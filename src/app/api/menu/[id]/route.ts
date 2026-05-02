import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["mains", "sides", "drinks", "desserts"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

type PatchBody = {
  name?: string;
  description?: string;
  priceCents?: number;
  category?: Category;
  sortOrder?: number;
  available?: boolean;
};

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/menu/[id]">) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const n = body.name.trim();
    if (!n) return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    update.name = n;
  }
  if (body.description !== undefined) update.description = body.description.trim();
  if (body.priceCents !== undefined) {
    const p = Number(body.priceCents);
    if (!Number.isFinite(p) || p < 0 || p > 100_000) {
      return Response.json({ error: "Price must be 0 – 1000 dollars" }, { status: 400 });
    }
    update.price_cents = Math.round(p);
  }
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    update.category = body.category;
  }
  if (body.sortOrder !== undefined) update.sort_order = body.sortOrder;
  if (body.available !== undefined) update.available = body.available;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .update(update)
    .eq("id", id)
    .select("id, slug, name, description, price_cents, category, sort_order, available")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/menu/[id]">) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
