import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listMenuItemsAdmin } from "@/lib/menu-db";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";
import { getResend, isResendConfigured, getResendFrom } from "@/lib/resend";
import { getBaseUrl } from "@/lib/format";
import type { CartLine } from "@/lib/types";

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
    .select("id")
    .single();
  if (error || !order) {
    console.error("invoice insert error", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  const payUrl = `${getBaseUrl()}/pay/${order.id}`;
  const totalUsd = (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Send the email.
  try {
    const resend = getResend();
    const itemsHtml = lines
      .map(
        (l) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #2e2618;color:#f4e7c0">
            <div style="font-weight:600">${escapeHtml(l.name)}</div>
            <div style="font-size:12px;color:#8a7a5a">${l.qty} × ${(l.priceCents / 100).toFixed(2)}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #2e2618;color:#e9c75c;text-align:right;font-weight:700">
            $${((l.priceCents * l.qty) / 100).toFixed(2)}
          </td>
        </tr>`
      )
      .join("");

    const pickupLine = pickupAt
      ? `<p style="margin:12px 0 0;color:#c9b88a;font-size:14px">Pickup: <strong style="color:#e9c75c">${new Date(pickupAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong></p>`
      : "";

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0806;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f4e7c0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0806">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1510;border:1px solid #2e2618;border-radius:14px;overflow:hidden">
        <tr><td style="padding:28px 32px;border-bottom:1px solid #2e2618;text-align:center">
          <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:#d4af37;color:#0a0806;line-height:44px;font-family:Georgia,serif;font-weight:900;font-size:22px;margin-bottom:8px">D</div>
          <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#f4e7c0">Deone's Gourmet Trotters</div>
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a7a5a;margin-top:4px">Your invoice is ready</div>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 16px;color:#f4e7c0;font-size:16px">Hi ${escapeHtml(name)},</p>
          <p style="margin:0 0 20px;color:#c9b88a;font-size:15px;line-height:1.55">
            Here's your invoice from Deone. Tap the button below to pay — it stays on our site, card or Apple/Google Pay.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
            ${itemsHtml}
            <tr>
              <td style="padding:14px 0 0;color:#8a7a5a;font-size:12px;text-transform:uppercase;letter-spacing:0.18em">Total</td>
              <td style="padding:14px 0 0;text-align:right;font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:700;color:#e9c75c">${totalUsd}</td>
            </tr>
          </table>
          ${pickupLine}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td align="center">
            <a href="${payUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#e9c75c,#d4af37 60%,#b8902a);color:#0a0806;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px">
              Pay ${totalUsd}
            </a>
          </td></tr></table>
          <p style="margin:18px 0 0;color:#8a7a5a;font-size:12px;text-align:center">
            Or paste this link in your browser:<br>
            <span style="color:#c9b88a;word-break:break-all">${payUrl}</span>
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #2e2618;text-align:center;color:#8a7a5a;font-size:11px;letter-spacing:0.1em">
          Slow food · served loud. · Order #${order.id.slice(0, 8)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const subject = `Your invoice from Deone's Gourmet Trotters · ${totalUsd}`;
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: email,
      subject,
      html,
      text: [
        `Hi ${name},`,
        ``,
        `Your invoice from Deone's Gourmet Trotters.`,
        ``,
        ...lines.map((l) => `${l.qty} × ${l.name} — $${((l.priceCents * l.qty) / 100).toFixed(2)}`),
        ``,
        `Total: ${totalUsd}`,
        ...(pickupAt
          ? [`Pickup: ${new Date(pickupAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`]
          : []),
        ``,
        `Pay here: ${payUrl}`,
        ``,
        `Order #${order.id.slice(0, 8)}`,
      ].join("\n"),
    });

    if (result.error) {
      console.error("Resend error", result.error);
      return Response.json(
        { error: `Email failed: ${result.error.message ?? "unknown"}` },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("invoice send error", err);
    return Response.json({ error: "Email failed" }, { status: 500 });
  }

  return Response.json({
    id: order.id,
    payUrl,
    amountCents: amount,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
