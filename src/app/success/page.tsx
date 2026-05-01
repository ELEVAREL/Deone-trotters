import Link from "next/link";
import { BUSINESS } from "@/lib/menu";

export const metadata = { title: "Thank you" };

export default function SuccessPage() {
  return (
    <main className="min-h-screen grid place-items-center px-5">
      <div className="card p-10 text-center max-w-md w-full fade-up">
        <div className="w-16 h-16 rounded-full bg-[color:var(--olive)] text-[color:var(--paper)] grid place-items-center mx-auto mb-5 text-3xl glow-paid">
          ✓
        </div>
        <h1 className="h-display text-4xl">Thank you!</h1>
        <p className="mt-3 text-[color:var(--ink-mute)] text-pretty">
          Card cleared. The kitchen is plating you up. Show this screen at the
          counter, or just smile. We know you.
        </p>
        <Link href="/" className="btn btn-primary mt-7">Back to menu</Link>
      </div>
    </main>
  );
}
