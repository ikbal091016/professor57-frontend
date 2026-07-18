"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createCourse } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";

export default function NewCoursePage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await createCourse({ title, description, category, price: Number(price) }, accessToken);
      router.push(`/admin/courses/${res.course.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the course.");
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="font-display text-2xl text-forest">New course</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{error}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-forest">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-forest">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-forest">Category</label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Test Prep"
              className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-forest">Price (USD)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-2 disabled:opacity-60"
        >
          {isSaving ? "Creating…" : "Create course"}
        </button>
      </form>
    </main>
  );
}
