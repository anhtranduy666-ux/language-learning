/**
 * Bám cao độ (F0) của giọng nói — bản TypeScript của `scripts/tone_check.py`.
 *
 * Cách làm giữ nguyên bản Python, vốn đã được kiểm trên tín hiệu giả và trên
 * giọng Microsoft Huihui (xem `docs/audio-voice.md`):
 *
 * 1. Lọc thông thấp rồi hạ về 16 kHz.
 * 2. Mỗi khung 10 ms, cửa sổ 30 ms: tìm chu kỳ bằng tương quan chéo chuẩn hoá (NCCF).
 * 3. Lấy chu kỳ **ngắn nhất** có đỉnh gần bằng đỉnh cao nhất — chống nhận nhầm
 *    gấp đôi chu kỳ, tức hụt một quãng tám.
 * 4. Nội suy parabol quanh đỉnh, rồi lọc trung vị 3 khung.
 *
 * Khác bản Python ở đúng một chỗ: trần cao độ nâng từ 500 lên 600 Hz và sàn hạ
 * từ 75 xuống 70 Hz. Bản Python chỉ đo giọng máy; ở đây là giọng người học, có
 * cả trẻ em lẫn giọng nam trầm.
 */

import { ANALYSIS_RATE, HOP_SECONDS, resample } from './dsp'

export const F0_MIN = 70
export const F0_MAX = 600

/** Cửa sổ phân tích 30 ms. */
const WINDOW_SECONDS = 0.03

/** NCCF dưới mức này thì coi khung là vô thanh. */
const VOICING = 0.55

/** Khung yếu hơn 15% RMS của cả bản thu thì bỏ qua, khỏi tốn công tìm chu kỳ trong khoảng lặng. */
const ENERGY_FLOOR = 0.15

/**
 * Cao độ theo khung 10 ms. Giá trị 0 là khung vô thanh.
 *
 * Khung thứ k bắt đầu ở thời điểm k × 10 ms của bản thu gốc.
 */
export function f0Track(samples: Float32Array, rate: number): Float32Array {
  const y = rate === ANALYSIS_RATE ? samples : resample(samples, rate, ANALYSIS_RATE)
  const n = Math.round(WINDOW_SECONDS * ANALYSIS_RATE)
  const hop = Math.round(HOP_SECONDS * ANALYSIS_RATE)
  const lo = Math.floor(ANALYSIS_RATE / F0_MAX)
  const hi = Math.floor(ANALYSIS_RATE / F0_MIN)

  // Tổng bình phương cộng dồn: năng lượng của mọi đoạn dài n tính trong O(1).
  const cumulative = new Float64Array(y.length + 1)
  for (let i = 0; i < y.length; i += 1) cumulative[i + 1] = cumulative[i] + y[i] * y[i]
  const rms = Math.sqrt(cumulative[y.length] / Math.max(1, y.length)) + 1e-12

  const frames = Math.max(0, Math.ceil((y.length - n - hi) / hop))
  const raw = new Float32Array(frames)
  const values = new Float64Array(hi - lo + 1)

  for (let frame = 0; frame < frames; frame += 1) {
    const start = frame * hop
    const energy = cumulative[start + n] - cumulative[start]
    if (Math.sqrt(energy / n) < ENERGY_FLOOR * rms) continue

    let best = 0
    for (let lag = lo; lag <= hi; lag += 1) {
      let dot = 0
      for (let i = 0; i < n; i += 1) dot += y[start + i] * y[start + lag + i]
      const other = cumulative[start + lag + n] - cumulative[start + lag]
      const value = dot / Math.sqrt(energy * other + 1e-12)
      values[lag - lo] = value
      if (value > values[best]) best = lag - lo
    }

    // Chu kỳ ngắn nhất có đỉnh cục bộ đạt 90% đỉnh cao nhất.
    const peak = values[best]
    for (let j = 0; j < values.length; j += 1) {
      const left = j > 0 ? values[j - 1] : -Infinity
      const right = j + 1 < values.length ? values[j + 1] : -Infinity
      if (values[j] > 0.9 * peak && values[j] >= left && values[j] >= right) {
        best = j
        break
      }
    }
    if (values[best] < VOICING) continue

    let shift = 0
    if (best > 0 && best < values.length - 1) {
      const a = values[best - 1]
      const b = values[best]
      const c = values[best + 1]
      shift = (a - c) / (2 * (a - 2 * b + c) + 1e-12)
    }
    raw[frame] = ANALYSIS_RATE / (lo + best + shift)
  }

  // Lọc trung vị 3 khung, chỉ ở chỗ cả ba khung đều hữu thanh.
  const smoothed = raw.slice()
  for (let i = 1; i < raw.length - 1; i += 1) {
    const a = raw[i - 1]
    const b = raw[i]
    const c = raw[i + 1]
    if (a > 0 && b > 0 && c > 0) smoothed[i] = Math.max(Math.min(a, b), Math.min(Math.max(a, b), c))
  }
  return smoothed
}

/** Số khung hữu thanh. */
export function voicedCount(f0: Float32Array): number {
  let count = 0
  for (const value of f0) if (value > 0) count += 1
  return count
}

/** Các giá trị hữu thanh trong đoạn khung [start, end). */
export function voicedValues(f0: Float32Array, start = 0, end = f0.length): number[] {
  const out: number[] = []
  for (let i = Math.max(0, start); i < Math.min(end, f0.length); i += 1) if (f0[i] > 0) out.push(f0[i])
  return out
}
