import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-leaf">Payment received</p>
      <h1 className="mt-2 font-display text-3xl text-forest">You're enrolled</h1>
      <p className="mt-3 text-forest/60">
        Your purchase went through. It can take a few seconds for the course to unlock on your account —
        refresh your dashboard if it's not there yet.
      </p>
      <Link href="/dashboard" className="mt-6 rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-paper">
        Go to my courses
      </Link>
    </main>
  );
}
