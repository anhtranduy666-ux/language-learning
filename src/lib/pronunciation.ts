/**
 * Chấm một lượt đọc từ đơn — gộp mọi phần lại, theo `docs/pronunciation-mvp.md`.
 *
 * ```
 * bản thu → cổng chặn → cắt âm tiết → chấm thanh từng âm tiết
 *                                    → nhịp so với bản mẫu
 *                                    → điểm tổng + đúng một lời khuyên
 * ```
 *
 * Mọi thứ chạy trên máy người học, không gửi tiếng nói đi đâu. Hàm thuần: nhận
 * `Float32Array`, trả kết quả — test được thẳng, không cần micro.
 *
 * Thiết kế ban đầu còn một phần "độ gần với bản mẫu" bằng MFCC + DTW. Cho một
 * giọng khác đọc 60 từ rồi so với 60 file mẫu, file gần nhất chỉ đúng là từ đó
 * 5–9/60 lần — quá yếu để làm điểm, chỉ cộng nhiễu vào tổng — nên đã bỏ. Số đo
 * ở mục 14 của `docs/pronunciation-mvp.md`.
 */

import type { AttemptProblem, Rejection } from '../data/pronunciationTips'
import { ANALYSIS_RATE, HOP_SECONDS, frameEnergyDb, median, percentile, resample, speechRegion } from './dsp'
import { f0Track, voicedCount, voicedValues } from './pitch'
import { splitSyllables } from './segment'
import { expectedTones, isPauseToken, speechTokens } from './speechTokens'
import { PASS_SCORE, scoreTone, type ToneProblem } from './toneScore'

/** Khung to nhất nhỏ hơn mức này (dBFS) là quá nhỏ để chấm. */
export const QUIET_PEAK_DB = -42

/** Tiếng nói phải nổi hơn nền ít nhất chừng này dB. */
export const MIN_SNR_DB = 12

/** Phần có tiếng ngắn hơn chừng này thì chưa đủ một từ. */
export const MIN_SPEECH_SECONDS = 0.2

/** Một từ HSK 1 đọc chậm cũng không quá chừng này; dài hơn là đã đọc sang thứ khác. */
export const MAX_SPEECH_SECONDS = 4

/** Trọng số điểm tổng. Thanh điệu nặng nhất vì là thứ bản này đo chắc nhất. */
export const WEIGHTS = { tone: 0.75, rhythm: 0.25 }

/** Bản thu hợp lệ không bao giờ dưới mức này — lỗi thật có khi nằm ở cái micro. */
export const SCORE_FLOOR = 40

export interface SyllableResult {
  /** Pinyin đánh số, ví dụ `xie4`. */
  token: string
  /** Pinyin để hiện, ví dụ `xiè`. */
  display: string
  /** Thanh nghe thấy mong đợi; 0 là không chấm (thanh nhẹ). */
  expectedTone: number
  /** 0–100, null khi không chấm. */
  score: number | null
  problem: ToneProblem | null
  /** Đường cao độ theo nửa cung so với mặt bằng giọng, để vẽ. */
  contourSt: number[]
}

export interface Attempt {
  /** Có lý do để không chấm thì mọi điểm đều null. */
  rejected: Rejection | null
  total: number | null
  tone: number | null
  rhythm: number | null
  syllables: SyllableResult[]
  /** Chỉ số âm tiết yếu nhất trong số được chấm. */
  weakest: number | null
  /** Chỗ cần sửa nhất — tra `TIPS` để ra lời khuyên. Null là không có gì phải sửa. */
  problem: AttemptProblem | null
  /** Cao độ giữa của lượt đọc, để cập nhật mặt bằng giọng người học. */
  medianHz: number | null
}

export interface AttemptInput {
  samples: Float32Array
  rate: number
  /** Pinyin của từ, đúng như trong `hsk1.ts`: `xiè xie`. */
  pinyin: string
  /** Độ dài phần có tiếng của bản mẫu (giây) — xem `speechSeconds`. Null thì bỏ phần nhịp. */
  referenceSeconds: number | null
  /** Mặt bằng giọng của người học; null khi chưa đủ bản thu để biết. */
  baselineHz: number | null
}

/** Nội suy tuyến tính qua các mốc (x tăng dần), kẹp hai đầu. */
function ramp(x: number, points: Array<[number, number]>): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return points[points.length - 1][1]
}

/**
 * Độ dài phần có tiếng của một bản thu, tính bằng giây, không kể khoảng lặng
 * hai đầu. App gọi hàm này một lần cho mỗi file mẫu để có mốc so nhịp.
 */
export function speechSeconds(samples: Float32Array, rate: number): number {
  const region = speechRegion(frameEnergyDb(samples, rate), 30, 0)
  return region ? (region.end - region.start) * HOP_SECONDS : 0
}

function rejected(reason: Rejection, syllables: SyllableResult[]): Attempt {
  return {
    rejected: reason,
    total: null,
    tone: null,
    rhythm: null,
    syllables,
    weakest: null,
    problem: null,
    medianHz: null,
  }
}

/** Lời khuyên chung cho một thanh, khi âm tiết vừa đạt mà vẫn còn chỗ để tốt hơn. */
const GENERIC_PROBLEM: Record<number, ToneProblem> = {
  1: 'not-level',
  2: 'no-rise',
  3: 'no-dip',
  4: 'no-fall',
}

/** Âm tiết dưới mức này thì Zibi nhắc, dù đã qua ngưỡng đạt. */
const NUDGE_BELOW = 75

/** Chấm một lượt đọc. */
export function scoreAttempt(input: AttemptInput): Attempt {
  const tokens = speechTokens(input.pinyin).filter((token) => !isPauseToken(token))
  const expected = expectedTones(tokens)
  const display = input.pinyin.trim().split(/\s+/)
  const blank: SyllableResult[] = tokens.map((token, index) => ({
    token,
    display: display[index] ?? token,
    expectedTone: expected[index],
    score: null,
    problem: null,
    contourSt: [],
  }))

  const y = input.rate === ANALYSIS_RATE ? input.samples : resample(input.samples, input.rate, ANALYSIS_RATE)
  const energy = frameEnergyDb(y, ANALYSIS_RATE)
  const f0 = f0Track(y, ANALYSIS_RATE)

  // Cổng chặn — một điểm số sai thấp còn tệ hơn không có điểm.
  let peak = -Infinity
  for (const value of energy) peak = Math.max(peak, value)
  if (peak < QUIET_PEAK_DB || voicedCount(f0) < 5) return rejected('too-quiet', blank)

  if (percentile(energy, 0.95) - percentile(energy, 0.1) < MIN_SNR_DB) return rejected('too-noisy', blank)

  // Đo độ dài trên vùng chưa đệm; vùng có đệm dùng để cắt âm tiết, khỏi mất phụ âm đầu.
  const region = speechRegion(energy)
  const core = speechRegion(energy, 30, 0)
  const seconds = core ? (core.end - core.start) * HOP_SECONDS : 0
  if (seconds < MIN_SPEECH_SECONDS) return rejected('too-short', blank)
  if (seconds > MAX_SPEECH_SECONDS) return rejected('too-long', blank)

  const spans = splitSyllables(f0, energy, tokens.length, region ?? undefined)
  if (!spans) return rejected('too-short', blank)

  // Từ nhiều âm tiết tự mang mặt bằng giọng của nó. Từ một âm tiết thì không —
  // mặt bằng chính là âm tiết đó — nên phải nhờ mặt bằng dành dụm từ các lượt trước.
  const medianHz = median(voicedValues(f0, region?.start, region?.end))
  const baseline = tokens.length > 1 ? medianHz : input.baselineHz

  const syllables = blank.map((syllable, index) => {
    const contour = voicedValues(f0, spans[index].start, spans[index].end)
    const result = scoreTone(contour, syllable.expectedTone, baseline)
    return result
      ? { ...syllable, score: result.score, problem: result.problem, contourSt: result.contourSt }
      : syllable
  })

  // Âm tiết cần chấm mà không đủ khung để chấm thì bản thu chưa dùng được.
  if (syllables.some((syllable) => syllable.expectedTone > 0 && syllable.score === null)) {
    return rejected('too-short', blank)
  }

  const scored = syllables.filter((syllable) => syllable.score !== null)
  const tone = scored.length > 0 ? scored.reduce((sum, s) => sum + s.score!, 0) / scored.length : null

  let rhythm: number | null = null
  let ratio = 1
  if (input.referenceSeconds && input.referenceSeconds > 0) {
    ratio = seconds / input.referenceSeconds
    rhythm = ramp(Math.abs(Math.log(ratio)), [
      [Math.log(1.35), 100],
      [Math.log(1.8), PASS_SCORE],
      [Math.log(3), 0],
    ])
  }

  // Gộp theo trọng số, bỏ phần không đo được và chia lại cho phần còn lại.
  const parts = [
    [tone, WEIGHTS.tone],
    [rhythm, WEIGHTS.rhythm],
  ].filter((part): part is [number, number] => part[0] !== null)
  const weight = parts.reduce((sum, [, w]) => sum + w, 0)
  const raw = weight > 0 ? parts.reduce((sum, [value, w]) => sum + value * w, 0) / weight : 0
  const total = Math.round(Math.max(SCORE_FLOOR, raw))

  // Đúng một lời khuyên: âm tiết yếu nhất trước, rồi mới tới nhịp.
  let weakest: number | null = null
  syllables.forEach((syllable, index) => {
    if (syllable.score === null) return
    if (weakest === null || syllable.score < syllables[weakest].score!) weakest = index
  })

  let problem: AttemptProblem | null = null
  const weak = weakest === null ? null : syllables[weakest]
  if (weak && weak.score! < NUDGE_BELOW) {
    problem = weak.problem ?? GENERIC_PROBLEM[weak.expectedTone]
  } else if (rhythm !== null && rhythm < PASS_SCORE) {
    problem = ratio < 1 ? 'too-fast' : 'too-slow'
  }

  return {
    rejected: null,
    total,
    tone: tone === null ? null : Math.round(tone),
    rhythm: rhythm === null ? null : Math.round(rhythm),
    syllables,
    weakest,
    problem,
    medianHz: Number.isFinite(medianHz) ? medianHz : null,
  }
}
