/**
 * Xử lý tín hiệu dùng chung cho phần chấm phát âm.
 *
 * Mọi hàm ở đây là hàm thuần: nhận `Float32Array`, trả số hoặc mảng mới. Không
 * chạm micro, không chạm DOM — test được bằng tín hiệu dựng tay.
 *
 * Toàn bộ phần phân tích chạy ở 16 kHz, giống `scripts/tone_check.py`: đủ cho
 * giọng nói (cao độ, formant), mà lại nhẹ gấp ba so với 48 kHz của micro.
 */

/** Tần số lấy mẫu của mọi bước phân tích. */
export const ANALYSIS_RATE = 16_000

/** Một khung phân tích dài 10 ms — cao độ, năng lượng và MFCC cùng chung nhịp này. */
export const HOP_SECONDS = 0.01

/**
 * Đổi tần số lấy mẫu, có lọc thông thấp trước khi hạ để khỏi bị chồng phổ.
 *
 * Bộ lọc là sinc cửa sổ Hamming 101 hệ số, cắt ở 0.45 × tần số đích — đúng như
 * bản Python. Nâng tần số thì chỉ nội suy tuyến tính, không lọc.
 */
export function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples.slice()
  if (samples.length === 0) return new Float32Array(0)

  let source = samples
  if (toRate < fromRate) {
    const cutoff = (0.45 * toRate) / fromRate
    const taps = 101
    const half = (taps - 1) / 2
    const kernel = new Float64Array(taps)
    let sum = 0
    for (let i = 0; i < taps; i += 1) {
      const k = i - half
      const sinc = k === 0 ? 1 : Math.sin(2 * Math.PI * cutoff * k) / (2 * Math.PI * cutoff * k)
      const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (taps - 1))
      kernel[i] = 2 * cutoff * sinc * hamming
      sum += kernel[i]
    }
    for (let i = 0; i < taps; i += 1) kernel[i] /= sum

    const filtered = new Float32Array(samples.length)
    for (let n = 0; n < samples.length; n += 1) {
      let acc = 0
      const from = Math.max(0, n - half)
      const to = Math.min(samples.length - 1, n + half)
      for (let m = from; m <= to; m += 1) acc += samples[m] * kernel[m - n + half]
      filtered[n] = acc
    }
    source = filtered
  }

  const length = Math.max(1, Math.floor((source.length * toRate) / fromRate))
  const out = new Float32Array(length)
  const step = fromRate / toRate
  for (let i = 0; i < length; i += 1) {
    const position = i * step
    const left = Math.floor(position)
    const right = Math.min(left + 1, source.length - 1)
    const fraction = position - left
    out[i] = source[left] * (1 - fraction) + source[right] * fraction
  }
  return out
}

/** Năng lượng từng khung 10 ms, tính bằng dB so với biên độ tối đa (0 dB = sóng vuông đầy thang). */
export function frameEnergyDb(
  samples: Float32Array,
  rate: number,
  windowSeconds = 0.025,
): Float32Array {
  const hop = Math.round(HOP_SECONDS * rate)
  const window = Math.round(windowSeconds * rate)
  const count = Math.max(0, Math.floor((samples.length - window) / hop) + 1)
  const out = new Float32Array(count)
  for (let frame = 0; frame < count; frame += 1) {
    const start = frame * hop
    let energy = 0
    for (let i = start; i < start + window; i += 1) energy += samples[i] * samples[i]
    out[frame] = 10 * Math.log10(energy / window + 1e-12)
  }
  return out
}

/** Giá trị ở phân vị `p` (0–1) của một mảng số, không làm đổi mảng gốc. */
export function percentile(values: ArrayLike<number>, p: number): number {
  if (values.length === 0) return Number.NaN
  const sorted = Array.from(values).sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))
  return sorted[index]
}

/** Trung vị. */
export function median(values: ArrayLike<number>): number {
  return percentile(values, 0.5)
}

/**
 * Vùng có tiếng nói, tính theo khung: từ khung đầu tới khung cuối vượt ngưỡng.
 *
 * Ngưỡng là `dropDb` dưới khung to nhất — người học hay bấm ghi rồi mới nghĩ,
 * nên hai đầu bản thu thường là khoảng lặng dài. Giữ thêm `padFrames` khung ở
 * mỗi đầu để không cắt vào phụ âm đầu hay đuôi thanh.
 *
 * @returns null khi bản thu không có gì nghe được — khung to nhất vẫn dưới
 * `silenceDb` — hoặc rỗng.
 */
export function speechRegion(
  energyDb: Float32Array,
  dropDb = 30,
  padFrames = 3,
  silenceDb = -70,
): { start: number; end: number } | null {
  if (energyDb.length === 0) return null
  let peak = -Infinity
  for (const value of energyDb) peak = Math.max(peak, value)
  if (peak < silenceDb) return null
  const threshold = peak - dropDb

  let start = -1
  let end = -1
  for (let i = 0; i < energyDb.length; i += 1) {
    if (energyDb[i] >= threshold) {
      if (start === -1) start = i
      end = i
    }
  }
  if (start === -1) return null
  return {
    start: Math.max(0, start - padFrames),
    end: Math.min(energyDb.length, end + 1 + padFrames),
  }
}

/** Đổi Hz sang nửa cung so với một mốc — tai người nghe cao độ theo tỉ lệ, không theo hiệu. */
export function semitones(hz: number, referenceHz: number): number {
  return 12 * Math.log2(hz / referenceHz)
}

/**
 * Ghi PCM mono thành file WAV 16 bit, để người học bấm nghe lại giọng mình
 * bằng một thẻ `<audio>` bình thường. Không nén, không thư viện.
 */
export function encodeWav(samples: Float32Array, rate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i))
  }

  text(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true) // cỡ khối fmt
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true) // byte mỗi giây
  view.setUint16(32, 2, true) // byte mỗi mẫu
  view.setUint16(34, 16, true) // bit mỗi mẫu
  text(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return buffer
}

/**
 * Đọc WAV PCM 16 bit (mono hoặc stereo — stereo thì lấy trung bình hai kênh).
 * Dùng cho bản thu mẫu trong test; app thật giải mã mp3 bằng Web Audio.
 *
 * @throws khi không phải WAV PCM 16 bit.
 */
export function decodeWav(buffer: ArrayBuffer): { samples: Float32Array; rate: number } {
  const view = new DataView(buffer)
  const tag = (offset: number) =>
    String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(offset + i)))

  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Không phải file WAV')

  let offset = 12
  let rate = 0
  let channels = 0
  let bits = 0
  while (offset + 8 <= view.byteLength) {
    const id = tag(offset)
    const size = view.getUint32(offset + 4, true)
    if (id === 'fmt ') {
      if (view.getUint16(offset + 8, true) !== 1) throw new Error('Chỉ đọc được WAV PCM')
      channels = view.getUint16(offset + 10, true)
      rate = view.getUint32(offset + 12, true)
      bits = view.getUint16(offset + 22, true)
    } else if (id === 'data') {
      if (bits !== 16) throw new Error('Chỉ đọc được WAV 16 bit')
      const frames = Math.floor(size / (2 * channels))
      const samples = new Float32Array(frames)
      for (let i = 0; i < frames; i += 1) {
        let sum = 0
        for (let c = 0; c < channels; c += 1) {
          sum += view.getInt16(offset + 8 + (i * channels + c) * 2, true) / 0x8000
        }
        samples[i] = sum / channels
      }
      return { samples, rate }
    }
    offset += 8 + size + (size % 2)
  }
  throw new Error('File WAV không có khối dữ liệu')
}
