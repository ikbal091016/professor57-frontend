import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-display italic text-4xl text-forest">Professor57</p>
        <p className="mt-3 text-forest/60">
          Course catalog and marketing pages land in a later phase — for now, auth is wired up.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/courses" className="rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
            Browse courses
          </Link>
          <Link href="/practice" className="rounded-md bg-lime px-4 py-2 text-sm font-medium text-white">
            Practice tests
          </Link>
          <Link href="/login" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper">
            Sign in
          </Link>
          <Link href="/register" className="rounded-md border border-rule px-4 py-2 text-sm font-medium text-forest">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
