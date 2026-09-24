import { describe, expect, it } from 'vitest'
import { WORDS } from '../data/hsk1'
import { PINYIN_SYLLABLES } from '../test/pinyinSyllables'
import { expectedTones, isPauseToken, numberSyllable, speechTokens } from './speechTokens'

describe('numberSyllable', () => {
  it('đổi dấu thanh thành số', () => {
    expect(numberSyllable('mā')).toBe('ma1')
    expect(numberSyllable('má')).toBe('ma2')
    expect(numberSyllable('mǎ')).toBe('ma3')
    expect(numberSyllable('mà')).toBe('ma4')
  })

  it('âm tiết không dấu là thanh nhẹ, số 5', () => {
    expect(numberSyllable('ma')).toBe('ma5')
    expect(numberSyllable('xie')).toBe('xie5')
  })

  it('viết thường chữ hoa của đầu câu và tên riêng', () => {
    expect(numberSyllable('Zhōng')).toBe('zhong1')
    expect(numberSyllable('Nǐ')).toBe('ni3')
  })

  it('ü viết thành v như máy đọc quen dùng', () => {
    expect(numberSyllable('nǚ')).toBe('nv3')
    expect(numberSyllable('lǜ')).toBe('lv4')
  })

  it('sau j q x y thì giữ u như pinyin chuẩn', () => {
    expect(numberSyllable('qù')).toBe('qu4')
    expect(numberSyllable('xué')).toBe('xue2')
    expect(numberSyllable('yuè')).toBe('yue4')
  })

  it('nhận cả dấu thanh viết dạng tổ hợp lẫn dạng dựng sẵn', () => {
    expect(numberSyllable('hǎo'.normalize('NFD'))).toBe('hao3')
    expect(numberSyllable('hǎo'.normalize('NFC'))).toBe('hao3')
  })
})

describe('speechTokens', () => {
  it('tách pinyin của một từ thành từng âm tiết', () => {
    expect(speechTokens('nǐ hǎo')).toEqual(['ni3', 'hao3'])
    expect(speechTokens('bú kè qi')).toEqual(['bu2', 'ke4', 'qi5'])
  })

  it('dấu câu thành chỗ ngắt của máy đọc', () => {
    expect(speechTokens('Nǐ hǎo, wǒ jiào Xiǎo míng.')).toEqual([
      'ni3',
      'hao3',
      '，',
      'wo3',
      'jiao4',
      'xiao3',
      'ming2',
      '。',
    ])
    expect(speechTokens('Nǐ hǎo ma?')).toEqual(['ni3', 'hao3', 'ma5', '？'])
    expect(speechTokens('Xiè xie nǐ!')).toEqual(['xie4', 'xie5', 'ni3', '！'])
  })

  it('giữ nguyên thanh đã biến của 一 và 不 như pinyin ghi', () => {
    expect(speechTokens('Wǒ bú shì lǎo shī.')).toEqual(['wo3', 'bu2', 'shi4', 'lao3', 'shi1', '。'])
    expect(speechTokens('yí ge')).toEqual(['yi2', 'ge5'])
  })

  it('bỏ qua khoảng trắng thừa', () => {
    expect(speechTokens('  nǐ   hǎo ')).toEqual(['ni3', 'hao3'])
  })

  it('âm tiết lạ thì báo lỗi chứ không đọc lướt qua', () => {
    expect(() => speechTokens("Xī'ān")).toThrow(/không hợp lệ/)
    expect(() => speechTokens('ni3 hao3')).toThrow(/không hợp lệ/)
  })

  it('mọi âm tiết của 60 từ đều là âm tiết tiếng Trung có thật', () => {
    // Gõ nhầm pinyin (`shie`, `zhogn`) thì máy vẫn cố đọc ra một thứ gì đó —
    // test này chặn trước khi file audio sai được sinh ra.
    for (const word of WORDS) {
      for (const token of speechTokens(word.pinyin)) {
        expect(PINYIN_SYLLABLES.has(token.slice(0, -1)), `${word.id}: ${token}`).toBe(true)
      }
    }
  })
})

describe('isPauseToken', () => {
  it('chỉ dấu câu mới là chỗ ngắt', () => {
    expect(isPauseToken('，')).toBe(true)
    expect(isPauseToken('。')).toBe(true)
    expect(isPauseToken('ni3')).toBe(false)
  })
})

describe('expectedTones', () => {
  it('thanh viết sao nghe vậy khi không có hai thanh 3 liền nhau', () => {
    expect(expectedTones(['ta1', 'shi4', 'xue2', 'sheng5', '。'])).toEqual([1, 4, 2, 0, 0])
  })

  it('thanh 3 đứng trước thanh 3 thì nghe thành thanh 2', () => {
    expect(expectedTones(['ni3', 'hao3'])).toEqual([2, 3])
    expect(expectedTones(['wu3', 'dian3', 'jian4', '。'])).toEqual([2, 3, 4, 0])
  })

  it('chuỗi ba thanh 3 trở lên thì chỉ chấm âm cuối', () => {
    expect(expectedTones(['wo3', 'hen3', 'hao3', '。'])).toEqual([0, 0, 3, 0])
  })

  it('dấu câu cắt đứt chuỗi thanh 3', () => {
    expect(expectedTones(['hao3', '，', 'wo3', 'jiao4'])).toEqual([3, 0, 3, 4])
  })

  it('thanh nhẹ không chấm, và cũng cắt chuỗi thanh 3', () => {
    expect(expectedTones(['wo3', 'men5', 'hao3'])).toEqual([3, 0, 3])
  })
})
