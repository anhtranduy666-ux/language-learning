import { describe, expect, it } from 'vitest'
import { WORDS } from '../data/hsk1'
import type { ExampleSentence } from '../types'
import {
  hanziChars,
  highlightTarget,
  isAligned,
  pinyinSyllables,
  sentenceAudioKey,
} from './sentences'

const ASK_NAME: ExampleSentence = {
  hanzi: '你叫什么名字？',
  pinyin: 'Nǐ jiào shén me míng zi?',
  meaning: 'Bạn tên là gì?',
}

/** Dòng chữ đang hiển thị, và phần được tô — đọc dễ hơn so từng đoạn một. */
function marked(segments: { text: string; target: boolean }[]) {
  return {
    text: segments.map((segment) => segment.text).join(''),
    target: segments.filter((segment) => segment.target).map((segment) => segment.text),
  }
}

describe('hanziChars / pinyinSyllables', () => {
  it('chỉ đếm chữ Hán, bỏ dấu câu', () => {
    expect(hanziChars('你好，我叫小明。')).toEqual(['你', '好', '我', '叫', '小', '明'])
  })

  it('tách pinyin theo âm tiết, dấu câu vẫn dính vào âm tiết', () => {
    expect(pinyinSyllables('Nǐ hǎo, wǒ jiào Xiǎo míng.')).toEqual([
      'Nǐ',
      'hǎo,',
      'wǒ',
      'jiào',
      'Xiǎo',
      'míng.',
    ])
  })
})

describe('isAligned', () => {
  it('mỗi chữ Hán đúng một âm tiết', () => {
    expect(isAligned(ASK_NAME)).toBe(true)
  })

  it('thiếu một âm tiết là lệch', () => {
    expect(isAligned({ ...ASK_NAME, pinyin: 'Nǐ jiào shénme míng zi?' })).toBe(false)
  })
})

describe('highlightTarget', () => {
  it('tô từ đang học ở cả chữ Hán lẫn pinyin', () => {
    const { hanzi, pinyin } = highlightTarget(ASK_NAME, '什么')

    expect(marked(hanzi)).toEqual({ text: '你叫什么名字？', target: ['什么'] })
    expect(marked(pinyin)).toEqual({ text: 'Nǐ jiào shén me míng zi?', target: ['shén me'] })
  })

  it('từ đứng đầu câu vẫn giữ chữ hoa của pinyin', () => {
    const { pinyin } = highlightTarget(ASK_NAME, '你')
    expect(marked(pinyin).target).toEqual(['Nǐ'])
  })

  it('không tô dấu câu dính sau âm tiết', () => {
    const { pinyin } = highlightTarget(
      { hanzi: '谢谢你！', pinyin: 'Xiè xie nǐ!', meaning: 'Cảm ơn bạn!' },
      '你',
    )
    expect(pinyin).toEqual([
      { text: 'Xiè xie ', target: false },
      { text: 'nǐ', target: true },
      { text: '!', target: false },
    ])
  })

  it('dấu phẩy trong câu không làm lệch âm tiết', () => {
    const { pinyin } = highlightTarget(
      { hanzi: '你好，我叫小明。', pinyin: 'Nǐ hǎo, wǒ jiào Xiǎo míng.', meaning: '' },
      '叫',
    )
    expect(marked(pinyin).target).toEqual(['jiào'])
  })

  it('từ xuất hiện hai lần thì chỉ tô lần đầu', () => {
    const { hanzi } = highlightTarget(
      { hanzi: '我爱我的家。', pinyin: 'Wǒ ài wǒ de jiā.', meaning: '' },
      '我',
    )
    expect(hanzi).toEqual([
      { text: '我', target: true },
      { text: '爱我的家。', target: false },
    ])
  })

  it('câu không chứa từ thì để nguyên, không tô nhầm chỗ', () => {
    const { hanzi, pinyin } = highlightTarget(ASK_NAME, '老师')
    expect(hanzi).toEqual([{ text: ASK_NAME.hanzi, target: false }])
    expect(pinyin).toEqual([{ text: ASK_NAME.pinyin, target: false }])
  })

  it('pinyin lệch số âm tiết thì chỉ không tô, không vỡ', () => {
    const broken = { ...ASK_NAME, pinyin: 'Nǐ jiào shénme míngzi?' }
    expect(highlightTarget(broken, '什么').pinyin).toEqual([{ text: broken.pinyin, target: false }])
  })

  it('mọi câu mẫu của khoá học đều tô được đúng từ của nó', () => {
    for (const word of WORDS) {
      for (const sentence of word.examples) {
        const { hanzi, pinyin } = highlightTarget(sentence, word.hanzi)
        expect(marked(hanzi).target, sentence.hanzi).toEqual([word.hanzi])
        // Số âm tiết được tô bằng đúng số chữ của từ.
        const syllables = marked(pinyin).target.join(' ').split(' ')
        expect(syllables, sentence.hanzi).toHaveLength([...word.hanzi].length)
      }
    }
  })
})

describe('sentenceAudioKey', () => {
  it('là 8 ký tự hex, và không đổi giữa các lần gọi', () => {
    expect(sentenceAudioKey(ASK_NAME)).toMatch(/^[0-9a-f]{8}$/)
    expect(sentenceAudioKey(ASK_NAME)).toBe(sentenceAudioKey({ ...ASK_NAME }))
  })

  it('sửa pinyin thì ra tên file khác, để file đọc sai không lọt lên', () => {
    expect(sentenceAudioKey({ ...ASK_NAME, pinyin: 'Nǐ jiào shén me míng zì?' })).not.toBe(
      sentenceAudioKey(ASK_NAME),
    )
  })

  it('sửa nghĩa tiếng Việt thì không phải sinh lại audio', () => {
    expect(sentenceAudioKey({ ...ASK_NAME, meaning: 'Tên bạn là gì?' })).toBe(
      sentenceAudioKey(ASK_NAME),
    )
  })

  it('mỗi câu khác nhau trong khoá học có một tên file riêng', () => {
    const sentences = new Map<string, string>()
    for (const sentence of WORDS.flatMap((word) => word.examples)) {
      sentences.set(`${sentence.hanzi}\n${sentence.pinyin}`, sentenceAudioKey(sentence))
    }
    const keys = [...sentences.values()]
    expect(new Set(keys).size).toBe(keys.length)
  })
})
