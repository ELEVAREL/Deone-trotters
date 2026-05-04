import Link from "next/link";
import { getBusinessInfo } from "@/lib/business-db";

export async function SiteFooter() {
  const info = await getBusinessInfo();
  const hasHours = info.hours.length > 0;
  const hasContact = info.address || info.phone || info.instagram;

  return (
    <footer className="mt-24 border-t border-[color:var(--line)] bg-[color:var(--paper)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-bold tracking-tight">
            {info.name}
          </div>
          {info.tagline && (
            <p className="mt-2 text-[color:var(--ink-mute)] max-w-sm text-pretty">
              {info.tagline}
            </p>
          )}
        </div>

        {hasHours && (
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-3">
              Hours
            </div>
            <ul className="space-y-1.5 text-sm">
              {info.hours.map((h, i) => (
                <li key={`${h.day}-${i}`} className="flex justify-between gap-6">
                  <span className="text-[color:var(--ink-soft)]">{h.day}</span>
                  <span className="text-[color:var(--ink)] font-medium">
                    {h.close ? `${h.open} – ${h.close}` : h.open}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          {hasContact && (
            <>
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-3">
                Visit / Connect
              </div>
              <ul className="space-y-1.5 text-sm text-[color:var(--ink-soft)]">
                {info.address && <li>{info.address}</li>}
                {info.phone && (
                  <li>
                    <a href={`tel:${info.phone}`} className="hover:text-[color:var(--gold)] transition">
                      {info.phone}
                    </a>
                  </li>
                )}
                {info.instagram && (
                  <li>
                    <a
                      href={`https://instagram.com/${info.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[color:var(--gold)] transition"
                    >
                      {info.instagram}
                    </a>
                  </li>
                )}
              </ul>
            </>
          )}
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
        © {new Date().getFullYear()} {info.name} · Made with love
      </div>
    </footer>
  );
}
