import { afterEach, describe, expect, it, vi } from 'vitest'
import { referenceSeconds, resetReferenceCache } from './referenceAudio'
import { RATE, spokenWord } from '../test/synthVoice'

/** Web Audio giả: "giải mã" ra đúng tín hiệu dựng sẵn. */
function installDecoder(samples: Float32Array) {
  const decode = vi.fn((_bytes: ArrayBuffer, resolve: (buffer: AudioBuffer) => void) =>
    resolve({ sampleRate: RATE, getChannelData: () => samples } as unknown as AudioBuffer),
  )
  vi.stubGlobal(
    'OfflineAudioContext',
    class {
      decodeAudioData = decode
    },
  )
  const fetch = vi.fn(async () => new Response(new ArrayBuffer(8)))
  vi.stubGlobal('fetch', fetch)
  return { decode, fetch }
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetReferenceCache()
})

describe('referenceSeconds', () => {
  it('đo độ dài phần có tiếng của file mẫu', async () => {
    installDecoder(spokenWord([4, 4], 200))
    const seconds = await referenceSeconds('/audio/zaijian.mp3')
    expect(seconds!).toBeGreaterThan(0.65)
    expect(seconds!).toBeLessThan(0.78)
  })

  it('mỗi file chỉ giải mã một lần', async () => {
    const { decode, fetch } = installDecoder(spokenWord([1], 220))
    await referenceSeconds('/audio/ta.mp3')
    await referenceSeconds('/audio/ta.mp3')
    expect(fetch).toHaveBeenCalledOnce()
    expect(decode).toHaveBeenCalledOnce()
  })

  it('không có file thì không có mốc, bộ chấm bỏ phần nhịp', async () => {
    expect(await referenceSeconds(null)).toBeNull()
  })

  it('giải mã hỏng thì trả null chứ không ném lỗi ra màn hình', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))))
    vi.stubGlobal('OfflineAudioContext', class {})
    expect(await referenceSeconds('/audio/x.mp3')).toBeNull()
  })
})
