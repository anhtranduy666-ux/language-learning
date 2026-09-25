import { describe, expect, it } from 'vitest'
import { MIN_TONE_FRAMES, PASS_SCORE, scoreTone } from './toneScore'

/** Đường cao độ đi qua các mốc cho trước, `frames` khung, nội suy tuyến tính. */
function contour(points: number[], frames = 30): number[] {
  return Array.from({ length: frames }, (_, i) => {
    const position = (i / (frames - 1)) * (points.length - 1)
    const left = Math.floor(position)
    const right = Math.min(left + 1, points.length - 1)
    return points[left] + (points[right] - points[left]) * (position - left)
  })
}

const score = (points: number[], tone: number, baseline: number | null = null) =>
  scoreTone(contour(points), tone, baseline)!

describe('scoreTone — thanh 4', () => {
  it('đổ dốc từ cao xuống thấp thì điểm tối đa', () => {
    expect(score([300, 180], 4).score).toBe(100)
  })

  it('đọc phẳng thì trượt, và chỉ ra là chưa đổ xuống', () => {
    const result = score([250, 248], 4)
    expect(result.score).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('no-fall')
  })

  it('đọc đi lên thì 0 điểm', () => {
    expect(score([200, 280], 4).score).toBe(0)
  })
})

describe('scoreTone — thanh 2', () => {
  it('đi lên rõ thì điểm tối đa', () => {
    expect(score([170, 270], 2).score).toBe(100)
  })

  it('đọc đổ xuống thì trượt, và chỉ ra là chưa đi lên', () => {
    const result = score([260, 200], 2)
    expect(result.score).toBe(0)
    expect(result.problem).toBe('no-rise')
  })

  it('trũng nhẹ trước khi lên — cách người bản xứ hay đọc — vẫn đạt', () => {
    expect(score([200, 190, 250], 2).score).toBeGreaterThanOrEqual(90)
  })
})

describe('scoreTone — thanh 1', () => {
  it('cao và phẳng thì điểm tối đa, không bị kẹt ở 70', () => {
    expect(score([260, 262, 259], 1).score).toBe(100)
  })

  it('đổ xuống như thanh 4 thì trượt vì không phẳng', () => {
    const result = score([320, 200], 1)
    expect(result.score).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('not-level')
  })

  it('phẳng nhưng thấp hẳn so với giọng thường thì trượt vì thấp', () => {
    const result = score([150, 151], 1, 250)
    expect(result.score).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('too-low')
  })

  it('lệch một hai nửa cung — như thanh 1 người thật — vẫn đạt', () => {
    expect(score([250, 280], 1).score).toBeGreaterThanOrEqual(PASS_SCORE)
  })

  it('bỏ qua đoạn chuyển từ phụ âm đầu: qua âm m cao độ vọt lên rồi mới phẳng', () => {
    expect(score([200, 250, 252, 251, 250, 251], 1).score).toBe(100)
  })

  it('chưa biết mặt bằng giọng thì chỉ chấm độ phẳng, không đoán cao thấp', () => {
    expect(score([150, 151], 1, null).score).toBe(100)
  })
})

describe('scoreTone — thanh 3', () => {
  it('xuống rồi lên (214) thì đạt cao', () => {
    // Thanh 3 đọc riêng trũng cỡ bốn năm nửa cung so với đầu âm tiết.
    expect(score([220, 165, 210], 3).score).toBeGreaterThanOrEqual(90)
  })

  it('đứng thấp hẳn so với giọng thường thì đạt, dù không có chỗ trũng', () => {
    expect(score([180, 175], 3, 250).score).toBeGreaterThanOrEqual(90)
  })

  it('vút lên như thanh 2 thì trượt', () => {
    const result = score([180, 260], 3)
    expect(result.score).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('no-dip')
  })

  it('đổ dốc như thanh 4 thì trượt', () => {
    expect(score([300, 180], 3).score).toBeLessThan(PASS_SCORE)
  })

  it('cao hẳn so với giọng thường thì trượt', () => {
    expect(score([300, 298], 3, 220).score).toBeLessThan(PASS_SCORE)
  })

  it('bắt đầu thấp rồi vút lên ngay, không trũng — là thanh 2, không được tính là thanh 3', () => {
    // Nằm thấp so với giọng thường, nhưng hình dáng là thanh 2 chứ không phải 214.
    const result = score([150, 152, 230], 3, 220)
    expect(result.score).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('no-dip')
  })

  it('xuống rồi lên (214) vẫn đạt khi biết mặt bằng giọng, dù cuối âm tiết lên cao', () => {
    expect(score([200, 150, 230], 3, 220).score).toBeGreaterThanOrEqual(90)
  })
})

describe('scoreTone — chung', () => {
  it('giọng nam trầm và giọng trẻ em đọc cùng một hình thanh thì cùng điểm', () => {
    for (const tone of [1, 2, 3, 4]) {
      const shape = { 1: [1.2, 1.2], 2: [0.95, 1.2], 3: [0.9, 0.72, 0.85], 4: [1.2, 0.75] }[tone]!
      const low = scoreTone(contour(shape.map((r) => r * 100)), tone, 100)!.score
      const high = scoreTone(contour(shape.map((r) => r * 450)), tone, 450)!.score
      expect(Math.abs(low - high), `thanh ${tone}`).toBeLessThanOrEqual(1)
    }
  })

  it('một khung bám sai không tạo ra chỗ trũng giả cho thanh 3', () => {
    const flatHigh = contour([300, 300])
    flatHigh[12] = 150
    expect(scoreTone(flatHigh, 3, 220)!.score).toBeLessThan(PASS_SCORE)
  })

  it('thanh 3 phẳng mà chưa biết mặt bằng giọng thì cho qua, không trừ oan', () => {
    // Phẳng có thể là thanh 3 thấp đọc đúng, cũng có thể là thanh 1 đọc sai.
    // Không có mặt bằng thì không phân biệt được — thà cho qua còn hơn trừ nhầm.
    expect(score([250, 250], 3, null).score).toBeGreaterThanOrEqual(PASS_SCORE)
  })

  it('thanh 3 hạ thấp rồi rè đi — kiểu hay gặp khi đọc riêng — được qua khi chưa biết mặt bằng', () => {
    // Đổ cỡ 3.6 nửa cung, như giọng máy đọc 好.
    expect(score([220, 180], 3, null).score).toBeGreaterThanOrEqual(PASS_SCORE)
  })

  it('bỏ những khung bám nhảy quãng tám ở đáy giọng rè', () => {
    const creaky = contour([219, 170], 12)
    creaky[10] = 74
    creaky[11] = 72
    expect(scoreTone(creaky, 3, null)!.score).toBeGreaterThanOrEqual(PASS_SCORE)
  })

  it('thanh nhẹ không chấm', () => {
    expect(scoreTone(contour([200, 190]), 0, null)).toBeNull()
  })

  it('quá ít khung hữu thanh thì không chấm, không đoán bừa', () => {
    expect(scoreTone(contour([300, 180], MIN_TONE_FRAMES - 1), 4, null)).toBeNull()
    expect(scoreTone(contour([300, 180], MIN_TONE_FRAMES), 4, null)).not.toBeNull()
  })

  it('trả kèm đường cao độ theo nửa cung để vẽ cho người học xem', () => {
    const result = scoreTone(contour([200, 400], 10), 2, 200)!
    expect(result.contourSt[0]).toBeCloseTo(0)
    expect(result.contourSt[9]).toBeCloseTo(12)
    expect(result.slopeSt).toBeGreaterThan(6)
  })
})
