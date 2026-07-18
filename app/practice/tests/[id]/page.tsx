"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, ListChecks, Lock } from "lucide-react";
import { fetchTestDetail, startAttempt, TestSummary, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const TYPE_COPY: Record<TestSummary["type"], string> = {
  practice: "Untimed. You'll see whether each answer is right as soon as you submit it.",
  timed_section: "Timed. Answers are withheld until you submit the whole section.",
  mock: "Timed, full-length. Answers are withheld until you submit the exam.",
};

function formatMinutes(sec?: number) {
  if (!sec) return null;
  return `${Math.round(sec / 60)} minutes`;
}

export default function TestStartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<{ test: TestSummary; locked: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchTestDetail(id, accessToken)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this test."));
  }, [id, accessToken, authLoading]);

  if (error) return <main className="mx-auto max-w-2xl px-6 py-16 text-forest/60">{error}</main>;
  if (!data) return <main className="mx-auto max-w-2xl px-6 py-16 text-forest/40">Loading…</main>;

  const { test, locked } = data;

  async function handleStart() {
    if (!user) {
      router.push(`/login?next=/practice/tests/${id}`);
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const res = await startAttempt(id, accessToken);
      router.push(`/practice/attempts/${res.attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start this test.");
      setIsStarting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">{test.exam}</p>
      <h1 className="mt-2 font-display text-3xl text-forest">{test.title}</h1>
      <p className="mt-3 text-forest/60">{TYPE_COPY[test.type]}</p>

      <div className="mt-6 flex gap-6 text-sm text-forest/60">
        <span className="flex items-center gap-1.5">
          <ListChecks size={16} /> {test.questionCount} questions
        </span>
        {test.timeLimitSec && (
          <span className="flex items-center gap-1.5">
            <Clock size={16} /> {formatMinutes(test.timeLimitSec)}
          </span>
        )}
      </div>

      {locked ? (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-rule bg-white p-5">
          <Lock size={18} className="mt-0.5 shrink-0 text-forest/40" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-forest">This test unlocks with the test-prep bundle.</p>
            <p className="mt-1 text-sm text-forest/50">Purchase gives lifetime access to every test for this exam.</p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="mt-8 rounded-md bg-forest px-6 py-3 text-sm font-medium text-paper
                     hover:bg-forest-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStarting ? "Starting…" : "Start test"}
        </button>
      )}
    </main>
  );
}
