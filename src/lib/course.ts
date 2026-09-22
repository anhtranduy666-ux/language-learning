import { ALL_LESSONS } from '../data/hsk1'

/**
 * Bài học nên gợi ý tiếp theo: bài chưa hoàn thành đầu tiên theo thứ tự khoá học.
 * Học xong hết thì quay lại bài cuối để ôn.
 */
export function nextLessonId(completedLessonIds: readonly string[]): string {
  const completed = new Set(completedLessonIds)
  const pending = ALL_LESSONS.find((lesson) => !completed.has(lesson.id))
  return pending ? pending.id : ALL_LESSONS[ALL_LESSONS.length - 1].id
}

/** Vị trí của một bài trong khoá, bắt đầu từ 1. Trả về 0 nếu không tìm thấy. */
export function lessonPosition(lessonId: string): number {
  return ALL_LESSONS.findIndex((lesson) => lesson.id === lessonId) + 1
}

/** Bài kế tiếp trong khoá, hoặc null nếu đây đã là bài cuối. */
export function lessonAfter(lessonId: string): string | null {
  const index = ALL_LESSONS.findIndex((lesson) => lesson.id === lessonId)
  if (index === -1 || index === ALL_LESSONS.length - 1) return null
  return ALL_LESSONS[index + 1].id
}

/** Phần trăm khoá học đã hoàn thành, 0–100. */
export function courseCompletion(completedLessonIds: readonly string[]): number {
  const valid = new Set(ALL_LESSONS.map((lesson) => lesson.id))
  const done = new Set(completedLessonIds.filter((id) => valid.has(id)))
  return Math.round((done.size / ALL_LESSONS.length) * 100)
}

/** Tổng số bài học của khoá. */
export const TOTAL_LESSONS = ALL_LESSONS.length
