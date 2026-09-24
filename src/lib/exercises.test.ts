import { describe, expect, it } from 'vitest'
import { WORDS, wordsOfLesson } from '../data/hsk1'
import type { ChoiceExercise, MatchingExercise, SentenceExercise, Word } from '../types'
import { EXTRA_LEXICON, stripPunctuation } from './chinese'
import {
  SENTENCE_DISTRACTORS,
  SENTENCE_MAX_TILES,
  SENTENCE_MIN_TILES,
  buildDictationExercise,
  buildExercises,
  buildMatchingExercise,
  buildSentenceExercise,
  createRng,
  gradeChoice,
  gradeDictation,
  gradeMatching,
  gradeSentence,
  isChoiceExercise,
  seedFromText,
  shuffle,
} from './exercises'

const LESSON_WORDS = wordsOfLesson('u1l1')

const LESSON_IDS = ['u1l1', 'u1l2', 'u2l1', 'u2l2', 'u3l1', 'u3l2', 'u4l1', 'u4l2', 'u5l1', 'u5l2']

describe('createRng', () => {
  it('cùng seed cho cùng chuỗi số', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('seed khác cho chuỗi khác', () => {
    const a = createRng(1)
    const b = createRng(2)
    expect(a()).not.toBe(b())
  })

  it('luôn nằm trong khoảng [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('seedFromText', () => {
  it('cùng chuỗi cho cùng seed', () => {
    expect(seedFromText('u1l1')).toBe(seedFromText('u1l1'))
  })

  it('chuỗi khác cho seed khác', () => {
    expect(seedFromText('u1l1')).not.toBe(seedFromText('u1l2'))
  })

  it('luôn là số nguyên không âm', () => {
    for (const id of ['', 'u1l1', 'một chuỗi tiếng Việt dài']) {
      const seed = seedFromText(id)
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('shuffle', () => {
  it('giữ nguyên mảng gốc', () => {
    const original = [1, 2, 3, 4, 5]
    shuffle(original, createRng(3))
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('giữ nguyên tập phần tử', () => {
    const result = shuffle([1, 2, 3, 4, 5], createRng(3))
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('buildExercises', () => {
  it('trả về mảng rỗng khi không có từ nào', () => {
    expect(buildExercises([], WORDS, createRng(1))).toEqual([])
  })

  it('sinh một câu cho mỗi từ, cộng thêm một bài ghép nối', () => {
    const exercises = buildExercises(LESSON_WORDS, WORDS, createRng(1))
    expect(exercises).toHaveLength(LESSON_WORDS.length + 1)
  })

  it('dùng đủ cả sáu dạng bài tập', () => {
    const kinds = new Set(buildExercises(LESSON_WORDS, WORDS, createRng(1)).map((e) => e.kind))
    expect(kinds).toEqual(
      new Set(['multiple-choice', 'pinyin', 'listening', 'sentence', 'dictation', 'matching']),
    )
  })

  it('câu ví dụ quá ngắn để ghép thì thay bằng trắc nghiệm, không bỏ trống', () => {
    for (const lessonId of LESSON_IDS) {
      const words = wordsOfLesson(lessonId)
      const exercises = buildExercises(words, WORDS, createRng(seedFromText(lessonId)))

      expect(exercises, lessonId).toHaveLength(words.length + 1)
      for (const exercise of exercises) {
        if (exercise.kind === 'sentence') {
          expect(exercise.pieces.length).toBeGreaterThanOrEqual(SENTENCE_MIN_TILES)
        }
      }
    }
  })

  it('ổn định với cùng một seed', () => {
    const a = buildExercises(LESSON_WORDS, WORDS, createRng(99))
    const b = buildExercises(LESSON_WORDS, WORDS, createRng(99))
    expect(a).toEqual(b)
  })

  it('mỗi bài chọn đáp án có 4 lựa chọn', () => {
    for (const exercise of buildExercises(LESSON_WORDS, WORDS, createRng(1))) {
      if (isChoiceExercise(exercise)) expect(exercise.choices).toHaveLength(4)
    }
  })

  it('không có hai lựa chọn trùng nhãn', () => {
    for (const exercise of buildExercises(LESSON_WORDS, WORDS, createRng(5))) {
      if (!isChoiceExercise(exercise)) continue
      const labels = exercise.choices.map((choice) => choice.label)
      expect(new Set(labels).size).toBe(labels.length)
    }
  })

  it('đáp án đúng luôn nằm trong danh sách lựa chọn', () => {
    for (const exercise of buildExercises(LESSON_WORDS, WORDS, createRng(11))) {
      if (!isChoiceExercise(exercise)) continue
      const ids = exercise.choices.map((choice) => choice.id)
      expect(ids).toContain(exercise.correctChoiceId)
    }
  })

  it('đáp án đúng mang đúng nội dung của từ được hỏi', () => {
    for (const exercise of buildExercises(LESSON_WORDS, WORDS, createRng(21))) {
      if (!isChoiceExercise(exercise)) continue
      const word = LESSON_WORDS.find((item) => item.id === exercise.wordId)!
      const correct = exercise.choices.find((c) => c.id === exercise.correctChoiceId)!
      const expected = { 'multiple-choice': word.meaning, pinyin: word.pinyin, listening: word.hanzi }
      expect(correct.label).toBe(expected[exercise.kind])
    }
  })

  it('vẫn chạy được khi kho từ nhiễu quá nhỏ', () => {
    const tiny = LESSON_WORDS.slice(0, 2)
    const exercises = buildExercises(tiny, tiny, createRng(1))
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('không tự lấy chính từ đang hỏi làm đáp án nhiễu', () => {
    for (const exercise of buildExercises(LESSON_WORDS, WORDS, createRng(33))) {
      if (!isChoiceExercise(exercise)) continue
      const wrongIds = exercise.choices
        .filter((choice) => choice.id !== exercise.correctChoiceId)
        .map((choice) => choice.id)
      expect(wrongIds).not.toContain(`c-${exercise.wordId}`)
    }
  })
})

describe('buildMatchingExercise', () => {
  it('ghép 4 cặp khi đủ từ', () => {
    const exercise = buildMatchingExercise(LESSON_WORDS, createRng(1))!
    expect(exercise.left).toHaveLength(4)
    expect(exercise.right).toHaveLength(4)
    expect(Object.keys(exercise.answerKey)).toHaveLength(4)
  })

  it('trả về null khi không đủ từ để ghép', () => {
    expect(buildMatchingExercise(LESSON_WORDS.slice(0, 1), createRng(1))).toBeNull()
  })

  it('mỗi vế trái khớp đúng một vế phải có thật', () => {
    const exercise = buildMatchingExercise(LESSON_WORDS, createRng(2))!
    const rightIds = new Set(exercise.right.map((choice) => choice.id))
    for (const [leftId, rightId] of Object.entries(exercise.answerKey)) {
      expect(exercise.left.some((choice) => choice.id === leftId)).toBe(true)
      expect(rightIds.has(rightId)).toBe(true)
    }
  })
})

describe('gradeChoice', () => {
  const exercise = buildExercises(LESSON_WORDS, WORDS, createRng(1)).find(
    isChoiceExercise,
  ) as ChoiceExercise

  it('chấm đúng khi chọn đáp án đúng', () => {
    expect(gradeChoice(exercise, exercise.correctChoiceId)).toBe(true)
  })

  it('chấm sai khi chọn đáp án khác', () => {
    const wrong = exercise.choices.find((c) => c.id !== exercise.correctChoiceId)!
    expect(gradeChoice(exercise, wrong.id)).toBe(false)
  })

  it('chấm sai khi chưa chọn gì', () => {
    expect(gradeChoice(exercise, '')).toBe(false)
  })
})

describe('gradeMatching', () => {
  const exercise = buildMatchingExercise(LESSON_WORDS, createRng(1)) as MatchingExercise

  it('đúng khi ghép trọn vẹn', () => {
    expect(gradeMatching(exercise, exercise.answerKey)).toBe(true)
  })

  it('sai khi còn cặp bỏ trống', () => {
    const partial = { ...exercise.answerKey }
    delete partial[Object.keys(partial)[0]]
    expect(gradeMatching(exercise, partial)).toBe(false)
  })

  it('sai khi có một cặp ghép nhầm', () => {
    const keys = Object.keys(exercise.answerKey)
    const wrong = { ...exercise.answerKey, [keys[0]]: exercise.answerKey[keys[1]] }
    expect(gradeMatching(exercise, wrong)).toBe(false)
  })

  it('sai khi chưa ghép gì', () => {
    expect(gradeMatching(exercise, {})).toBe(false)
  })
})

describe('isChoiceExercise', () => {
  it('chỉ ba dạng chọn đáp án mới được coi là bài chọn đáp án', () => {
    const exercises = buildExercises(LESSON_WORDS, WORDS, createRng(1))
    const others = exercises.filter((e) => !isChoiceExercise(e)).map((e) => e.kind)
    expect(new Set(others)).toEqual(new Set(['sentence', 'dictation', 'matching']))
  })
})

/** Một từ giả, để test ghép câu không phụ thuộc câu ví dụ thật có thể đổi sau này. */
function wordWithExample(example: string, exampleMeaning = 'nghĩa'): Word {
  return { id: 'thu', hanzi: '我', pinyin: 'wǒ', meaning: 'tôi', example, exampleMeaning }
}

const LEXICON = [...WORDS.map((word) => word.hanzi), ...EXTRA_LEXICON]

/** Id của từng mảnh theo đúng thứ tự câu, lấy mảnh chưa dùng khi có hai mảnh cùng chữ. */
function correctOrder(exercise: SentenceExercise): string[] {
  const used = new Set<string>()
  return exercise.pieces.map((piece) => {
    const tile = exercise.tiles.find((item) => item.label === piece && !used.has(item.id))!
    used.add(tile.id)
    return tile.id
  })
}

describe('buildSentenceExercise', () => {
  it('cắt câu thành đúng các từ, rồi trộn lên', () => {
    const exercise = buildSentenceExercise(wordWithExample('我是中国人。'), WORDS, LEXICON, createRng(3))!

    expect(exercise.pieces).toEqual(['我', '是', '中国', '人'])
    expect(exercise.answer).toBe('我是中国人')
    expect(exercise.tiles.map((tile) => tile.label)).toEqual(expect.arrayContaining(exercise.pieces))
  })

  it('lấy nghĩa tiếng Việt của câu làm đề bài', () => {
    const exercise = buildSentenceExercise(
      wordWithExample('我是中国人。', 'Tôi là người Trung Quốc.'),
      WORDS,
      LEXICON,
      createRng(3),
    )!

    expect(exercise.meaning).toBe('Tôi là người Trung Quốc.')
  })

  it('trộn thêm mảnh nhiễu không trùng chữ nào với câu đúng', () => {
    const exercise = buildSentenceExercise(wordWithExample('我是中国人。'), WORDS, LEXICON, createRng(3))!
    const answerChars = new Set(exercise.answer)
    const distractors = exercise.tiles.filter((tile) => !exercise.pieces.includes(tile.label))

    expect(distractors).toHaveLength(SENTENCE_DISTRACTORS)
    for (const tile of distractors) {
      expect([...tile.label].some((char) => answerChars.has(char)), tile.label).toBe(false)
    }
  })

  it('câu quá ngắn thì không ra bài ghép', () => {
    expect(buildSentenceExercise(wordWithExample('谢谢你！'), WORDS, LEXICON, createRng(1))).toBeNull()
  })

  it('câu quá dài thì không ra bài ghép', () => {
    const long = '我是你的朋友，他是我的老师，她是医生。'
    const exercise = buildSentenceExercise(wordWithExample(long), WORDS, LEXICON, createRng(1))

    expect(exercise).toBeNull()
    expect(SENTENCE_MAX_TILES).toBeLessThan(13)
  })

  it('mảnh trùng chữ vẫn có id riêng, bấm được cả hai', () => {
    const exercise = buildSentenceExercise(wordWithExample('我有我的家。'), WORDS, LEXICON, createRng(2))!
    const ids = exercise.tiles.map((tile) => tile.id)

    expect(exercise.pieces.filter((piece) => piece === '我')).toHaveLength(2)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi câu ví dụ của khoá hoặc ghép được trọn vẹn, hoặc bị loại — không câu nào mất chữ', () => {
    for (const word of WORDS) {
      const exercise = buildSentenceExercise(word, WORDS, LEXICON, createRng(1))
      if (!exercise) continue
      expect(exercise.answer, word.example).toBe(stripPunctuation(word.example).replace(/\s/g, ''))
    }
  })
})

describe('gradeSentence', () => {
  const exercise = buildSentenceExercise(wordWithExample('我是中国人。'), WORDS, LEXICON, createRng(3))!

  it('đúng thứ tự thì đúng', () => {
    expect(gradeSentence(exercise, correctOrder(exercise))).toBe(true)
  })

  it('sai thứ tự thì sai', () => {
    expect(gradeSentence(exercise, correctOrder(exercise).reverse())).toBe(false)
  })

  it('thiếu mảnh thì sai', () => {
    expect(gradeSentence(exercise, correctOrder(exercise).slice(1))).toBe(false)
  })

  it('chêm mảnh nhiễu vào thì sai', () => {
    const noise = exercise.tiles.find((tile) => !exercise.pieces.includes(tile.label))!
    expect(gradeSentence(exercise, [...correctOrder(exercise), noise.id])).toBe(false)
  })

  it('hai mảnh cùng chữ bấm cái nào trước cũng đúng', () => {
    const twice = buildSentenceExercise(wordWithExample('我有我的家。'), WORDS, LEXICON, createRng(2))!
    const order = correctOrder(twice)
    // Đổi chỗ chữ 我 thứ nhất (vị trí 0) với chữ 我 thứ hai (vị trí 2).
    const swapped = [order[2], order[1], order[0], ...order.slice(3)]

    expect(twice.pieces[0]).toBe('我')
    expect(twice.pieces[2]).toBe('我')
    expect(gradeSentence(twice, swapped)).toBe(true)
  })

  it('chưa bấm gì thì sai', () => {
    expect(gradeSentence(exercise, [])).toBe(false)
  })
})

describe('buildDictationExercise và gradeDictation', () => {
  const nihao = WORDS.find((word) => word.id === 'nihao')!
  const exercise = buildDictationExercise(nihao)

  it('giữ nguyên pinyin có dấu để chữa bài', () => {
    expect(exercise.answer).toBe('nǐ hǎo')
    expect(exercise.hanzi).toBe('你好')
    expect(exercise.meaning).toBe('xin chào')
  })

  it('không bắt gõ dấu thanh', () => {
    expect(gradeDictation(exercise, 'ni hao')).toBe(true)
    expect(gradeDictation(exercise, 'nihao')).toBe(true)
    expect(gradeDictation(exercise, 'nǐ hǎo')).toBe(true)
  })

  it('gõ sai âm thì sai', () => {
    expect(gradeDictation(exercise, 'ni hai')).toBe(false)
  })

  it('bỏ trống thì sai', () => {
    expect(gradeDictation(exercise, '   ')).toBe(false)
  })
})
