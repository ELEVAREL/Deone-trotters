import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MENU } from "@/lib/menu";
import type { CartLine } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  items: Array<{ id: string; qty: number }>;
  notes?: string;
};

// POST /api/orders — create a new pending order. Validates items against MENU
// (clients never set the price). Returns the new order id.
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

  const lines: CartLine[] = [];
  let amount = 0;
  for (const raw of body.items) {
    const menuItem = MENU.find((m) => m.id === raw.id);
    if (!menuItem) {
      return Response.json({ error: `Unknown item: ${raw.id}` }, { status: 400 });
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

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      amount_cents: amount,
      currency: "usd",
      items: lines,
      notes: body.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("orders.insert error", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  return Response.json({ id: data.id, amount_cents: amount });
}
