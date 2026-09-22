/** Tiện ích ngày tháng. Toàn bộ ứng dụng dùng chuỗi YYYY-MM-DD theo giờ địa phương. */

/** Đổi một Date thành chuỗi YYYY-MM-DD theo giờ địa phương (không dùng UTC để tránh lệch ngày). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Ngày hôm nay dạng YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now)
}

/** Ngày liền trước của một chuỗi YYYY-MM-DD. */
export function previousDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() - 1)
  return toIsoDate(date)
}

/** `b` có phải là ngày ngay sau `a` không. */
export function isNextDay(a: string, b: string): boolean {
  if (!a || !b) return false
  return previousDay(b) === a
}
