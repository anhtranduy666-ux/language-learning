/**
 * Dịch tiếng Việt sang tiếng Trung — xem `docs/translate.md`.
 *
 * Hai nguồn, thử lần lượt:
 *
 * 1. **Khoá học.** Nghĩa tiếng Việt của 60 từ và 180 câu mẫu. Tra ngay trên máy,
 *    không cần mạng, pinyin do người soạn, audio thu sẵn bằng Piper.
 * 2. **Google Dịch**, qua đúng endpoint mà tiện ích từ điển của Chrome dùng. Trả
 *    cả chữ Hán lẫn pinyin, và mở CORS nên gọi thẳng từ trình duyệt được — app
 *    không có máy chủ nào để đứng giữa.
 *
 * Endpoint đó không phải API chính thức: không cần khoá, không tốn tiền, nhưng
 * Google có thể đổi hay chặn bất cứ lúc nào. Mọi chỗ chạm tới nó nằm trong
 * `translateWithGoogle`, đổi nguồn thì chỉ sửa một hàm. Vì sao không dùng các
 * dịch vụ miễn phí khác: xem tài liệu.
 */

import { WORDS } from '../data/hsk1'
import type { ExampleSentence, Word } from '../types'
import { audioUrlForSentence } from './audioFiles'

export type TranslationSource = 'course' | 'google'

export interface Translation {
  /** Chữ Hán. */
  hanzi: string
  /** Pinyin có dấu thanh; null khi nguồn không trả. */
  pinyin: string | null
  source: TranslationSource
  /** Nghĩa tiếng Việt đúng như trong khoá học — chỉ có khi tìm thấy trong khoá học. */
  courseMeaning?: string
  /** Id của từ, để phát file thu sẵn. */
  wordId?: string
  /** File thu sẵn cho đúng câu này. */
  clipUrl?: string | null
  /**
   * Từ khác trong khoá học cũng mang đúng nghĩa đã gõ — "năm" là 五 mà cũng là
   * 年. Tiếng Việt nhập nhằng thì cho người học thấy hết, đừng chọn thầm một.
   */
  alternatives?: Translation[]
}

/** Lý do không dịch được. */
export type TranslateFailure = 'empty' | 'too-long' | 'offline' | 'blocked' | 'failed'

export class TranslateError extends Error {
  readonly reason: TranslateFailure

  constructor(reason: TranslateFailure) {
    super(reason)
    this.name = 'TranslateError'
    this.reason = reason
  }
}

/** Đủ cho một câu dài; ô nhập cũng chặn ở mốc này. */
export const MAX_INPUT_LENGTH = 200

/** Quá mốc này thì coi như mạng hỏng, đừng để người học chờ mãi. */
const TIMEOUT_MS = 8000

export const GOOGLE_ENDPOINT = 'https://clients5.google.com/translate_a/single'

/** Năm dấu thanh tiếng Việt, ở dạng ký tự tổ hợp: huyền, sắc, ngã, hỏi, nặng. */
const TONE_MARKS = /[̣̀́̃̉]/g

/**
 * Khoá để so hai chuỗi tiếng Việt: không phân biệt hoa thường, dấu câu, dấu
 * ngoặc, và **chỗ đặt dấu thanh**.
 *
 * Tiếng Việt có hai lối bỏ dấu: khoá học viết "khoẻ", nhiều người gõ "khỏe".
 * Tách dấu thanh của từng tiếng ra rồi gắn về cuối tiếng thì hai lối thành
 * một, mà "bạn" với "bán" vẫn khác nhau.
 */
export function matchKey(text: string): string {
  return text
    .normalize('NFD')
    .toLowerCase()
    .replace(/[“”"‘’'«»()[\]]/g, ' ')
    .replace(/[.,!?;:…。，！？、~-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const tone = word.match(TONE_MARKS)?.[0] ?? ''
      return word.replace(TONE_MARKS, '') + tone
    })
    .join(' ')
}

/** Các nghĩa của một từ: "tốt, khoẻ" → ["tốt", "khoẻ"]; bỏ chú thích trong ngoặc. */
function senses(meaning: string): string[] {
  return meaning
    .replace(/\([^)]*\)/g, '')
    .split(/[,;/]/)
    .map((sense) => sense.trim())
    .filter(Boolean)
}

function fromWord(word: Word): Translation {
  return { hanzi: word.hanzi, pinyin: word.pinyin, source: 'course', courseMeaning: word.meaning, wordId: word.id }
}

function fromSentence(sentence: ExampleSentence): Translation {
  return {
    hanzi: sentence.hanzi,
    pinyin: sentence.pinyin,
    source: 'course',
    courseMeaning: sentence.meaning,
    clipUrl: audioUrlForSentence(sentence),
  }
}

let courseIndex: Map<string, Translation[]> | null = null

/** Bảng tra nghĩa tiếng Việt → các mục trong khoá học, dựng một lần khi cần tới. */
function getCourseIndex(): Map<string, Translation[]> {
  if (courseIndex) return courseIndex
  const index = new Map<string, Translation[]>()
  const add = (text: string, entry: Translation) => {
    const key = matchKey(text)
    if (!key) return
    const entries = index.get(key) ?? []
    if (!entries.some((existing) => existing.hanzi === entry.hanzi)) index.set(key, [...entries, entry])
  }

  // Từ trước, câu sau: gõ đúng một nghĩa của từ thì ra đúng từ đó.
  for (const word of WORDS) {
    const entry = fromWord(word)
    add(word.meaning, entry)
    for (const sense of senses(word.meaning)) add(sense, entry)
  }
  for (const word of WORDS) {
    for (const sentence of word.examples) add(sentence.meaning, fromSentence(sentence))
  }

  courseIndex = index
  return index
}

/**
 * Tìm trong khoá học; null nếu khoá học không có đúng chữ này. Nhiều từ cùng
 * nghĩa thì từ đứng trước trong khoá học là bản chính, các từ còn lại nằm ở
 * `alternatives`.
 */
export function lookupCourse(text: string): Translation | null {
  const [first, ...rest] = getCourseIndex().get(matchKey(text)) ?? []
  if (!first) return null
  return rest.length > 0 ? { ...first, alternatives: rest } : first
}

/** Bỏ dấu câu và khoảng trắng, để "你好！" và "你好" là một. */
function hanziKey(text: string): string {
  return text.replace(/[\s\p{P}]/gu, '')
}

let recordedIndex: Map<string, Pick<Translation, 'wordId' | 'clipUrl'>> | null = null

/**
 * File thu sẵn cho một chuỗi chữ Hán, nếu khoá học có đúng chuỗi đó.
 *
 * Google dịch "xin chào" ra 你好 — đúng chữ đã có file Piper, nghe hay hơn
 * giọng đọc của máy nhiều.
 */
function recordedAudioFor(hanzi: string): Pick<Translation, 'wordId' | 'clipUrl'> {
  if (!recordedIndex) {
    recordedIndex = new Map()
    for (const word of WORDS) {
      recordedIndex.set(hanziKey(word.hanzi), { wordId: word.id })
      for (const sentence of word.examples) {
        const key = hanziKey(sentence.hanzi)
        if (!recordedIndex.has(key)) recordedIndex.set(key, { clipUrl: audioUrlForSentence(sentence) })
      }
    }
  }
  return recordedIndex.get(hanziKey(hanzi)) ?? {}
}

/**
 * Đọc câu trả lời của Google.
 *
 * Dạng `[[[bản dịch, câu gốc, …], …, [null, null, pinyin]], …]`: mỗi câu một
 * đoạn, đoạn cuối mang pinyin của cả bản dịch. Trả null nếu không có bản dịch.
 */
export function parseGoogleResponse(data: unknown): { hanzi: string; pinyin: string | null } | null {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null

  let hanzi = ''
  const pinyin: string[] = []
  for (const segment of data[0]) {
    if (!Array.isArray(segment)) continue
    if (typeof segment[0] === 'string') hanzi += segment[0]
    else if (segment[0] == null && typeof segment[2] === 'string') pinyin.push(segment[2])
  }

  hanzi = hanzi.trim()
  if (!hanzi) return null
  return { hanzi, pinyin: pinyin.join(' ').trim() || null }
}

/** Gọi Google Dịch. Chỗ duy nhất trong app chạm tới dịch vụ này. */
export async function translateWithGoogle(
  text: string,
  fetchImpl: typeof fetch,
): Promise<{ hanzi: string; pinyin: string | null }> {
  const params = new URLSearchParams([
    ['client', 'dict-chrome-ex'],
    ['sl', 'vi'],
    ['tl', 'zh-CN'],
    ['dt', 't'],
    ['dt', 'rm'],
    ['q', text],
  ])

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetchImpl(`${GOOGLE_ENDPOINT}?${params}`, { signal: controller.signal })
  } catch {
    throw new TranslateError(isOffline() ? 'offline' : 'failed')
  } finally {
    clearTimeout(timer)
  }

  // 429 và 403 là Google đang chặn vì gọi dồn dập — khác với hỏng hẳn.
  if (response.status === 429 || response.status === 403) throw new TranslateError('blocked')
  if (!response.ok) throw new TranslateError('failed')

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new TranslateError('failed')
  }

  const parsed = parseGoogleResponse(data)
  if (!parsed) throw new TranslateError('failed')
  return parsed
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/** Bản dịch đã có trong lượt dùng này — gõ lại câu cũ thì khỏi gọi mạng. */
const cache = new Map<string, Translation>()
const CACHE_LIMIT = 100

/** Xoá bộ nhớ bản dịch — cho test. */
export function clearTranslationCache(): void {
  cache.clear()
}

/**
 * Dịch một chữ, một cụm hay một câu tiếng Việt sang tiếng Trung.
 *
 * @throws TranslateError kèm lý do để giao diện nói đúng chuyện gì xảy ra.
 */
export async function translate(
  input: string,
  deps: { fetch?: typeof fetch } = {},
): Promise<Translation> {
  const text = input.trim().replace(/\s+/g, ' ')
  if (!text) throw new TranslateError('empty')
  if (text.length > MAX_INPUT_LENGTH) throw new TranslateError('too-long')

  const course = lookupCourse(text)
  if (course) return course

  const key = matchKey(text)
  const cached = cache.get(key)
  if (cached) return cached

  if (isOffline()) throw new TranslateError('offline')

  const result = await translateWithGoogle(text, deps.fetch ?? globalThis.fetch)
  const translation: Translation = { ...result, source: 'google', ...recordedAudioFor(result.hanzi) }

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(key, translation)
  return translation
}
