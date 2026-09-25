/**
 * Độ dài phần có tiếng của file mẫu — mốc để chấm nhịp.
 *
 * Giải mã mp3 của từ bằng Web Audio (file đã nằm sẵn trong bộ nhớ đệm của app,
 * nên chạy được cả khi mất mạng), đo một lần rồi nhớ theo URL.
 */

import { speechSeconds } from './pronunciation'

const cache = new Map<string, Promise<number | null>>()

type OfflineConstructor = typeof OfflineAudioContext

function offlineContext(): OfflineConstructor | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as unknown as { webkitOfflineAudioContext?: OfflineConstructor })
    .webkitOfflineAudioContext
  return window.OfflineAudioContext ?? legacy ?? null
}

async function measure(url: string): Promise<number | null> {
  const Offline = offlineContext()
  if (!Offline) return null
  const bytes = await (await fetch(url)).arrayBuffer()
  const context = new Offline(1, 1, 16_000)
  // Safari cũ chỉ có dạng callback; dạng này chạy được ở mọi trình duyệt.
  const audio = await new Promise<AudioBuffer>((resolve, reject) =>
    context.decodeAudioData(bytes, resolve, reject),
  )
  const seconds = speechSeconds(audio.getChannelData(0), audio.sampleRate)
  return seconds > 0 ? seconds : null
}

/**
 * Độ dài phần có tiếng của file mẫu, tính bằng giây.
 * @returns null khi không có file, hoặc không giải mã được — bộ chấm bỏ phần nhịp.
 */
export function referenceSeconds(url: string | null): Promise<number | null> {
  if (!url) return Promise.resolve(null)
  let pending = cache.get(url)
  if (!pending) {
    pending = measure(url).catch(() => null)
    cache.set(url, pending)
  }
  return pending
}

/** Dọn bộ nhớ. Chỉ dùng cho test. */
export function resetReferenceCache(): void {
  cache.clear()
}
