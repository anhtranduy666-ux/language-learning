import { describe, expect, it } from 'vitest'
import { median } from './dsp'
import { F0_MAX, F0_MIN, f0Track, voicedCount, voicedValues } from './pitch'
import { RATE, concat, noise, silence, vowel } from '../test/synthVoice'

/** Cao độ giữa của các khung hữu thanh. */
function medianHz(f0: Float32Array): number {
  return median(voicedValues(f0))
}

describe('f0Track', () => {
  it('đo đúng một sin thuần', () => {
    const f0 = f0Track(vowel({ hz: [200], seconds: 0.5, harmonics: 1 }), RATE)
    expect(medianHz(f0)).toBeCloseTo(200, -1)
  })

  it('đo đúng chuỗi hài như giọng người, không nhầm sang hài bậc cao', () => {
    const f0 = f0Track(vowel({ hz: [150], seconds: 0.5 }), RATE)
    expect(Math.abs(medianHz(f0) - 150)).toBeLessThan(3)
  })

  it('không hụt một quãng tám khi hài bậc hai mạnh hơn cả âm cơ bản', () => {
    // Bẫy kinh điển: chu kỳ gấp đôi (90 Hz) cũng khớp gần như hoàn hảo.
    const length = RATE / 2
    const tricky = Float32Array.from({ length }, (_, i) => {
      const phase = (2 * Math.PI * 180 * i) / RATE
      return 0.2 * Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase)
    })
    expect(Math.abs(medianHz(f0Track(tricky, RATE)) - 180)).toBeLessThan(5)
  })

  it('đo được giọng nam trầm 90 Hz và giọng trẻ em 520 Hz', () => {
    expect(Math.abs(medianHz(f0Track(vowel({ hz: [90], seconds: 0.5 }), RATE)) - 90)).toBeLessThan(3)
    expect(Math.abs(medianHz(f0Track(vowel({ hz: [520], seconds: 0.5 }), RATE)) - 520)).toBeLessThan(15)
    expect(F0_MIN).toBeLessThan(90)
    expect(F0_MAX).toBeGreaterThan(520)
  })

  it('bám theo cao độ đổ xuống và đi lên', () => {
    const falling = voicedValues(f0Track(vowel({ hz: [320, 180], seconds: 0.4 }), RATE))
    const rising = voicedValues(f0Track(vowel({ hz: [180, 300], seconds: 0.4 }), RATE))

    expect(falling[2]).toBeGreaterThan(290)
    expect(falling[falling.length - 3]).toBeLessThan(215)
    expect(rising[2]).toBeLessThan(200)
    expect(rising[rising.length - 3]).toBeGreaterThan(265)
  })

  it('khoảng lặng không có khung hữu thanh nào', () => {
    expect(voicedCount(f0Track(silence(0.5), RATE))).toBe(0)
  })

  it('tiếng ồn trắng gần như không có khung hữu thanh', () => {
    const f0 = f0Track(noise(1, 0.3), RATE)
    expect(voicedCount(f0) / f0.length).toBeLessThan(0.05)
  })

  it('khung thứ k ứng với mốc k × 10 ms', () => {
    const recording = concat(silence(0.5), vowel({ hz: [220], seconds: 0.4 }), silence(0.5))
    const f0 = f0Track(recording, RATE)
    const first = f0.findIndex((value) => value > 0)
    // Cửa sổ dài 30 ms nên khung bắt đầu hơi trước 0.5 s đã chạm tới tiếng.
    expect(first).toBeGreaterThanOrEqual(46)
    expect(first).toBeLessThanOrEqual(52)
  })

  it('bản thu 48 kHz cho cùng kết quả sau khi tự hạ mẫu', () => {
    const f0 = f0Track(vowel({ hz: [250], seconds: 0.5, rate: 48_000 }), 48_000)
    expect(Math.abs(medianHz(f0) - 250)).toBeLessThan(4)
  })

  it('bản thu quá ngắn thì trả mảng rỗng, không vỡ', () => {
    expect(f0Track(new Float32Array(100), RATE)).toHaveLength(0)
  })
})
