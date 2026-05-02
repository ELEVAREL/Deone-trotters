import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["mains", "sides", "drinks", "desserts"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// GET — list all items (admin view, includes unavailable). Auth required.
export async function GET() {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, slug, name, description, price_cents, category, sort_order, available, updated_at")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

type CreateBody = {
  name?: string;
  description?: string;
  priceCents?: number;
  category?: Category;
  sortOrder?: number;
  available?: boolean;
};

// POST — create a new item.
export async function POST(req: NextRequest) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const description = (body.description ?? "").trim();
  const priceCents = Number(body.priceCents);
  const category = body.category;
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 100_000) {
    return Response.json({ error: "Price must be 0 – 1000 dollars" }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return Response.json({ error: "Pick mains, sides, drinks, or desserts" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Make sure the slug is unique. Append a numeric suffix on collision.
  const base = slugify(name) || "item";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: existing } = await supabase
      .from("menu_items")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${i}`;
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      slug,
      name,
      description,
      price_cents: Math.round(priceCents),
      category,
      sort_order: body.sortOrder ?? 100,
      available: body.available ?? true,
    })
    .select("id, slug, name, description, price_cents, category, sort_order, available")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
