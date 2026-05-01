import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MENU, BUSINESS } from "@/lib/menu";
import { formatPrice } from "@/lib/format";

const CATEGORIES: Array<{ key: "mains" | "sides" | "drinks" | "desserts"; label: string }> = [
  { key: "mains", label: "From the Kitchen" },
  { key: "sides", label: "Sides" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader active="home" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div className="fade-up">
            <span className="chip">Family kitchen · Since forever</span>
            <h1 className="h-display text-[clamp(2.5rem,7vw,5rem)] mt-5 text-balance">
              Soul food, <em className="text-[color:var(--rust)] not-italic">slow-cooked</em>,
              <br />
              served with love.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--ink-soft)] max-w-xl text-pretty">
              {BUSINESS.story}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#menu" className="btn btn-primary">See the menu</Link>
              <Link href="/order" className="btn btn-ghost">Order in person</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[color:var(--ink-mute)]">
              <Stat n="3" label="generations of recipes" />
              <Stat n="6h" label="braising time, no shortcuts" />
              <Stat n="100%" label="made-from-scratch" />
            </div>
          </div>
          <div className="relative aspect-[4/5] max-w-md justify-self-center md:justify-self-end">
            <div className="absolute inset-0 rounded-[var(--radius-lg)] overflow-hidden bg-gradient-to-br from-[color:var(--cream)] via-[color:var(--gold-soft)] to-[color:var(--rust)] shadow-[0_30px_80px_-30px_rgba(138,49,16,.45)]">
              <div className="absolute inset-0 grid place-items-center">
                <PlateMark />
              </div>
              <div className="absolute -bottom-2 -left-2 px-3 py-1.5 bg-[color:var(--paper)] border border-[color:var(--line)] rounded-full font-display text-sm">
                ✦ Today&apos;s special
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-16">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--rust)] font-semibold">
              The Menu
            </div>
            <h2 className="h-display text-4xl sm:text-5xl mt-2">What&apos;s cooking</h2>
          </div>
          <Link href="/order" className="btn btn-gold">Place an order →</Link>
        </div>

        <div className="grid gap-12">
          {CATEGORIES.map((cat) => {
            const items = MENU.filter((m) => m.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <h3 className="font-display text-2xl tracking-tight mb-5 flex items-center gap-3">
                  <span>{cat.label}</span>
                  <span className="flex-1 h-px bg-[color:var(--line)]" />
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <article key={item.id} className="card p-5 sm:p-6 flex justify-between gap-5">
                      <div>
                        <div className="font-display text-lg font-semibold">{item.name}</div>
                        <p className="text-sm text-[color:var(--ink-mute)] mt-1.5 text-pretty">
                          {item.description}
                        </p>
                      </div>
                      <div className="font-display text-[color:var(--rust)] font-bold whitespace-nowrap">
                        {formatPrice(item.priceCents)}
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
      <section className="bg-[color:var(--paper)] border-y border-[color:var(--line)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--rust)] font-semibold">
              The Story
            </div>
            <h2 className="h-display text-3xl sm:text-4xl mt-2 text-balance">
              Recipes you can&apos;t get anywhere else.
            </h2>
            <p className="text-[color:var(--ink-soft)] mt-4 text-pretty leading-relaxed">
              Deone learned to cook standing on a milk crate next to her grandmother&apos;s
              cast-iron stove. Three generations later, those same recipes — handwritten,
              never measured — show up on every plate we serve. We don&apos;t cut corners,
              and we don&apos;t use anything we wouldn&apos;t feed our own family.
            </p>
            <Link href="/order" className="btn btn-primary mt-6">Take an order</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile heading="Cast iron" sub="Everything starts in a seasoned skillet." rust />
            <Tile heading="Six hours" sub="Trotters braise low and slow, every day." />
            <Tile heading="Hand-peeled" sub="Nothing from a bag, nothing from a can." />
            <Tile heading="Honey & vinegar" sub="The secrets aren't really secrets." rust />
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
          ? "bg-[color:var(--rust)] text-[color:var(--paper)] border-[color:var(--rust-deep)]"
          : "bg-[color:var(--bg-warm)] border-[color:var(--line)]"
      }`}
    >
      <div className="font-display text-xl font-semibold tracking-tight">{heading}</div>
      <div className={`text-sm mt-1 ${rust ? "text-[color:var(--cream)]" : "text-[color:var(--ink-mute)]"}`}>
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
          <stop offset="0%" stopColor="#fffaf2" />
          <stop offset="100%" stopColor="#f3e3c2" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#plate)" stroke="#1c1410" strokeOpacity="0.08" strokeWidth="2" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#1c1410" strokeOpacity="0.08" strokeWidth="1.5" />
      <text
        x="100"
        y="108"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="56"
        fontWeight="700"
        fill="#8a3110"
      >
        D
      </text>
    </svg>
  );
}
