import { describe, expect, it } from 'vitest'
import { WORDS } from '../data/hsk1'
import { EXTRA_LEXICON, stripPunctuation, tokenizeChinese } from './chinese'

const LEXICON = [...WORDS.map((word) => word.hanzi), ...EXTRA_LEXICON]

describe('stripPunctuation', () => {
  it('bỏ dấu câu tiếng Trung', () => {
    expect(stripPunctuation('你好，我叫 Tom。')).toBe('你好 我叫 Tom')
  })

  it('bỏ dấu hỏi và dấu than kiểu toàn khổ', () => {
    expect(stripPunctuation('你是学生吗？')).toBe('你是学生吗')
    expect(stripPunctuation('谢谢你！')).toBe('谢谢你')
  })

  it('gom khoảng trắng thừa', () => {
    expect(stripPunctuation('  我   很好 ')).toBe('我 很好')
  })
})

describe('tokenizeChinese', () => {
  it('giữ nguyên từ nhiều chữ thay vì cắt vụn', () => {
    expect(tokenizeChinese('我是学生。', LEXICON)).toEqual(['我', '是', '学生'])
  })

  it('ưu tiên từ dài nhất', () => {
    // 中国人 có thể cắt thành 中国 + 人 hoặc 中 + 国人; từ điển có 中国 nên phải ra 中国 + 人.
    expect(tokenizeChinese('他是中国人。', LEXICON)).toEqual(['他', '是', '中国', '人'])
  })

  it('từ ba chữ vẫn nguyên một mảnh', () => {
    expect(tokenizeChinese('对不起，我不知道。', LEXICON)).toEqual(['对不起', '我', '不', '知道'])
  })

  it('chữ không thuộc từ nào thì đứng riêng', () => {
    expect(tokenizeChinese('你是学生吗？', LEXICON)).toEqual(['你', '是', '学生', '吗'])
  })

  it('tên riêng chữ Latin giữ nguyên một mảnh', () => {
    expect(tokenizeChinese('你好，我叫 Tom。', LEXICON)).toEqual(['你好', '我', '叫', 'Tom'])
  })

  it('không có từ điển thì cắt từng chữ, không vỡ', () => {
    expect(tokenizeChinese('我很好', [])).toEqual(['我', '很', '好'])
  })

  it('câu rỗng ra danh sách rỗng', () => {
    expect(tokenizeChinese('。', LEXICON)).toEqual([])
  })

  it('ghép lại cả 60 câu ví dụ đều ra đúng câu gốc — không mất chữ, không nhân đôi chữ', () => {
    for (const word of WORDS) {
      const tokens = tokenizeChinese(word.example, LEXICON)
      expect(tokens.join(''), word.example).toBe(stripPunctuation(word.example).replace(/\s/g, ''))
    }
  })

  it('từ trong từ điển phụ không bị cắt vụn trong câu thật', () => {
    // Mỗi từ ở đây từng bị cắt thành hai chữ rời khi chưa có trong EXTRA_LEXICON.
    expect(tokenizeChinese('我在中国学习。', LEXICON)).toContain('学习')
    expect(tokenizeChinese('她很高兴。', LEXICON)).toContain('高兴')
    expect(tokenizeChinese('今年是好年。', LEXICON)).toContain('今年')
  })
})
