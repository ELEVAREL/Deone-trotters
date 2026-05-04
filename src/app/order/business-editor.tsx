"use client";
import { useEffect, useState } from "react";
import type { BusinessHours, BusinessInfo } from "@/lib/business-db";

export function BusinessEditor({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedHint, setSavedHint] = useState(false);

  // Local edit buffer — we save the whole object so grandma sees a single
  // Save button, not one per field.
  const [draft, setDraft] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business-info", { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json()).error || "Could not load info");
        const data: BusinessInfo = await res.json();
        setInfo(data);
        setDraft(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load info");
      }
    })();
  }, []);

  const dirty =
    draft && info && JSON.stringify(draft) !== JSON.stringify(info);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setInfo(data);
      setDraft(data);
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function setHourRow(i: number, patch: Partial<BusinessHours>) {
    setDraft((d) => {
      if (!d) return d;
      const next = [...d.hours];
      next[i] = { ...next[i], ...patch };
      return { ...d, hours: next };
    });
  }

  function addHourRow() {
    setDraft((d) => (d ? { ...d, hours: [...d.hours, { day: "", open: "", close: "" }] } : d));
  }

  function removeHourRow(i: number) {
    setDraft((d) => (d ? { ...d, hours: d.hours.filter((_, idx) => idx !== i) } : d));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative w-full sm:max-w-xl bg-[color:var(--bg)] border-l border-[color:var(--line)] flex flex-col shadow-2xl fade-up">
        <header className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[color:var(--line)] bg-[color:var(--paper)]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              Edit info
            </div>
            <h2 className="font-display text-2xl italic">
              <span className="gilt">Hours & contact</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {savedHint && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--olive)]">
                Saved ✓
              </span>
            )}
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="btn btn-primary !py-2 !px-4 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 grid place-items-center rounded-full text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--bg-warm)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {error && (
          <div className="px-5 sm:px-7 pt-4">
            <p className="text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
              {error}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-7">
          {!draft ? (
            <p className="text-sm text-[color:var(--ink-mute)] py-12 text-center">
              Loading…
            </p>
          ) : (
            <>
              <Section title="Brand">
                <Field label="Business name">
                  <input
                    className="input"
                    maxLength={80}
                    value={draft.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </Field>
                <Field label="Tagline (optional)">
                  <input
                    className="input"
                    maxLength={200}
                    value={draft.tagline}
                    placeholder="e.g. Slow food, served loud."
                    onChange={(e) => setField("tagline", e.target.value)}
                  />
                </Field>
              </Section>

              <Section title="Visit & Connect">
                <Field label="Address">
                  <input
                    className="input"
                    maxLength={200}
                    value={draft.address}
                    placeholder="123 Main St, Brooklyn NY 11201"
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <input
                      className="input"
                      maxLength={40}
                      value={draft.phone}
                      placeholder="(555) 123-4567"
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Instagram">
                    <input
                      className="input"
                      maxLength={60}
                      value={draft.instagram}
                      placeholder="@deonesgourmet"
                      onChange={(e) => setField("instagram", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Hours"
                action={
                  <button
                    onClick={addHourRow}
                    className="btn btn-ghost !py-1.5 !px-3 !text-xs hover:!border-[color:var(--rust-deep)] hover:!text-[color:var(--gold)]"
                  >
                    + Add row
                  </button>
                }
              >
                <p className="text-xs text-[color:var(--ink-mute)] -mt-1 mb-1">
                  For closed days, leave the close time blank and write
                  &ldquo;Closed&rdquo; in open.
                </p>
                <div className="space-y-2">
                  {draft.hours.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center"
                    >
                      <input
                        className="input !py-2 !text-sm"
                        placeholder="Day(s) — e.g. Tue – Thu"
                        maxLength={40}
                        value={row.day}
                        onChange={(e) => setHourRow(i, { day: e.target.value })}
                      />
                      <input
                        className="input !py-2 !text-sm w-28"
                        placeholder="Open"
                        maxLength={20}
                        value={row.open}
                        onChange={(e) => setHourRow(i, { open: e.target.value })}
                      />
                      <input
                        className="input !py-2 !text-sm w-28"
                        placeholder="Close"
                        maxLength={20}
                        value={row.close}
                        onChange={(e) => setHourRow(i, { close: e.target.value })}
                      />
                      <button
                        onClick={() => removeHourRow(i)}
                        className="w-8 h-8 grid place-items-center rounded-full text-[color:var(--ink-mute)] hover:text-[color:var(--rust-deep)] hover:bg-[color:var(--cream)]"
                        aria-label="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {draft.hours.length === 0 && (
                    <p className="text-sm text-[color:var(--ink-mute)] italic">
                      No hours yet. Tap + Add row to start.
                    </p>
                  )}
                </div>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg italic">
          <span className="text-[color:var(--gold)]">{title}</span>
        </h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
