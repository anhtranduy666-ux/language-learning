/**
 * "Giọng" dựng tay cho test phần chấm phát âm.
 *
 * Mỗi âm tiết là một chuỗi hài có đường cao độ biết trước, bao năng lượng kiểu
 * nguyên âm (lên nhanh, xuống êm). Không giống tiếng người, nhưng có đúng những
 * thứ bộ đo cần: chu kỳ rõ ràng, cao độ đổi theo thời gian, khoảng lặng giữa các
 * âm tiết. Nhờ vậy kiểm được bộ đo mà không cần micro hay tai người.
 */

export const RATE = 16_000

/** Bộ sinh số giả ngẫu nhiên có seed, để tiếng ồn trong test lần nào cũng như nhau. */
function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface VowelOptions {
  /** Cao độ theo thời gian, từ đầu tới cuối âm tiết. Nhiều điểm thì nội suy tuyến tính. */
  hz: number[]
  seconds: number
  rate?: number
  amplitude?: number
  /** Số hài. Tiếng người có hàng chục; 10 là đủ để bộ đo phải chống nhầm gấp đôi chu kỳ. */
  harmonics?: number
}

/** Một "âm tiết": chuỗi hài đi theo đường cao độ cho trước. */
export function vowel({
  hz,
  seconds,
  rate = RATE,
  amplitude = 0.4,
  harmonics = 10,
}: VowelOptions): Float32Array {
  const length = Math.round(seconds * rate)
  const out = new Float32Array(length)
  let phase = 0
  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1)
    const position = t * (hz.length - 1)
    const left = Math.floor(position)
    const right = Math.min(left + 1, hz.length - 1)
    const f = hz[left] + (hz[right] - hz[left]) * (position - left)
    phase += (2 * Math.PI * f) / rate

    // Hài giảm dần 1/k như nguồn thanh môn, lên 20 ms đầu và tắt 40 ms cuối.
    let sample = 0
    for (let k = 1; k <= harmonics; k += 1) sample += Math.sin(k * phase) / k
    const attack = Math.min(1, i / (0.02 * rate))
    const release = Math.min(1, (length - i) / (0.04 * rate))
    out[i] = amplitude * 0.5 * sample * attack * release
  }
  return out
}

/** Khoảng lặng — có thêm chút tiếng ồn nền nếu cần, như phòng thật. */
export function silence(seconds: number, noiseAmplitude = 0, seed = 1, rate = RATE): Float32Array {
  const out = new Float32Array(Math.round(seconds * rate))
  if (noiseAmplitude > 0) {
    const random = rng(seed)
    for (let i = 0; i < out.length; i += 1) out[i] = noiseAmplitude * (random() * 2 - 1)
  }
  return out
}

/** Tiếng ồn trắng. */
export function noise(seconds: number, amplitude: number, seed = 7, rate = RATE): Float32Array {
  return silence(seconds, amplitude, seed, rate)
}

/** Nối nhiều đoạn thành một bản thu. */
export function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** Cộng tiếng ồn vào một bản thu có sẵn. */
export function withNoise(samples: Float32Array, amplitude: number, seed = 3): Float32Array {
  const random = rng(seed)
  return samples.map((value) => value + amplitude * (random() * 2 - 1))
}

/**
 * Hình thanh điệu mẫu, tính theo tỉ lệ so với mặt bằng giọng — theo thang năm
 * bậc của Chao Yuanren (55, 35, 214, 51), mỗi bậc cỡ ba nửa cung.
 */
export const TONE_SHAPES: Record<number, number[]> = {
  1: [1.19, 1.19, 1.19],
  2: [0.94, 1.05, 1.19],
  3: [0.89, 0.75, 1.0],
  4: [1.19, 1.0, 0.79],
}

/** Một âm tiết mang thanh `tone`, quanh mặt bằng `baseHz`. */
export function toneSyllable(tone: number, baseHz: number, seconds = 0.32, rate = RATE): Float32Array {
  return vowel({ hz: TONE_SHAPES[tone].map((ratio) => ratio * baseHz), seconds, rate })
}

/**
 * Một từ: các âm tiết mang thanh cho trước, cách nhau bởi một phụ âm vô thanh
 * giả (khoảng lặng ngắn), có khoảng lặng hai đầu như người học thật.
 */
export function spokenWord(tones: number[], baseHz: number, rate = RATE): Float32Array {
  const parts: Float32Array[] = [silence(0.25, 0.002, 11, rate)]
  tones.forEach((tone, index) => {
    if (index > 0) parts.push(silence(0.06, 0.002, 20 + index, rate))
    parts.push(toneSyllable(tone, baseHz, 0.32, rate))
  })
  parts.push(silence(0.3, 0.002, 13, rate))
  return concat(...parts)
}
