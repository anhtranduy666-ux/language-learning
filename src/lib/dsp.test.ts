import { describe, expect, it } from 'vitest'
import {
  decodeWav,
  encodeWav,
  frameEnergyDb,
  median,
  percentile,
  resample,
  semitones,
  speechRegion,
} from './dsp'
import { RATE, concat, silence, vowel } from '../test/synthVoice'

function sine(hz: number, seconds: number, rate: number, amplitude = 0.5): Float32Array {
  return Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) =>
    amplitude * Math.sin((2 * Math.PI * hz * i) / rate),
  )
}

function rms(samples: Float32Array, from = 0, to = samples.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += samples[i] * samples[i]
  return Math.sqrt(sum / Math.max(1, to - from))
}

/** Tần số ước lượng bằng số lần cắt qua 0. */
function zeroCrossingHz(samples: Float32Array, rate: number): number {
  let crossings = 0
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i - 1] < 0 !== samples[i] < 0) crossings += 1
  }
  return (crossings / 2) * (rate / samples.length)
}

describe('resample', () => {
  it('hạ 48 kHz về 16 kHz mà giữ nguyên cao độ', () => {
    const out = resample(sine(440, 1, 48_000), 48_000, 16_000)
    expect(out.length).toBe(16_000)
    expect(zeroCrossingHz(out, 16_000)).toBeCloseTo(440, -1)
  })

  it('lọc bỏ tần số cao hơn nửa tần số đích, không để chồng phổ', () => {
    // 12 kHz không tồn tại được ở 16 kHz; không lọc thì nó dội ngược thành 4 kHz.
    const out = resample(sine(12_000, 0.5, 48_000), 48_000, 16_000)
    expect(rms(out, 200, out.length - 200)).toBeLessThan(0.02)
  })

  it('cùng tần số thì trả bản sao', () => {
    const input = sine(200, 0.1, RATE)
    const out = resample(input, RATE, RATE)
    expect(out).toEqual(input)
    expect(out).not.toBe(input)
  })

  it('mảng rỗng vẫn chạy', () => {
    expect(resample(new Float32Array(0), 48_000, 16_000)).toHaveLength(0)
  })
})

describe('frameEnergyDb và speechRegion', () => {
  it('khoảng lặng rất thấp, sin đầy thang cỡ -3 dB', () => {
    const quiet = frameEnergyDb(new Float32Array(RATE / 10), RATE)
    const loud = frameEnergyDb(sine(300, 0.1, RATE, 1), RATE)
    expect(Math.max(...quiet)).toBeLessThan(-100)
    expect(median(loud)).toBeCloseTo(-3, 0)
  })

  it('khung thứ k ứng với mốc k × 10 ms', () => {
    const energy = frameEnergyDb(new Float32Array(RATE), RATE)
    // 1 giây, cửa sổ 25 ms, bước 10 ms → 98 khung.
    expect(energy).toHaveLength(98)
  })

  it('tìm ra vùng có tiếng giữa hai khoảng lặng', () => {
    const recording = concat(silence(0.5, 0.001), vowel({ hz: [200], seconds: 0.4 }), silence(0.5, 0.001))
    const region = speechRegion(frameEnergyDb(recording, RATE))!

    // Tiếng nói nằm từ 0.5 s tới 0.9 s; vùng tìm được có đệm thêm vài khung.
    expect(region.start).toBeGreaterThanOrEqual(44)
    expect(region.start).toBeLessThanOrEqual(50)
    expect(region.end).toBeGreaterThanOrEqual(88)
    expect(region.end).toBeLessThanOrEqual(96)
  })

  it('bản thu rỗng thì không có vùng nào', () => {
    expect(speechRegion(new Float32Array(0))).toBeNull()
  })

  it('lặng tuyệt đối thì không có vùng nào, dù ngưỡng tính tương đối', () => {
    expect(speechRegion(frameEnergyDb(silence(0.5), RATE))).toBeNull()
  })
})

describe('percentile, median, semitones', () => {
  it('lấy đúng phân vị, không đổi mảng gốc', () => {
    const values = [5, 1, 4, 2, 3]
    expect(median(values)).toBe(3)
    expect(percentile(values, 0)).toBe(1)
    expect(percentile(values, 1)).toBe(5)
    expect(values).toEqual([5, 1, 4, 2, 3])
  })

  it('một quãng tám là 12 nửa cung', () => {
    expect(semitones(440, 220)).toBeCloseTo(12)
    expect(semitones(220, 440)).toBeCloseTo(-12)
  })
})

describe('encodeWav / decodeWav', () => {
  it('ghi rồi đọc lại ra đúng tín hiệu, sai số trong một bước lượng tử 16 bit', () => {
    const input = sine(330, 0.2, RATE, 0.8)
    const { samples, rate } = decodeWav(encodeWav(input, RATE))

    expect(rate).toBe(RATE)
    expect(samples).toHaveLength(input.length)
    for (let i = 0; i < input.length; i += 97) expect(samples[i]).toBeCloseTo(input[i], 3)
  })

  it('kẹp mẫu vượt thang thay vì để tràn số', () => {
    const { samples } = decodeWav(encodeWav(Float32Array.from([2, -2]), RATE))
    expect(samples[0]).toBeCloseTo(1, 3)
    expect(samples[1]).toBeCloseTo(-1, 3)
  })

  it('không phải WAV thì báo lỗi', () => {
    expect(() => decodeWav(new ArrayBuffer(44))).toThrow(/WAV/)
  })
})
