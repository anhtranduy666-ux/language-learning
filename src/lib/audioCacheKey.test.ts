import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_RATE,
  DEFAULT_VOICE,
  HASH_VECTOR,
  audioHash,
  audioPath,
  canonicalString,
  isValidRequest,
  publicAudioUrl,
  sha256Hex,
} from './audioCacheKey'

const REQUEST = { text: HASH_VECTOR.text, voice: HASH_VECTOR.voice, rate: HASH_VECTOR.rate }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('canonicalString', () => {
  it('ghép text, giọng và tốc độ bằng xuống dòng', () => {
    expect(canonicalString(REQUEST)).toBe('你好\nzh-CN-XiaoxiaoNeural\n0.85')
  })

  it('in tốc độ với đúng hai chữ số thập phân', () => {
    expect(canonicalString({ ...REQUEST, rate: 1 })).toBe('你好\nzh-CN-XiaoxiaoNeural\n1.00')
    expect(canonicalString({ ...REQUEST, rate: 0.5 })).toBe('你好\nzh-CN-XiaoxiaoNeural\n0.50')
  })
})

describe('audioHash', () => {
  it('khớp vector dùng chung với Edge Function', async () => {
    expect(await audioHash(REQUEST)).toBe(HASH_VECTOR.hash)
  })

  it('đổi text thì đổi hash', async () => {
    expect(await audioHash({ ...REQUEST, text: '再见' })).not.toBe(HASH_VECTOR.hash)
  })

  it('đổi giọng thì đổi hash, file cũ không bị đụng', async () => {
    expect(await audioHash({ ...REQUEST, voice: 'zh-CN-YunxiNeural' })).not.toBe(HASH_VECTOR.hash)
  })

  it('đổi tốc độ thì đổi hash', async () => {
    expect(await audioHash({ ...REQUEST, rate: 1 })).not.toBe(HASH_VECTOR.hash)
  })

  it('trả về null khi trình duyệt không có crypto.subtle', async () => {
    vi.stubGlobal('crypto', {})
    expect(await audioHash(REQUEST)).toBeNull()
  })

  it('trả về null khi băm ném lỗi, không để lỗi lọt ra giao diện', async () => {
    vi.stubGlobal('crypto', {
      subtle: {
        digest: () => {
          throw new Error('NotSupportedError')
        },
      },
    })
    expect(await audioHash(REQUEST)).toBeNull()
  })
})

describe('sha256Hex', () => {
  it('trả về 64 ký tự hex viết thường', async () => {
    const hash = await sha256Hex('你好')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('audioPath', () => {
  it('đặt file dưới tiền tố phiên bản', () => {
    expect(audioPath(HASH_VECTOR.hash)).toBe(`v1/${HASH_VECTOR.hash}.mp3`)
  })
})

describe('publicAudioUrl', () => {
  it('dựng URL công khai của bucket tts', () => {
    expect(publicAudioUrl('https://abc.supabase.co', HASH_VECTOR.hash)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/tts/v1/${HASH_VECTOR.hash}.mp3`,
    )
  })

  it('không sinh ra hai dấu gạch chéo khi URL có sẵn dấu ở cuối', () => {
    expect(publicAudioUrl('https://abc.supabase.co/', HASH_VECTOR.hash)).not.toContain('co//')
  })
})

describe('isValidRequest', () => {
  it('nhận yêu cầu hợp lệ', () => {
    expect(isValidRequest(REQUEST)).toBe(true)
  })

  it('từ chối text rỗng hoặc chỉ có khoảng trắng', () => {
    expect(isValidRequest({ ...REQUEST, text: '' })).toBe(false)
    expect(isValidRequest({ ...REQUEST, text: '   ' })).toBe(false)
  })

  it('từ chối text quá dài', () => {
    expect(isValidRequest({ ...REQUEST, text: '好'.repeat(201) })).toBe(false)
  })

  it('từ chối tốc độ ngoài khoảng cho phép', () => {
    expect(isValidRequest({ ...REQUEST, rate: 0.4 })).toBe(false)
    expect(isValidRequest({ ...REQUEST, rate: 1.6 })).toBe(false)
    expect(isValidRequest({ ...REQUEST, rate: Number.NaN })).toBe(false)
  })

  it('từ chối giọng rỗng', () => {
    expect(isValidRequest({ ...REQUEST, voice: '' })).toBe(false)
  })
})

describe('mặc định của khoá học', () => {
  it('khớp tốc độ mà Web Speech đang dùng, để hai nguồn nghe giống nhau', () => {
    expect(DEFAULT_RATE).toBe(0.85)
    expect(DEFAULT_VOICE).toBe('zh-CN-XiaoxiaoNeural')
  })
})
