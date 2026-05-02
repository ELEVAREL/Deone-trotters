import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/orders/[id]/complete — staff-only. Marks a paid order as
// fulfilled. The live queue filters orders by completed_at IS NULL, so
// once this fires the row drops off grandma's working list.
//
// DELETE — undo (in case she taps it by accident).
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]/complete">) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid")
    .select("id, completed_at")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Order not found or not paid" }, { status: 404 });
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]/complete">) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ completed_at: null })
    .eq("id", id)
    .select("id, completed_at")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json(data);
}
