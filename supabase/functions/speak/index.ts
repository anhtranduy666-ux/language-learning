/**
 * Edge Function `speak` — sinh audio phát âm và cache vào Supabase Storage.
 *
 * File này chỉ làm phần nối dây: đọc biến môi trường, gọi Storage, PostgREST
 * và nhà cung cấp TTS. Toàn bộ luật nằm ở `handler.ts` và được `npm test`
 * kiểm — file này cố ý mỏng vì nó chạy trên Deno, ngoài tầm với của bộ test.
 *
 * Cố tình dùng `fetch` thuần thay cho `@supabase/supabase-js`: chỉ cần ba
 * endpoint REST, mà đổi lại không phải ghim phiên bản SDK cho môi trường Deno.
 *
 * Deploy:
 *   supabase secrets set AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southeastasia
 *   supabase functions deploy speak
 *
 * `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase tự tiêm vào.
 * Khoá TTS **không** bao giờ mang tiền tố `VITE_`: mọi thứ có tiền tố đó đều
 * đi thẳng vào bundle của trình duyệt.
 */

// Deno nạp thẳng file TypeScript nên import phải có đuôi `.ts`.
// `Deno` là biến toàn cục sẵn có của runtime — cố ý không khai lại ở đây, vì
// khai lại sẽ che mất kiểu thật và `supabase functions deploy` báo lỗi.
import { handleSpeak, type SpeakDeps, type SpeakRequest } from './handler.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const AZURE_KEY = Deno.env.get('AZURE_SPEECH_KEY') ?? ''
const AZURE_REGION = Deno.env.get('AZURE_SPEECH_REGION') ?? ''

const BUCKET = 'tts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

/** Thoát ký tự để chuỗi của người học không phá được cấu trúc SSML. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Azure Speech. Đổi nhà cung cấp chỉ cần thay đúng hàm này — xem mục 8 của
 * `docs/audio-tts.md`.
 */
async function synthesize({ text, voice, rate }: SpeakRequest): Promise<Uint8Array> {
  if (!AZURE_KEY || !AZURE_REGION) throw new Error('chưa cấu hình AZURE_SPEECH_KEY/REGION')

  // SSML nhận tốc độ theo phần trăm so với bình thường: 0.85 là -15%.
  const percent = Math.round((rate - 1) * 100)
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">` +
    `<voice name="${voice}"><prosody rate="${percent >= 0 ? '+' : ''}${percent}%">` +
    `${escapeXml(text)}</prosody></voice></speak>`

  const response = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'chinese-learning-app',
      },
      body: ssml,
    },
  )

  if (!response.ok) throw new Error(`Azure trả ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

const deps: SpeakDeps = {
  async objectExists(path) {
    // Bucket công khai nên hỏi thẳng CDN, không cần khoá.
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
      { method: 'HEAD' },
    )
    return response.ok
  },

  async isAllowed(hash) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/speakable_texts?hash=eq.${hash}&select=hash&limit=1`,
      { headers: serviceHeaders },
    )
    if (!response.ok) return false
    const rows = (await response.json()) as unknown[]
    return Array.isArray(rows) && rows.length > 0
  },

  synthesize,

  async upload(path, bytes) {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        ...serviceHeaders,
        'Content-Type': 'audio/mpeg',
        // Nội dung bất biến theo hash nên cache được một năm.
        'Cache-Control': '31536000, immutable',
        'x-upsert': 'true',
      },
      body: bytes,
    })
    if (!response.ok) throw new Error(`Storage trả ${response.status}`)
  },

  publicUrl(path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  },

  async recordClip(hash, bytes) {
    await fetch(`${SUPABASE_URL}/rest/v1/audio_clips`, {
      method: 'POST',
      headers: {
        ...serviceHeaders,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ hash, provider: 'azure', bytes }),
    })
  },
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return json({ error: 'invalid_request', message: 'body không phải JSON' }, 400)
  }

  const { status, body } = await handleSpeak(raw, deps)
  return json(body, status)
})
