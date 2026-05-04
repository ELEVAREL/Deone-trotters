import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listMenuItemsPublic } from "@/lib/menu-db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORIES: Array<{ key: "mains" | "sides" | "drinks" | "desserts"; label: string }> = [
  { key: "mains", label: "Mains" },
  { key: "sides", label: "Sides" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
];

export default async function Home() {
  const MENU = await listMenuItemsPublic();
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader active="home" />

      {/* Title */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-14 sm:pt-20 pb-2 text-center">
        <h1 className="h-display text-[clamp(2.5rem,7vw,5rem)] italic">
          <span className="gilt">Deone&apos;s Trotter Menu</span>
        </h1>
        <div className="mt-4 flex justify-center">
          <Link href="/preorder" className="btn btn-primary">Pre-order pickup →</Link>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16 scroll-mt-20">
        <div className="grid gap-12">
          {CATEGORIES.map((cat) => {
            const items = MENU.filter((m) => m.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <h2 className="font-display text-2xl sm:text-3xl italic tracking-tight mb-5 flex items-center gap-4">
                  <span className="text-[color:var(--gold)]">{cat.label}</span>
                  <span className="flex-1 h-px bg-gradient-to-r from-[color:var(--rust-deep)] via-[color:var(--rust)] to-transparent" />
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="card lift p-5 sm:p-6 flex justify-between gap-5 group"
                    >
                      <div className="min-w-0">
                        <div className="font-display text-lg font-semibold tracking-tight group-hover:text-[color:var(--gold)] transition-colors">
                          {item.name}
                        </div>
                        <p className="text-sm text-[color:var(--ink-mute)] mt-2 text-pretty leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-2xl text-[color:var(--gold)] font-bold whitespace-nowrap leading-tight">
                          {formatPrice(item.priceCents)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
