import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HASH_VECTOR } from './audioCacheKey'
import {
  CDN_TIMEOUT_MS,
  FUNCTION_TIMEOUT_MS,
  fetchWithTimeout,
  prefetchAudio,
  remoteAudioUrl,
  resetRemoteAudioCache,
} from './remoteAudio'

const SUPABASE_URL = 'https://abc.supabase.co'
const ANON_KEY = 'anon-key'
const CDN_URL = `${SUPABASE_URL}/storage/v1/object/public/tts/v1/${HASH_VECTOR.hash}.mp3`

/** Bật cấu hình Supabase cho một test. */
function configureSupabase() {
  vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', ANON_KEY)
}

/**
 * `fetch` giả trả lời theo từng chặng.
 * `cdn` là câu trả lời cho HEAD lên CDN, `fn` là cho POST lên Edge Function.
 */
function stubFetch(handlers: { cdn?: () => Response; fn?: () => Response }) {
  const fetchMock = vi.fn((url: string, init: RequestInit = {}) => {
    const handler = init.method === 'POST' ? handlers.fn : handlers.cdn
    if (!handler) return Promise.reject(new Error(`không mong đợi request tới ${url}`))
    return Promise.resolve(handler())
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const ok = () => new Response(null, { status: 200 })
const notFound = () => new Response(null, { status: 404 })
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  resetRemoteAudioCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('remoteAudioUrl — chưa cấu hình Supabase', () => {
  it('tắt hẳn, không chạm mạng một lần nào', async () => {
    const fetchMock = stubFetch({})
    expect(await remoteAudioUrl('你好')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('remoteAudioUrl — file đã có trên CDN', () => {
  it('trả URL công khai và không gọi Edge Function', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: ok })

    expect(await remoteAudioUrl('你好')).toBe(CDN_URL)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(CDN_URL)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('HEAD')
  })

  it('lần bấm sau đọc từ bộ nhớ, không chạm mạng nữa', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: ok })

    await remoteAudioUrl('你好')
    await remoteAudioUrl('你好')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('remoteAudioUrl — CDN chưa có file', () => {
  it('nhờ Edge Function sinh rồi trả URL vừa nhận', async () => {
    configureSupabase()
    const fetchMock = stubFetch({
      cdn: notFound,
      fn: () => json({ url: CDN_URL, hash: HASH_VECTOR.hash, cached: false }),
    })

    expect(await remoteAudioUrl('你好')).toBe(CDN_URL)

    const post = fetchMock.mock.calls[1]
    expect(post[0]).toBe(`${SUPABASE_URL}/functions/v1/speak`)
    expect(post[1]?.method).toBe('POST')
    expect(JSON.parse(String(post[1]?.body))).toEqual({
      text: '你好',
      voice: HASH_VECTOR.voice,
      rate: HASH_VECTOR.rate,
    })
  })

  it('gửi kèm khoá anon để Supabase cho qua cổng', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: notFound, fn: () => json({ url: CDN_URL }) })

    await remoteAudioUrl('你好')

    const headers = fetchMock.mock.calls[1][1]?.headers as Record<string, string>
    expect(headers.apikey).toBe(ANON_KEY)
    expect(headers.Authorization).toBe(`Bearer ${ANON_KEY}`)
  })

  it('chuỗi ngoài nội dung khoá học bị từ chối thì trả null', async () => {
    configureSupabase()
    stubFetch({ cdn: notFound, fn: () => json({ error: 'not_allowed' }, 403) })

    expect(await remoteAudioUrl('你好')).toBeNull()
  })

  it('nhà cung cấp TTS lỗi thì trả null', async () => {
    configureSupabase()
    stubFetch({ cdn: notFound, fn: () => json({ error: 'tts_failed' }, 502) })

    expect(await remoteAudioUrl('你好')).toBeNull()
  })

  it('Edge Function trả body không có url thì trả null', async () => {
    configureSupabase()
    stubFetch({ cdn: notFound, fn: () => json({ hash: HASH_VECTOR.hash }) })

    expect(await remoteAudioUrl('你好')).toBeNull()
  })

  it('đã biết là không có thì không hỏi lại trong cùng phiên', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: notFound, fn: () => json({ error: 'not_allowed' }, 403) })

    await remoteAudioUrl('你好')
    await remoteAudioUrl('你好')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('remoteAudioUrl — mạng hỏng', () => {
  it('trả null khi fetch ném lỗi', async () => {
    configureSupabase()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )

    expect(await remoteAudioUrl('你好')).toBeNull()
  })

  it('mỗi request đều mang theo hạn giờ', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: notFound, fn: () => json({ url: CDN_URL }) })

    await remoteAudioUrl('你好')

    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })
})

describe('fetchWithTimeout', () => {
  it('cắt request quá hạn và trả null thay vì treo', async () => {
    // `fetch` không bao giờ trả lời — đúng cảnh mạng chập chờn.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('AbortError')))
          }),
      ),
    )

    expect(await fetchWithTimeout('https://abc.supabase.co/x.mp3', {}, 10)).toBeNull()
  })

  it('trả nguyên response khi kịp giờ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(ok())),
    )

    const response = await fetchWithTimeout('https://abc.supabase.co/x.mp3', {}, 1_000)
    expect(response?.ok).toBe(true)
  })

  it('giữ đúng hạn giờ mà phương án kỹ thuật đã chốt', () => {
    expect(CDN_TIMEOUT_MS).toBe(3_000)
    expect(FUNCTION_TIMEOUT_MS).toBe(8_000)
  })
})

describe('remoteAudioUrl — đầu vào không hợp lệ', () => {
  it('bỏ qua chuỗi rỗng', async () => {
    configureSupabase()
    const fetchMock = stubFetch({})
    expect(await remoteAudioUrl('   ')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('bỏ qua chuỗi dài quá giới hạn', async () => {
    configureSupabase()
    const fetchMock = stubFetch({})
    expect(await remoteAudioUrl('好'.repeat(201))).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('prefetchAudio', () => {
  it('không làm gì khi chưa cấu hình Supabase', () => {
    const fetchMock = stubFetch({})
    prefetchAudio(['你好', '再见'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('nạp trước từng từ, bỏ trùng lặp', async () => {
    configureSupabase()
    const fetchMock = stubFetch({ cdn: ok })

    prefetchAudio(['你好', '再见', '你好', '  '])
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('không chạy quá số request song song cho phép', async () => {
    configureSupabase()
    let active = 0
    let peak = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        active += 1
        peak = Math.max(peak, active)
        await Promise.resolve()
        active -= 1
        return ok()
      }),
    )

    prefetchAudio(['一', '二', '三', '四', '五', '六'], 2)
    await vi.waitFor(() => expect(active).toBe(0))

    expect(peak).toBeLessThanOrEqual(2)
  })
})
