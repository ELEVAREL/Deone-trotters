import Link from "next/link";

export const metadata = { title: "Order cancelled" };

export default function CancelPage() {
  return (
    <main className="min-h-screen grid place-items-center px-5">
      <div className="card p-10 text-center max-w-md w-full">
        <h1 className="h-display text-3xl">No worries</h1>
        <p className="mt-3 text-[color:var(--ink-mute)]">
          Your card wasn&apos;t charged. Scan a fresh QR when you&apos;re ready.
        </p>
        <Link href="/" className="btn btn-ghost mt-6">Back home</Link>
      </div>
    </main>
  );
}
