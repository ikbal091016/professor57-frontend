"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
  bulkImportQuestions,
  AdminQuestion,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";

const EMPTY_FORM = {
  exam: "GRE",
  section: "",
  difficulty: "medium" as const,
  stem: "",
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctChoiceIds: ["a"] as string[],
  explanation: "",
  tags: "",
};

// Expected CSV columns: exam,section,difficulty,stem,choiceA,choiceB,choiceC,choiceD,correctChoiceIds,explanation,tags
// correctChoiceIds and tags are semicolon-separated for multi-value cells (e.g. "a;c").
function csvRowToQuestion(row: Record<string, string>): Omit<AdminQuestion, "_id"> {
  const choices = ["A", "B", "C", "D"]
    .filter((letter) => row[`choice${letter}`])
    .map((letter) => ({ id: letter.toLowerCase(), text: row[`choice${letter}`] }));
  return {
    exam: row.exam,
    section: row.section,
    difficulty: (row.difficulty as AdminQuestion["difficulty"]) || "medium",
    type: choices.length && row.correctChoiceIds?.includes(";") ? "multi" : "single",
    stem: row.stem,
    choices,
    correctChoiceIds: (row.correctChoiceIds || "").toLowerCase().split(";").map((s) => s.trim()).filter(Boolean),
    explanation: row.explanation || "",
    tags: (row.tags || "").split(";").map((s) => s.trim()).filter(Boolean),
  };
}

export default function QuestionBankPage() {
  const { accessToken } = useAuth();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [examFilter, setExamFilter] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetchQuestions({ exam: examFilter || undefined }, accessToken).then((res) => {
      setQuestions(res.questions);
      setTotal(res.total);
    });
  }

  useEffect(load, [accessToken, examFilter]);

  function toggleCorrect(letter: string) {
    setForm((prev) => ({
      ...prev,
      correctChoiceIds: prev.correctChoiceIds.includes(letter)
        ? prev.correctChoiceIds.filter((id) => id !== letter)
        : [...prev.correctChoiceIds, letter],
    }));
  }

  async function handleCreate() {
    setFormError(null);

    const choices = [
      { id: "a", text: form.choiceA },
      { id: "b", text: form.choiceB },
      { id: "c", text: form.choiceC },
      { id: "d", text: form.choiceD },
    ].filter((c) => c.text.trim());

    if (!form.stem.trim()) return setFormError("Add the question text before saving.");
    if (choices.length < 2) return setFormError("Add at least two answer choices.");
    if (form.correctChoiceIds.length === 0) return setFormError("Check at least one correct answer.");
    if (!form.explanation.trim()) return setFormError("Add an explanation before saving.");

    setIsSaving(true);
    try {
      await createQuestion(
        {
          exam: form.exam,
          section: form.section,
          difficulty: form.difficulty,
          type: form.correctChoiceIds.length > 1 ? "multi" : "single",
          stem: form.stem,
          choices,
          correctChoiceIds: form.correctChoiceIds,
          explanation: form.explanation,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        },
        accessToken
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't save this question. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id, accessToken);
    load();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = results.data.map(csvRowToQuestion).filter((q) => q.stem && q.choices.length >= 2);
          const res = await bulkImportQuestions(parsed, accessToken);
          setImportStatus(`Imported ${res.created} question${res.created === 1 ? "" : "s"}.`);
          load();
        } catch {
          setImportStatus("Import failed — check the CSV columns match the expected format.");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  const CHOICE_FIELDS: { letter: string; key: "choiceA" | "choiceB" | "choiceC" | "choiceD" }[] = [
    { letter: "a", key: "choiceA" },
    { letter: "b", key: "choiceB" },
    { letter: "c", key: "choiceC" },
    { letter: "d", key: "choiceD" },
  ];

  return (
    <main className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-forest">Question bank</h1>
          <p className="mt-1 text-sm text-forest/50">
            {total} questions — the shared pool of exam-prep questions. A "Practice Test" is just a named set of
            questions picked from here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelected}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-rule bg-white px-4 py-2 text-sm font-medium text-forest"
          >
            <Upload size={15} /> Import CSV
          </label>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper"
          >
            <Plus size={15} /> New question
          </button>
        </div>
      </div>

      {importStatus && <p className="mt-3 text-sm text-forest/60">{importStatus}</p>}
      <p className="mt-2 text-xs text-forest/40">
        CSV columns: exam, section, difficulty, stem, choiceA–D, correctChoiceIds (e.g. &quot;a&quot; or &quot;a;c&quot; for
        multi-answer), explanation, tags (semicolon-separated).
      </p>

      <div className="mt-4">
        <input
          placeholder="Filter by exam (e.g. GRE)"
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="rounded-md border border-rule bg-white px-3 py-2 text-sm"
        />
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-rule bg-white p-5">
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{formError}</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Exam" value={form.exam} onChange={(e) => setForm({ ...form, exam: e.target.value })} className="rounded-md border border-rule px-3 py-2 text-sm" />
            <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-md border border-rule px-3 py-2 text-sm" />
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })} className="rounded-md border border-rule px-3 py-2 text-sm">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <textarea placeholder="Question stem" rows={2} value={form.stem} onChange={(e) => setForm({ ...form, stem: e.target.value })} className="w-full rounded-md border border-rule px-3 py-2 text-sm" />

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-forest/40">
              Answer choices — check the box next to every correct answer
            </p>
            <div className="space-y-2">
              {CHOICE_FIELDS.map(({ letter, key }) => (
                <div key={letter} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.correctChoiceIds.includes(letter)}
                    onChange={() => toggleCorrect(letter)}
                    title={`Mark ${letter.toUpperCase()} as correct`}
                  />
                  <span className="w-5 text-xs font-medium text-forest/50">{letter.toUpperCase()}</span>
                  <input
                    placeholder={`Choice ${letter.toUpperCase()}`}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="flex-1 rounded-md border border-rule px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <input placeholder="Tags, comma-separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-md border border-rule px-3 py-2 text-sm" />
          <textarea placeholder="Explanation (shown after the student answers)" rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="w-full rounded-md border border-rule px-3 py-2 text-sm" />
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save question"}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {questions.map((q) => (
          <div key={q._id} className="flex items-start justify-between gap-4 rounded-lg border border-rule bg-white p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-lime-dark">
                {q.exam} · {q.section} · {q.difficulty}
              </p>
              <p className="mt-1 text-sm text-forest">{q.stem}</p>
            </div>
            <button onClick={() => handleDelete(q._id)} className="shrink-0 text-red-500 hover:text-red-700">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {questions.length === 0 && <p className="text-forest/40">No questions yet.</p>}
      </div>
    </main>
  );
}
