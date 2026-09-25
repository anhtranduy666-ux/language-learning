import { afterEach, describe, expect, it, vi } from 'vitest'
import { Endpointer, MicError, classifyMicError, levelFromRms, micSupport, startRecording } from './recorder'

/** Cài tạm những API thu âm mà jsdom không có. */
function installMedia({ secure = true, mediaDevices = true, audioContext = true } = {}) {
  Object.defineProperty(window, 'isSecureContext', { value: secure, configurable: true })
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: mediaDevices ? { getUserMedia: vi.fn() } : undefined,
  })
  vi.stubGlobal('AudioContext', audioContext ? class {} : undefined)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('micSupport', () => {
  it('đủ API và chạy qua https thì thu được', () => {
    installMedia()
    expect(micSupport()).toBe('ok')
  })

  it('không chạy qua https thì trình duyệt chặn micro', () => {
    installMedia({ secure: false })
    expect(micSupport()).toBe('insecure')
  })

  it('trình duyệt không có API thu âm', () => {
    installMedia({ mediaDevices: false })
    expect(micSupport()).toBe('unsupported')
    installMedia({ audioContext: false })
    expect(micSupport()).toBe('unsupported')
  })

  it('không thu được thì startRecording ném MicError kèm lý do, không xin quyền vô ích', async () => {
    installMedia({ secure: false })
    await expect(startRecording()).rejects.toEqual(new MicError('insecure'))
  })
})

describe('classifyMicError', () => {
  const named = (name: string) => Object.assign(new Error(name), { name })

  it('người dùng từ chối quyền', () => {
    expect(classifyMicError(named('NotAllowedError'))).toBe('denied')
    expect(classifyMicError(named('SecurityError'))).toBe('denied')
  })

  it('máy không có micro', () => {
    expect(classifyMicError(named('NotFoundError'))).toBe('no-device')
  })

  it('micro đang bị ứng dụng khác giữ', () => {
    expect(classifyMicError(named('NotReadableError'))).toBe('busy')
  })

  it('lỗi lạ thì không đoán mò', () => {
    expect(classifyMicError(named('WeirdError'))).toBe('error')
    expect(classifyMicError(null)).toBe('error')
  })
})

describe('levelFromRms', () => {
  it('im lặng là 0, rất to là 1, ở giữa tăng dần', () => {
    expect(levelFromRms(0)).toBe(0)
    expect(levelFromRms(1)).toBe(1)
    expect(levelFromRms(0.01)).toBeGreaterThan(levelFromRms(0.001))
  })
})

describe('Endpointer', () => {
  const CHUNK = 0.05
  const QUIET = 0.001 // -60 dB
  const VOICE = 0.1 // -20 dB

  /** Đẩy một dãy mức âm, trả thời điểm (giây) được bảo dừng, hoặc null. */
  function run(endpointer: Endpointer, levels: Array<[number, number]>): number | null {
    let t = 0
    for (const [rms, seconds] of levels) {
      for (let i = 0; i < Math.round(seconds / CHUNK); i += 1) {
        t += CHUNK
        if (endpointer.push(rms, CHUNK) === 'stop') return Math.round(t * 100) / 100
      }
    }
    return null
  }

  it('đọc xong rồi im lặng thì dừng sau chừng một giây', () => {
    const stoppedAt = run(new Endpointer(), [
      [QUIET, 0.5],
      [VOICE, 0.6],
      [QUIET, 3],
    ])
    expect(stoppedAt).toBeGreaterThanOrEqual(1.95)
    expect(stoppedAt).toBeLessThanOrEqual(2.1)
  })

  it('chưa nói gì thì không tự dừng vì im lặng — người học đang nghĩ', () => {
    expect(run(new Endpointer(10), [[QUIET, 4]])).toBeNull()
  })

  it('một tiếng cạch ngắn không tính là đã nói', () => {
    expect(run(new Endpointer(10), [[QUIET, 0.5], [VOICE, 0.05], [QUIET, 3]])).toBeNull()
  })

  it('ngừng giữa hai âm tiết không làm dừng sớm', () => {
    const stoppedAt = run(new Endpointer(), [
      [QUIET, 0.4],
      [VOICE, 0.3],
      [QUIET, 0.3],
      [VOICE, 0.3],
      [QUIET, 3],
    ])
    expect(stoppedAt).toBeGreaterThan(1.3)
  })

  it('hết giờ thì dừng dù vẫn đang có tiếng', () => {
    expect(run(new Endpointer(2), [[VOICE, 5]])).toBeCloseTo(2, 1)
  })

  it('phòng ồn thì ngưỡng nâng theo nền ồn, tiếng ồn đều không bị coi là giọng nói', () => {
    // Nền ồn -40 dB kéo dài: không có "giọng nói" nào nổi hơn nền 15 dB.
    expect(run(new Endpointer(10), [[0.01, 4]])).toBeNull()
  })
})
