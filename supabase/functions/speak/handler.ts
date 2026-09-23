/**
 * Phần xử lý của Edge Function `speak` — mục 5 của `docs/audio-tts.md`.
 *
 * Tách khỏi `index.ts` để chạy được bằng `npm test`: file này thuần TypeScript,
 * không chạm `Deno`, không chạm mạng. Mọi phụ thuộc đi vào qua `SpeakDeps` nên
 * test bơm được nhà cung cấp TTS giả.
 *
 * Cách băm ở đây **cố ý lặp lại** `src/lib/audioCacheKey.ts`. Không import
 * chéo vì Supabase chỉ đóng gói những gì nằm trong `supabase/functions/`.
 * Hai bên lệch nhau là rủi ro số một của cả phương án — mọi request đều trượt
 * cache mà giao diện không có dấu hiệu gì — nên cả hai bộ test đều chốt theo
 * cùng một `HASH_VECTOR`.
 */

export const CACHE_PREFIX = 'v1'
export const MAX_TEXT_LENGTH = 200
export const MIN_RATE = 0.5
export const MAX_RATE = 1.5

/** Giọng được phép. Hằng số trong code, không nhận giá trị tuỳ ý từ request. */
export const ALLOWED_VOICES = [
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-YunxiNeural',
  'zh-CN-XiaoyiNeural',
] as const

export interface SpeakRequest {
  text: string
  voice: string
  rate: number
}

/** Những gì Edge Function cần từ bên ngoài. `index.ts` nối vào Supabase thật. */
export interface SpeakDeps {
  /** File đã có trong bucket chưa. */
  objectExists(path: string): Promise<boolean>
  /** Hash này có nằm trong nội dung khoá học không. */
  isAllowed(hash: string): Promise<boolean>
  /** Gọi nhà cung cấp TTS. */
  synthesize(request: SpeakRequest): Promise<Uint8Array>
  /** Ghi file vào bucket. */
  upload(path: string, bytes: Uint8Array): Promise<void>
  /** URL công khai của một đường dẫn trong bucket. */
  publicUrl(path: string): string
  /** Ghi nhận một lần sinh mới. Không bắt buộc. */
  recordClip?(hash: string, bytes: number): Promise<void>
}

export interface SpeakResponse {
  status: number
  body: Record<string, unknown>
}

/** Chuỗi chuẩn hoá đem đi băm. Phải giống hệt `canonicalString` phía client. */
export function canonicalString({ text, voice, rate }: SpeakRequest): string {
  return `${text}\n${voice}\n${rate.toFixed(2)}`
}

/** SHA-256 của một chuỗi UTF-8, viết thường, 64 ký tự hex. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Đường dẫn file trong bucket. */
export function audioPath(hash: string): string {
  return `${CACHE_PREFIX}/${hash}.mp3`
}

/**
 * Đọc và kiểm tra body của request.
 * @returns yêu cầu đã chuẩn hoá, hoặc null nếu không hợp lệ.
 */
export function parseRequest(raw: unknown): SpeakRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { text, voice, rate } = raw as Record<string, unknown>

  if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_TEXT_LENGTH) return null
  if (typeof voice !== 'string' || !ALLOWED_VOICES.includes(voice as (typeof ALLOWED_VOICES)[number])) {
    return null
  }
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < MIN_RATE || rate > MAX_RATE) {
    return null
  }

  return { text, voice, rate }
}

/**
 * Xử lý một lần gọi `/speak`.
 *
 * Thứ tự cố ý: **kiểm cache trước whitelist**. File đã có nghĩa là nó từng
 * được duyệt rồi, trả luôn thì khỏi tốn một lượt đọc bảng.
 */
export async function handleSpeak(raw: unknown, deps: SpeakDeps): Promise<SpeakResponse> {
  const request = parseRequest(raw)
  if (!request) {
    return {
      status: 400,
      body: { error: 'invalid_request', message: 'text, voice hoặc rate không hợp lệ' },
    }
  }

  const hash = await sha256Hex(canonicalString(request))
  const path = audioPath(hash)

  // 1. Đã có thì trả luôn, không gọi TTS.
  if (await deps.objectExists(path)) {
    return { status: 200, body: { url: deps.publicUrl(path), hash, cached: true } }
  }

  // 2. Chỉ sinh audio cho nội dung của khoá học.
  if (!(await deps.isAllowed(hash))) {
    return { status: 403, body: { error: 'not_allowed' } }
  }

  // 3. Sinh và lưu.
  let bytes: Uint8Array
  try {
    bytes = await deps.synthesize(request)
  } catch {
    return { status: 502, body: { error: 'tts_failed' } }
  }

  try {
    await deps.upload(path, bytes)
  } catch {
    return { status: 502, body: { error: 'upload_failed' } }
  }

  // Ghi nhận chi phí là việc phụ: hỏng thì vẫn trả audio cho người học.
  try {
    await deps.recordClip?.(hash, bytes.byteLength)
  } catch {
    // Bỏ qua.
  }

  return { status: 200, body: { url: deps.publicUrl(path), hash, cached: false } }
}
