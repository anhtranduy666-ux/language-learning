/**
 * Phát âm tiếng Trung.
 *
 * Hai nguồn âm thanh, thử lần lượt:
 *
 * 1. File thu sẵn trong `src/assets/audio/` (xem `audioFiles.ts`).
 * 2. Giọng đọc tiếng Trung của hệ điều hành qua Web Speech API.
 *
 * Máy không có giọng tiếng Trung thì Web Speech API im lặng hoàn toàn — không
 * báo lỗi, không phát gì. Vì vậy module này kiểm tra trước xem có giọng tiếng
 * Trung hay không, để giao diện nói rõ cho người học thay vì bấm nút mà không
 * nghe thấy gì.
 */

import { audioUrlForWord } from './audioFiles'

/** Tình trạng phát âm của máy đang dùng. */
export type AudioStatus =
  /** Phát được: có file thu sẵn hoặc có giọng tiếng Trung. */
  | 'ready'
  /** Trình duyệt đọc được nhưng máy chưa cài giọng tiếng Trung nào. */
  | 'no-chinese-voice'
  /** Trình duyệt không hỗ trợ đọc và cũng không có file thu sẵn. */
  | 'unsupported'

/** Kết quả một lần bấm nút phát âm. */
export type PlayResult = 'played' | 'no-chinese-voice' | 'unsupported' | 'error'

/** Mã ngôn ngữ được coi là tiếng Trung: phổ thông, Quan thoại, Quảng Đông. */
const CHINESE_LANGS = ['zh', 'cmn', 'yue']

/** Thứ tự ưu tiên khi máy có nhiều giọng tiếng Trung. */
const PREFERRED_LANGS = ['zh-cn', 'zh', 'cmn', 'zh-tw', 'zh-hk', 'yue']

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return 'speechSynthesis' in window ? window.speechSynthesis : null
}

function isChinese(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  return CHINESE_LANGS.some((code) => lang === code || lang.startsWith(`${code}-`))
}

function rank(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  const index = PREFERRED_LANGS.findIndex((code) => lang === code || lang.startsWith(`${code}-`))
  return index === -1 ? PREFERRED_LANGS.length : index
}

/** Giọng tiếng Trung hợp nhất mà máy đang có, hoặc null nếu không có giọng nào. */
export function findChineseVoice(): SpeechSynthesisVoice | null {
  const speech = synth()
  if (!speech) return null

  const chinese = speech.getVoices().filter(isChinese)
  if (chinese.length === 0) return null

  return [...chinese].sort((a, b) => rank(a) - rank(b))[0]
}

/** Tình trạng phát âm ngay lúc này. */
export function getAudioStatus(): AudioStatus {
  if (findChineseVoice()) return 'ready'
  if (synth()) return 'no-chinese-voice'
  return 'unsupported'
}

/**
 * Theo dõi danh sách giọng đọc.
 *
 * Chrome và Edge nạp danh sách giọng bất đồng bộ: lần `getVoices()` đầu tiên
 * thường trả về mảng rỗng. Vừa nghe sự kiện `voiceschanged` vừa hỏi lại vài
 * lần để giao diện cập nhật khi danh sách về tới nơi.
 *
 * @returns hàm huỷ theo dõi.
 */
export function subscribeAudioStatus(onChange: (status: AudioStatus) => void): () => void {
  const speech = synth()
  if (!speech) return () => {}

  let stopped = false
  let last = getAudioStatus()

  const check = () => {
    if (stopped) return
    const next = getAudioStatus()
    if (next !== last) {
      last = next
      onChange(next)
    }
  }

  speech.addEventListener?.('voiceschanged', check)
  // Một số bản Safari không bắn `voiceschanged`, nên hỏi lại trong ~3 giây đầu.
  const timers = [100, 300, 700, 1500, 3000].map((delay) => setTimeout(check, delay))
  speech.getVoices()

  return () => {
    stopped = true
    speech.removeEventListener?.('voiceschanged', check)
    timers.forEach(clearTimeout)
  }
}

/** Một từ đọc lâu nhất cỡ vài giây; quá mốc này coi như trình duyệt đã nuốt câu. */
const MAX_UTTERANCE_MS = 10_000

/** Audio đang phát, giữ lại để lần bấm sau cắt ngang được lần trước. */
let current: HTMLAudioElement | null = null

/** Dừng mọi âm thanh đang phát. */
export function stopPlayback(): void {
  if (current) {
    current.pause()
    current = null
  }
  synth()?.cancel()
}

function playFile(url: string): Promise<PlayResult> {
  return new Promise((resolve) => {
    const audio = new Audio(url)
    current = audio
    audio.addEventListener('ended', () => resolve('played'), { once: true })
    audio.addEventListener('error', () => resolve('error'), { once: true })
    audio.play().catch(() => resolve('error'))
  })
}

function playVoice(text: string, voice: SpeechSynthesisVoice): Promise<PlayResult> {
  const speech = synth()
  if (!speech) return Promise.resolve('unsupported')

  return new Promise((resolve) => {
    // Nút phát âm không được phép kẹt ở trạng thái "đang đọc": Chrome thỉnh
    // thoảng nuốt luôn sự kiện `end`, nên luôn có một mốc thời gian chốt lại.
    let done = false
    const finish = (result: PlayResult) => {
      if (done) return
      done = true
      clearTimeout(guard)
      resolve(result)
    }
    const guard = setTimeout(() => finish('error'), MAX_UTTERANCE_MS)

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.lang = voice.lang
      // Chậm hơn bình thường một chút để người mới nghe kịp từng âm tiết.
      utterance.rate = 0.85
      utterance.onend = () => finish('played')
      utterance.onerror = () => finish('error')

      // Chrome bỏ rơi câu mới nếu `speak` được gọi ngay sau `cancel`, nên nhường
      // một nhịp event loop trước khi đọc.
      speech.cancel()
      setTimeout(() => {
        try {
          speech.speak(utterance)
        } catch {
          finish('error')
        }
      }, 0)
    } catch {
      finish('error')
    }
  })
}

/**
 * Phát âm một từ. Ưu tiên file thu sẵn, không có thì dùng giọng hệ điều hành.
 *
 * @returns kết quả để giao diện biết nên hiện gì — không bao giờ ném lỗi.
 */
export async function playWord(input: { text: string; wordId?: string }): Promise<PlayResult> {
  stopPlayback()

  const url = audioUrlForWord(input.wordId)
  if (url) {
    const result = await playFile(url)
    if (result === 'played') return result
    // File hỏng hoặc trình duyệt chặn tự phát: vẫn còn cửa giọng hệ điều hành.
  }

  const voice = findChineseVoice()
  if (voice) return playVoice(input.text, voice)

  return synth() ? 'no-chinese-voice' : 'unsupported'
}
