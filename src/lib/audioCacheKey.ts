/**
 * Khoá cache cho audio phát âm — mục 4 của `docs/audio-tts.md`.
 *
 * Đường dẫn file suy ra từ chính nội dung cần đọc, nên trình duyệt tự tính
 * được URL và đọc thẳng từ CDN, không phải hỏi Edge Function trước.
 *
 * Client và server **phải** dựng ra cùng một chuỗi chuẩn hoá. Lệch nhau thì
 * mọi lần bấm đều trượt cache, hoá đơn TTS tăng mà giao diện không có dấu hiệu
 * gì bất thường. Vì vậy có `HASH_VECTOR` bên dưới, và cả hai bộ test đều chốt
 * theo nó — xem `supabase/functions/speak/handler.ts`.
 */

/** Bucket Supabase Storage chứa file mp3. */
export const AUDIO_BUCKET = 'tts'

/** Tiền tố đường dẫn. Đổi quy ước băm thì bump lên `v2`, file cũ vẫn còn để rollback. */
export const CACHE_PREFIX = 'v1'

/** Giọng đọc mặc định của khoá học. Nằm trong chuỗi băm nên đổi giọng là ra file khác. */
export const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'

/** Chậm hơn bình thường một chút, để người mới nghe kịp từng âm tiết. */
export const DEFAULT_RATE = 0.85

/** Ràng buộc đầu vào, dùng chung cho cả client lẫn Edge Function. */
export const MAX_TEXT_LENGTH = 200
export const MIN_RATE = 0.5
export const MAX_RATE = 1.5

/** Một chuỗi cần đọc, kèm giọng và tốc độ. */
export interface SpeechRequest {
  text: string
  voice: string
  rate: number
}

/**
 * Vector kiểm tra dùng chung giữa client và Edge Function.
 * Cả hai bộ test đều phải cho ra đúng `hash` này.
 */
export const HASH_VECTOR = {
  text: '你好',
  voice: DEFAULT_VOICE,
  rate: DEFAULT_RATE,
  hash: '99a8fdaabbbfe7749d99192988740d8d02a75bd4347eb687103de33b7fdc6a7a',
} as const

/**
 * Chuỗi chuẩn hoá đem đi băm.
 *
 * `toFixed(2)` để `0.85` và `0.850` cho ra cùng một chuỗi — số thực in ra khác
 * nhau giữa các ngôn ngữ là cách dễ nhất để client và server lệch hash.
 */
export function canonicalString({ text, voice, rate }: SpeechRequest): string {
  return `${text}\n${voice}\n${rate.toFixed(2)}`
}

/** `crypto.subtle` chỉ có trong secure context (https hoặc localhost). */
export function canHash(): boolean {
  return typeof globalThis.crypto?.subtle?.digest === 'function'
}

/** SHA-256 của một chuỗi UTF-8, viết thường, 64 ký tự hex. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Khoá cache của một chuỗi cần đọc.
 *
 * @returns null khi trình duyệt không có `crypto.subtle` — mở app qua
 * `http://<ip-lan>` chẳng hạn. Lúc đó phần audio lùi xuống nguồn kế tiếp thay
 * vì ném lỗi ra giao diện.
 */
export async function audioHash(request: SpeechRequest): Promise<string | null> {
  if (!canHash()) return null
  try {
    return await sha256Hex(canonicalString(request))
  } catch {
    return null
  }
}

/** Đường dẫn file trong bucket, ví dụ `v1/99a8….mp3`. */
export function audioPath(hash: string): string {
  return `${CACHE_PREFIX}/${hash}.mp3`
}

/** URL công khai của file, đọc thẳng qua CDN không cần khoá. */
export function publicAudioUrl(supabaseUrl: string, hash: string): string {
  const base = supabaseUrl.replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/${AUDIO_BUCKET}/${audioPath(hash)}`
}

/** Đầu vào có nằm trong giới hạn cho phép không. Edge Function kiểm lại y hệt. */
export function isValidRequest({ text, voice, rate }: SpeechRequest): boolean {
  if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_TEXT_LENGTH) return false
  if (typeof voice !== 'string' || voice.trim() === '') return false
  return Number.isFinite(rate) && rate >= MIN_RATE && rate <= MAX_RATE
}
