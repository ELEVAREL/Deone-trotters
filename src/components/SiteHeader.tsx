import Link from "next/link";
import { BUSINESS } from "@/lib/menu";

export function SiteHeader({ active }: { active?: "home" | "order" }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-[color:var(--bg)]/85 border-b border-[color:var(--line)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-[color:var(--rust)] grid place-items-center text-[color:var(--paper)] font-display text-lg leading-none shadow-md">
            D
          </div>
          <div className="leading-tight">
            <div className="font-display text-[17px] tracking-tight font-bold">
              {BUSINESS.name.split("'")[0]}
              <span className="text-[color:var(--rust)]">&apos;s</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] -mt-0.5">
              Gourmet Trotters
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-full text-sm font-medium transition ${
              active === "home"
                ? "bg-[color:var(--cream)] text-[color:var(--gold)] border border-[color:var(--rust-deep)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--paper)]"
            }`}
          >
            Menu
          </Link>
          <Link href="/order" className="btn btn-primary !py-2.5 !px-4 !text-sm">
            Take Order
          </Link>
        </nav>
      </div>
    </header>
  );
}
