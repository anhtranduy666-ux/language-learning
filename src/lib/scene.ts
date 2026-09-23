/**
 * Nền động: khu vườn ban ngày và bầu trời sao ban đêm.
 *
 * Cảnh không phải là hình trang trí đứng yên — nó đọc thẳng `UserProgress` và
 * nở dần theo XP trong ngày, nên nhìn nền là biết hôm nay đã học tới đâu.
 * Xem `docs/scene.md`.
 *
 * Toàn bộ logic ở đây là hàm thuần để test trực tiếp, không cần dựng React.
 * Phần vẽ nằm ở `src/components/scene/` và `src/styles/scene.css`.
 */

/** Lựa chọn của người học. Đây là thứ được lưu lại. */
export type SceneChoice = 'full' | 'still' | 'off'

/** Mức chuyển động thật sự, sau khi đã tính cả "giảm chuyển động" của hệ điều hành. */
export type SceneMotion = 'animate' | 'still' | 'none'

/** Cảnh nở tới đâu, tính theo XP hôm nay so với mục tiêu. */
export type SceneStage = 'dawn' | 'rising' | 'bloom'

/**
 * Khoá localStorage. Tách khỏi khoá tiến độ và khoá giao diện vì đây là lựa
 * chọn của *thiết bị*: cùng một người, máy mạnh thì bật đầy đủ, máy yếu thì tắt.
 */
export const SCENE_KEY = 'chinese-learning-app:scene:v1'

/** Số ngày streak để khu vườn rộng thêm một khoảnh, bầu trời thêm một thiên thạch lớn. */
export const STREAK_BONUS_DAYS = 7

/**
 * Thuộc tính trên thẻ `html` cho biết nền động đang bật hay tắt.
 * Lớp `.surface` trong `index.css` dựa vào đây để chuyển thẻ sang kính mờ.
 */
export const SCENE_ATTRIBUTE = 'data-scene'

const CHOICES: SceneChoice[] = ['full', 'still', 'off']

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Mức chuyển động thật sự.
 *
 * "Tắt" là tắt hẳn, kể cả khi hệ điều hành không yêu cầu gì — người học đã nói
 * rõ thì không suy diễn thêm. Ngược lại, hệ điều hành bật "giảm chuyển động"
 * thì cảnh vẫn hiện nhưng đứng yên: bỏ hẳn cảnh đi là lấy mất thông tin tiến
 * độ, còn để nó nhúc nhích là làm đúng cái người ta vừa xin đừng làm.
 */
export function resolveSceneMotion(choice: SceneChoice, reducedMotion: boolean): SceneMotion {
  if (choice === 'off') return 'none'
  if (choice === 'still' || reducedMotion) return 'still'
  return 'animate'
}

/**
 * Cảnh nở tới đâu.
 *
 * Chưa có XP nào thì trời còn sương sớm; đạt mục tiêu thì cả vườn nở.
 * Mục tiêu bằng 0 (dữ liệu hỏng) thì chỉ cần có XP là coi như đạt.
 */
export function sceneStage(xpToday: number, dailyGoal: number): SceneStage {
  // Viết ngược để `NaN` cũng rơi về 'dawn' thay vì lọt xuống dưới.
  if (!(xpToday > 0)) return 'dawn'
  if (xpToday >= dailyGoal) return 'bloom'
  return 'rising'
}

/** Đã giữ streak đủ dài để cảnh được thưởng thêm chưa. */
export function hasStreakBonus(streak: number): boolean {
  return streak >= STREAK_BONUS_DAYS
}

/**
 * Gắn trạng thái nền động vào thẻ `html`.
 *
 * Mặt thẻ phải biết chuyện này: nền động tắt thì thẻ giữ màu đặc như cũ, bật
 * thì chuyển sang kính mờ. Một thuộc tính trên `html` rẻ hơn là truyền context
 * xuống từng thẻ một.
 */
export function applyScene(motion: SceneMotion, root: HTMLElement = document.documentElement): void {
  root.setAttribute(SCENE_ATTRIBUTE, motion === 'none' ? 'off' : 'on')
}

/**
 * Lựa chọn đã lưu.
 * Giá trị lạ, chưa lưu gì, hoặc trình duyệt chặn đọc đều rơi về `full`.
 */
export function loadSceneChoice(storage: Storage = localStorage): SceneChoice {
  let raw: string | null = null
  try {
    raw = storage.getItem(SCENE_KEY)
  } catch {
    return 'full'
  }
  return CHOICES.includes(raw as SceneChoice) ? (raw as SceneChoice) : 'full'
}

/** Lưu lựa chọn. Bỏ qua lỗi quota hoặc chế độ riêng tư chặn ghi. */
export function saveSceneChoice(choice: SceneChoice, storage: Storage = localStorage): void {
  try {
    storage.setItem(SCENE_KEY, choice)
  } catch {
    // Không lưu được thì phiên hiện tại vẫn đúng lựa chọn vừa bấm.
  }
}

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY)
  } catch {
    return null
  }
}

/** Hệ điều hành có đang xin giảm chuyển động không. Máy không trả lời được thì coi như không. */
export function prefersReducedMotion(): boolean {
  return mediaQuery()?.matches ?? false
}

/**
 * Theo dõi tuỳ chọn giảm chuyển động của hệ điều hành.
 *
 * @returns hàm huỷ theo dõi.
 */
export function subscribeReducedMotion(onChange: (reduced: boolean) => void): () => void {
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

/** Trang có đang hiện trên màn hình không. Không hỏi được thì coi như đang hiện. */
export function isDocumentVisible(): boolean {
  if (typeof document === 'undefined') return true
  return document.visibilityState !== 'hidden'
}

/**
 * Theo dõi việc người học chuyển sang app khác.
 * Trang bị ẩn thì cảnh dừng hẳn, để không đốt pin sau lưng.
 *
 * @returns hàm huỷ theo dõi.
 */
export function subscribeVisibility(onChange: (visible: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {}

  const handle = () => onChange(isDocumentVisible())
  document.addEventListener('visibilitychange', handle)
  return () => document.removeEventListener('visibilitychange', handle)
}
