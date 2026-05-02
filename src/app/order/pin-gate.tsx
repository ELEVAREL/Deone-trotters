"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BUSINESS } from "@/lib/menu";

export function PinGate() {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function setDigit(i: number, v: string) {
    const cleaned = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < 3) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") submit();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    refs.current[Math.min(text.length, 3)]?.focus();
  }

  async function submit() {
    const pin = digits.join("");
    if (pin.length !== 4) {
      setError("Need all four digits.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/order-pad/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Wrong PIN");
        setDigits(["", "", "", ""]);
        refs.current[0]?.focus();
      } else {
        window.location.reload();
      }
    } catch {
      setError("Network hiccup. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 60%)" }}
      />
      <div className="relative w-full max-w-sm card p-7 sm:p-9 fade-up text-center">
        <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[color:var(--rust)] rounded-tl" />
        <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[color:var(--rust)] rounded-tr" />
        <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[color:var(--rust)] rounded-bl" />
        <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[color:var(--rust)] rounded-br" />

        <Link href="/" className="inline-flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-full bg-[color:var(--rust)] grid place-items-center text-[color:var(--bg)] font-display font-bold">
            D
          </div>
          <span className="font-display text-base font-bold tracking-tight">{BUSINESS.name}</span>
        </Link>

        <h1 className="h-display text-3xl italic">
          <span className="gilt">Staff only</span>
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-mute)]">
          Punch in your four-digit PIN.
        </p>

        <div
          className="mt-7 flex gap-3 justify-center"
          onPaste={onPaste}
          role="group"
          aria-label="PIN"
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`PIN digit ${i + 1}`}
              className="w-14 h-16 text-center text-3xl font-display font-bold bg-[color:var(--bg-warm)] border border-[color:var(--line)] rounded-xl text-[color:var(--gold)] focus:outline-none focus:border-[color:var(--rust)] focus:shadow-[0_0_0_4px_rgba(212,175,55,0.16)] transition"
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-[color:var(--rust-deep)]">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="btn btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-wait"
        >
          {submitting ? "Checking…" : "Unlock"}
        </button>

        <Link
          href="/"
          className="block mt-4 text-xs text-[color:var(--ink-mute)] hover:text-[color:var(--gold)] transition tracking-wide"
        >
          ← Back to menu
        </Link>
      </div>
    </main>
  );
}
