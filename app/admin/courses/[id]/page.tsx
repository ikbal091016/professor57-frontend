"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchCourseForEditing,
  updateCourse,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  createMuxUpload,
  CourseEditRecord,
  SectionRecord,
  LectureRecord,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";

function LectureForm({
  sectionId,
  onCreated,
  accessToken,
}: {
  sectionId: string;
  onCreated: (l: LectureRecord) => void;
  accessToken: string | null;
}) {
  const [title, setTitle] = useState("");
  const [videoRef, setVideoRef] = useState("");
  const [duration, setDuration] = useState("300");
  const [isFree, setIsFree] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title || !videoRef) return;
    setSaving(true);
    try {
      const res = await createLecture(
        sectionId,
        { title, videoProvider: "youtube", videoRef, durationSec: Number(duration), isFree },
        accessToken
      );
      onCreated(res.lecture);
      setTitle("");
      setVideoRef("");
      setDuration("300");
      setIsFree(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-rule p-3">
      <input
        placeholder="Lecture title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 min-w-[160px] rounded-md border border-rule px-2.5 py-1.5 text-sm"
      />
      <input
        placeholder="YouTube video ID"
        value={videoRef}
        onChange={(e) => setVideoRef(e.target.value)}
        className="w-40 rounded-md border border-rule px-2.5 py-1.5 text-sm"
      />
      <input
        type="number"
        placeholder="Seconds"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-24 rounded-md border border-rule px-2.5 py-1.5 text-sm"
      />
      <label className="flex items-center gap-1.5 text-xs text-forest/60">
        <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free preview
      </label>
      <button
        onClick={handleAdd}
        disabled={saving}
        className="rounded-md bg-forest px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-60"
      >
        Add lecture
      </button>
    </div>
  );
}

function ResourceEditor({
  lecture,
  onAdd,
  onRemove,
}: {
  lecture: LectureRecord;
  onAdd: (title: string, url: string) => void;
  onRemove: (index: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="mt-2 rounded border border-dashed border-rule p-2">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-forest/40">
        Attachments (slides, PDF, images — paste a Google Drive/Dropbox link)
      </p>
      {(lecture.resources || []).length > 0 && (
        <ul className="mb-2 space-y-1">
          {lecture.resources.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-xs text-forest/70">
              <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-lime-dark hover:underline">
                {r.title}
              </a>
              <button onClick={() => onRemove(i)} className="ml-2 shrink-0 text-red-500 hover:text-red-700">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5">
        <input
          placeholder="Title (e.g. Slides)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-28 rounded border border-rule px-2 py-1 text-xs"
        />
        <input
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded border border-rule px-2 py-1 text-xs"
        />
        <button
          onClick={() => {
            if (!title || !url) return;
            onAdd(title, url);
            setTitle("");
            setUrl("");
          }}
          className="rounded bg-forest/10 px-2 py-1 text-xs font-medium text-forest hover:bg-forest/20"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function CourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [course, setCourse] = useState<CourseEditRecord | null>(null);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [lectures, setLectures] = useState<LectureRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [uploadInfo, setUploadInfo] = useState<{ lectureId: string; url: string } | null>(null);

  useEffect(() => {
    fetchCourseForEditing(id, accessToken)
      .then((res) => {
        setCourse(res.course);
        setSections(res.sections.sort((a, b) => a.order - b.order));
        setLectures(res.lectures);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this course."));
  }, [id, accessToken]);

  if (error) return <main className="p-10 text-forest/60">{error}</main>;
  if (!course) return <main className="p-10 text-forest/40">Loading…</main>;

  async function saveField(field: string, value: unknown) {
    const res = await updateCourse(id, { [field]: value }, accessToken);
    setCourse(res.course);
  }

  async function handleDeleteCourse() {
    if (!confirm("Delete this course and all its sections/lectures? This can't be undone.")) return;
    await deleteCourse(id, accessToken);
    router.push("/admin/courses");
  }

  async function handleAddSection() {
    if (!newSectionTitle) return;
    const res = await createSection(id, newSectionTitle, accessToken);
    setSections((prev) => [...prev, res.section]);
    setNewSectionTitle("");
  }

  async function handleMoveSection(index: number, direction: -1 | 1) {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    await reorderSections(id, next.map((s) => s._id), accessToken);
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Delete this section and its lectures?")) return;
    await deleteSection(sectionId, accessToken);
    setSections((prev) => prev.filter((s) => s._id !== sectionId));
    setLectures((prev) => prev.filter((l) => l.sectionId !== sectionId));
  }

  async function handleMoveLecture(sectionId: string, index: number, direction: -1 | 1) {
    const sectionLectures = lectures.filter((l) => l.sectionId === sectionId).sort((a, b) => a.order - b.order);
    const target = index + direction;
    if (target < 0 || target >= sectionLectures.length) return;
    [sectionLectures[index], sectionLectures[target]] = [sectionLectures[target], sectionLectures[index]];
    const orderedIds = sectionLectures.map((l) => l._id);
    setLectures((prev) => [...prev.filter((l) => l.sectionId !== sectionId), ...sectionLectures]);
    await reorderLectures(sectionId, orderedIds, accessToken);
  }

  async function handleDeleteLecture(lectureId: string) {
    if (!confirm("Delete this lecture?")) return;
    await deleteLecture(lectureId, accessToken);
    setLectures((prev) => prev.filter((l) => l._id !== lectureId));
  }

  async function handleToggleFree(lecture: LectureRecord) {
    const res = await updateLecture(lecture._id, { isFree: !lecture.isFree }, accessToken);
    setLectures((prev) => prev.map((l) => (l._id === lecture._id ? res.lecture : l)));
  }

  async function handleRequestUpload(lectureId: string) {
    const res = await createMuxUpload(lectureId, accessToken);
    setUploadInfo({ lectureId, url: res.uploadUrl });
  }

  async function handleToggleProvider(lecture: LectureRecord) {
    const nextProvider = lecture.videoProvider === "mux" ? "youtube" : "mux";
    const res = await updateLecture(
      lecture._id,
      { videoProvider: nextProvider, videoRef: lecture.videoRef || "pending" },
      accessToken
    );
    setLectures((prev) => prev.map((l) => (l._id === lecture._id ? res.lecture : l)));
  }

  async function handleUpdateVideoRef(lecture: LectureRecord, videoRef: string) {
    const res = await updateLecture(lecture._id, { videoRef }, accessToken);
    setLectures((prev) => prev.map((l) => (l._id === lecture._id ? res.lecture : l)));
  }

  async function handleAddResource(lecture: LectureRecord, title: string, url: string) {
    const resources = [...(lecture.resources || []), { title, url }];
    const res = await updateLecture(lecture._id, { resources }, accessToken);
    setLectures((prev) => prev.map((l) => (l._id === lecture._id ? res.lecture : l)));
  }

  async function handleRemoveResource(lecture: LectureRecord, index: number) {
    const resources = (lecture.resources || []).filter((_, i) => i !== index);
    const res = await updateLecture(lecture._id, { resources }, accessToken);
    setLectures((prev) => prev.map((l) => (l._id === lecture._id ? res.lecture : l)));
  }

  return (
    <main className="mx-auto max-w-3xl p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-forest">{course.title}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveField("published", !course.published)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              course.published ? "bg-leaf/10 text-leaf" : "bg-forest/10 text-forest/50"
            }`}
          >
            {course.published ? "Published" : "Draft"} — click to toggle
          </button>
          <button onClick={handleDeleteCourse} className="text-sm text-red-600 hover:underline">
            Delete course
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-lg border border-rule bg-white p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-forest/40">Title</label>
          <input
            defaultValue={course.title}
            onBlur={(e) => e.target.value !== course.title && saveField("title", e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-forest/40">Description</label>
          <textarea
            defaultValue={course.description}
            rows={3}
            onBlur={(e) => e.target.value !== course.description && saveField("description", e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-forest/40">Category</label>
            <input
              defaultValue={course.category}
              onBlur={(e) => e.target.value !== course.category && saveField("category", e.target.value)}
              className="w-full rounded-md border border-rule px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-forest/40">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              defaultValue={course.price}
              onBlur={(e) => Number(e.target.value) !== course.price && saveField("price", Number(e.target.value))}
              className="w-full rounded-md border border-rule px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl text-forest">Sections & lectures</h2>
      <div className="mt-4 space-y-4">
        {sections.map((section, sIndex) => {
          const sectionLectures = lectures.filter((l) => l.sectionId === section._id).sort((a, b) => a.order - b.order);
          return (
            <div key={section._id} className="rounded-lg border border-rule bg-white">
              <div className="flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5">
                <input
                  defaultValue={section.title}
                  onBlur={(e) => e.target.value !== section.title && updateSection(section._id, { title: e.target.value }, accessToken)}
                  className="bg-transparent font-display text-base text-forest focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMoveSection(sIndex, -1)} className="text-forest/40 hover:text-forest">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => handleMoveSection(sIndex, 1)} className="text-forest/40 hover:text-forest">
                    <ChevronDown size={16} />
                  </button>
                  <button onClick={() => handleDeleteSection(section._id)} className="ml-2 text-red-500 hover:text-red-700">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-rule">
                {sectionLectures.map((lecture, lIndex) => (
                  <li key={lecture._id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-forest">{lecture.title}</span>
                      <div className="flex items-center gap-2">
                        {lecture.videoProvider === "mux" && (
                          <button
                            onClick={() => handleRequestUpload(lecture._id)}
                            title="Get a Mux upload URL"
                            className="text-forest/40 hover:text-forest"
                          >
                            <Upload size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleProvider(lecture)}
                          className="rounded-full border border-rule px-2 py-0.5 text-xs text-forest/60 hover:border-forest"
                          title="Switch between YouTube and Mux"
                        >
                          {lecture.videoProvider === "mux" ? "Mux" : "YouTube"}
                        </button>
                        <button
                          onClick={() => handleToggleFree(lecture)}
                          className={`rounded-full px-2 py-0.5 text-xs ${lecture.isFree ? "bg-leaf/10 text-leaf" : "bg-forest/10 text-forest/50"}`}
                        >
                          {lecture.isFree ? "Free" : "Locked"}
                        </button>
                        <button onClick={() => handleMoveLecture(section._id, lIndex, -1)} className="text-forest/40 hover:text-forest">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => handleMoveLecture(section._id, lIndex, 1)} className="text-forest/40 hover:text-forest">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => handleDeleteLecture(lecture._id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <input
                      defaultValue={lecture.videoRef}
                      placeholder={lecture.videoProvider === "mux" ? "Mux playback ID" : "YouTube video ID"}
                      onBlur={(e) => e.target.value !== lecture.videoRef && handleUpdateVideoRef(lecture, e.target.value)}
                      className="mt-1.5 w-full rounded border border-rule bg-paper px-2 py-1 text-xs text-forest/70"
                    />
                    <ResourceEditor
                      lecture={lecture}
                      onAdd={(title, url) => handleAddResource(lecture, title, url)}
                      onRemove={(index) => handleRemoveResource(lecture, index)}
                    />
                  </li>
                ))}
              </ul>

              {uploadInfo && sectionLectures.some((l) => l._id === uploadInfo.lectureId) && (
                <p className="break-all border-t border-rule bg-paper px-4 py-2 text-xs text-forest/60">
                  Upload URL (use with Mux's uploader): {uploadInfo.url}
                </p>
              )}

              <div className="px-4 py-3">
                <LectureForm
                  sectionId={section._id}
                  accessToken={accessToken}
                  onCreated={(l) => setLectures((prev) => [...prev, l])}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-2">
          <input
            placeholder="New section title"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            className="flex-1 rounded-md border border-rule bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper"
          >
            <Plus size={15} /> Add section
          </button>
        </div>
      </div>
    </main>
  );
}
