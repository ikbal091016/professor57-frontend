"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Lock, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchCourseBySlug,
  fetchLecturePlayback,
  createCheckoutSession,
  CourseDetailResponse,
  LectureView,
  PlaybackPayload,
  ApiError,
} from "@/lib/api";

// Mux Player wraps a web component — load client-side only, no SSR.
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LectureRow({
  lecture,
  isPlaying,
  isLoading,
  onSelect,
}: {
  lecture: LectureView;
  isPlaying: boolean;
  isLoading: boolean;
  onSelect: (l: LectureView) => void;
}) {
  return (
    <li>
      <button
        onClick={() => !lecture.locked && onSelect(lecture)}
        disabled={lecture.locked}
        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-paper
                    disabled:hover:bg-transparent disabled:cursor-not-allowed ${isPlaying ? "bg-paper" : ""}`}
      >
        <span className="flex items-center gap-3 text-forest">
          {lecture.locked ? (
            <Lock size={16} className="shrink-0 text-forest/35" aria-hidden="true" />
          ) : (
            <PlayCircle size={16} className="shrink-0 text-leaf" aria-hidden="true" />
          )}
          {lecture.title}
          {lecture.isFree && (
            <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-xs font-medium text-leaf">Free</span>
          )}
        </span>
        <span className="shrink-0 text-forest/40">{isLoading ? "Loading…" : formatDuration(lecture.durationSec)}</span>
      </button>
    </li>
  );
}

function VideoPanel({ playback, title }: { playback: PlaybackPayload | null; title: string }) {
  if (!playback) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-paper/50">
        Select a free lecture to preview.
      </div>
    );
  }
  if (playback.provider === "youtube") {
    return (
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${playback.videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <MuxPlayer
      playbackId={playback.playbackId}
      tokens={{ playback: playback.token }}
      streamType="on-demand"
      metadata={{ video_title: title }}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<CourseDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait for the silent refresh so entitlement checks are accurate
    fetchCourseBySlug(slug, accessToken)
      .then((res) => {
        setData(res);
        const firstPlayable = res.sections.flatMap((s) => s.lectures).find((l) => !l.locked);
        if (firstPlayable) selectLecture(firstPlayable);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this course."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, accessToken, authLoading]);

  async function selectLecture(lecture: LectureView) {
    setActiveLectureId(lecture.id);
    setPlaybackLoading(true);
    try {
      const payload = await fetchLecturePlayback(lecture.id, accessToken);
      setPlayback(payload);
    } catch {
      setPlayback(null);
    } finally {
      setPlaybackLoading(false);
    }
  }

  if (error) return <main className="mx-auto max-w-4xl px-6 py-16 text-forest/60">{error}</main>;
  if (!data) return <main className="mx-auto max-w-4xl px-6 py-16 text-forest/40">Loading…</main>;

  const { course, hasAccess, sections } = data;
  const activeLecture = sections.flatMap((s) => s.lectures).find((l) => l.id === activeLectureId) || null;

  async function handleEnroll() {
    if (!user) {
      router.push(`/login?next=/courses/${slug}`);
      return;
    }
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const { url } = await createCheckoutSession({ courseIds: [course.id] }, accessToken);
      window.location.href = url; // hand off to Stripe Checkout
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Couldn't start checkout. Please try again.");
      setIsCheckingOut(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs font-semibold tracking-[0.14em] uppercase text-lime-dark">{course.category}</p>
      <h1 className="mt-2 font-display text-3xl text-forest">{course.title}</h1>
      <p className="mt-3 max-w-2xl text-forest/60">{course.description}</p>

      <div className="mt-8 aspect-video w-full overflow-hidden rounded-lg border border-rule bg-forest">
        {playbackLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-paper/50">Loading video…</div>
        ) : (
          <VideoPanel playback={playback} title={activeLecture?.title || course.title} />
        )}
      </div>

      {activeLecture && activeLecture.resources && activeLecture.resources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeLecture.resources.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-rule bg-white px-3 py-1.5 text-sm text-lime-dark hover:border-lime"
            >
              {r.title}
            </a>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_260px]">
        <div className="divide-y divide-rule rounded-lg border border-rule bg-white">
          {sections.map((section) => (
            <div key={section.id}>
              <h2 className="border-b border-rule bg-paper px-4 py-2.5 font-display text-base text-forest">
                {section.title}
              </h2>
              <ul className="divide-y divide-rule">
                {section.lectures.map((lecture) => (
                  <LectureRow
                    key={lecture.id}
                    lecture={lecture}
                    isPlaying={lecture.id === activeLectureId}
                    isLoading={playbackLoading && lecture.id === activeLectureId}
                    onSelect={selectLecture}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-rule bg-white p-5">
          {hasAccess ? (
            <p className="text-sm font-medium text-leaf">You have lifetime access to this course.</p>
          ) : (
            <>
              <p className="font-display text-2xl text-forest">
                {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
              </p>
              <p className="mt-1 text-xs text-forest/50">One-time payment. Lifetime access.</p>
              <button
                onClick={handleEnroll}
                disabled={isCheckingOut}
                className="mt-4 w-full rounded-md bg-forest py-2.5 text-sm font-medium text-paper
                           hover:bg-forest-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? "Redirecting to checkout…" : "Enroll"}
              </button>
              {checkoutError && <p className="mt-3 text-xs text-red-700">{checkoutError}</p>}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
