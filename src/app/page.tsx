import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BUSINESS } from "@/lib/menu";
import { listMenuItemsPublic } from "@/lib/menu-db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORIES: Array<{ key: "mains" | "sides" | "drinks" | "desserts"; label: string }> = [
  { key: "mains", label: "From the Kitchen" },
  { key: "sides", label: "Sides" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
];

export default async function Home() {
  const MENU = await listMenuItemsPublic();
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader active="home" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <span className="chip hero-rise hero-rise-1">Family kitchen · Three generations</span>
            <h1 className="h-display text-[clamp(2.75rem,7.5vw,5.5rem)] mt-6 text-balance hero-rise hero-rise-2">
              Slow food,
              <br />
              <span className="gilt italic">served loud.</span>
            </h1>
            <p className="mt-6 text-lg text-[color:var(--ink-soft)] max-w-xl text-pretty leading-relaxed hero-rise hero-rise-3">
              {BUSINESS.story}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 hero-rise hero-rise-4">
              <Link href="#menu" className="btn btn-primary">See the menu →</Link>
              <a href={`tel:${BUSINESS.phone}`} className="btn btn-ghost">Call ahead</a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-sm text-[color:var(--ink-mute)] hero-rise hero-rise-5">
              <Stat n="3" label="Generations of recipes" />
              <Stat n="6h" label="Braising time, no shortcuts" />
              <Stat n="0" label="Things from a can" />
            </div>
          </div>
          <div className="relative aspect-[4/5] max-w-md justify-self-center md:justify-self-end hero-rise hero-rise-3">
            <div className="absolute inset-0 rounded-[var(--radius-lg)] overflow-hidden bg-gradient-to-br from-[color:var(--gold-soft)] via-[color:var(--rust)] to-[color:var(--bg-warm)] plate-glow plate-float">
              <div className="absolute inset-0 grid place-items-center">
                <PlateMark />
              </div>
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-[color:var(--bg)]/85 backdrop-blur border border-[color:var(--rust-deep)] rounded-full font-display text-xs text-[color:var(--gold)] tracking-[0.2em] uppercase">
                Tonight
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[color:var(--paper)] border border-[color:var(--rust-deep)] rounded-full font-display text-sm text-[color:var(--gold)] shadow-[0_8px_24px_-8px_rgba(212,175,55,.4)]">
                ✦  Splits · $25  ✦
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleuron divider */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="fleuron"><span className="fleuron-glyph">✦   ❋   ✦</span></div>
      </div>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-20 scroll-mt-20">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              The Menu
            </div>
            <h2 className="h-display text-4xl sm:text-5xl mt-3 italic">
              <span className="gilt">À la carte</span>
            </h2>
            <p className="mt-2 text-[color:var(--ink-mute)] text-sm">
              Everything is made the day you eat it.
            </p>
          </div>
          <Link href="/order" className="btn btn-gold">Place an order →</Link>
        </div>

        <div className="grid gap-14">
          {CATEGORIES.map((cat) => {
            const items = MENU.filter((m) => m.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <h3 className="font-display text-3xl italic tracking-tight mb-6 flex items-center gap-4">
                  <span className="text-[color:var(--gold)]">{cat.label}</span>
                  <span className="flex-1 h-px bg-gradient-to-r from-[color:var(--rust-deep)] via-[color:var(--rust)] to-transparent" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--ink-mute)]">
                    {items.length} {items.length === 1 ? "dish" : "dishes"}
                  </span>
                </h3>
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
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mt-1.5">
                          plate
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

      {/* Story strip */}
      <section className="bg-[color:var(--paper)] border-y border-[color:var(--line)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <svg className="absolute -right-20 -top-10 w-[420px] text-[color:var(--gold)]" viewBox="0 0 200 200" fill="currentColor" aria-hidden>
            <path d="M100 5 L120 80 L195 80 L135 125 L155 195 L100 150 L45 195 L65 125 L5 80 L80 80 Z" opacity="0.4" />
          </svg>
        </div>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              The Story
            </div>
            <h2 className="h-display text-4xl sm:text-5xl mt-3 text-balance italic">
              <span className="gilt">Three generations</span>
              <br />
              of cast-iron memory.
            </h2>
            <p className="text-[color:var(--ink-soft)] mt-5 text-pretty leading-relaxed text-lg">
              Deone learned at her grandmother&apos;s stove, milk crate under her feet.
              Those recipes show up on every plate. We don&apos;t cut corners, and we
              don&apos;t serve anything we wouldn&apos;t feed our own kids.
            </p>
            <Link href="/order" className="btn btn-primary mt-7">Place your order →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile heading="Cast iron" sub="Every dish starts in a seasoned skillet." rust />
            <Tile heading="Six hours" sub="The trotters braise low. No exceptions." />
            <Tile heading="Hand-peeled" sub="Nothing from a bag. Nothing from a can." />
            <Tile heading="Honey, vinegar" sub="The two best secrets aren&apos;t secret." rust />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-[color:var(--ink)]">{n}</div>
      <div className="text-xs uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Tile({ heading, sub, rust }: { heading: string; sub: string; rust?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius)] p-5 border ${
        rust
          ? "bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--rust)] text-[color:var(--bg)] border-[color:var(--rust-deep)]"
          : "bg-[color:var(--bg-warm)] border-[color:var(--line)] text-[color:var(--ink)]"
      }`}
    >
      <div className="font-display text-xl font-semibold tracking-tight">{heading}</div>
      <div className={`text-sm mt-1 ${rust ? "text-[color:var(--bg)] opacity-75" : "text-[color:var(--ink-mute)]"}`}>
        {sub}
      </div>
    </div>
  );
}

function PlateMark() {
  return (
    <svg viewBox="0 0 200 200" className="w-2/3 h-2/3" aria-hidden>
      <defs>
        <radialGradient id="plate" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1510" />
          <stop offset="100%" stopColor="#0a0806" />
        </radialGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5dc8a" />
          <stop offset="100%" stopColor="#b8902a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#plate)" stroke="url(#rim)" strokeWidth="3" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#d4af37" strokeOpacity="0.45" strokeWidth="1" />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="80"
        fontWeight="900"
        fill="url(#rim)"
      >
        D
      </text>
    </svg>
  );
}
