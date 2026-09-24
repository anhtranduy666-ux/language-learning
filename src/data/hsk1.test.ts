import { describe, expect, it } from 'vitest'
import { isAligned } from '../lib/sentences'
import { isPauseToken, speechTokens } from '../lib/speechTokens'
import { PINYIN_SYLLABLES } from '../test/pinyinSyllables'
import { ALL_LESSONS, HSK1, WORDS, WORD_BY_ID, wordsOfLesson } from './hsk1'

describe('WORDS', () => {
  it('có đủ 60 từ cho bản demo', () => {
    expect(WORDS).toHaveLength(60)
  })

  it('không có id trùng nhau', () => {
    const ids = WORDS.map((word) => word.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mỗi từ đều có đủ Hanzi, Pinyin và nghĩa', () => {
    for (const word of WORDS) {
      expect(word.hanzi, `${word.id} thiếu hanzi`).not.toBe('')
      expect(word.pinyin, `${word.id} thiếu pinyin`).not.toBe('')
      expect(word.meaning, `${word.id} thiếu nghĩa`).not.toBe('')
    }
  })

  it('không có hai từ trùng cả Hanzi lẫn nghĩa', () => {
    const pairs = WORDS.map((word) => `${word.hanzi}|${word.meaning}`)
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})

describe('Câu mẫu', () => {
  const ALL = WORDS.flatMap((word) => word.examples.map((sentence) => ({ word, sentence })))

  /** Dấu câu tiếng Trung và dấu tương ứng bên pinyin. */
  const MARKS: Record<string, string> = { '，': ',', '。': '.', '？': '?', '！': '!' }

  it('mỗi từ có ba câu mẫu, không câu nào lặp lại', () => {
    for (const word of WORDS) {
      expect(word.examples, word.id).toHaveLength(3)
      const hanzi = word.examples.map((sentence) => sentence.hanzi)
      expect(new Set(hanzi).size, word.id).toBe(hanzi.length)
    }
  })

  it('câu nào cũng đủ chữ Hán, pinyin và nghĩa', () => {
    for (const { word, sentence } of ALL) {
      expect(sentence.hanzi, word.id).not.toBe('')
      expect(sentence.pinyin, sentence.hanzi).not.toBe('')
      expect(sentence.meaning, sentence.hanzi).not.toBe('')
    }
  })

  it('câu mẫu có chứa chính từ đang học', () => {
    for (const { word, sentence } of ALL) {
      expect(sentence.hanzi, `câu của ${word.id}`).toContain(word.hanzi)
    }
  })

  it('mỗi chữ Hán có đúng một âm tiết pinyin', () => {
    // Lệch một âm tiết thì tô sai từ trên màn hình, và audio sinh ra đọc lệch
    // khỏi dòng chữ người học đang nhìn.
    for (const { sentence } of ALL) {
      expect(isAligned(sentence), `${sentence.hanzi} / ${sentence.pinyin}`).toBe(true)
    }
  })

  it('chỉ dùng chữ Hán và bốn dấu câu quen thuộc — không có chữ Latin để máy đọc bừa', () => {
    for (const { sentence } of ALL) {
      expect(sentence.hanzi, sentence.hanzi).toMatch(/^[㐀-鿿，。？！]+$/)
    }
  })

  it('dấu câu bên pinyin khớp từng dấu bên chữ Hán', () => {
    for (const { sentence } of ALL) {
      const hanziMarks = [...sentence.hanzi].filter((char) => char in MARKS).map((char) => MARKS[char])
      const pinyinMarks = [...sentence.pinyin].filter((char) => ',.?!'.includes(char))
      expect(pinyinMarks, sentence.hanzi).toEqual(hanziMarks)
    }
  })

  it('câu kết thúc bằng dấu câu, pinyin viết hoa chữ đầu', () => {
    for (const { sentence } of ALL) {
      expect(sentence.hanzi, sentence.hanzi).toMatch(/[。？！]$/)
      expect(sentence.pinyin[0], sentence.pinyin).toBe(sentence.pinyin[0].toUpperCase())
    }
  })

  it('mọi âm tiết trong câu mẫu là âm tiết tiếng Trung có thật', () => {
    for (const { sentence } of ALL) {
      for (const token of speechTokens(sentence.pinyin).filter((token) => !isPauseToken(token))) {
        expect(PINYIN_SYLLABLES.has(token.slice(0, -1)), `${sentence.hanzi}: ${token}`).toBe(true)
      }
    }
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
