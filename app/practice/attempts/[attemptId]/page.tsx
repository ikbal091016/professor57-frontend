"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getAttempt,
  saveAnswer,
  submitAttempt,
  AttemptStartResponse,
  ExamQuestion,
  ApiError,
} from "@/lib/api";

interface LocalAnswer {
  selectedChoiceIds: string[];
  flagged: boolean;
}

function formatClock(totalSec: number) {
  const clamped = Math.max(0, Math.round(totalSec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [data, setData] = useState<AttemptStartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, { isCorrect: boolean; correctChoiceIds: string[]; explanation: string }>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionStartedAt = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    getAttempt(attemptId, accessToken)
      .then((res) => {
        setData(res);
        const initial: Record<string, LocalAnswer> = {};
        for (const a of res.attempt.answers) {
          initial[a.questionId] = { selectedChoiceIds: a.selectedChoiceIds, flagged: a.flagged };
        }
        setAnswers(initial);
        if (res.test.timeLimitSec) {
          const elapsed = (Date.now() - new Date(res.attempt.startedAt).getTime()) / 1000;
          setSecondsLeft(Math.max(0, res.test.timeLimitSec - elapsed));
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this attempt."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, accessToken]);

  const questions = data?.questions || [];
  const isPractice = data?.test.type === "practice";
  const currentQuestion: ExamQuestion | undefined = questions[currentIndex];

  const flushTime = useCallback(
    (questionId: string) => {
      const elapsed = (Date.now() - questionStartedAt.current) / 1000;
      questionStartedAt.current = Date.now();
      if (elapsed < 1) return;
      const current = answersRef.current[questionId] || { selectedChoiceIds: [], flagged: false };
      saveAnswer(
        attemptId,
        { questionId, selectedChoiceIds: current.selectedChoiceIds, flagged: current.flagged, timeSpentSec: elapsed },
        accessToken
      ).catch(() => {});
    },
    [attemptId, accessToken]
  );

  function goTo(index: number) {
    if (currentQuestion) flushTime(currentQuestion.id);
    setCurrentIndex(index);
  }

  async function handleSelect(question: ExamQuestion, choiceId: string) {
    const isMulti = question.type === "multi";
    const existing = answers[question.id]?.selectedChoiceIds || [];
    const nextSelection = isMulti
      ? existing.includes(choiceId)
        ? existing.filter((id) => id !== choiceId)
        : [...existing, choiceId]
      : [choiceId];

    const flagged = answers[question.id]?.flagged || false;
    setAnswers((prev) => ({ ...prev, [question.id]: { selectedChoiceIds: nextSelection, flagged } }));

    try {
      const res = await saveAnswer(
        attemptId,
        { questionId: question.id, selectedChoiceIds: nextSelection, flagged },
        accessToken
      );
      if (res.isCorrect !== undefined && res.correctChoiceIds && res.explanation) {
        setFeedback((prev) => ({
          ...prev,
          [question.id]: { isCorrect: res.isCorrect!, correctChoiceIds: res.correctChoiceIds!, explanation: res.explanation! },
        }));
      }
    } catch {
      // Local state already updated optimistically; a failed autosave isn't worth interrupting the test for.
    }
  }

  function toggleFlag(question: ExamQuestion) {
    const existing = answers[question.id] || { selectedChoiceIds: [], flagged: false };
    const next = { ...existing, flagged: !existing.flagged };
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
    saveAnswer(attemptId, { questionId: question.id, selectedChoiceIds: next.selectedChoiceIds, flagged: next.flagged }, accessToken).catch(
      () => {}
    );
  }

  const handleSubmit = useCallback(async () => {
    if (currentQuestion) flushTime(currentQuestion.id);
    setIsSubmitting(true);
    try {
      await submitAttempt(attemptId, accessToken);
      router.push(`/practice/attempts/${attemptId}/results`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit the test.");
      setIsSubmitting(false);
    }
  }, [attemptId, accessToken, currentQuestion, flushTime, router]);

  // Countdown timer for timed sections/mocks — auto-submits at zero.
  useEffect(() => {
    if (secondsLeft === null || isSubmitting) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, isSubmitting, handleSubmit]);

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.selectedChoiceIds.length || 0) > 0).length,
    [questions, answers]
  );

  if (error) return <main className="mx-auto max-w-3xl px-6 py-16 text-forest/60">{error}</main>;
  if (!data || !currentQuestion) return <main className="mx-auto max-w-3xl px-6 py-16 text-forest/40">Loading…</main>;

  const currentAnswer = answers[currentQuestion.id] || { selectedChoiceIds: [], flagged: false };
  const currentFeedback = feedback[currentQuestion.id];

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-dark">{data.test.title}</p>
          <p className="mt-0.5 text-sm text-forest/50">
            Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        {secondsLeft !== null && (
          <div className="flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-forest">
            <Clock size={14} /> {formatClock(secondsLeft)}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest/40">{currentQuestion.section}</p>
          <button
            onClick={() => toggleFlag(currentQuestion)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium
                        ${currentAnswer.flagged ? "bg-lime/15 text-lime-dark" : "text-forest/40 hover:text-forest/60"}`}
          >
            <Flag size={13} fill={currentAnswer.flagged ? "currentColor" : "none"} /> Flag for review
          </button>
        </div>

        <p className="mt-4 font-display text-xl leading-relaxed text-forest">{currentQuestion.stem}</p>

        <div className="mt-6 space-y-2.5">
          {currentQuestion.choices.map((choice) => {
            const selected = currentAnswer.selectedChoiceIds.includes(choice.id);
            const showResult = isPractice && !!currentFeedback;
            const isCorrectChoice = currentFeedback?.correctChoiceIds.includes(choice.id);
            let stateClasses = "border-rule hover:border-forest/30";
            if (showResult && isCorrectChoice) stateClasses = "border-leaf bg-leaf/5";
            else if (showResult && selected && !isCorrectChoice) stateClasses = "border-red-300 bg-red-50";
            else if (selected) stateClasses = "border-forest bg-paper";

            return (
              <button
                key={choice.id}
                onClick={() => !showResult && handleSelect(currentQuestion, choice.id)}
                disabled={showResult}
                className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm text-forest
                            transition-colors disabled:cursor-default ${stateClasses}`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs
                              ${selected ? "border-forest bg-forest text-paper" : "border-rule text-forest/40"}`}
                >
                  {choice.id.toUpperCase()}
                </span>
                {choice.text}
              </button>
            );
          })}
        </div>

        {isPractice && currentFeedback && (
          <div className={`mt-4 rounded-md border p-4 text-sm ${currentFeedback.isCorrect ? "border-leaf/30 bg-leaf/5 text-leaf" : "border-red-200 bg-red-50 text-red-800"}`}>
            <p className="font-medium">{currentFeedback.isCorrect ? "Correct" : "Not quite"}</p>
            <p className="mt-1 text-forest/70">{currentFeedback.explanation}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => goTo(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 rounded-md border border-rule px-4 py-2 text-sm text-forest disabled:opacity-40"
        >
          <ArrowLeft size={15} /> Previous
        </button>
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={() => {
              if (confirm("Submit this test? You won't be able to change your answers after.")) handleSubmit();
            }}
            disabled={isSubmitting}
            className="rounded-md bg-forest px-6 py-2 text-sm font-medium text-paper hover:bg-forest-2 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit test"}
          </button>
        ) : (
          <button
            onClick={() => goTo(Math.min(questions.length - 1, currentIndex + 1))}
            className="flex items-center gap-1.5 rounded-md border border-rule px-4 py-2 text-sm text-forest"
          >
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>

      <div className="mt-8 border-t border-rule pt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-forest/40">Jump to question</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const isCurrent = i === currentIndex;
            const isAnswered = (a?.selectedChoiceIds.length || 0) > 0;
            let classes = "border-rule text-forest/50";
            if (isCurrent) classes = "border-forest bg-forest text-paper";
            else if (a?.flagged) classes = "border-lime bg-lime/10 text-lime-dark";
            else if (isAnswered) classes = "border-leaf/40 bg-leaf/10 text-leaf";

            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium ${classes}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
