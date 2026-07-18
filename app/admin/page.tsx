"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchAnalyticsSummary, AnalyticsSummary } from "@/lib/admin-api";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-rule bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-forest/40">{label}</p>
      <p className="mt-2 font-display text-2xl text-forest">{value}</p>
      {sub && <p className="mt-1 text-xs text-forest/40">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return; // instructors don't get platform-wide analytics
    fetchAnalyticsSummary(accessToken)
      .then(setData)
      .catch(() => setError("Couldn't load analytics."));
  }, [accessToken, user]);

  if (user?.role !== "admin") {
    return (
      <main className="p-10">
        <h1 className="font-display text-2xl text-forest">Welcome back</h1>
        <p className="mt-2 text-forest/60">
          Use the sidebar to manage your courses. Platform-wide analytics are visible to admins only.
        </p>
      </main>
    );
  }

  if (error) return <main className="p-10 text-forest/60">{error}</main>;
  if (!data) return <main className="p-10 text-forest/40">Loading…</main>;

  return (
    <main className="p-10">
      <h1 className="font-display text-2xl text-forest">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (all time)"
          value={`$${(data.revenue.totalCents / 100).toLocaleString()}`}
          sub={`$${(data.revenue.last30dCents / 100).toLocaleString()} last 30 days`}
        />
        <StatCard
          label="Enrollments"
          value={data.enrollments.total.toLocaleString()}
          sub={`${data.enrollments.last30d} last 30 days`}
        />
        <StatCard
          label="Users"
          value={data.users.total.toLocaleString()}
          sub={`${data.users.last30d} last 30 days`}
        />
        <StatCard label="Published courses" value={data.courses.total.toLocaleString()} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-rule bg-white p-5">
          <p className="font-display text-lg text-forest">Top courses by enrollment</p>
          {data.topCourses.length === 0 ? (
            <p className="mt-3 text-sm text-forest/40">No enrollments yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.topCourses.map((c) => (
                <li key={c.slug} className="flex items-center justify-between text-sm">
                  <span className="text-forest/70">{c.title}</span>
                  <span className="font-medium text-forest">{c.enrollments}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-rule bg-white p-5">
          <p className="font-display text-lg text-forest">Exam performance</p>
          <p className="mt-1 text-xs text-forest/40">{data.examStats.totalAttempts} submitted attempts total</p>
          {data.examStats.byExam.length === 0 ? (
            <p className="mt-3 text-sm text-forest/40">No submitted attempts yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.examStats.byExam.map((e) => (
                <li key={e.exam} className="flex items-center justify-between text-sm">
                  <span className="text-forest/70">
                    {e.exam} · {e.attempts} attempts
                  </span>
                  <span className="font-medium text-forest">{e.avgPct}% avg</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
