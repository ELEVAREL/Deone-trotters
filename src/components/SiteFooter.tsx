import Link from "next/link";
import { BUSINESS } from "@/lib/menu";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--line)] bg-[color:var(--paper)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-bold tracking-tight">
            {BUSINESS.name}
          </div>
          <p className="mt-2 text-[color:var(--ink-mute)] max-w-sm text-pretty">
            {BUSINESS.tagline}
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-3">
            Hours
          </div>
          <ul className="space-y-1.5 text-sm">
            {BUSINESS.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-6">
                <span className="text-[color:var(--ink-soft)]">{h.day}</span>
                <span className="text-[color:var(--ink)] font-medium">
                  {h.close ? `${h.open} – ${h.close}` : h.open}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-3">
            Visit / Connect
          </div>
          <ul className="space-y-1.5 text-sm text-[color:var(--ink-soft)]">
            <li>{BUSINESS.address}</li>
            <li>{BUSINESS.phone}</li>
            <li>{BUSINESS.instagram}</li>
          </ul>
          <div className="mt-5 flex gap-2">
            <Link href="/" className="btn btn-ghost !py-2 !px-3 !text-xs">
              Menu
            </Link>
            <Link href="/order" className="btn btn-ghost !py-2 !px-3 !text-xs">
              Take Order
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[color:var(--line)] py-5 text-center text-xs text-[color:var(--ink-mute)]">
        © {new Date().getFullYear()} {BUSINESS.name} · Made with love
      </div>
    </footer>
  );
}
