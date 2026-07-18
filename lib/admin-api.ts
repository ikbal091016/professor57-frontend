import { request } from "./api";

// ---------- course management ----------

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  published: boolean;
  enrollments: number;
  createdAt: string;
}

export function fetchAdminCourses(accessToken: string | null) {
  return request<{ courses: AdminCourseSummary[] }>("/api/admin/courses", { accessToken });
}

export interface CourseEditRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  published: boolean;
  instructorId: string;
}

export interface SectionRecord {
  _id: string;
  title: string;
  order: number;
}

export interface LectureRecord {
  _id: string;
  sectionId: string;
  title: string;
  videoProvider: "youtube" | "mux";
  videoRef: string;
  durationSec: number;
  order: number;
  isFree: boolean;
}

export function fetchCourseForEditing(courseId: string, accessToken: string | null) {
  return request<{ course: CourseEditRecord; sections: SectionRecord[]; lectures: LectureRecord[] }>(
    `/api/courses/${courseId}/edit`,
    { accessToken }
  );
}

export function createCourse(
  input: { title: string; description: string; category: string; price: number },
  accessToken: string | null
) {
  return request<{ course: { id: string } }>("/api/courses", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updateCourse(courseId: string, input: Record<string, unknown>, accessToken: string | null) {
  return request<{ course: CourseEditRecord }>(`/api/courses/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteCourse(courseId: string, accessToken: string | null) {
  return request<void>(`/api/courses/${courseId}`, { method: "DELETE", accessToken });
}

export function createSection(courseId: string, title: string, accessToken: string | null) {
  return request<{ section: SectionRecord }>(`/api/courses/${courseId}/sections`, {
    method: "POST",
    body: JSON.stringify({ title }),
    accessToken,
  });
}

export function updateSection(sectionId: string, input: Record<string, unknown>, accessToken: string | null) {
  return request<{ section: SectionRecord }>(`/api/sections/${sectionId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteSection(sectionId: string, accessToken: string | null) {
  return request<void>(`/api/sections/${sectionId}`, { method: "DELETE", accessToken });
}

export function reorderSections(courseId: string, orderedIds: string[], accessToken: string | null) {
  return request<{ message: string }>(`/api/courses/${courseId}/sections/reorder`, {
    method: "POST",
    body: JSON.stringify({ orderedIds }),
    accessToken,
  });
}

export function reorderLectures(sectionId: string, orderedIds: string[], accessToken: string | null) {
  return request<{ message: string }>(`/api/courses/sections/${sectionId}/lectures/reorder`, {
    method: "POST",
    body: JSON.stringify({ orderedIds }),
    accessToken,
  });
}

export function createLecture(
  sectionId: string,
  input: { title: string; videoProvider: "youtube" | "mux"; videoRef: string; durationSec: number; isFree: boolean },
  accessToken: string | null
) {
  return request<{ lecture: LectureRecord }>(`/api/courses/sections/${sectionId}/lectures`, {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updateLecture(lectureId: string, input: Record<string, unknown>, accessToken: string | null) {
  return request<{ lecture: LectureRecord }>(`/api/lectures/${lectureId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteLecture(lectureId: string, accessToken: string | null) {
  return request<void>(`/api/lectures/${lectureId}`, { method: "DELETE", accessToken });
}

export function createMuxUpload(lectureId: string, accessToken: string | null) {
  return request<{ uploadId: string; uploadUrl: string }>(`/api/admin/video/lectures/${lectureId}/uploads`, {
    method: "POST",
    accessToken,
  });
}

// ---------- question bank ----------

export interface AdminQuestion {
  _id: string;
  exam: string;
  section: string;
  difficulty: "easy" | "medium" | "hard";
  type: "single" | "multi";
  stem: string;
  choices: { id: string; text: string }[];
  correctChoiceIds: string[];
  explanation: string;
  tags: string[];
}

export function fetchQuestions(
  params: { exam?: string; section?: string; difficulty?: string; page?: number },
  accessToken: string | null
) {
  const qs = new URLSearchParams();
  if (params.exam) qs.set("exam", params.exam);
  if (params.section) qs.set("section", params.section);
  if (params.difficulty) qs.set("difficulty", params.difficulty);
  if (params.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return request<{ questions: AdminQuestion[]; total: number; totalPages: number }>(
    `/api/exams/questions${query ? `?${query}` : ""}`,
    { accessToken }
  );
}

export function createQuestion(input: Omit<AdminQuestion, "_id">, accessToken: string | null) {
  return request<{ question: AdminQuestion }>("/api/exams/questions", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updateQuestion(id: string, input: Partial<Omit<AdminQuestion, "_id">>, accessToken: string | null) {
  return request<{ question: AdminQuestion }>(`/api/exams/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteQuestion(id: string, accessToken: string | null) {
  return request<void>(`/api/exams/questions/${id}`, { method: "DELETE", accessToken });
}

export function bulkImportQuestions(questions: Omit<AdminQuestion, "_id">[], accessToken: string | null) {
  return request<{ created: number }>("/api/exams/questions/bulk-import", {
    method: "POST",
    body: JSON.stringify({ questions }),
    accessToken,
  });
}

// ---------- test definitions ----------

export interface AdminTest {
  id: string;
  title: string;
  exam: string;
  type: "practice" | "timed_section" | "mock";
  section?: string;
  questionCount: number;
  timeLimitSec?: number;
  isFree: boolean;
  productCourseId?: string;
  published: boolean;
}

export function fetchAdminTests(accessToken: string | null) {
  return request<{ tests: AdminTest[] }>("/api/exams/admin/tests", { accessToken });
}

export function createTest(
  input: {
    title: string;
    exam: string;
    type: "practice" | "timed_section" | "mock";
    section?: string;
    questionIds: string[];
    timeLimitSec?: number;
    isFree?: boolean;
    productCourseId?: string;
    published?: boolean;
  },
  accessToken: string | null
) {
  return request<{ test: { _id: string } }>("/api/exams/tests", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updateTest(id: string, input: Record<string, unknown>, accessToken: string | null) {
  return request<{ test: unknown }>(`/api/exams/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteTest(id: string, accessToken: string | null) {
  return request<void>(`/api/exams/tests/${id}`, { method: "DELETE", accessToken });
}

// ---------- orders ----------

export interface AdminOrder {
  _id: string;
  userId: { name: string; email: string } | null;
  courseIds: { title: string; price: number }[];
  amountCents: number;
  status: "pending" | "paid" | "refunded" | "expired" | "failed";
  createdAt: string;
}

export function fetchOrders(status: string | undefined, accessToken: string | null) {
  const qs = status ? `?status=${status}` : "";
  return request<{ orders: AdminOrder[]; total: number }>(`/api/admin/orders${qs}`, { accessToken });
}

export function refundOrder(orderId: string, accessToken: string | null) {
  return request<{ order: AdminOrder }>(`/api/admin/orders/${orderId}/refund`, {
    method: "POST",
    accessToken,
  });
}

// ---------- users ----------

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  isEmailVerified: boolean;
  createdAt: string;
}

export function fetchUsers(params: { search?: string; role?: string }, accessToken: string | null) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.role) qs.set("role", params.role);
  const query = qs.toString();
  return request<{ users: AdminUser[]; total: number }>(`/api/admin/users${query ? `?${query}` : ""}`, {
    accessToken,
  });
}

export function updateUserRole(userId: string, role: string, accessToken: string | null) {
  return request<{ user: AdminUser }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
    accessToken,
  });
}

// ---------- analytics ----------

export interface AnalyticsSummary {
  revenue: { totalCents: number; last30dCents: number };
  enrollments: { total: number; last30d: number };
  users: { total: number; last30d: number };
  courses: { total: number };
  topCourses: { title: string; slug: string; enrollments: number }[];
  examStats: { totalAttempts: number; byExam: { exam: string; attempts: number; avgPct: number }[] };
}

export function fetchAnalyticsSummary(accessToken: string | null) {
  return request<AnalyticsSummary>("/api/admin/analytics/summary", { accessToken });
}
