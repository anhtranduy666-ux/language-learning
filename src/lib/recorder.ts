/**
 * Thu âm từ micro, lấy PCM thô — phần duy nhất của tính năng chấm phát âm chạm
 * tới trình duyệt. Xem `docs/pronunciation-mvp.md` mục 8.
 *
 * - Lấy mẫu qua **AudioWorklet**, không qua `MediaRecorder`: bộ chấm cần mẫu thô,
 *   không cần file nén, và Safari trên iOS không ghi được `audio/webm`. Máy cũ
 *   không có AudioWorklet thì lùi về `ScriptProcessorNode`.
 * - Tắt khử vọng, khử ồn và tự chỉnh âm lượng: ba thứ đó làm cho cuộc gọi dễ
 *   nghe, nhưng bóp méo đúng cái bộ chấm cần đo.
 * - `AudioContext` được tạo và `resume()` **trước** mọi `await`, vẫn còn trong
 *   cử chỉ bấm nút của người dùng — iOS đòi như vậy.
 *
 * Không có gì được gửi đi hay lưu lại: bản thu nằm trong bộ nhớ của trang, và
 * mất khi rời màn hình.
 */

/** Lý do không thu âm được. */
export type MicFailure =
  /** Trình duyệt không có API thu âm. */
  | 'unsupported'
  /** Trang không chạy qua https — trình duyệt chặn micro. */
  | 'insecure'
  /** Người dùng (hoặc cài đặt) không cho phép dùng micro. */
  | 'denied'
  /** Máy không có micro. */
  | 'no-device'
  /** Micro đang bị ứng dụng khác giữ. */
  | 'busy'
  | 'error'

export class MicError extends Error {
  constructor(public readonly reason: MicFailure) {
    super(`Không thu âm được: ${reason}`)
  }
}

export interface Recording {
  samples: Float32Array
  rate: number
}

export interface ActiveRecording {
  /** Dừng và lấy bản thu. */
  stop(): Promise<Recording>
  /** Dừng và bỏ bản thu. */
  cancel(): void
}

export interface RecordOptions {
  /** Mức âm lượng 0–1 của đoạn vừa thu, vài chục lần mỗi giây — để vẽ vòng sáng. */
  onLevel?: (level: number) => void
  /** Người học đọc xong rồi im lặng, hoặc đã hết giờ: nên dừng. */
  onAutoStop?: () => void
  /** Thu lâu nhất bao nhiêu giây. */
  maxSeconds?: number
}

type AudioContextConstructor = typeof AudioContext

function audioContextClass(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  return window.AudioContext ?? legacy ?? null
}

/** Máy này thu âm được không, xét trước khi xin quyền. */
export function micSupport(): 'ok' | 'unsupported' | 'insecure' {
  if (typeof window === 'undefined') return 'unsupported'
  if (window.isSecureContext === false) return 'insecure'
  if (typeof navigator.mediaDevices?.getUserMedia !== 'function') return 'unsupported'
  if (!audioContextClass()) return 'unsupported'
  return 'ok'
}

/** Đổi lỗi của `getUserMedia` thành lý do người học hiểu được. */
export function classifyMicError(error: unknown): MicFailure {
  const name = (error as { name?: string } | null)?.name ?? ''
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return 'denied'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
    return 'no-device'
  }
  if (name === 'NotReadableError' || name === 'AbortError' || name === 'TrackStartError') return 'busy'
  return 'error'
}

/** Độ lớn RMS → 0–1 để vẽ, theo thang dB: -60 dB là 0, -10 dB là 1. */
export function levelFromRms(rms: number): number {
  const db = 20 * Math.log10(rms + 1e-9)
  return Math.max(0, Math.min(1, (db + 60) / 50))
}

/**
 * Quyết định khi nào tự dừng: đã nghe thấy giọng nói, rồi im lặng một lúc.
 *
 * Ngưỡng tính theo **nền ồn của chính lần thu này** — trung vị những đoạn yếu
 * nhất — không theo hằng số, vì micro điện thoại không bật tự chỉnh âm lượng
 * thì mỗi máy một độ nhạy.
 */
export class Endpointer {
  private levels: number[] = []
  private speechSeconds = 0
  private silenceSeconds = 0
  private elapsed = 0

  constructor(
    private readonly maxSeconds = 5,
    /** Im lặng chừng này sau khi đã nói thì dừng. */
    private readonly silenceAfter = 0.9,
    /** Phải nói ít nhất chừng này mới tính là đã nói — một tiếng cạch không đủ. */
    private readonly minSpeech = 0.15,
  ) {}

  /** Đẩy vào một đoạn vừa thu. Trả `stop` khi nên dừng. */
  push(rms: number, seconds: number): 'continue' | 'stop' {
    this.elapsed += seconds
    const db = 20 * Math.log10(rms + 1e-9)
    this.levels.push(db)

    const sorted = [...this.levels].sort((a, b) => a - b)
    const floor = sorted[Math.floor(sorted.length * 0.1)]
    const speaking = db > Math.max(floor + 15, -50)
    const quiet = db < Math.max(floor + 8, -55)

    if (speaking) {
      this.speechSeconds += seconds
      this.silenceSeconds = 0
    } else if (quiet && this.speechSeconds >= this.minSpeech) {
      this.silenceSeconds += seconds
    }

    if (this.elapsed >= this.maxSeconds) return 'stop'
    if (this.speechSeconds >= this.minSpeech && this.silenceSeconds >= this.silenceAfter) return 'stop'
    return 'continue'
  }
}

/**
 * Mã của AudioWorklet, nạp qua Blob URL để khỏi phải tách thành file riêng
 * trong bản build. Gom 2048 mẫu rồi mới gửi, đỡ vài trăm tin nhắn mỗi giây.
 */
const WORKLET = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(2048); this.filled = 0 }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) {
      let offset = 0
      while (offset < channel.length) {
        const take = Math.min(channel.length - offset, this.buffer.length - this.filled)
        this.buffer.set(channel.subarray(offset, offset + take), this.filled)
        this.filled += take
        offset += take
        if (this.filled === this.buffer.length) {
          this.port.postMessage(this.buffer.slice())
          this.filled = 0
        }
      }
    }
    return true
  }
}
registerProcessor('capture-processor', CaptureProcessor)
`

function rmsOf(chunk: Float32Array): number {
  let sum = 0
  for (const value of chunk) sum += value * value
  return Math.sqrt(sum / Math.max(1, chunk.length))
}

function joinChunks(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/**
 * Bắt đầu thu. Phải gọi thẳng từ handler của cú bấm — xem ghi chú iOS ở đầu file.
 *
 * @throws MicError khi không thu được, kèm lý do.
 */
export async function startRecording(options: RecordOptions = {}): Promise<ActiveRecording> {
  const support = micSupport()
  if (support !== 'ok') throw new MicError(support)

  const Context = audioContextClass()!
  const context = new Context()
  const resumed = context.resume().catch(() => {})

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    })
  } catch (error) {
    void context.close()
    throw new MicError(classifyMicError(error))
  }
  await resumed

  const chunks: Float32Array[] = []
  const endpointer = new Endpointer(options.maxSeconds)
  let stopped = false
  let announcedStop = false

  const onChunk = (chunk: Float32Array) => {
    if (stopped) return
    chunks.push(chunk)
    const rms = rmsOf(chunk)
    options.onLevel?.(levelFromRms(rms))
    if (endpointer.push(rms, chunk.length / context.sampleRate) === 'stop' && !announcedStop) {
      announcedStop = true
      options.onAutoStop?.()
    }
  }

  const source = context.createMediaStreamSource(stream)
  let node: AudioNode
  try {
    if (context.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }))
      try {
        await context.audioWorklet.addModule(url)
      } finally {
        URL.revokeObjectURL(url)
      }
      const worklet = new AudioWorkletNode(context, 'capture-processor')
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => onChunk(event.data)
      node = worklet
    } else {
      const processor = context.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (event) => onChunk(event.inputBuffer.getChannelData(0).slice())
      node = processor
    }
  } catch {
    stream.getTracks().forEach((track) => track.stop())
    void context.close()
    throw new MicError('error')
  }

  // Có trình duyệt chỉ chạy node khi nó nối tới loa. Nối qua một gain bằng 0
  // để node chạy mà người học không nghe thấy chính mình.
  const mute = context.createGain()
  mute.gain.value = 0
  source.connect(node)
  node.connect(mute)
  mute.connect(context.destination)

  const release = () => {
    stopped = true
    stream.getTracks().forEach((track) => track.stop())
    source.disconnect()
    node.disconnect()
    mute.disconnect()
    void context.close()
  }

  return {
    async stop() {
      release()
      return { samples: joinChunks(chunks), rate: context.sampleRate }
    },
    cancel: release,
  }
}
