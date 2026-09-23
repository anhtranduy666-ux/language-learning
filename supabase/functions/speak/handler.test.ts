import { describe, expect, it, vi } from 'vitest'
import { HASH_VECTOR, canonicalString as clientCanonical } from '../../../src/lib/audioCacheKey'
import {
  ALLOWED_VOICES,
  audioPath,
  canonicalString,
  handleSpeak,
  parseRequest,
  sha256Hex,
  type SpeakDeps,
} from './handler'

const REQUEST = { text: HASH_VECTOR.text, voice: HASH_VECTOR.voice, rate: HASH_VECTOR.rate }
const MP3 = new Uint8Array([0xff, 0xfb, 0x90, 0x00])

/** Bộ phụ thuộc giả. Mặc định: chưa có file, nằm trong whitelist, TTS chạy tốt. */
function deps(overrides: Partial<SpeakDeps> = {}) {
  return {
    objectExists: vi.fn(async () => false),
    isAllowed: vi.fn(async () => true),
    synthesize: vi.fn(async () => MP3),
    upload: vi.fn(async () => {}),
    publicUrl: (path: string) => `https://abc.supabase.co/storage/v1/object/public/tts/${path}`,
    recordClip: vi.fn(async () => {}),
    ...overrides,
  } satisfies SpeakDeps
}

describe('vector dùng chung với client', () => {
  it('dựng ra cùng một chuỗi chuẩn hoá', () => {
    expect(canonicalString(REQUEST)).toBe(clientCanonical(REQUEST))
  })

  it('băm ra cùng một hash — đây là thứ giữ cache không bị trượt', async () => {
    expect(await sha256Hex(canonicalString(REQUEST))).toBe(HASH_VECTOR.hash)
  })
})

describe('parseRequest', () => {
  it('nhận yêu cầu hợp lệ', () => {
    expect(parseRequest(REQUEST)).toEqual(REQUEST)
  })

  it('từ chối body không phải object', () => {
    expect(parseRequest(null)).toBeNull()
    expect(parseRequest('你好')).toBeNull()
  })

  it('từ chối text rỗng hoặc quá dài', () => {
    expect(parseRequest({ ...REQUEST, text: '  ' })).toBeNull()
    expect(parseRequest({ ...REQUEST, text: '好'.repeat(201) })).toBeNull()
  })

  it('chỉ nhận giọng nằm trong danh sách cho phép', () => {
    expect(parseRequest({ ...REQUEST, voice: 'en-US-JennyNeural' })).toBeNull()
    for (const voice of ALLOWED_VOICES) {
      expect(parseRequest({ ...REQUEST, voice })).not.toBeNull()
    }
  })

  it('từ chối tốc độ ngoài khoảng cho phép', () => {
    expect(parseRequest({ ...REQUEST, rate: 0.4 })).toBeNull()
    expect(parseRequest({ ...REQUEST, rate: 1.6 })).toBeNull()
    expect(parseRequest({ ...REQUEST, rate: '0.85' })).toBeNull()
  })
})

describe('handleSpeak', () => {
  it('đầu vào sai thì trả 400 và không gọi TTS', async () => {
    const d = deps()
    const response = await handleSpeak({ text: '' }, d)

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('invalid_request')
    expect(d.synthesize).not.toHaveBeenCalled()
  })

  it('đã có file thì trả luôn, không gọi TTS và không đọc whitelist', async () => {
    const d = deps({ objectExists: vi.fn(async () => true) })
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      url: `https://abc.supabase.co/storage/v1/object/public/tts/v1/${HASH_VECTOR.hash}.mp3`,
      hash: HASH_VECTOR.hash,
      cached: true,
    })
    expect(d.synthesize).not.toHaveBeenCalled()
    expect(d.isAllowed).not.toHaveBeenCalled()
  })

  it('chuỗi ngoài nội dung khoá học thì trả 403 và không tốn một đồng TTS nào', async () => {
    const d = deps({ isAllowed: vi.fn(async () => false) })
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'not_allowed' })
    expect(d.synthesize).not.toHaveBeenCalled()
  })

  it('sinh và lưu audio cho nội dung hợp lệ chưa có file', async () => {
    const d = deps()
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(200)
    expect(response.body.cached).toBe(false)
    expect(d.synthesize).toHaveBeenCalledWith(REQUEST)
    expect(d.upload).toHaveBeenCalledWith(`v1/${HASH_VECTOR.hash}.mp3`, MP3)
  })

  it('ghi nhận dung lượng clip để theo dõi chi phí', async () => {
    const d = deps()
    await handleSpeak(REQUEST, d)

    expect(d.recordClip).toHaveBeenCalledWith(HASH_VECTOR.hash, MP3.byteLength)
  })

  it('nhà cung cấp TTS lỗi thì trả 502', async () => {
    const d = deps({
      synthesize: vi.fn(async () => {
        throw new Error('429 Too Many Requests')
      }),
    })
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({ error: 'tts_failed' })
    expect(d.upload).not.toHaveBeenCalled()
  })

  it('ghi bucket lỗi thì trả 502', async () => {
    const d = deps({
      upload: vi.fn(async () => {
        throw new Error('storage unavailable')
      }),
    })
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({ error: 'upload_failed' })
  })

  it('ghi sổ chi phí lỗi thì vẫn trả audio cho người học', async () => {
    const d = deps({
      recordClip: vi.fn(async () => {
        throw new Error('bảng chưa tạo')
      }),
    })
    const response = await handleSpeak(REQUEST, d)

    expect(response.status).toBe(200)
    expect(response.body.cached).toBe(false)
  })

  it('đặt file dưới đúng tiền tố phiên bản', () => {
    expect(audioPath(HASH_VECTOR.hash)).toBe(`v1/${HASH_VECTOR.hash}.mp3`)
  })
})
