import { describe, expect, it } from 'vitest'
import { frameEnergyDb, speechRegion } from './dsp'
import { f0Track } from './pitch'
import { splitSyllables, voicedRuns } from './segment'
import { RATE, concat, noise, silence, vowel } from '../test/synthVoice'

/** Đo sẵn cao độ và năng lượng, rồi cắt thành `count` âm tiết. */
function split(recording: Float32Array, count: number) {
  const f0 = f0Track(recording, RATE)
  const energy = frameEnergyDb(recording, RATE)
  const region = speechRegion(energy) ?? undefined
  return splitSyllables(f0, energy, count, region)
}

/** Mốc giây → khung. */
const frame = (seconds: number) => Math.round(seconds * 100)

describe('voicedRuns', () => {
  it('nối lại chỗ đứt một hai khung do bộ bám cao độ lỡ nhịp', () => {
    const f0 = Float32Array.from([0, 200, 200, 0, 200, 200, 200, 0, 0, 0, 0, 180, 180, 180, 0])
    expect(voicedRuns(f0)).toEqual([
      { start: 1, end: 7 },
      { start: 11, end: 14 },
    ])
  })

  it('bỏ tiếng động hữu thanh quá ngắn', () => {
    const f0 = Float32Array.from([0, 200, 0, 0, 0, 180, 180, 180, 180, 0])
    expect(voicedRuns(f0)).toEqual([{ start: 5, end: 9 }])
  })
})

describe('splitSyllables', () => {
  it('một âm tiết thì trả đúng một đoạn', () => {
    const spans = split(concat(silence(0.3), vowel({ hz: [220], seconds: 0.35 }), silence(0.3)), 1)!
    expect(spans).toHaveLength(1)
    expect(Math.abs(spans[0].start - frame(0.3))).toBeLessThanOrEqual(3)
    expect(Math.abs(spans[0].end - frame(0.65))).toBeLessThanOrEqual(5)
  })

  it('hai âm tiết cách nhau bởi phụ âm vô thanh — như 谢谢, 你好', () => {
    const recording = concat(
      silence(0.3),
      vowel({ hz: [280, 200], seconds: 0.3 }),
      silence(0.07),
      vowel({ hz: [220], seconds: 0.2 }),
      silence(0.3),
    )
    const spans = split(recording, 2)!
    expect(spans).toHaveLength(2)
    // Ranh giới rơi vào khoảng lặng 0.60–0.67 s.
    expect(spans[0].end).toBeLessThanOrEqual(frame(0.64))
    expect(spans[1].start).toBeGreaterThanOrEqual(frame(0.6))
  })

  it('hai âm tiết liền hơi, chỉ hụt năng lượng ở giữa — như 妈妈, 我们', () => {
    // Một đoạn hữu thanh liền, biên độ hụt xuống còn 15% ở giữa, như qua âm m.
    const length = Math.round(0.6 * RATE)
    const joined = vowel({ hz: [250, 230], seconds: 0.6 }).map((value, i) => {
      const t = i / length
      const dipAt = Math.abs(t - 0.5)
      return value * (dipAt < 0.06 ? 0.15 : 1)
    })
    const spans = split(concat(silence(0.3), joined, silence(0.3)), 2)!
    expect(spans).toHaveLength(2)
    const cut = spans[1].start
    expect(Math.abs(cut - frame(0.6))).toBeLessThanOrEqual(4)
  })

  it('hai âm tiết không có chỗ trũng nào — như 女儿 — thì chia đôi, không bỏ cuộc', () => {
    const spans = split(concat(silence(0.3), vowel({ hz: [220, 260], seconds: 0.5 }), silence(0.3)), 2)!
    expect(spans).toHaveLength(2)
    expect(spans[0].end).toBe(spans[1].start)
  })

  it('ba âm tiết — như 对不起', () => {
    const recording = concat(
      silence(0.3),
      vowel({ hz: [300, 200], seconds: 0.25 }),
      silence(0.05),
      vowel({ hz: [200], seconds: 0.15 }),
      silence(0.06),
      vowel({ hz: [210, 180, 220], seconds: 0.3 }),
      silence(0.3),
    )
    expect(split(recording, 3)).toHaveLength(3)
  })

  it('thừa một đoạn vì thanh 3 xuống thấp tới mức giọng rè đứt — thì gộp lại', () => {
    const recording = concat(
      silence(0.3),
      vowel({ hz: [220, 170], seconds: 0.15 }),
      silence(0.04),
      vowel({ hz: [170, 210], seconds: 0.15 }),
      silence(0.3),
    )
    expect(split(recording, 1)).toHaveLength(1)
  })

  it('mẩu tiếng ngắn ở mép — tiếng người bên cạnh, tiếng chạm micro — bị bỏ, không gộp vào âm tiết', () => {
    const recording = concat(
      silence(0.3),
      vowel({ hz: [260, 180], seconds: 0.3 }),
      silence(0.07),
      vowel({ hz: [200, 260], seconds: 0.3 }),
      silence(0.13),
      vowel({ hz: [230], seconds: 0.045 }),
      silence(0.3),
    )
    const spans = split(recording, 2)!
    expect(spans).toHaveLength(2)
    // Âm tiết thứ hai kết thúc ở 1.0 s, không kéo dài tới mẩu tiếng ở 1.13 s.
    expect(spans[1].end).toBeLessThanOrEqual(frame(1.03))
  })

  it('tiếng ồn không có âm tiết nào thì trả null', () => {
    expect(split(noise(1, 0.2), 2)).toBeNull()
  })

  it('quá ngắn so với số âm tiết cần có thì trả null thay vì cắt bừa', () => {
    expect(split(concat(silence(0.3), vowel({ hz: [220], seconds: 0.08 }), silence(0.3)), 3)).toBeNull()
  })
})
