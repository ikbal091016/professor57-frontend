export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  isEmailVerified: boolean;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

/**
 * Thin fetch wrapper for the Professor57 API.
 * - Always sends credentials so the httpOnly refresh cookie travels with requests.
 * - Attaches the in-memory access token as a Bearer header when present.
 * - On a 401 from an authenticated call, tries a single silent refresh, then retries once.
 */
export async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {},
  isRetry = false
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && !isRetry && path !== "/api/auth/refresh") {
    const refreshed = await refreshSession().catch(() => null);
    if (refreshed) {
      return request<T>(path, { ...options, accessToken: refreshed.accessToken }, true);
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || "Something went wrong.", res.status, body.details);
  }
  return body as T;
}

export function registerUser(input: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export function loginUser(input: { email: string; password: string }) {
  return request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function refreshSession() {
  return request<AuthResponse>("/api/auth/refresh", { method: "POST" });
}

export function logoutUser(accessToken: string | null) {
  return request<void>("/api/auth/logout", { method: "POST", accessToken });
}

export function fetchMe(accessToken: string) {
  return request<{ user: ApiUser }>("/api/auth/me", { accessToken });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface CourseSummary {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  thumbnailUrl?: string;
}

export interface CourseListResponse {
  courses: CourseSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LectureView {
  id: string;
  title: string;
  durationSec: number;
  order: number;
  isFree: boolean;
  locked: boolean;
  videoProvider?: "youtube" | "mux";
  resources?: { title: string; url: string }[];
}

export type PlaybackPayload =
  | { provider: "youtube"; videoId: string }
  | { provider: "mux"; playbackId: string; token: string; expiresAt: string };

export function fetchLecturePlayback(lectureId: string, accessToken?: string | null) {
  return request<PlaybackPayload>(`/api/lectures/${lectureId}/playback`, { accessToken });
}

export interface SectionView {
  id: string;
  title: string;
  order: number;
  lectures: LectureView[];
}

export interface CourseDetailResponse {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    price: number;
    thumbnailUrl?: string;
  };
  hasAccess: boolean;
  sections: SectionView[];
}

export function fetchCourses(params: { category?: string; search?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return request<CourseListResponse>(`/api/courses${query ? `?${query}` : ""}`);
}

export function fetchCourseBySlug(slug: string, accessToken?: string | null) {
  return request<CourseDetailResponse>(`/api/courses/${slug}`, { accessToken });
}

export interface MyCourseEntry {
  course: CourseSummary;
  purchasedAt: string;
}

export function createCheckoutSession(
  input: { courseIds: string[]; promotionCode?: string },
  accessToken: string | null
) {
  return request<{ url: string; orderId: string }>("/api/checkout/session", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function fetchMyCourses(accessToken: string | null) {
  return request<{ courses: MyCourseEntry[] }>("/api/entitlements/me", { accessToken });
}

// ---------- exam / test prep ----------

export interface TestSummary {
  id: string;
  title: string;
  exam: string;
  type: "practice" | "timed_section" | "mock";
  section?: string;
  timeLimitSec?: number;
  questionCount: number;
  isFree: boolean;
  locked: boolean;
}

export interface ExamQuestion {
  id: string;
  section: string;
  difficulty: "easy" | "medium" | "hard";
  type: "single" | "multi";
  stem: string;
  choices: { id: string; text: string }[];
}

export interface AttemptAnswerState {
  questionId: string;
  selectedChoiceIds: string[];
  flagged: boolean;
}

export interface AttemptStartResponse {
  attempt: { id: string; status: "in_progress" | "submitted"; startedAt: string; answers: AttemptAnswerState[] };
  test: { id: string; title: string; exam: string; type: TestSummary["type"]; timeLimitSec?: number };
  questions: ExamQuestion[];
}

export interface SaveAnswerResponse {
  saved: true;
  isCorrect?: boolean;
  correctChoiceIds?: string[];
  explanation?: string;
}

export interface AttemptResults {
  testTitle: string;
  score: { correct: number; total: number };
  sectionBreakdown: { section: string; correct: number; total: number }[];
  topicAccuracy: { tag: string; correct: number; total: number }[];
  questions: (ExamQuestion & { correctChoiceIds: string[]; explanation: string; selectedChoiceIds: string[] })[];
}

export function fetchTests(exam?: string, accessToken?: string | null) {
  const qs = exam ? `?exam=${encodeURIComponent(exam)}` : "";
  return request<{ tests: TestSummary[] }>(`/api/exams/tests${qs}`, { accessToken });
}

export function fetchTestDetail(id: string, accessToken?: string | null) {
  return request<{ test: TestSummary; locked: boolean }>(`/api/exams/tests/${id}`, { accessToken });
}

export function startAttempt(testId: string, accessToken: string | null) {
  return request<AttemptStartResponse>(`/api/exams/tests/${testId}/attempts`, {
    method: "POST",
    accessToken,
  });
}

export function getAttempt(attemptId: string, accessToken: string | null) {
  return request<AttemptStartResponse>(`/api/exams/attempts/${attemptId}`, { accessToken });
}

export function saveAnswer(
  attemptId: string,
  body: { questionId: string; selectedChoiceIds: string[]; flagged?: boolean; timeSpentSec?: number },
  accessToken: string | null
) {
  return request<SaveAnswerResponse>(`/api/exams/attempts/${attemptId}/answers`, {
    method: "PATCH",
    body: JSON.stringify(body),
    accessToken,
  });
}

export function submitAttempt(attemptId: string, accessToken: string | null) {
  return request<AttemptResults>(`/api/exams/attempts/${attemptId}/submit`, { method: "POST", accessToken });
}

export function fetchResults(attemptId: string, accessToken: string | null) {
  return request<AttemptResults>(`/api/exams/attempts/${attemptId}/results`, { accessToken });
}

export interface MyAttemptEntry {
  id: string;
  test: { title: string; exam: string; type: string };
  status: "in_progress" | "submitted";
  score: { correct: number; total: number } | null;
  startedAt: string;
  submittedAt?: string;
}

export function fetchMyAttempts(accessToken: string | null) {
  return request<{ attempts: MyAttemptEntry[] }>("/api/exams/attempts/me", { accessToken });
}

export { ApiError };
