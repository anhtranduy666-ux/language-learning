import { describe, expect, it } from 'vitest'
import { WORDS, wordsOfLesson } from '../data/hsk1'
import type { ChoiceExercise, MatchingExercise } from '../types'
import {
  buildExercises,
  buildMatchingExercise,
  createRng,
  gradeChoice,
  gradeMatching,
  isChoiceExercise,
  shuffle,
} from './exercises'

const LESSON_WORDS = wordsOfLesson('u1l1')

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

  it('dùng đủ cả bốn dạng bài tập của Version 2', () => {
    const kinds = new Set(buildExercises(LESSON_WORDS, WORDS, createRng(1)).map((e) => e.kind))
    expect(kinds).toEqual(new Set(['multiple-choice', 'pinyin', 'listening', 'matching']))
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
  it('phân biệt đúng hai nhóm bài tập', () => {
    const exercises = buildExercises(LESSON_WORDS, WORDS, createRng(1))
    const matching = exercises.filter((e) => !isChoiceExercise(e))
    expect(matching).toHaveLength(1)
    expect(matching[0].kind).toBe('matching')
  })
})
