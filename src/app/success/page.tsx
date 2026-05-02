import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BUSINESS } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import type { OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thank you" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  const orderId = sp.order ?? null;
  let order: OrderRow | null = null;
  if (orderId) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, status, amount_cents, currency, items, customer_name, customer_phone, pickup_at, order_type, paid_at, created_at, notes, customer_email, stripe_session_id, stripe_payment_intent"
      )
      .eq("id", orderId)
      .maybeSingle<OrderRow>();
    order = data;
  }

  const isPreorder = order?.order_type === "preorder";

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(95,168,80,0.18) 0%, transparent 60%)" }}
      />
      <div className="relative card p-8 sm:p-10 text-center max-w-md w-full fade-up">
        <div className="w-16 h-16 rounded-full bg-[color:var(--olive)] text-[color:var(--bg)] grid place-items-center mx-auto mb-5 text-3xl font-bold glow-paid">
          ✓
        </div>
        <h1 className="h-display text-4xl italic">
          <span className="gilt">Thank you.</span>
        </h1>

        {isPreorder && order ? (
          <>
            <p className="mt-3 text-[color:var(--ink-mute)] text-pretty">
              Order is in. The kitchen is on it.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--bg-warm)] border border-[color:var(--rust-deep)] text-left">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-semibold">
                Pickup
              </div>
              <div className="font-display text-xl font-bold mt-1 text-[color:var(--ink)]">
                {order.pickup_at
                  ? new Date(order.pickup_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "As soon as ready"}
              </div>
              {order.customer_name && (
                <div className="text-sm text-[color:var(--ink-soft)] mt-1">
                  Under {order.customer_name}
                </div>
              )}
              {order.customer_phone && (
                <div className="text-sm text-[color:var(--ink-mute)] mt-1">
                  We&apos;ll text {order.customer_phone} when it&apos;s in the bag.
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[color:var(--line)] flex justify-between items-baseline">
                <span className="text-xs text-[color:var(--ink-mute)] uppercase tracking-wider">
                  Paid
                </span>
                <span className="font-display text-lg font-bold gilt italic">
                  {formatPrice(order.amount_cents, order.currency)}
                </span>
              </div>
            </div>
            <p className="mt-5 text-xs text-[color:var(--ink-mute)]">
              Save this screen — it&apos;s your receipt. Order #{order.id.slice(0, 8)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-[color:var(--ink-mute)] text-pretty">
            Card cleared. The kitchen is plating you up. Show this screen at
            the counter, or just smile. We know you.
          </p>
        )}

        <div className="flex gap-2 mt-7">
          <Link href="/" className="btn btn-ghost flex-1">Home</Link>
          <a href={`tel:${BUSINESS.phone}`} className="btn btn-primary flex-1">
            Call us
          </a>
        </div>
      </div>
    </main>
  );
}
