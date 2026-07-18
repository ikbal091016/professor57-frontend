import Link from "next/link";
import { fetchCourses } from "@/lib/api";

export const revalidate = 60;

function formatPrice(price: number) {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const { courses, total } = await fetchCourses({
    category: searchParams.category,
    search: searchParams.search,
  }).catch(() => ({ courses: [], total: 0 }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">Catalog</p>
      <h1 className="mt-2 font-display text-4xl text-forest">Courses</h1>
      <p className="mt-2 text-forest/60">
        {total} course{total === 1 ? "" : "s"} available. Every course opens with a few free lectures.
      </p>

      <form action="/courses" className="mt-8 flex gap-3">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search courses…"
          className="flex-1 rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest
                     placeholder:text-forest/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30"
        />
        <button
          type="submit"
          className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-2"
        >
          Search
        </button>
      </form>

      {courses.length === 0 ? (
        <p className="mt-16 text-forest/50">No courses match yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="group rounded-lg border border-rule bg-white p-5 transition-colors hover:border-lime"
            >
              <p className="text-xs font-semibold tracking-[0.1em] uppercase text-lime-dark">
                {course.category}
              </p>
              <h2 className="mt-2 font-display text-xl text-forest group-hover:underline">{course.title}</h2>
              <p className="mt-2 text-sm text-forest/60 line-clamp-2">{course.description}</p>
              <p className="mt-4 text-sm font-medium text-forest">{formatPrice(course.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
