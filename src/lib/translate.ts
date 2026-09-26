/**
 * Dịch hai chiều Việt ⇄ Trung — xem `docs/translate.md`.
 *
 * Hai nguồn, thử lần lượt:
 *
 * 1. **Khoá học.** 60 từ và 180 câu mẫu, tra theo nghĩa tiếng Việt (chiều Việt →
 *    Trung) hoặc theo chữ Hán (chiều Trung → Việt). Tra ngay trên máy, không cần
 *    mạng, pinyin do người soạn, audio thu sẵn bằng Piper.
 * 2. **Google Dịch**, qua đúng endpoint mà tiện ích từ điển của Chrome dùng. Trả
 *    cả bản dịch lẫn pinyin của phía tiếng Trung, và mở CORS nên gọi thẳng từ
 *    trình duyệt được — app không có máy chủ nào để đứng giữa.
 *
 * Endpoint đó không phải API chính thức: không cần khoá, không tốn tiền, nhưng
 * Google có thể đổi hay chặn bất cứ lúc nào. Mọi chỗ chạm tới nó nằm trong
 * `translateWithGoogle`, đổi nguồn thì chỉ sửa một hàm. Vì sao không dùng các
 * dịch vụ miễn phí khác: xem tài liệu.
 */

import { WORDS } from '../data/hsk1'
import type { ExampleSentence, Word } from '../types'
import { audioUrlForSentence } from './audioFiles'

/** Chiều dịch. */
export type Direction = 'vi-zh' | 'zh-vi'

export type TranslationSource = 'course' | 'google'

/**
 * Một cặp câu Việt – Trung. Chiều nào cũng có đủ hai phía, để giao diện hiện
 * chữ Hán kèm pinyin và phát âm tiếng Trung bất kể người học dịch theo chiều nào.
 */
export interface Translation {
  direction: Direction
  source: TranslationSource
  /** Phía tiếng Trung: bản dịch (Việt → Trung) hoặc chữ người học đưa vào (Trung → Việt). */
  hanzi: string
  /** Pinyin của phía tiếng Trung; null khi nguồn không trả. */
  pinyin: string | null
  /**
   * Phía tiếng Việt: chữ người học đưa vào hoặc bản dịch. Tìm thấy trong khoá
   * học thì là nghĩa đúng như khoá học viết.
   */
  vietnamese: string
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
export type TranslateFailure =
  | 'empty'
  | 'too-long'
  /** Chiều Trung → Việt mà không có chữ Hán nào — gõ pinyin thì Google đọc không ra. */
  | 'not-chinese'
  /** Chiều Việt → Trung mà lại gõ chữ Hán — nhiều khả năng quên đổi chiều. */
  | 'looks-chinese'
  | 'offline'
  | 'blocked'
  | 'failed'

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

/** Có chữ Hán nào không. */
export function hasHanzi(text: string): boolean {
  return /\p{Script=Han}/u.test(text)
}

/** Chiều ngược lại. */
export function flip(direction: Direction): Direction {
  return direction === 'vi-zh' ? 'zh-vi' : 'vi-zh'
}

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

/** Bỏ dấu câu và khoảng trắng, để "你好！" và "你好" là một. */
function hanziKey(text: string): string {
  return text.replace(/[\s\p{P}]/gu, '')
}

/** Các nghĩa của một từ: "tốt, khoẻ" → ["tốt", "khoẻ"]; bỏ chú thích trong ngoặc. */
function senses(meaning: string): string[] {
  return meaning
    .replace(/\([^)]*\)/g, '')
    .split(/[,;/]/)
    .map((sense) => sense.trim())
    .filter(Boolean)
}

function fromWord(word: Word, direction: Direction): Translation {
  return {
    direction,
    source: 'course',
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    vietnamese: word.meaning,
    wordId: word.id,
  }
}

function fromSentence(sentence: ExampleSentence, direction: Direction): Translation {
  return {
    direction,
    source: 'course',
    hanzi: sentence.hanzi,
    pinyin: sentence.pinyin,
    vietnamese: sentence.meaning,
    clipUrl: audioUrlForSentence(sentence),
  }
}

type CourseIndex = Map<string, Translation[]>
const courseIndexes: Partial<Record<Direction, CourseIndex>> = {}

/**
 * Bảng tra khoá học của một chiều, dựng một lần khi cần tới: chiều Việt →
 * Trung tra theo nghĩa, chiều Trung → Việt tra theo chữ Hán. Từ trước, câu sau:
 * gõ đúng một từ thì ra đúng từ đó.
 */
function getCourseIndex(direction: Direction): CourseIndex {
  const cached = courseIndexes[direction]
  if (cached) return cached

  const index: CourseIndex = new Map()
  const add = (key: string, entry: Translation) => {
    if (!key) return
    const entries = index.get(key) ?? []
    if (!entries.some((existing) => existing.hanzi === entry.hanzi)) index.set(key, [...entries, entry])
  }

  for (const word of WORDS) {
    const entry = fromWord(word, direction)
    if (direction === 'zh-vi') {
      add(hanziKey(word.hanzi), entry)
    } else {
      add(matchKey(word.meaning), entry)
      for (const sense of senses(word.meaning)) add(matchKey(sense), entry)
    }
  }
  for (const word of WORDS) {
    for (const sentence of word.examples) {
      const entry = fromSentence(sentence, direction)
      add(direction === 'zh-vi' ? hanziKey(sentence.hanzi) : matchKey(sentence.meaning), entry)
    }
  }

  courseIndexes[direction] = index
  return index
}

/**
 * Tìm trong khoá học; null nếu khoá học không có đúng chữ này. Nhiều mục cùng
 * khớp thì mục đứng trước trong khoá học là bản chính, còn lại ở `alternatives`.
 */
export function lookupCourse(text: string, direction: Direction = 'vi-zh'): Translation | null {
  const key = direction === 'zh-vi' ? hanziKey(text) : matchKey(text)
  const [first, ...rest] = getCourseIndex(direction).get(key) ?? []
  if (!first) return null
  return rest.length > 0 ? { ...first, alternatives: rest } : first
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

/** Câu trả lời của Google, đã đọc ra. */
export interface GoogleAnswer {
  /** Bản dịch. */
  text: string
  /** Phiên âm của bản dịch — có khi dịch sang tiếng Trung. */
  targetRomanization: string | null
  /** Phiên âm của câu gốc — có khi câu gốc là tiếng Trung. */
  sourceRomanization: string | null
}

/**
 * Đọc câu trả lời của Google.
 *
 * Dạng `[[[bản dịch, câu gốc, …], …, [null, null, phiên âm bản dịch, phiên âm
 * câu gốc]], …]`: mỗi câu một đoạn, đoạn cuối mang phiên âm của cả hai phía.
 * Trả null nếu không có bản dịch.
 */
export function parseGoogleResponse(data: unknown): GoogleAnswer | null {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null

  let text = ''
  const target: string[] = []
  const source: string[] = []
  for (const segment of data[0]) {
    if (!Array.isArray(segment)) continue
    if (typeof segment[0] === 'string') {
      text += segment[0]
    } else if (segment[0] == null) {
      if (typeof segment[2] === 'string') target.push(segment[2])
      if (typeof segment[3] === 'string') source.push(segment[3])
    }
  }

  text = text.trim()
  if (!text) return null
  return {
    text,
    targetRomanization: target.join(' ').trim() || null,
    sourceRomanization: source.join(' ').trim() || null,
  }
}

/** Mã ngôn ngữ của Google cho từng chiều: [nguồn, đích]. */
const GOOGLE_LANGS: Record<Direction, [string, string]> = {
  'vi-zh': ['vi', 'zh-CN'],
  'zh-vi': ['zh-CN', 'vi'],
}

/** Gọi Google Dịch. Chỗ duy nhất trong app chạm tới dịch vụ này. */
export async function translateWithGoogle(
  text: string,
  direction: Direction,
  fetchImpl: typeof fetch,
): Promise<GoogleAnswer> {
  const [from, to] = GOOGLE_LANGS[direction]
  const params = new URLSearchParams([
    ['client', 'dict-chrome-ex'],
    ['sl', from],
    ['tl', to],
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

/** Bản dịch đã có trong lượt dùng này — dịch lại câu cũ thì khỏi gọi mạng. */
const cache = new Map<string, Translation>()
const CACHE_LIMIT = 100

/** Xoá bộ nhớ bản dịch — cho test. */
export function clearTranslationCache(): void {
  cache.clear()
}

/**
 * Dịch một chữ, một cụm hay một câu theo chiều đã chọn.
 *
 * @throws TranslateError kèm lý do để giao diện nói đúng chuyện gì xảy ra.
 */
export async function translate(
  input: string,
  options: { direction?: Direction; fetch?: typeof fetch } = {},
): Promise<Translation> {
  const direction = options.direction ?? 'vi-zh'
  const text = input.trim().replace(/\s+/g, ' ')
  if (!text) throw new TranslateError('empty')
  if (text.length > MAX_INPUT_LENGTH) throw new TranslateError('too-long')
  if (direction === 'zh-vi' && !hasHanzi(text)) throw new TranslateError('not-chinese')
  if (direction === 'vi-zh' && hasHanzi(text)) throw new TranslateError('looks-chinese')

  const course = lookupCourse(text, direction)
  if (course) return course

  const key = `${direction}:${matchKey(text)}`
  const cached = cache.get(key)
  if (cached) return cached

  if (isOffline()) throw new TranslateError('offline')

  const answer = await translateWithGoogle(text, direction, options.fetch ?? globalThis.fetch)
  const translation: Translation =
    direction === 'vi-zh'
      ? {
          direction,
          source: 'google',
          hanzi: answer.text,
          pinyin: answer.targetRomanization,
          vietnamese: text,
          ...recordedAudioFor(answer.text),
        }
      : {
          direction,
          source: 'google',
          hanzi: text,
          pinyin: answer.sourceRomanization,
          vietnamese: answer.text,
          ...recordedAudioFor(text),
        }

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(key, translation)
  return translation
}
