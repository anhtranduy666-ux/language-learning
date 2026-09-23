/**
 * Chế độ hiển thị sáng/tối.
 *
 * Ba lựa chọn, mặc định bám theo hệ điều hành — xem `docs/theme.md`.
 * Toàn bộ logic ở đây là hàm thuần để test trực tiếp, không cần dựng React.
 */

/** Lựa chọn của người học. Đây là thứ được lưu lại. */
export type ThemeChoice = 'light' | 'dark' | 'system'

/** Chế độ thật sự đang hiển thị, sau khi đã giải `system` ra. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Khoá localStorage. Tách khỏi khoá tiến độ vì chế độ hiển thị thuộc về thiết
 * bị, không thuộc về người học: xoá tiến độ không được đổi màn hình, và khi
 * Phase 3 đồng bộ tiến độ lên Supabase thì cái này vẫn ở lại máy.
 *
 * Script nội tuyến trong `index.html` dùng đúng chuỗi này — sửa thì sửa cả hai.
 */
export const THEME_KEY = 'chinese-learning-app:theme:v1'

/** Thuộc tính trên thẻ `html` mà biến thể `dark:` của Tailwind trỏ vào. */
export const THEME_ATTRIBUTE = 'data-theme'

const CHOICES: ThemeChoice[] = ['light', 'dark', 'system']

/** Media query dùng để hỏi hệ điều hành đang ở chế độ nào. */
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Chế độ thật sự hiển thị, ứng với một lựa chọn và trạng thái của hệ điều hành. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
  if (choice === 'system') return systemPrefersDark ? 'dark' : 'light'
  return choice
}

/**
 * Lựa chọn đã lưu.
 * Giá trị lạ, chưa lưu gì, hoặc trình duyệt chặn đọc đều rơi về `system`.
 */
export function loadThemeChoice(storage: Storage = localStorage): ThemeChoice {
  let raw: string | null = null
  try {
    raw = storage.getItem(THEME_KEY)
  } catch {
    return 'system'
  }
  return CHOICES.includes(raw as ThemeChoice) ? (raw as ThemeChoice) : 'system'
}

/** Lưu lựa chọn. Bỏ qua lỗi quota hoặc chế độ riêng tư chặn ghi. */
export function saveThemeChoice(choice: ThemeChoice, storage: Storage = localStorage): void {
  try {
    storage.setItem(THEME_KEY, choice)
  } catch {
    // Không lưu được thì phiên hiện tại vẫn đúng chế độ vừa chọn.
  }
}

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  try {
    return window.matchMedia(DARK_QUERY)
  } catch {
    return null
  }
}

/** Hệ điều hành có đang để chế độ tối không. Máy không trả lời được thì coi như sáng. */
export function prefersDark(): boolean {
  return mediaQuery()?.matches ?? false
}

/**
 * Theo dõi chế độ của hệ điều hành.
 * Chỉ có ý nghĩa khi người học đang chọn `system`.
 *
 * @returns hàm huỷ theo dõi.
 */
export function subscribeSystemTheme(onChange: (systemPrefersDark: boolean) => void): () => void {
  const query = mediaQuery()
  if (!query) return () => {}

  const handle = (event: MediaQueryListEvent) => onChange(event.matches)

  // Safari dưới bản 14 chỉ có `addListener`, không có `addEventListener`.
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handle)
    return () => query.removeEventListener('change', handle)
  }
  query.addListener(handle)
  return () => query.removeListener(handle)
}

/**
 * Gắn chế độ vào thẻ `html`.
 *
 * `color-scheme` đi kèm để trình duyệt tự đổi màu thanh cuộn và ô nhập liệu —
 * thiếu nó thì ô nhập tên vẫn trắng giữa nền tối.
 */
export function applyTheme(theme: ResolvedTheme, root: HTMLElement = document.documentElement): void {
  root.setAttribute(THEME_ATTRIBUTE, theme)
  root.style.colorScheme = theme
}
