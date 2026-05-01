"use client";
import { useState } from "react";

export function PayButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        onClick={pay}
        disabled={loading}
        className="btn btn-primary w-full !py-4 !text-base disabled:opacity-60 disabled:cursor-wait"
      >
        {loading ? "Redirecting…" : "Pay securely"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-[color:var(--rust-deep)]">{error}</p>
      )}
      <p className="mt-3 text-xs text-center text-[color:var(--ink-mute)]">
        Powered by Stripe · Card details never touch our server
      </p>
    </div>
  );
}
