/**
 * Sinh sẵn toàn bộ audio của khoá học — mốc M1 trong `docs/audio-tts.md`.
 *
 * Chạy thủ công, không nằm trong app. Mỗi lần thêm từ mới vào `hsk1.ts` thì
 * chạy lại; những gì đã có sẵn sẽ được bỏ qua.
 *
 *   cp .env.example .env.local     # rồi điền giá trị thật
 *   npm run prewarm-audio -- --dry-run   # xem sẽ làm gì, không chạm mạng
 *   npm run prewarm-audio
 *
 * Biến môi trường cần có:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — service role, KHÔNG phải anon
 *   AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
 *
 * Script cố ý dùng chung `src/lib/audioCacheKey.ts` với trình duyệt. Đây là
 * thứ bảo đảm hash seed vào whitelist đúng bằng hash mà app sẽ hỏi.
 */

import { WORDS } from '../src/data/hsk1.ts'
import {
  AUDIO_BUCKET,
  DEFAULT_RATE,
  DEFAULT_VOICE,
  audioPath,
  canonicalString,
  sha256Hex,
} from '../src/lib/audioCacheKey.ts'

interface Clip {
  hash: string
  text: string
  voice: string
  rate: number
  source: 'word' | 'example'
  word_id: string
}

const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const AZURE_KEY = process.env.AZURE_SPEECH_KEY ?? ''
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? ''

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
}

function requireEnv(): void {
  const missing = [
    ['SUPABASE_URL', SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY],
    ['AZURE_SPEECH_KEY', AZURE_KEY],
    ['AZURE_SPEECH_REGION', AZURE_REGION],
  ]
    .filter(([, value]) => value === '')
    .map(([name]) => name)

  if (missing.length > 0) {
    console.error(`Thiếu biến môi trường: ${missing.join(', ')}`)
    console.error('Xem .env.example, rồi chạy lại. Muốn xem trước thì thêm --dry-run.')
    process.exit(1)
  }
}

/** Mọi chuỗi tiếng Trung của khoá học: từ vựng và câu ví dụ. */
async function collectClips(): Promise<Clip[]> {
  const clips: Clip[] = []

  for (const word of WORDS) {
    for (const [source, text] of [
      ['word', word.hanzi],
      ['example', word.example],
    ] as const) {
      const request = { text, voice: DEFAULT_VOICE, rate: DEFAULT_RATE }
      clips.push({
        hash: await sha256Hex(canonicalString(request)),
        text,
        voice: DEFAULT_VOICE,
        rate: DEFAULT_RATE,
        source,
        word_id: word.id,
      })
    }
  }

  // Hai từ có thể dùng chung một câu ví dụ — chỉ sinh audio một lần.
  const seen = new Set<string>()
  return clips.filter((clip) => (seen.has(clip.hash) ? false : seen.add(clip.hash)))
}

/** Nạp whitelist. Không có bảng này thì Edge Function từ chối mọi thứ. */
async function seedWhitelist(clips: Clip[]): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/speakable_texts`, {
    method: 'POST',
    headers: {
      ...serviceHeaders,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(clips),
  })

  if (!response.ok) {
    throw new Error(`Seed whitelist hỏng: ${response.status} ${await response.text()}`)
  }
}

async function objectExists(path: string): Promise<boolean> {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`, {
    method: 'HEAD',
  })
  return response.ok
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Azure Speech. Giữ đúng định dạng và tốc độ mà Edge Function dùng. */
async function synthesize(clip: Clip): Promise<Uint8Array> {
  const percent = Math.round((clip.rate - 1) * 100)
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">` +
    `<voice name="${clip.voice}"><prosody rate="${percent >= 0 ? '+' : ''}${percent}%">` +
    `${escapeXml(clip.text)}</prosody></voice></speak>`

  const response = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'chinese-learning-app-prewarm',
      },
      body: ssml,
    },
  )

  if (!response.ok) {
    throw new Error(`Azure trả ${response.status}: ${await response.text()}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

async function upload(path: string, bytes: Uint8Array): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${AUDIO_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      ...serviceHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': '31536000, immutable',
      'x-upsert': 'true',
    },
    body: bytes,
  })

  if (!response.ok) {
    throw new Error(`Upload hỏng: ${response.status} ${await response.text()}`)
  }
}

async function main(): Promise<void> {
  const clips = await collectClips()
  const characters = clips.reduce((total, clip) => total + clip.text.length, 0)

  console.log(`${clips.length} chuỗi, ${characters} ký tự tiếng Trung.`)

  if (DRY_RUN) {
    for (const clip of clips.slice(0, 5)) {
      console.log(`  ${clip.text.padEnd(12)} ${clip.source.padEnd(8)} ${audioPath(clip.hash)}`)
    }
    console.log(`  … và ${Math.max(0, clips.length - 5)} chuỗi nữa.`)
    console.log('\nDry run: chưa chạm tới Supabase hay Azure.')
    return
  }

  requireEnv()

  console.log('Nạp whitelist…')
  await seedWhitelist(clips)

  let created = 0
  let skipped = 0

  for (const clip of clips) {
    const path = audioPath(clip.hash)

    if (await objectExists(path)) {
      skipped += 1
      continue
    }

    const bytes = await synthesize(clip)
    await upload(path, bytes)
    created += 1
    console.log(`  + ${clip.text}  (${bytes.byteLength} byte)`)
  }

  console.log(`\nXong. Sinh mới ${created}, đã có sẵn ${skipped}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
