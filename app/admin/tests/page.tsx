"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchAdminTests, createTest, deleteTest, fetchQuestions, AdminTest, AdminQuestion } from "@/lib/admin-api";

export default function AdminTestsPage() {
  const { accessToken } = useAuth();
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [exam, setExam] = useState("GRE");
  const [type, setType] = useState<"practice" | "timed_section" | "mock">("practice");
  const [timeLimitMin, setTimeLimitMin] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  function load() {
    fetchAdminTests(accessToken).then((res) => setTests(res.tests));
    fetchQuestions({}, accessToken).then((res) => setQuestions(res.questions));
  }

  useEffect(load, [accessToken]);

  async function handleCreate() {
    if (!title || selectedQuestionIds.length === 0) return;
    await createTest(
      {
        title,
        exam,
        type,
        questionIds: selectedQuestionIds,
        timeLimitSec: timeLimitMin ? Number(timeLimitMin) * 60 : undefined,
        isFree,
        published: true,
      },
      accessToken
    );
    setTitle("");
    setSelectedQuestionIds([]);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this test?")) return;
    await deleteTest(id, accessToken);
    load();
  }

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
  }

  return (
    <main className="p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-forest">Practice tests</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper"
        >
          <Plus size={15} /> New test
        </button>
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-rule bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-rule px-3 py-2 text-sm" />
            <input placeholder="Exam (e.g. GRE)" value={exam} onChange={(e) => setExam(e.target.value)} className="rounded-md border border-rule px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-md border border-rule px-3 py-2 text-sm">
              <option value="practice">Practice (untimed, instant feedback)</option>
              <option value="timed_section">Timed section</option>
              <option value="mock">Full mock exam</option>
            </select>
            <input
              placeholder="Time limit (minutes)"
              type="number"
              value={timeLimitMin}
              onChange={(e) => setTimeLimitMin(e.target.value)}
              disabled={type === "practice"}
              className="rounded-md border border-rule px-3 py-2 text-sm disabled:opacity-40"
            />
            <label className="flex items-center gap-1.5 text-sm text-forest/60">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free sample test
            </label>
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-forest/40">
            Questions ({selectedQuestionIds.length} selected)
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-rule p-2">
            {questions.map((q) => (
              <label key={q._id} className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper">
                <input
                  type="checkbox"
                  checked={selectedQuestionIds.includes(q._id)}
                  onChange={() => toggleQuestion(q._id)}
                  className="mt-0.5"
                />
                <span className="text-forest/70">
                  <span className="text-xs text-lime-dark">
                    [{q.exam}/{q.section}]
                  </span>{" "}
                  {q.stem}
                </span>
              </label>
            ))}
            {questions.length === 0 && <p className="p-2 text-forest/40">No questions yet — add some in the question bank first.</p>}
          </div>

          <button onClick={handleCreate} className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper">
            Save test
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {tests.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-white p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-lime-dark">
                {t.exam} · {t.type} · {t.questionCount} questions
              </p>
              <p className="mt-1 text-sm text-forest">{t.title}</p>
              <p className="mt-1 text-xs text-forest/40">
                {t.published ? "Published" : "Draft"} · {t.isFree ? "Free" : "Gated"}
              </p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="shrink-0 text-red-500 hover:text-red-700">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {tests.length === 0 && <p className="text-forest/40">No tests yet.</p>}
      </div>
    </main>
  );
}
