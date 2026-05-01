import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/webhook — Stripe sends payment lifecycle events here. With the
// PaymentElement (in-app payments) the relevant event is
// `payment_intent.succeeded`. We mark the order paid on success. Configure the
// endpoint in Stripe Dashboard → Developers → Webhooks, then drop the signing
// secret into STRIPE_WEBHOOK_SECRET.
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
    const charge = intent.latest_charge && typeof intent.latest_charge === "object"
      ? (intent.latest_charge as Stripe.Charge)
      : null;
    const billing = charge?.billing_details ?? null;
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent: intent.id,
        customer_email: intent.receipt_email ?? billing?.email ?? null,
        customer_name: billing?.name ?? null,
      })
      .eq("id", orderId);
    if (error) {
      console.error("webhook order update failed", error);
      return new Response("DB update failed", { status: 500 });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const orderId = intent.metadata?.order_id;
    if (orderId) {
      // Don't mark cancelled — customer may retry. Just log.
      console.log("PaymentIntent failed for order", orderId, intent.last_payment_error?.message);
    }
  }

  // Backwards-compat: if anyone still has the old Checkout Session webhook
  // wired up, honour it. Safe to remove later.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          customer_email: session.customer_details?.email ?? null,
          customer_name: session.customer_details?.name ?? null,
        })
        .eq("id", orderId);
    }
  }

  return Response.json({ received: true });
}
