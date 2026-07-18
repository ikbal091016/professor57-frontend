"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchAdminCourses, AdminCourseSummary } from "@/lib/admin-api";

export default function AdminCoursesPage() {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState<AdminCourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminCourses(accessToken)
      .then((res) => setCourses(res.courses))
      .catch(() => setError("Couldn't load courses."));
  }, [accessToken]);

  return (
    <main className="p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-forest">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper"
        >
          <Plus size={15} /> New course
        </Link>
      </div>

      {error && <p className="mt-6 text-forest/60">{error}</p>}
      {!courses && !error && <p className="mt-6 text-forest/40">Loading…</p>}

      {courses && (
        <div className="mt-6 overflow-hidden rounded-lg border border-rule bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-rule bg-paper text-left text-xs uppercase tracking-wide text-forest/40">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Enrollments</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${c.id}`} className="font-medium text-forest hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-forest/60">{c.category}</td>
                  <td className="px-4 py-3 text-forest/60">${c.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-forest/60">{c.enrollments}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.published ? "bg-leaf/10 text-leaf" : "bg-forest/10 text-forest/50"
                      }`}
                    >
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-forest/40">
                    No courses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
