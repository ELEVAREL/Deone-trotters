import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmins } from "@/lib/email-notify";
import type Stripe from "stripe";
import type { OrderRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_SELECT =
  "id, amount_cents, items, customer_name, customer_email, customer_phone, pickup_at, notes, order_type, status, paid_at, created_at";

// POST /api/webhook — Stripe sends payment lifecycle events here. With the
// PaymentElement (in-app payments) the relevant event is
// `payment_intent.succeeded`. We mark the order paid on success and email
// the staff admins.
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return new Response("Stripe not configured", { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification failed";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const orderId = intent.metadata?.order_id;
    if (!orderId) {
      return Response.json({ received: true, note: "no order_id metadata" });
    }

    // Read the existing order so we don't clobber pre-order customer info.
    const { data: existing } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .maybeSingle<OrderRow>();

    const charge =
      intent.latest_charge && typeof intent.latest_charge === "object"
        ? (intent.latest_charge as Stripe.Charge)
        : null;
    const billing = charge?.billing_details ?? null;

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent: intent.id,
        // Only fill what's missing — never overwrite info grandma collected.
        customer_email:
          existing?.customer_email ?? intent.receipt_email ?? billing?.email ?? null,
        customer_name: existing?.customer_name ?? billing?.name ?? null,
      })
      .eq("id", orderId)
      .select(ORDER_SELECT)
      .single<OrderRow>();
    if (error || !updated) {
      console.error("webhook order update failed", error);
      return new Response("DB update failed", { status: 500 });
    }

    void notifyAdmins("paid", updated);
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const orderId = intent.metadata?.order_id;
    if (orderId) {
      console.log(
        "PaymentIntent failed for order",
        orderId,
        intent.last_payment_error?.message
      );
    }
  }

  // Backwards-compat: legacy Checkout Session webhook. Safe to remove later.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const { data: existing } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", orderId)
        .maybeSingle<OrderRow>();
      const { data: updated } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          customer_email:
            existing?.customer_email ?? session.customer_details?.email ?? null,
          customer_name:
            existing?.customer_name ?? session.customer_details?.name ?? null,
        })
        .eq("id", orderId)
        .select(ORDER_SELECT)
        .single<OrderRow>();
      if (updated) void notifyAdmins("paid", updated);
    }
  }

  return Response.json({ received: true });
}
