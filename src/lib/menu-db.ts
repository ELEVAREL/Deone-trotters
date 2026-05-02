import { getSupabaseAdmin } from "./supabase";
import { MENU as SEED_MENU } from "./menu";
import type { MenuItem } from "./types";

export type DbMenuItem = MenuItem & {
  uuid: string;
  available: boolean;
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category: MenuItem["category"];
  sort_order: number;
  available: boolean;
};

function rowToItem(row: Row): DbMenuItem {
  return {
    id: row.slug,
    uuid: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    category: row.category,
    sortOrder: row.sort_order,
    available: row.available,
  };
}

// Read all menu items (admin view — includes unavailable). Falls back to the
// seed file in src/lib/menu.ts if Supabase is not reachable so the storefront
// is never blank.
export async function listMenuItemsAdmin(): Promise<DbMenuItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, slug, name, description, price_cents, category, sort_order, available")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error || !data) throw error ?? new Error("no data");
    return (data as Row[]).map(rowToItem);
  } catch {
    return SEED_MENU.map((m, i) => ({
      ...m,
      uuid: m.id,
      available: true,
      sortOrder: (i + 1) * 10,
    }));
  }
}

// Read only available items for public display.
export async function listMenuItemsPublic(): Promise<MenuItem[]> {
  const all = await listMenuItemsAdmin();
  return all.filter((m) => m.available);
}

export async function getMenuItemBySlug(slug: string): Promise<MenuItem | null> {
  const all = await listMenuItemsAdmin();
  return all.find((m) => m.id === slug) ?? null;
}
