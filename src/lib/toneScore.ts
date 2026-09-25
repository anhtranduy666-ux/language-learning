/**
 * Chấm thanh điệu của một âm tiết từ đường cao độ của nó.
 *
 * Làm theo tinh thần `scripts/tone_check.py` — so **hình dáng** đường cao độ với
 * hình thanh mong đợi — nhưng đo bằng **nửa cung** thay vì phần trăm, vì đây là
 * giọng người thật: tai nghe cao độ theo tỉ lệ, và một giọng nam 100 Hz lẫn một
 * giọng trẻ em 450 Hz đọc cùng một thanh phải ra cùng một con số.
 *
 * Mỗi thanh có thang điểm riêng, đi qua ba mốc: rõ ràng đúng → 100, vừa qua
 * ngưỡng → 60, rõ ràng sai → 0. Công thức chung `50 + 250 × margin` ở tài liệu
 * thiết kế không dùng được nguyên xi: với thanh 1, biên an toàn không bao giờ
 * vượt 0.08, nên một thanh 1 đọc hoàn hảo cũng chỉ được 70.
 *
 * Mốc 60 của thanh 4 và thanh 2 lấy từ `tone_check.py` (đổ 10%, lên 6% — quy ra
 * nửa cung); thanh 1 được nới rộng hơn vì giọng người không phẳng như giọng máy.
 * Mốc 100 đặt theo biên độ thanh điệu khi đọc từ đơn. Tất cả là điểm khởi đầu,
 * đã kiểm trên giọng máy đọc đúng và cố tình đọc sai
 * (`pronunciation.fixtures.test.ts`), nhưng còn phải chỉnh lại trên bản thu
 * giọng người thật — mốc M4 của `docs/pronunciation-mvp.md`.
 */

import { median, percentile, semitones } from './dsp'

/** Chỗ sai đo được, để chọn lời khuyên. */
export type ToneProblem =
  /** Thanh 4 không đổ xuống đủ. */
  | 'no-fall'
  /** Thanh 2 không đi lên đủ. */
  | 'no-rise'
  /** Thanh 3 không xuống thấp, không có chỗ trũng. */
  | 'no-dip'
  /** Thanh 1 không giữ được phẳng. */
  | 'not-level'
  /** Thanh 1 đọc thấp quá so với giọng thường của người học. */
  | 'too-low'

export interface ToneScore {
  /** 0–100. */
  score: number
  /** Chỗ sai chính khi điểm dưới ngưỡng đạt, null khi đạt. */
  problem: ToneProblem | null
  startHz: number
  endHz: number
  /** Độ đổi cao độ từ đầu tới cuối âm tiết, tính bằng nửa cung. */
  slopeSt: number
  /** Đường cao độ theo nửa cung so với mặt bằng giọng — để vẽ cho người học xem. */
  contourSt: number[]
}

/** Dưới chừng này khung hữu thanh (50 ms) thì không đủ để dựng một đường cao độ. */
export const MIN_TONE_FRAMES = 5

/** Điểm tối thiểu để một âm tiết được coi là đọc đúng thanh. */
export const PASS_SCORE = 60

/**
 * Nội suy tuyến tính qua các mốc (x, điểm), kẹp ở hai đầu.
 * Các mốc phải xếp theo x tăng dần.
 */
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
 * Độ sâu chỗ trũng, tính bằng nửa cung: đáy thấp hơn **cả hai bên** bao nhiêu.
 *
 * Đo từ đáy của đường đã làm mượt tới đỉnh ở mỗi bên (phân vị 75, để một khung
 * bám sai không thành đỉnh giả). Đáy nằm ở mép — đường chỉ xuống hoặc chỉ lên —
 * thì không có chỗ trũng nào, trả 0.
 */
function dipDepth(contour: readonly number[]): number {
  const smooth = contour.map((_, i) => median(contour.slice(Math.max(0, i - 1), i + 2)))
  let bottom = 0
  for (let i = 1; i < smooth.length; i += 1) if (smooth[i] < smooth[bottom]) bottom = i
  const left = smooth.slice(0, bottom)
  const right = smooth.slice(bottom + 1)
  if (left.length < 2 || right.length < 2) return 0
  return Math.min(percentile(left, 0.75), percentile(right, 0.75)) - smooth[bottom]
}

/**
 * Chấm một âm tiết.
 *
 * @param contourHz các giá trị cao độ hữu thanh của âm tiết, theo thứ tự thời gian.
 * @param expectedTone thanh **nghe thấy** mong đợi, lấy từ `expectedTones()` —
 * đã tính biến điệu. 0 là thanh nhẹ, không chấm.
 * @param baselineHz mặt bằng giọng của người học. Thanh 2 và thanh 4 chấm theo
 * độ dốc nên không cần; thanh 1 (cao) và thanh 3 (thấp) cần nó để biết "cao"
 * hay "thấp" so với cái gì. Null thì hai thanh này chỉ chấm theo hình dáng.
 * @returns null khi không chấm được: thanh nhẹ, hoặc quá ít khung hữu thanh.
 */
export function scoreTone(
  contourHz: readonly number[],
  expectedTone: number,
  baselineHz: number | null,
): ToneScore | null {
  if (expectedTone < 1 || expectedTone > 4) return null
  if (contourHz.length < MIN_TONE_FRAMES) return null

  const reference = baselineHz ?? median(contourHz)
  const contourSt = contourHz.map((hz) => semitones(hz, reference))

  // Giọng rè ở đáy thanh 3 hay làm bộ bám nhảy xuống một quãng tám (169 Hz →
  // 74 Hz). Không thanh nào đi xa trung vị của chính nó quá 9 nửa cung trong
  // một âm tiết, nên những khung đó là bám sai — bỏ đi trước khi đo.
  const centre = median(contourSt)
  const clean = contourSt.filter((value) => Math.abs(value - centre) <= 9)
  const measured = clean.length >= MIN_TONE_FRAMES ? clean : contourSt

  // Bỏ 20% đầu và 10% cuối trước khi đo hình dáng. Đầu âm tiết là đoạn chuyển
  // từ phụ âm sang — qua m, n, l, r cao độ luôn vọt lên trước khi tới thanh
  // thật, nên một thanh 1 phẳng đọc đúng sẽ bị đo thành đi lên. Cuối âm tiết
  // thì giọng hay rơi xuống khi tắt hơi. Bản Python tránh được chuyện này nhờ
  // biết ranh giới phụ âm từ mô hình; ở đây là giọng người, không có ranh giới đó.
  const skipHead = Math.floor(measured.length * 0.2)
  const skipTail = Math.floor(measured.length * 0.1)
  const core =
    measured.length - skipHead - skipTail >= MIN_TONE_FRAMES
      ? measured.slice(skipHead, measured.length - skipTail)
      : measured

  const quarter = Math.max(1, Math.floor(core.length / 4))
  const head = median(core.slice(0, quarter))
  const tail = median(core.slice(-quarter))
  const slope = tail - head
  const dip = dipDepth(core)
  const level = median(core)

  let score: number
  let problem: ToneProblem

  switch (expectedTone) {
    case 4:
      score = ramp(slope, [
        [-4.5, 100],
        [-1.8, 60],
        [0.5, 0],
      ])
      problem = 'no-fall'
      break

    case 2:
      score = ramp(slope, [
        [-1, 0],
        [1, 60],
        [3.5, 100],
      ])
      problem = 'no-rise'
      break

    case 1: {
      // Thanh 1 của người thật không phẳng như kẻ chỉ: lệch một hai nửa cung là
      // chuyện thường, nhất là khi âm tiết sau là thanh nhẹ. Thanh 4 đọc nhầm
      // thì đổ bốn năm nửa cung, thanh 2 thì lên chừng đó — vẫn bị bắt.
      const flat = ramp(Math.abs(slope), [
        [1.5, 100],
        [3, 60],
        [5.5, 0],
      ])
      const high =
        baselineHz === null
          ? 100
          : ramp(level, [
              [-5, 20],
              [-2.5, 60],
              [-0.5, 100],
            ])
      score = Math.min(flat, high)
      problem = flat <= high ? 'not-level' : 'too-low'
      break
    }

    default: {
      // Thanh 3: có chỗ trũng (đọc đủ 214), hoặc đứng thấp hẳn so với giọng
      // thường (thanh 3 nửa, hay gặp khi đọc nhanh).
      const dipped = ramp(dip, [
        [0, 35],
        [0.7, 60],
        [2, 100],
      ])
      let low: number
      if (baselineHz !== null) {
        low = ramp(level, [
          [-2.5, 100],
          [-0.8, 60],
          [1.5, 20],
        ])
        // Thanh 2 cũng bắt đầu thấp — nhưng nó vút lên ngay mà không trũng
        // xuống trước. Thấp mà không trũng, lại đi lên dốc, thì là thanh 2.
        if (slope >= 2.5 && dip < 0.7) low = Math.min(low, 30)
      } else {
        // Không biết mặt bằng thì không biết "thấp" là thấp so với cái gì. Thanh
        // 3 đọc riêng hay hạ thấp rồi rè đi — đo trên giọng máy là đổ 3.6 nửa
        // cung — trong khi thanh 4 đổ từ 5.2 nửa cung trở lên (độ dốc ở đây đo
        // trên phần lõi âm tiết, nên nhỏ hơn độ đổ thật). Chỉ loại hai kiểu chắc
        // chắn sai: đổ dốc như thanh 4, hoặc vút lên như thanh 2.
        low = slope <= -4.5 || slope >= 3 ? 30 : 70
      }
      score = Math.max(dipped, low)
      problem = 'no-dip'
    }
  }

  score = Math.round(Math.max(0, Math.min(100, score)))
  return {
    score,
    problem: score < PASS_SCORE ? problem : null,
    startHz: reference * 2 ** (head / 12),
    endHz: reference * 2 ** (tail / 12),
    slopeSt: slope,
    contourSt,
  }
}
