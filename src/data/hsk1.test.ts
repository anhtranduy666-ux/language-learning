import { describe, expect, it } from 'vitest'
import { ALL_LESSONS, HSK1, WORDS, WORD_BY_ID, wordsOfLesson } from './hsk1'

describe('WORDS', () => {
  it('có đủ 60 từ cho bản demo', () => {
    expect(WORDS).toHaveLength(60)
  })

  it('không có id trùng nhau', () => {
    const ids = WORDS.map((word) => word.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mỗi từ đều có đủ Hanzi, Pinyin, nghĩa và ví dụ', () => {
    for (const word of WORDS) {
      expect(word.hanzi, `${word.id} thiếu hanzi`).not.toBe('')
      expect(word.pinyin, `${word.id} thiếu pinyin`).not.toBe('')
      expect(word.meaning, `${word.id} thiếu nghĩa`).not.toBe('')
      expect(word.example, `${word.id} thiếu câu ví dụ`).not.toBe('')
      expect(word.exampleMeaning, `${word.id} thiếu nghĩa câu ví dụ`).not.toBe('')
    }
  })

  it('câu ví dụ có chứa chính từ đó', () => {
    for (const word of WORDS) {
      expect(word.example, `ví dụ của ${word.id} không chứa ${word.hanzi}`).toContain(word.hanzi)
    }
  })

  it('không có hai từ trùng cả Hanzi lẫn nghĩa', () => {
    const pairs = WORDS.map((word) => `${word.hanzi}|${word.meaning}`)
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})

describe('HSK1', () => {
  it('có 5 unit', () => {
    expect(HSK1.units).toHaveLength(5)
  })

  it('mỗi unit có ít nhất một lesson', () => {
    for (const unit of HSK1.units) {
      expect(unit.lessons.length).toBeGreaterThan(0)
    }
  })

  it('id của mọi lesson là duy nhất', () => {
    const ids = ALL_LESSONS.map((lesson) => lesson.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi wordId trong lesson đều tồn tại trong kho từ', () => {
    for (const lesson of ALL_LESSONS) {
      for (const wordId of lesson.wordIds) {
        expect(WORD_BY_ID[wordId], `${lesson.id} trỏ tới từ không tồn tại: ${wordId}`).toBeDefined()
      }
    }
  })

  it('không có từ nào bị dùng ở hai lesson khác nhau', () => {
    const used = ALL_LESSONS.flatMap((lesson) => lesson.wordIds)
    expect(new Set(used).size).toBe(used.length)
  })

  it('mọi từ trong kho đều được dùng ở đâu đó', () => {
    const used = new Set(ALL_LESSONS.flatMap((lesson) => lesson.wordIds))
    for (const word of WORDS) {
      expect(used.has(word.id), `từ ${word.id} chưa thuộc lesson nào`).toBe(true)
    }
  })
})

describe('wordsOfLesson', () => {
  it('trả về đúng số từ của bài học', () => {
    expect(wordsOfLesson('u1l1')).toHaveLength(6)
  })

  it('giữ đúng thứ tự khai báo trong lesson', () => {
    expect(wordsOfLesson('u1l1').map((word) => word.id)).toEqual([
      'nihao',
      'ni',
      'hao',
      'wo',
      'zaijian',
      'xiexie',
    ])
  })

  it('trả về mảng rỗng với lesson không tồn tại', () => {
    expect(wordsOfLesson('không-có-bài-này')).toEqual([])
  })
})
