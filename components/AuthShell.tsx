import Link from "next/link";

/**
 * Shared two-panel shell for auth pages: a dark editorial panel carrying the "57"
 * signature mark (echoes the numbered-question vernacular of the exam-prep side of
 * the product), and a light panel holding the actual form.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between bg-forest text-paper px-12 py-10 overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -bottom-24 font-display italic font-medium text-[420px] leading-none text-white/5 select-none"
        >
          57
        </span>
        <Link href="/" className="relative font-display italic text-2xl">
          Professor57
        </Link>
        <div className="relative max-w-sm">
          <p className="font-display italic text-3xl leading-snug mb-4">
            Lecture by lecture, question by question.
          </p>
          <p className="text-sm text-paper/70">
            Video courses from the Professor57 catalog, plus timed practice for the GRE, GMAT,
            and more — built the way a real classroom is built.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden font-display italic text-xl text-forest">
            Professor57
          </Link>
          <p className="mt-8 lg:mt-0 text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest">{title}</h1>
          <p className="mt-2 text-sm text-forest/60">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
