import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WORD_BY_ID } from '../data/hsk1'
import {
  GOOGLE_ENDPOINT,
  MAX_INPUT_LENGTH,
  TranslateError,
  clearTranslationCache,
  lookupCourse,
  matchKey,
  parseGoogleResponse,
  translate,
} from './translate'

/** Câu trả lời thật của Google cho "tôi muốn đi ngân hàng", rút gọn phần không dùng. */
const GOOGLE_BANK = [
  [
    ['我想去银行', 'tôi muốn đi ngân hàng', null, null, 3],
    [null, null, 'Wǒ xiǎng qù yínháng'],
  ],
  null,
  'vi',
]

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Lỗi `translate` ném ra, hoặc null nếu nó chạy êm. */
async function failure(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise
    return null
  } catch (error) {
    return error instanceof TranslateError ? error.reason : 'not-a-translate-error'
  }
}

beforeEach(() => clearTranslationCache())
afterEach(() => vi.unstubAllGlobals())

describe('matchKey', () => {
  it('không phân biệt hoa thường, dấu câu và khoảng trắng thừa', () => {
    expect(matchKey('  Bạn tên là gì ?? ')).toBe(matchKey('bạn tên là gì'))
    expect(matchKey('“Cảm ơn!”')).toBe(matchKey('cảm ơn'))
  })

  it('bỏ dấu kiểu cũ hay kiểu mới đều ra một: khoẻ = khỏe, hoà = hòa', () => {
    expect(matchKey('khoẻ')).toBe(matchKey('khỏe'))
    expect(matchKey('hoà bình')).toBe(matchKey('hòa bình'))
  })

  it('nhưng khác dấu thanh thì vẫn là hai từ khác nhau', () => {
    expect(matchKey('bạn')).not.toBe(matchKey('bán'))
    expect(matchKey('ban')).not.toBe(matchKey('bạn'))
  })
})

describe('tra trong khoá học', () => {
  it('gõ đúng nghĩa của một từ thì ra từ đó, kèm pinyin và id để phát file thu sẵn', () => {
    const result = lookupCourse('Xin chào!')!
    expect(result.source).toBe('course')
    expect(result.hanzi).toBe('你好')
    expect(result.pinyin).toBe('nǐ hǎo')
    expect(WORD_BY_ID[result.wordId!].hanzi).toBe('你好')
  })

  it('từ có nhiều nghĩa thì gõ nghĩa nào cũng ra, kể cả kiểu bỏ dấu khác', () => {
    expect(lookupCourse('khỏe')?.hanzi).toBe('好')
    expect(lookupCourse('tốt')?.hanzi).toBe('好')
  })

  it('bỏ chú thích trong ngoặc: "cái" tra ra lượng từ 个', () => {
    expect(lookupCourse('cái')?.hanzi).toBe('个')
  })

  it('một nghĩa ứng với nhiều từ thì đưa cả, không chọn thầm: "năm" là 五 mà cũng là 年', () => {
    const result = lookupCourse('năm')!
    expect(result.hanzi).toBe('五')
    expect(result.alternatives?.map((entry) => entry.hanzi)).toEqual(['年'])
    // Nghĩa chỉ một từ mang thì không có danh sách thừa.
    expect(lookupCourse('cảm ơn')?.alternatives).toBeUndefined()
  })

  it('gõ nguyên một câu mẫu thì ra câu đó, kèm file đọc cả câu', () => {
    const result = lookupCourse('bạn tên là gì')!
    expect(result.hanzi).toBe('你叫什么名字？')
    expect(result.courseMeaning).toBe('Bạn tên là gì?')
    expect(result.clipUrl).toBeTruthy()
  })

  it('không có trong khoá học thì trả null', () => {
    expect(lookupCourse('con mèo')).toBeNull()
  })
})

describe('đọc câu trả lời của Google', () => {
  it('lấy chữ Hán và pinyin', () => {
    expect(parseGoogleResponse(GOOGLE_BANK)).toEqual({ hanzi: '我想去银行', pinyin: 'Wǒ xiǎng qù yínháng' })
  })

  it('nhiều câu thì nối các đoạn lại', () => {
    const data = [[['你叫什么名字？', 'bạn tên là gì?'], ['我叫兰。', 'tôi tên là Lan.'], [null, null, 'Nǐ jiào shénme míngzì? Wǒ jiào lán.']]]
    expect(parseGoogleResponse(data)).toEqual({
      hanzi: '你叫什么名字？我叫兰。',
      pinyin: 'Nǐ jiào shénme míngzì? Wǒ jiào lán.',
    })
  })

  it('thiếu pinyin thì vẫn có chữ Hán; hỏng dạng thì trả null', () => {
    expect(parseGoogleResponse([[['猫', 'con mèo']]])).toEqual({ hanzi: '猫', pinyin: null })
    expect(parseGoogleResponse({ error: 'x' })).toBeNull()
    expect(parseGoogleResponse([[[null, null, 'Māo']]])).toBeNull()
  })
})

describe('translate', () => {
  it('có trong khoá học thì không gọi mạng', async () => {
    const fetch = vi.fn()
    const result = await translate('cảm ơn', { fetch })
    expect(result.hanzi).toBe('谢谢')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('không có thì hỏi Google, đúng chiều Việt → Trung giản thể, xin cả pinyin', async () => {
    const fetch = vi.fn(async () => jsonResponse(GOOGLE_BANK))
    const result = await translate('tôi muốn đi ngân hàng', { fetch })

    expect(result).toMatchObject({ source: 'google', hanzi: '我想去银行', pinyin: 'Wǒ xiǎng qù yínháng' })
    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]))
    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_ENDPOINT)
    expect(url.searchParams.get('sl')).toBe('vi')
    expect(url.searchParams.get('tl')).toBe('zh-CN')
    expect(url.searchParams.getAll('dt')).toEqual(['t', 'rm'])
    expect(url.searchParams.get('q')).toBe('tôi muốn đi ngân hàng')
  })

  it('Google dịch ra đúng chữ khoá học đã thu âm thì dùng luôn file thu sẵn', async () => {
    const fetch = vi.fn(async () => jsonResponse([[['谢谢', 'cám ơn nha'], [null, null, 'Xièxiè']]]))
    const result = await translate('cám ơn nha', { fetch })
    expect(result.source).toBe('google')
    expect(WORD_BY_ID[result.wordId!].hanzi).toBe('谢谢')
  })

  it('gõ lại câu vừa dịch thì lấy bản đã có, không gọi mạng lần nữa', async () => {
    const fetch = vi.fn(async () => jsonResponse(GOOGLE_BANK))
    await translate('tôi muốn đi ngân hàng', { fetch })
    await translate('Tôi muốn đi ngân hàng.', { fetch })
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('ô trống hay quá dài thì không gọi mạng, báo đúng lý do', async () => {
    const fetch = vi.fn()
    expect(await failure(translate('   ', { fetch }))).toBe('empty')
    expect(await failure(translate('a'.repeat(MAX_INPUT_LENGTH + 1), { fetch }))).toBe('too-long')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('mất mạng thì báo mất mạng, không gọi đi', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const fetch = vi.fn()
    expect(await failure(translate('con mèo', { fetch }))).toBe('offline')
    expect(fetch).not.toHaveBeenCalled()
    // Nhưng từ trong khoá học thì vẫn tra được.
    expect((await translate('xin chào', { fetch })).hanzi).toBe('你好')
  })

  it('Google chặn vì gọi dồn dập thì báo khác với lỗi thường', async () => {
    expect(await failure(translate('con mèo', { fetch: vi.fn(async () => new Response('Sorry', { status: 429 })) }))).toBe('blocked')
    expect(await failure(translate('con chó', { fetch: vi.fn(async () => new Response('', { status: 500 })) }))).toBe('failed')
  })

  it('mạng hỏng giữa chừng hay trả về thứ không đọc được thì báo lỗi, không treo', async () => {
    expect(await failure(translate('con mèo', { fetch: vi.fn(async () => Promise.reject(new TypeError('network'))) }))).toBe('failed')
    expect(await failure(translate('con mèo', { fetch: vi.fn(async () => new Response('<html>', { status: 200 })) }))).toBe('failed')
    expect(await failure(translate('con mèo', { fetch: vi.fn(async () => jsonResponse([[]])) }))).toBe('failed')
  })
})
