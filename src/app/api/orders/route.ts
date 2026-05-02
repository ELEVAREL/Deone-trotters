import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listMenuItemsAdmin } from "@/lib/menu-db";
import type { CartLine } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  items: Array<{ id: string; qty: number }>;
  notes?: string;
  // Pre-order fields (optional — staff orders skip these)
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupAt?: string; // ISO timestamp
  orderType?: "in_person" | "preorder";
};

// POST /api/orders — create a new pending order. Validates items + price
// against the menu_items table (client never sets price). Used by both
// the staff order pad (in_person) and the public pre-order flow (preorder).
export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  const menu = await listMenuItemsAdmin();
  const lines: CartLine[] = [];
  let amount = 0;
  for (const raw of body.items) {
    const menuItem = menu.find((m) => m.id === raw.id);
    if (!menuItem || !menuItem.available) {
      return Response.json(
        { error: `Unknown or unavailable item: ${raw.id}` },
        { status: 400 }
      );
    }
    const qty = Math.max(1, Math.min(99, Math.floor(raw.qty)));
    lines.push({
      id: menuItem.id,
      name: menuItem.name,
      priceCents: menuItem.priceCents,
      qty,
    });
    amount += menuItem.priceCents * qty;
  }

  // Pre-order specific validation
  const orderType = body.orderType === "preorder" ? "preorder" : "in_person";
  let pickupAt: string | null = null;
  if (orderType === "preorder") {
    const name = (body.customerName ?? "").trim();
    const phone = (body.customerPhone ?? "").trim();
    if (!name) return Response.json({ error: "Name required" }, { status: 400 });
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      return Response.json({ error: "Valid phone required" }, { status: 400 });
    }
    if (body.pickupAt) {
      const t = new Date(body.pickupAt);
      if (Number.isNaN(t.getTime())) {
        return Response.json({ error: "Invalid pickup time" }, { status: 400 });
      }
      // Must be in the next 14 days, at least 15 minutes from now.
      const now = Date.now();
      const min = now + 15 * 60_000;
      const max = now + 14 * 24 * 60 * 60_000;
      if (t.getTime() < min || t.getTime() > max) {
        return Response.json(
          { error: "Pickup must be 15 min – 14 days from now" },
          { status: 400 }
        );
      }
      pickupAt = t.toISOString();
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      amount_cents: amount,
      currency: "usd",
      items: lines,
      notes: body.notes ?? null,
      order_type: orderType,
      customer_name: body.customerName?.trim() || null,
      customer_phone: body.customerPhone?.trim() || null,
      customer_email: body.customerEmail?.trim() || null,
      pickup_at: pickupAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("orders.insert error", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  return Response.json({ id: data.id, amount_cents: amount });
}
