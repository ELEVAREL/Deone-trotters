import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { OrderRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/checkout { orderId } -> creates or refreshes a Stripe PaymentIntent
// for the order and returns its clientSecret. The /pay/[id] page mounts
// Stripe's PaymentElement against this clientSecret so the customer pays
// inline without leaving the branded page.
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json(
      {
        error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable real payments.",
        demo: true,
      },
      { status: 503 }
    );
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.orderId) {
    return Response.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, amount_cents, currency, items, stripe_payment_intent")
    .eq("id", body.orderId)
    .maybeSingle<OrderRow>();

  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return Response.json({ error: "Order already paid" }, { status: 409 });
  }

  const stripe = getStripe();

  // Reuse the existing PaymentIntent if we have one (e.g. customer reloaded).
  // This keeps the same clientSecret stable across reloads.
  if (order.stripe_payment_intent) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent);
      if (
        existing.status === "requires_payment_method" ||
        existing.status === "requires_confirmation" ||
        existing.status === "requires_action"
      ) {
        // If the order amount has changed since (it can't in this app, but be safe), update.
        if (existing.amount !== order.amount_cents) {
          await stripe.paymentIntents.update(existing.id, {
            amount: order.amount_cents,
          });
        }
        return Response.json({ clientSecret: existing.client_secret });
      }
    } catch {
      // fall through to create a new one
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: order.amount_cents,
    currency: order.currency,
    automatic_payment_methods: { enabled: true },
    metadata: { order_id: order.id },
    description: `Deone's Gourmet Trotters · order ${order.id.slice(0, 8)}`,
  });

  await supabase
    .from("orders")
    .update({ stripe_payment_intent: intent.id })
    .eq("id", order.id);

  return Response.json({ clientSecret: intent.client_secret });
}
