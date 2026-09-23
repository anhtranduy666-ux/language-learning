/**
 * Audio phát âm lấy từ Supabase — mục 7 của `docs/audio-tts.md`.
 *
 * Đường đi thường gặp chỉ có một bước: file đã nằm sẵn trên CDN, client tự
 * tính được URL từ nội dung nên không cần hỏi ai. Chỉ khi CDN trả 404 mới gọi
 * Edge Function để sinh lần đầu.
 *
 * Mọi lỗi đều trả `null` chứ không ném ra ngoài: người học thà nghe giọng hệ
 * điều hành còn hơn thấy nút quay mãi.
 */

import {
  DEFAULT_RATE,
  DEFAULT_VOICE,
  audioHash,
  isValidRequest,
  publicAudioUrl,
  type SpeechRequest,
} from './audioCacheKey'
import { speakFunctionUrl, supabaseConfig } from '../services/supabase'

/**
 * Hạn giờ cho từng chặng — mục 7 của `docs/audio-tts.md`.
 * Quá hạn thì rơi xuống nguồn kế tiếp: thà nghe giọng máy còn hơn nút quay mãi.
 */
export const CDN_TIMEOUT_MS = 3_000
export const FUNCTION_TIMEOUT_MS = 8_000

/** URL đã biết là có, giữ lại để lần bấm sau không chạm mạng nữa. */
const resolved = new Map<string, string>()

/** Những hash đã hỏi và biết chắc là không có — khỏi hỏi lại trong phiên này. */
const missing = new Set<string>()

function withDefaults(input: string | Partial<SpeechRequest>): SpeechRequest {
  const partial = typeof input === 'string' ? { text: input } : input
  return {
    text: partial.text ?? '',
    voice: partial.voice ?? DEFAULT_VOICE,
    rate: partial.rate ?? DEFAULT_RATE,
  }
}

/** `fetch` có hạn giờ, nuốt mọi lỗi mạng và trả `null` thay vì ném. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** File đã có sẵn trên CDN chưa. Dùng HEAD để không tải cả mp3 chỉ để hỏi. */
async function cdnHit(url: string): Promise<boolean> {
  const response = await fetchWithTimeout(url, { method: 'HEAD' }, CDN_TIMEOUT_MS)
  return response?.ok === true
}

/** Nhờ Edge Function sinh audio. Trả về URL, hoặc null nếu bị từ chối. */
async function requestGeneration(request: SpeechRequest): Promise<string | null> {
  const config = supabaseConfig()
  if (!config) return null

  const response = await fetchWithTimeout(
    speakFunctionUrl(config),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify(request),
    },
    FUNCTION_TIMEOUT_MS,
  )

  if (!response?.ok) return null

  try {
    const body = (await response.json()) as { url?: unknown }
    return typeof body.url === 'string' && body.url !== '' ? body.url : null
  } catch {
    return null
  }
}

/**
 * URL audio của một chuỗi tiếng Trung.
 *
 * @returns null khi chưa cấu hình Supabase, mất mạng, hoặc chuỗi không nằm
 * trong nội dung khoá học.
 */
export async function remoteAudioUrl(
  input: string | Partial<SpeechRequest>,
): Promise<string | null> {
  const config = supabaseConfig()
  if (!config) return null

  const request = withDefaults(input)
  if (!isValidRequest(request)) return null

  const hash = await audioHash(request)
  if (!hash) return null

  const cached = resolved.get(hash)
  if (cached) return cached
  if (missing.has(hash)) return null

  // 1. Đường đi chính: file đã nằm trên CDN.
  const url = publicAudioUrl(config.url, hash)
  if (await cdnHit(url)) {
    resolved.set(hash, url)
    return url
  }

  // 2. Chưa có thì nhờ Edge Function sinh.
  const generated = await requestGeneration(request)
  if (generated) {
    resolved.set(hash, generated)
    return generated
  }

  missing.add(hash)
  return null
}

/**
 * Nạp trước audio cho cả một bài học.
 *
 * Vào màn hình Lesson là bắt đầu tải, tối đa ba request song song, không chờ
 * kết quả. Mỗi bài chỉ khoảng sáu từ nên thường xong trước khi người học đọc
 * hết trang.
 */
export function prefetchAudio(texts: string[], concurrency = 3): void {
  if (!supabaseConfig()) return

  const queue = [...new Set(texts)].filter((text) => text.trim() !== '')
  let active = 0

  const pump = () => {
    while (active < concurrency && queue.length > 0) {
      const text = queue.shift()!
      active += 1
      void remoteAudioUrl(text).finally(() => {
        active -= 1
        pump()
      })
    }
  }

  pump()
}

/** Dọn cache trong bộ nhớ. Chỉ dùng cho test. */
export function resetRemoteAudioCache(): void {
  resolved.clear()
  missing.clear()
}
