/**
 * Mặt bằng giọng của người học: cao độ giữa của những lượt đọc gần đây.
 *
 * Từ một âm tiết không tự cho biết giọng người nói cao hay trầm — mặt bằng của
 * nó chính là nó. Mà thanh 1 phải "cao" và thanh 3 phải "thấp" so với giọng
 * thường của người đó. Nên mỗi lượt đọc hợp lệ góp một con số vào đây, và từ
 * lượt thứ năm trở đi bộ chấm mới dùng tới — xem `docs/pronunciation-mvp.md` mục 4.2.
 *
 * Chỉ lưu con số cao độ, không lưu gì từ bản thu.
 */

import { median } from './dsp'

/** Khoá localStorage. */
export const BASELINE_KEY = 'chinese-learning-app:voice:v1'

/** Dưới chừng này lượt đọc thì chưa đủ để biết giọng thường của người học. */
export const BASELINE_MIN_SAMPLES = 5

/** Chỉ giữ chừng này lượt gần nhất — giọng đổi theo thời gian, nhất là trẻ em. */
export const BASELINE_MAX_SAMPLES = 20

/** Cao độ hợp lý của giọng người, để một số hỏng không làm lệch mặt bằng. */
const PLAUSIBLE = { min: 50, max: 700 }

const plausible = (hz: unknown): hz is number =>
  typeof hz === 'number' && Number.isFinite(hz) && hz >= PLAUSIBLE.min && hz <= PLAUSIBLE.max

/** Cao độ của các lượt đọc đã lưu. Dữ liệu hỏng hay bộ nhớ bị chặn thì coi như chưa có gì. */
export function loadVoiceSamples(storage: Storage = localStorage): number[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(BASELINE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(plausible).slice(-BASELINE_MAX_SAMPLES) : []
  } catch {
    return []
  }
}

/** Mặt bằng giọng, hoặc null khi chưa đủ lượt đọc để tin được. */
export function voiceBaseline(samples: readonly number[]): number | null {
  return samples.length >= BASELINE_MIN_SAMPLES ? median(samples) : null
}

/**
 * Ghi thêm cao độ của một lượt đọc hợp lệ.
 * @returns danh sách sau khi ghi — kể cả khi không lưu được vào bộ nhớ.
 */
export function recordVoiceSample(hz: number, storage: Storage = localStorage): number[] {
  const samples = loadVoiceSamples(storage)
  if (!plausible(hz)) return samples

  const next = [...samples, hz].slice(-BASELINE_MAX_SAMPLES)
  try {
    storage.setItem(BASELINE_KEY, JSON.stringify(next.map((value) => Math.round(value * 10) / 10)))
  } catch {
    // Trình duyệt chặn bộ nhớ (chế độ riêng tư): vẫn dùng được trong phiên này.
  }
  return next
}
