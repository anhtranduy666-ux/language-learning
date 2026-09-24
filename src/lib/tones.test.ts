import { describe, expect, it } from 'vitest'
import { WORDS } from '../data/hsk1'
import {
  TONE_NAMES,
  applyTone,
  isSingleToned,
  splitSyllables,
  stripTone,
  toneOf,
  toneVariants,
  tonedSyllableIndex,
  wordToneVariants,
} from './tones'

describe('toneOf', () => {
  it('đọc đúng cả bốn thanh', () => {
    expect(toneOf('mā')).toBe(1)
    expect(toneOf('má')).toBe(2)
    expect(toneOf('mǎ')).toBe(3)
    expect(toneOf('mà')).toBe(4)
  })

  it('trả về 0 cho thanh nhẹ', () => {
    expect(toneOf('ma')).toBe(0)
    expect(toneOf('xie')).toBe(0)
  })

  it('không nhầm hai chấm của ü thành dấu thanh', () => {
    expect(toneOf('nü')).toBe(0)
    expect(toneOf('nǚ')).toBe(3)
  })
})

describe('stripTone', () => {
  it('bỏ dấu thanh', () => {
    expect(stripTone('hǎo')).toBe('hao')
    expect(stripTone('zhōng')).toBe('zhong')
  })

  it('giữ nguyên hai chấm của ü', () => {
    expect(stripTone('nǚ')).toBe('nü')
  })

  it('không đụng tới âm tiết vốn đã không dấu', () => {
    expect(stripTone('xie')).toBe('xie')
  })
})

describe('applyTone', () => {
  it('đánh dấu vào a khi có a', () => {
    expect(applyTone('hao', 3)).toBe('hǎo')
    expect(applyTone('jiao', 4)).toBe('jiào')
  })

  it('đánh dấu vào o khi không có a', () => {
    expect(applyTone('zhong', 1)).toBe('zhōng')
    expect(applyTone('duo', 1)).toBe('duō')
  })

  it('đánh dấu vào e khi không có a và o', () => {
    expect(applyTone('er', 2)).toBe('ér')
    expect(applyTone('hen', 3)).toBe('hěn')
  })

  it('đánh dấu vào nguyên âm cuối với vần iu và ui', () => {
    expect(applyTone('jiu', 3)).toBe('jiǔ')
    expect(applyTone('liu', 4)).toBe('liù')
    expect(applyTone('dui', 4)).toBe('duì')
  })

  it('đánh dấu đúng cho ü', () => {
    expect(applyTone('nü', 3)).toBe('nǚ')
  })

  it('thay thanh cũ chứ không cộng thêm', () => {
    expect(applyTone('hào', 3)).toBe('hǎo')
    expect(toneOf(applyTone('hào', 3))).toBe(3)
  })

  it('thanh 0 hoặc ngoài khoảng thì trả về dạng không dấu', () => {
    expect(applyTone('hǎo', 0)).toBe('hao')
    expect(applyTone('hǎo', 7)).toBe('hao')
  })

  it('không vỡ với âm tiết không có nguyên âm', () => {
    expect(applyTone('n', 2)).toBe('n')
  })
})

describe('toneVariants', () => {
  it('trả về đúng bốn biến thể theo thứ tự thanh', () => {
    expect(toneVariants('ma')).toEqual(['mā', 'má', 'mǎ', 'mà'])
  })

  it('bốn biến thể đều khác nhau', () => {
    const variants = toneVariants('hao')
    expect(new Set(variants).size).toBe(4)
  })

  it('biến thể thứ n có đúng thanh n', () => {
    toneVariants('shi').forEach((variant, index) => {
      expect(toneOf(variant)).toBe(index + 1)
    })
  })
})

describe('splitSyllables', () => {
  it('cắt theo khoảng trắng', () => {
    expect(splitSyllables('nǐ hǎo')).toEqual(['nǐ', 'hǎo'])
  })

  it('một âm tiết thì trả về một phần tử', () => {
    expect(splitSyllables('wǒ')).toEqual(['wǒ'])
  })

  it('bỏ qua khoảng trắng thừa', () => {
    expect(splitSyllables('  bú  kè qi ')).toEqual(['bú', 'kè', 'qi'])
  })
})

describe('isSingleToned', () => {
  it('đúng với từ một âm tiết có thanh', () => {
    expect(isSingleToned('hǎo')).toBe(true)
  })

  it('sai với từ nhiều âm tiết', () => {
    expect(isSingleToned('nǐ hǎo')).toBe(false)
  })

  it('sai với âm tiết thanh nhẹ', () => {
    expect(isSingleToned('ma')).toBe(false)
  })
})

describe('tonedSyllableIndex', () => {
  it('lấy âm tiết có thanh đầu tiên', () => {
    expect(tonedSyllableIndex('nǐ hǎo')).toBe(0)
  })

  it('bỏ qua âm tiết thanh nhẹ ở đầu', () => {
    expect(tonedSyllableIndex('ma mā')).toBe(1)
  })

  it('trả về -1 khi cả từ đều thanh nhẹ', () => {
    expect(tonedSyllableIndex('ma ma')).toBe(-1)
  })
})

describe('wordToneVariants', () => {
  it('chỉ đổi thanh của đúng một âm tiết', () => {
    expect(wordToneVariants('nǐ hǎo', 0)).toEqual(['nī hǎo', 'ní hǎo', 'nǐ hǎo', 'nì hǎo'])
  })

  it('giữ nguyên âm tiết thanh nhẹ ở sau', () => {
    expect(wordToneVariants('xiè xie', 0)).toEqual(['xiē xie', 'xié xie', 'xiě xie', 'xiè xie'])
  })

  it('bốn phương án chỉ khác nhau đúng cái thanh', () => {
    const variants = wordToneVariants('nǐ hǎo', 0)
    const stripped = variants.map((variant) => variant.split(' ').map(stripTone).join(' '))
    expect(new Set(stripped).size).toBe(1)
  })

  it('bốn phương án không trùng nhau', () => {
    expect(new Set(wordToneVariants('zài jiàn', 1)).size).toBe(4)
  })

  it('phương án đúng nằm đúng vị trí theo thanh gốc', () => {
    // 好 là thanh 3, nên biến thể thứ ba phải bằng chính nó.
    expect(wordToneVariants('hǎo', 0)[2]).toBe('hǎo')
  })

  it('trả về mảng rỗng với vị trí không hợp lệ', () => {
    expect(wordToneVariants('nǐ hǎo', -1)).toEqual([])
    expect(wordToneVariants('nǐ hǎo', 5)).toEqual([])
  })
})

describe('TONE_NAMES', () => {
  it('mô tả đủ bốn thanh, đúng thứ tự', () => {
    expect(TONE_NAMES.map((item) => item.tone)).toEqual([1, 2, 3, 4])
  })
})

describe('toàn bộ 60 từ của khoá học', () => {
  it('dựng lại được đúng pinyin gốc từ thanh của chính nó', () => {
    for (const word of WORDS) {
      const index = tonedSyllableIndex(word.pinyin)
      if (index === -1) continue

      const tone = toneOf(splitSyllables(word.pinyin)[index])
      const variants = wordToneVariants(word.pinyin, index)
      expect(variants[tone - 1], `${word.id} (${word.pinyin}) dựng lại sai`).toBe(word.pinyin)
    }
  })

  it('từ nào cũng có ít nhất một âm tiết mang thanh', () => {
    for (const word of WORDS) {
      expect(tonedSyllableIndex(word.pinyin), `${word.id} không có âm tiết nào mang thanh`).toBeGreaterThanOrEqual(0)
    }
  })

  it('bỏ dấu rồi gắn lại đúng thanh thì ra chính nó', () => {
    for (const word of WORDS) {
      for (const syllable of splitSyllables(word.pinyin)) {
        const tone = toneOf(syllable)
        if (tone === 0) continue
        expect(applyTone(stripTone(syllable), tone), `${word.id}: ${syllable}`).toBe(syllable)
      }
    }
  })
})
