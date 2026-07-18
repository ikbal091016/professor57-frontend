"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchMyCourses, fetchMyAttempts, MyCourseEntry, MyAttemptEntry } from "@/lib/api";

export default function DashboardPage() {
  const { user, accessToken, isLoading, logout } = useAuth();
  const [courses, setCourses] = useState<MyCourseEntry[] | null>(null);
  const [attempts, setAttempts] = useState<MyAttemptEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyCourses(accessToken)
      .then((res) => setCourses(res.courses))
      .catch(() => setCourses([]));
    fetchMyAttempts(accessToken)
      .then((res) => setAttempts(res.attempts))
      .catch(() => setAttempts([]));
  }, [user, accessToken]);

  if (isLoading) return <main className="p-10 text-forest/60">Loading…</main>;
  if (!user) return <main className="p-10 text-forest/60">You need to sign in to view this page.</main>;

  return (
    <main className="mx-auto max-w-3xl p-10">
      <p className="text-forest/60 text-sm">Signed in as</p>
      <h1 className="font-display text-2xl text-forest">{user.name}</h1>
      <p className="text-forest/60">{user.email}</p>
      <button onClick={() => logout()} className="mt-4 text-sm text-lime-dark hover:underline">
        Sign out
      </button>

      {(user.role === "admin" || user.role === "instructor") && (
        <Link
          href="/admin"
          className="mt-4 ml-4 inline-block rounded-md border border-rule px-3 py-1.5 text-sm text-forest hover:bg-paper"
        >
          Go to admin dashboard
        </Link>
      )}

      <h2 className="mt-10 font-display text-xl text-forest">My courses</h2>
      {courses === null ? (
        <p className="mt-3 text-forest/40">Loading your courses…</p>
      ) : courses.length === 0 ? (
        <p className="mt-3 text-forest/50">
          No courses yet.{" "}
          <Link href="/courses" className="text-lime-dark hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-white">
          {courses.map(({ course, purchasedAt }) => (
            <li key={course.slug}>
              <Link href={`/courses/${course.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-paper">
                <span className="text-sm text-forest">{course.title}</span>
                <span className="text-xs text-forest/40">
                  Purchased {new Date(purchasedAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-xl text-forest">Practice tests</h2>
      {attempts === null ? (
        <p className="mt-3 text-forest/40">Loading your test history…</p>
      ) : attempts.length === 0 ? (
        <p className="mt-3 text-forest/50">
          No attempts yet.{" "}
          <Link href="/practice" className="text-lime-dark hover:underline">
            Browse practice tests
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-white">
          {attempts.map((a) => (
            <li key={a.id}>
              <Link
                href={a.status === "submitted" ? `/practice/attempts/${a.id}/results` : `/practice/attempts/${a.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-paper"
              >
                <span className="text-sm text-forest">{a.test.title}</span>
                <span className="text-xs text-forest/40">
                  {a.status === "submitted" && a.score ? `${a.score.correct}/${a.score.total}` : "In progress"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
