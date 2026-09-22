import type { Choice, ChoiceExercise, Exercise, MatchingExercise, Word } from '../types'

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

/**
 * Sinh bộ bài tập cho một lesson: mỗi từ một câu, xoay vòng qua 3 dạng chọn đáp án,
 * rồi khép lại bằng một bài ghép nối.
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
  const kinds: ChoiceExercise['kind'][] = ['multiple-choice', 'pinyin', 'listening']

  const exercises: Exercise[] = words.map((word, index) => {
    const kind = kinds[index % kinds.length]
    switch (kind) {
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

/** Phân biệt bài chọn đáp án với bài ghép nối. */
export function isChoiceExercise(exercise: Exercise): exercise is ChoiceExercise {
  return exercise.kind !== 'matching'
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

/** Nhãn tiếng Việt của từng dạng bài tập, dùng cho tiêu đề màn hình. */
export const KIND_LABEL: Record<Exercise['kind'], string> = {
  'multiple-choice': 'Trắc nghiệm',
  pinyin: 'Pinyin',
  listening: 'Nghe',
  matching: 'Ghép nối',
}
