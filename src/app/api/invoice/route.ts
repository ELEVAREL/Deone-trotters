import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listMenuItemsAdmin } from "@/lib/menu-db";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";
import { getResend, isResendConfigured, getResendFrom } from "@/lib/resend";
import { buildCustomerInvoiceEmail } from "@/lib/email-templates";
import { notifyAdmins } from "@/lib/email-notify";
import { getBaseUrl } from "@/lib/format";
import type { CartLine, OrderRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  items: Array<{ id: string; qty: number }>;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  pickupAt?: string;
};

// POST /api/invoice — staff-only. Used when grandma takes an order over the
// phone: build the cart on her pad, hit Send invoice, customer gets an email
// with their personalized payment link. Behind the PIN cookie.
export async function POST(req: NextRequest) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isResendConfigured()) {
    return Response.json(
      {
        error: "Resend not configured. Add RESEND_API_KEY to enable email invoices.",
        demo: true,
      },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.customerName ?? "").trim();
  const email = (body.customerEmail ?? "").trim();
  if (!name) return Response.json({ error: "Customer name required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate cart against menu (server-side authority on price).
  const menu = await listMenuItemsAdmin();
  const lines: CartLine[] = [];
  let amount = 0;
  for (const raw of body.items) {
    const item = menu.find((m) => m.id === raw.id);
    if (!item || !item.available) {
      return Response.json({ error: `Unknown item: ${raw.id}` }, { status: 400 });
    }
    const qty = Math.max(1, Math.min(99, Math.floor(raw.qty)));
    lines.push({ id: item.id, name: item.name, priceCents: item.priceCents, qty });
    amount += item.priceCents * qty;
  }

  let pickupAt: string | null = null;
  if (body.pickupAt) {
    const t = new Date(body.pickupAt);
    if (Number.isNaN(t.getTime())) {
      return Response.json({ error: "Invalid pickup time" }, { status: 400 });
    }
    pickupAt = t.toISOString();
  }

  // Create the order.
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      amount_cents: amount,
      currency: "usd",
      items: lines,
      notes: body.notes ?? null,
      order_type: "preorder",
      customer_name: name,
      customer_phone: body.customerPhone?.trim() || null,
      customer_email: email,
      pickup_at: pickupAt,
    })
    .select(
      "id, amount_cents, items, customer_name, customer_email, customer_phone, pickup_at, notes, order_type, status, paid_at, created_at"
    )
    .single<OrderRow>();
  if (error || !order) {
    console.error("invoice insert error", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  const payUrl = `${getBaseUrl()}/pay/${order.id}`;

  // Send the customer-facing invoice.
  try {
    const { subject, html, text } = buildCustomerInvoiceEmail({
      order: {
        id: order.id,
        amount_cents: order.amount_cents,
        items: lines,
        customer_name: order.customer_name,
        pickup_at: order.pickup_at,
        notes: order.notes,
      },
      payUrl,
    });
    const resend = getResend();
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: email,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("Resend customer invoice error", result.error);
      return Response.json(
        { error: `Email failed: ${result.error.message ?? "unknown"}` },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("invoice send error", err);
    return Response.json({ error: "Email failed" }, { status: 500 });
  }

  // Fire-and-forget admin notification — never blocks or fails the response.
  void notifyAdmins("invoice_sent", order);

  return Response.json({
    id: order.id,
    payUrl,
    amountCents: amount,
  });
}
