"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Clock, ListChecks } from "lucide-react";
import { fetchTests, TestSummary, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const TYPE_LABEL: Record<TestSummary["type"], string> = {
  practice: "Untimed practice",
  timed_section: "Timed section",
  mock: "Full mock exam",
};

function formatMinutes(sec?: number) {
  if (!sec) return null;
  return `${Math.round(sec / 60)} min`;
}

export default function PracticeCatalogPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchTests(undefined, accessToken)
      .then((res) => setTests(res.tests))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load practice tests."));
  }, [accessToken, authLoading]);

  if (error) return <main className="mx-auto max-w-4xl px-6 py-16 text-forest/60">{error}</main>;
  if (!tests) return <main className="mx-auto max-w-4xl px-6 py-16 text-forest/40">Loading…</main>;

  const exams = Array.from(new Set(tests.map((t) => t.exam)));
  const visible = examFilter ? tests.filter((t) => t.exam === examFilter) : tests;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">Exam prep</p>
      <h1 className="mt-2 font-display text-4xl text-forest">Practice tests</h1>
      <p className="mt-2 text-forest/60">Untimed practice with instant feedback, or full timed mock exams.</p>

      {exams.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setExamFilter(null)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${!examFilter ? "bg-forest text-paper" : "border border-rule text-forest/60"}`}
          >
            All
          </button>
          {exams.map((exam) => (
            <button
              key={exam}
              onClick={() => setExamFilter(exam)}
              className={`rounded-full px-3.5 py-1.5 text-sm ${examFilter === exam ? "bg-forest text-paper" : "border border-rule text-forest/60"}`}
            >
              {exam}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 divide-y divide-rule rounded-lg border border-rule bg-white">
        {visible.length === 0 && <p className="p-6 text-forest/50">No practice tests yet — check back soon.</p>}
        {visible.map((test) => (
          <Link
            key={test.id}
            href={`/practice/tests/${test.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-dark">
                {test.exam} · {TYPE_LABEL[test.type]}
                {test.section ? ` · ${test.section}` : ""}
              </p>
              <p className="mt-1 font-display text-lg text-forest">{test.title}</p>
              <p className="mt-1 flex items-center gap-3 text-xs text-forest/50">
                <span className="flex items-center gap-1">
                  <ListChecks size={13} /> {test.questionCount} questions
                </span>
                {test.timeLimitSec && (
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {formatMinutes(test.timeLimitSec)}
                  </span>
                )}
                {test.isFree && <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-leaf">Free</span>}
              </p>
            </div>
            {test.locked && <Lock size={16} className="shrink-0 text-forest/30" aria-hidden="true" />}
          </Link>
        ))}
      </div>
    </main>
  );
}
