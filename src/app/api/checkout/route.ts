import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getBaseUrl } from "@/lib/format";
import type { CartLine, OrderRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/checkout { orderId } -> creates a Stripe Checkout Session for the
// order and returns its URL. The customer is redirected to this URL after
// scanning the QR code on grandma's order pad.
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
    .select("id, status, amount_cents, currency, items, stripe_session_id")
    .eq("id", body.orderId)
    .maybeSingle<OrderRow>();

  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return Response.json({ error: "Order already paid" }, { status: 409 });
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: (order.items as CartLine[]).map((line) => ({
      quantity: line.qty,
      price_data: {
        currency: order.currency,
        unit_amount: line.priceCents,
        product_data: { name: line.name },
      },
    })),
    metadata: { order_id: order.id },
    success_url: `${baseUrl}/success?order=${order.id}`,
    cancel_url: `${baseUrl}/pay/${order.id}?cancelled=1`,
  });

  await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return Response.json({ url: session.url, id: session.id });
}
