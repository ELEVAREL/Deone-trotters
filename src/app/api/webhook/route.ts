import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/webhook — Stripe sends payment lifecycle events here. We mark the
// order paid when checkout.session.completed fires. Configure the endpoint in
// Stripe Dashboard → Developers → Webhooks, then drop the signing secret into
// STRIPE_WEBHOOK_SECRET.
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

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification failed";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return Response.json({ received: true, note: "no order_id metadata" });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent: typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
      })
      .eq("id", orderId);
    if (error) {
      console.error("webhook order update failed", error);
      return new Response("DB update failed", { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const supabase = getSupabaseAdmin();
      await supabase.from("orders").update({ status: "expired" }).eq("id", orderId);
    }
  }

  return Response.json({ received: true });
}
