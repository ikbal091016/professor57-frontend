"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchResults, AttemptResults, ApiError } from "@/lib/api";

export default function AttemptResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { accessToken } = useAuth();
  const [results, setResults] = useState<AttemptResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults(attemptId, accessToken)
      .then(setResults)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load results."));
  }, [attemptId, accessToken]);

  if (error) return <main className="mx-auto max-w-3xl px-6 py-16 text-forest/60">{error}</main>;
  if (!results) return <main className="mx-auto max-w-3xl px-6 py-16 text-forest/40">Loading…</main>;

  const pct = Math.round((results.score.correct / Math.max(1, results.score.total)) * 100);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">Results</p>
      <h1 className="mt-2 font-display text-3xl text-forest">{results.testTitle}</h1>

      <div className="mt-6 rounded-lg border border-rule bg-white p-6">
        <div className="flex items-baseline gap-3">
          <p className="font-display text-4xl text-forest">{pct}%</p>
          <p className="text-forest/50">
            {results.score.correct} of {results.score.total} correct
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-forest/40">By section</p>
            <ul className="space-y-1.5">
              {results.sectionBreakdown.map((s) => (
                <li key={s.section} className="flex items-center justify-between text-sm">
                  <span className="text-forest/70">{s.section}</span>
                  <span className="font-medium text-forest">
                    {s.correct}/{s.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-forest/40">By topic</p>
            <ul className="space-y-1.5">
              {results.topicAccuracy.map((t) => (
                <li key={t.tag} className="flex items-center justify-between text-sm">
                  <span className="text-forest/70">{t.tag}</span>
                  <span className="font-medium text-forest">
                    {t.correct}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl text-forest">Question review</h2>
      <div className="mt-4 space-y-4">
        {results.questions.map((q, i) => {
          const correct =
            q.selectedChoiceIds.length === q.correctChoiceIds.length &&
            [...q.selectedChoiceIds].sort().every((id, idx) => id === [...q.correctChoiceIds].sort()[idx]);

          return (
            <div key={q.id} className="rounded-lg border border-rule bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-forest">
                  <span className="text-forest/40">{i + 1}.</span> {q.stem}
                </p>
                {correct ? (
                  <Check size={18} className="mt-0.5 shrink-0 text-leaf" />
                ) : (
                  <X size={18} className="mt-0.5 shrink-0 text-red-500" />
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {q.choices.map((choice) => {
                  const wasSelected = q.selectedChoiceIds.includes(choice.id);
                  const isCorrectChoice = q.correctChoiceIds.includes(choice.id);
                  let classes = "text-forest/60";
                  if (isCorrectChoice) classes = "text-leaf font-medium";
                  else if (wasSelected) classes = "text-red-600 line-through";
                  return (
                    <li key={choice.id} className={`text-sm ${classes}`}>
                      {choice.id.toUpperCase()}. {choice.text}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 border-t border-rule pt-3 text-sm text-forest/60">{q.explanation}</p>
            </div>
          );
        })}
      </div>

      <Link href="/practice" className="mt-10 inline-block text-sm font-medium text-lime-dark hover:underline">
        Back to practice tests
      </Link>
    </main>
  );
}
