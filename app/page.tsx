import Link from "next/link";
import { fetchCourses, fetchTests } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const [coursesRes, testsRes] = await Promise.all([
    fetchCourses().catch(() => ({ courses: [] })),
    fetchTests().catch(() => ({ tests: [] })),
  ]);

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-display italic text-4xl text-forest">Professor57</p>
        <p className="mt-3 text-forest/60">Video courses and timed exam practice, taught properly.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-5 font-display text-2xl text-forest">Courses</h2>
        {coursesRes.courses.length === 0 ? (
          <p className="text-forest/50">No courses published yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {coursesRes.courses.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}`}
                className="rounded-xl border border-rule bg-gradient-to-b from-lime/10 to-white px-4 py-6
                           text-center font-display text-lg text-forest transition-colors hover:border-lime"
              >
                {c.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-5 font-display text-2xl text-forest">Practice Tests</h2>
        {testsRes.tests.length === 0 ? (
          <p className="text-forest/50">No practice tests published yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {testsRes.tests.map((t) => (
              <Link
                key={t.id}
                href={`/practice/tests/${t.id}`}
                className="rounded-xl border border-rule bg-gradient-to-b from-lime/10 to-white px-4 py-6
                           text-center font-display text-lg text-forest transition-colors hover:border-lime"
              >
                {t.title}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
