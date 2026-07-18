import Link from "next/link";

export default function CheckoutCancelledPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-forest/40">Checkout cancelled</p>
      <h1 className="mt-2 font-display text-3xl text-forest">No charge was made</h1>
      <p className="mt-3 text-forest/60">You can pick up where you left off any time — nothing was charged.</p>
      <Link href="/courses" className="mt-6 rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-paper">
        Back to courses
      </Link>
    </main>
  );
}
