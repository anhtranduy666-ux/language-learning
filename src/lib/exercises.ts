import type {
  Choice,
  ChoiceExercise,
  DictationExercise,
  Exercise,
  MatchingExercise,
  SentenceExercise,
  Word,
} from '../types'
import { EXTRA_LEXICON, tokenizeChinese } from './chinese'
import { matchesPinyin } from './pinyin'

/**
 * Bộ sinh số giả ngẫu nhiên có seed (mulberry32).
 * Dùng seed để bài tập sinh ra ổn định và kiểm thử được, thay vì Math.random.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Biến một chuỗi thành seed số (FNV-1a).
 * Nhờ vậy mỗi lesson luôn sinh ra đúng một bộ câu hỏi, lần học lại vẫn như cũ.
 */
export function seedFromText(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Trộn mảng, không làm thay đổi mảng gốc (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Chọn `count` từ nhiễu khác với `word`.
 * Loại bỏ những từ trùng đáp án hiển thị để không có hai lựa chọn giống hệt nhau.
 */
function pickDistractors(
  word: Word,
  pool: readonly Word[],
  count: number,
  label: (word: Word) => string,
  rng: () => number,
): Word[] {
  const answer = label(word)
  const seen = new Set([answer])
  const candidates = shuffle(pool, rng).filter((candidate) => {
    if (candidate.id === word.id) return false
    const value = label(candidate)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
  return candidates.slice(0, count)
}

function buildChoiceExercise(
  word: Word,
  pool: readonly Word[],
  kind: ChoiceExercise['kind'],
  prompt: string,
  label: (word: Word) => string,
  rng: () => number,
): ChoiceExercise {
  const distractors = pickDistractors(word, pool, 3, label, rng)
  const correctChoiceId = `c-${word.id}`
  const choices: Choice[] = shuffle(
    [
      { id: correctChoiceId, label: label(word) },
      ...distractors.map((item) => ({ id: `c-${item.id}`, label: label(item) })),
    ],
    rng,
  )

  return { id: `${kind}-${word.id}`, kind, wordId: word.id, prompt, choices, correctChoiceId }
}

/** Bài ghép Hanzi với nghĩa, mặc định 4 cặp. */
export function buildMatchingExercise(
  words: readonly Word[],
  rng: () => number,
  pairs = 4,
): MatchingExercise | null {
  const chosen = shuffle(words, rng).slice(0, Math.min(pairs, words.length))
  if (chosen.length < 2) return null

  const left: Choice[] = chosen.map((word) => ({ id: `l-${word.id}`, label: word.hanzi }))
  const right: Choice[] = shuffle(
    chosen.map((word) => ({ id: `r-${word.id}`, label: word.meaning })),
    rng,
  )
  const answerKey = Object.fromEntries(chosen.map((word) => [`l-${word.id}`, `r-${word.id}`]))

  return { id: 'matching', kind: 'matching', prompt: 'Ghép chữ Hán với nghĩa đúng', left, right, answerKey }
}

/** Câu ngắn hơn thế này thì ghép chẳng có gì để nghĩ; dài hơn thì quá sức người mới. */
export const SENTENCE_MIN_TILES = 3
export const SENTENCE_MAX_TILES = 7

/** Số mảnh nhiễu trộn vào bài ghép câu, để không thể bấm bừa theo thứ tự còn lại. */
export const SENTENCE_DISTRACTORS = 2

/**
 * Bài ghép câu từ câu ví dụ của một từ.
 *
 * Trả `null` khi câu quá ngắn hoặc quá dài — nơi gọi sẽ thay bằng dạng bài khác
 * thay vì đưa ra một câu ghép hai mảnh chẳng dạy được gì.
 *
 * Mảnh nhiễu là những từ khác trong khoá, không trùng chữ nào với câu đúng: một
 * mảnh nhiễu trùng chữ với đáp án sẽ làm câu có hai cách ghép đều đúng.
 */
export function buildSentenceExercise(
  word: Word,
  pool: readonly Word[],
  lexicon: readonly string[],
  rng: () => number,
): SentenceExercise | null {
  const pieces = tokenizeChinese(word.example, lexicon)
  if (pieces.length < SENTENCE_MIN_TILES || pieces.length > SENTENCE_MAX_TILES) return null

  const inAnswer = new Set(pieces)
  const answerChars = new Set(pieces.join(''))
  const distractors = shuffle(pool, rng)
    .map((item) => item.hanzi)
    .filter((hanzi, index, all) => all.indexOf(hanzi) === index)
    .filter((hanzi) => !inAnswer.has(hanzi) && ![...hanzi].some((char) => answerChars.has(char)))
    .slice(0, SENTENCE_DISTRACTORS)

  // Id theo vị trí chứ không theo chữ: một câu có thể có hai mảnh giống hệt
  // nhau, ví dụ hai chữ 我, và người học phải bấm được cả hai.
  const tiles: Choice[] = shuffle(
    [...pieces, ...distractors].map((label, index) => ({ id: `t${index}`, label })),
    rng,
  )

  return {
    id: `sentence-${word.id}`,
    kind: 'sentence',
    wordId: word.id,
    prompt: 'Sắp xếp thành câu đúng',
    meaning: word.exampleMeaning,
    answer: pieces.join(''),
    pieces,
    tiles,
  }
}

/** Bài nghe một từ rồi viết lại bằng pinyin. */
export function buildDictationExercise(word: Word): DictationExercise {
  return {
    id: `dictation-${word.id}`,
    kind: 'dictation',
    wordId: word.id,
    prompt: 'Nghe rồi viết lại bằng pinyin',
    answer: word.pinyin,
    meaning: word.meaning,
    hanzi: word.hanzi,
  }
}

/** Các dạng bài xoay vòng theo từng từ của bài học. */
const ROTATION = ['multiple-choice', 'pinyin', 'listening', 'sentence', 'dictation'] as const

/**
 * Sinh bộ bài tập cho một lesson: mỗi từ một câu, xoay vòng qua năm dạng,
 * rồi khép lại bằng một bài ghép nối.
 *
 * Câu ví dụ nào quá ngắn để ghép thì từ đó được hỏi bằng trắc nghiệm thay vào.
 *
 * `pool` là kho từ để lấy đáp án nhiễu — thường là toàn bộ từ vựng của khoá học.
 */
export function buildExercises(
  words: readonly Word[],
  pool: readonly Word[],
  rng: () => number = createRng(1),
): Exercise[] {
  if (words.length === 0) return []

  const distractorPool = pool.length >= 4 ? pool : words
  const lexicon = [...pool.map((word) => word.hanzi), ...EXTRA_LEXICON]

  const multipleChoice = (word: Word) =>
    buildChoiceExercise(
      word,
      distractorPool,
      'multiple-choice',
      `"${word.hanzi}" nghĩa là gì?`,
      (item) => item.meaning,
      rng,
    )

  const exercises: Exercise[] = words.map((word, index) => {
    const kind = ROTATION[index % ROTATION.length]
    switch (kind) {
      case 'sentence':
        return buildSentenceExercise(word, distractorPool, lexicon, rng) ?? multipleChoice(word)
      case 'dictation':
        return buildDictationExercise(word)
      case 'multiple-choice':
        return buildChoiceExercise(
          word,
          distractorPool,
          kind,
          `"${word.hanzi}" nghĩa là gì?`,
          (item) => item.meaning,
          rng,
        )
      case 'pinyin':
        return buildChoiceExercise(
          word,
          distractorPool,
          kind,
          `Pinyin của "${word.hanzi}" là gì?`,
          (item) => item.pinyin,
          rng,
        )
      case 'listening':
        return buildChoiceExercise(
          word,
          distractorPool,
          kind,
          'Nghe và chọn từ bạn vừa nghe',
          (item) => item.hanzi,
          rng,
        )
    }
  })

  const matching = buildMatchingExercise(words, rng)
  return matching ? [...exercises, matching] : exercises
}

/** Bài chọn một đáp án: trắc nghiệm nghĩa, chọn pinyin, hoặc nghe rồi chọn. */
export function isChoiceExercise(exercise: Exercise): exercise is ChoiceExercise {
  return (
    exercise.kind === 'multiple-choice' || exercise.kind === 'pinyin' || exercise.kind === 'listening'
  )
}

/** Chấm một bài chọn đáp án. */
export function gradeChoice(exercise: ChoiceExercise, choiceId: string): boolean {
  return exercise.correctChoiceId === choiceId
}

/** Chấm một bài ghép nối: đúng khi mọi cặp đều khớp. */
export function gradeMatching(
  exercise: MatchingExercise,
  answers: Record<string, string>,
): boolean {
  const keys = Object.keys(exercise.answerKey)
  return keys.every((leftId) => answers[leftId] === exercise.answerKey[leftId])
}

/**
 * Chấm bài ghép câu: đúng khi các mảnh ghép lại ra đúng câu.
 *
 * So theo chữ chứ không theo id, vì câu có thể có hai mảnh giống hệt nhau —
 * bấm chữ 我 thứ nhất hay thứ hai trước thì câu vẫn là một.
 */
export function gradeSentence(exercise: SentenceExercise, pickedIds: readonly string[]): boolean {
  const labelOf = new Map(exercise.tiles.map((tile) => [tile.id, tile.label]))
  return pickedIds.map((id) => labelOf.get(id) ?? '').join('') === exercise.answer
}

/** Chấm bài nghe–viết. Không bắt gõ dấu thanh — xem `src/lib/pinyin.ts`. */
export function gradeDictation(exercise: DictationExercise, input: string): boolean {
  return matchesPinyin(input, exercise.answer)
}

/** Nhãn tiếng Việt của từng dạng bài tập, dùng cho tiêu đề màn hình. */
export const KIND_LABEL: Record<Exercise['kind'], string> = {
  'multiple-choice': 'Trắc nghiệm',
  pinyin: 'Pinyin',
  listening: 'Nghe',
  matching: 'Ghép nối',
  sentence: 'Ghép câu',
  dictation: 'Nghe và viết',
}
