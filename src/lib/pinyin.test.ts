import { describe, expect, it } from 'vitest'
import { WORDS } from '../data/hsk1'
import { matchesPinyin, normalizePinyin } from './pinyin'

describe('normalizePinyin', () => {
  it('bỏ cả bốn dấu thanh', () => {
    expect(normalizePinyin('mā má mǎ mà')).toBe('mamamama')
  })

  it('ü rụng hai chấm thành u, kể cả khi có dấu thanh', () => {
    expect(normalizePinyin('nǚ')).toBe('nu')
    expect(normalizePinyin('lǜ')).toBe('lu')
  })

  it('v được coi như u, vì bàn phím không gõ được ü', () => {
    expect(normalizePinyin('nv er')).toBe(normalizePinyin('nǚ ér'))
  })

  it('bỏ khoảng trắng, dấu nháy và phân biệt hoa thường', () => {
    expect(normalizePinyin("Xi'an")).toBe('xian')
    expect(normalizePinyin('  NI  HAO ')).toBe('nihao')
  })
})

describe('matchesPinyin', () => {
  it('gõ không dấu vẫn đúng', () => {
    expect(matchesPinyin('ni hao', 'nǐ hǎo')).toBe(true)
  })

  it('gõ liền không cách vẫn đúng', () => {
    expect(matchesPinyin('xiexie', 'xiè xie')).toBe(true)
  })

  it('gõ nguyên dấu cũng đúng', () => {
    expect(matchesPinyin('zài jiàn', 'zài jiàn')).toBe(true)
  })

  it('sai âm thì sai, dù chỉ một chữ cái', () => {
    expect(matchesPinyin('ni hai', 'nǐ hǎo')).toBe(false)
    expect(matchesPinyin('xie', 'xiè xie')).toBe(false)
  })

  it('bỏ trống hoặc toàn dấu cách thì không bao giờ tính là đúng', () => {
    expect(matchesPinyin('', 'nǐ hǎo')).toBe(false)
    expect(matchesPinyin('   ', 'nǐ hǎo')).toBe(false)
  })

  it('pinyin của cả 60 từ đều tự khớp với chính nó khi gõ không dấu', () => {
    for (const word of WORDS) {
      const typed = word.pinyin.normalize('NFD').replace(/[̀-ͯ]/g, '')
      expect(matchesPinyin(typed, word.pinyin), word.pinyin).toBe(true)
    }
  })
})
