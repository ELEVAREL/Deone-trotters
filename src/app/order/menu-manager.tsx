"use client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category: "mains" | "sides" | "drinks" | "desserts";
  sort_order: number;
  available: boolean;
};

const CATEGORIES: Array<{ key: Row["category"]; label: string }> = [
  { key: "mains", label: "Mains" },
  { key: "sides", label: "Sides" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
];

export function MenuManager({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not load menu");
      const data: Row[] = await res.json();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load menu");
    }
  }

  useEffect(() => { load(); }, []);

  async function patch(id: string, body: Partial<Pick<Row, "name" | "description" | "category" | "available"> & { priceCents?: number; sortOrder?: number }>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRows((prev) => prev ? prev.map(r => r.id === id ? { ...r, ...data } : r) : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setRows((prev) => prev ? prev.filter(r => r.id !== id) : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative w-full sm:max-w-2xl bg-[color:var(--bg)] border-l border-[color:var(--line)] flex flex-col shadow-2xl fade-up">
        <header className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[color:var(--line)] bg-[color:var(--paper)]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              Edit menu
            </div>
            <h2 className="font-display text-2xl italic"><span className="gilt">The kitchen</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary !py-2 !px-4 !text-sm"
            >
              + Add dish
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 grid place-items-center rounded-full text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--bg-warm)]"
              aria-label="Close menu manager"
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

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-8">
          {rows === null ? (
            <p className="text-sm text-[color:var(--ink-mute)] py-12 text-center">Loading menu…</p>
          ) : (
            CATEGORIES.map((cat) => {
              const items = rows.filter(r => r.category === cat.key);
              return (
                <section key={cat.key}>
                  <h3 className="font-display text-lg italic mb-3 flex items-center gap-3">
                    <span className="text-[color:var(--gold)]">{cat.label}</span>
                    <span className="flex-1 h-px bg-[color:var(--line)]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--ink-mute)]">
                      {items.length}
                    </span>
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-sm text-[color:var(--ink-mute)] italic">No items in this section.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((row) => (
                        <EditRow
                          key={row.id}
                          row={row}
                          busy={busyId === row.id}
                          onPatch={(b) => patch(row.id, b)}
                          onDelete={() => remove(row.id, row.name)}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
      </aside>

      {showCreate && (
        <CreateDish
          onClose={() => setShowCreate(false)}
          onCreated={(row) => {
            setRows((prev) => prev ? [...prev, row].sort((a, b) =>
              a.category.localeCompare(b.category) || a.sort_order - b.sort_order
            ) : [row]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function EditRow({
  row,
  busy,
  onPatch,
  onDelete,
}: {
  row: Row;
  busy: boolean;
  onPatch: (body: Partial<Pick<Row, "name" | "description" | "category" | "available"> & { priceCents?: number }>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [priceDollars, setPriceDollars] = useState((row.price_cents / 100).toFixed(2));
  const [category, setCategory] = useState(row.category);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setPriceDollars((row.price_cents / 100).toFixed(2));
    setCategory(row.category);
  }, [row]);

  const dirty =
    name.trim() !== row.name ||
    description.trim() !== row.description ||
    Math.round(parseFloat(priceDollars || "0") * 100) !== row.price_cents ||
    category !== row.category;

  function save() {
    const body: Parameters<typeof onPatch>[0] = {};
    if (name.trim() !== row.name) body.name = name.trim();
    if (description.trim() !== row.description) body.description = description.trim();
    const cents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (cents !== row.price_cents) body.priceCents = cents;
    if (category !== row.category) body.category = category;
    onPatch(body);
    setOpen(false);
  }

  return (
    <li className="card p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left min-w-0"
          aria-expanded={open}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className={`font-display font-semibold truncate ${row.available ? "" : "opacity-60 line-through"}`}>
              {row.name}
            </span>
            <span className="font-display text-[color:var(--gold)] font-bold whitespace-nowrap">
              {formatPrice(row.price_cents)}
            </span>
          </div>
          <p className="text-xs text-[color:var(--ink-mute)] mt-1 truncate">
            {row.description || <span className="italic">No description</span>}
          </p>
        </button>
        <button
          onClick={() => onPatch({ available: !row.available })}
          disabled={busy}
          className={`text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${
            row.available
              ? "bg-[color:var(--olive)]/15 border-[color:var(--olive)] text-[color:var(--olive)]"
              : "bg-[color:var(--bg-warm)] border-[color:var(--line)] text-[color:var(--ink-mute)]"
          }`}
        >
          {row.available ? "Live" : "Off"}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-[color:var(--line)] space-y-3 fade-up">
          <Field label="Name">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="input resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)">
              <input
                className="input"
                inputMode="decimal"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </Field>
            <Field label="Section">
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Row["category"])}
              >
                <option value="mains">Mains</option>
                <option value="sides">Sides</option>
                <option value="drinks">Drinks</option>
                <option value="desserts">Desserts</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={!dirty || busy}
              className="btn btn-primary !py-2 !px-4 !text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onDelete}
              disabled={busy}
              className="btn btn-ghost !py-2 !px-4 !text-sm !text-[color:var(--rust-deep)] hover:!bg-[color:var(--cream)]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function CreateDish({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: Row) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [category, setCategory] = useState<Row["category"]>("mains");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const cents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Price must be more than 0");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          priceCents: cents,
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      onCreated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-5">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md card p-6 fade-up">
        <h3 className="font-display text-2xl italic"><span className="gilt">New dish</span></h3>
        <p className="text-xs text-[color:var(--ink-mute)] mt-1">Add it now, change anything later.</p>

        <div className="mt-5 space-y-3">
          <Field label="Name">
            <input
              className="input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="input resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              placeholder="Slow-cooked. Honey-glazed. Worth the wait."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)">
              <input
                className="input"
                inputMode="decimal"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="12.95"
              />
            </Field>
            <Field label="Section">
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Row["category"])}
              >
                <option value="mains">Mains</option>
                <option value="sides">Sides</option>
                <option value="drinks">Drinks</option>
                <option value="desserts">Desserts</option>
              </select>
            </Field>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[color:var(--rust-deep)]">{error}</p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={submit}
            disabled={submitting}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting ? "Adding…" : "Add to menu"}
          </button>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
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
