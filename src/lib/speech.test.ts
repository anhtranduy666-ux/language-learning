import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  findChineseVoice,
  getAudioStatus,
  playWord,
  subscribeAudioStatus,
} from './speech'

/** Giọng đọc giả, đủ trường để `speech.ts` xét ngôn ngữ. */
function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice
}

/** Bộ máy đọc giả: ghi lại câu được đọc và tự bắn sự kiện `end`. */
function fakeSynth(voices: SpeechSynthesisVoice[]) {
  const spoken: SpeechSynthesisUtterance[] = []
  const listeners: Record<string, Array<() => void>> = {}

  const synth = {
    spoken,
    getVoices: () => voices,
    cancel: vi.fn(),
    speak: (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
      utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
    },
    addEventListener: (type: string, fn: () => void) => {
      ;(listeners[type] ??= []).push(fn)
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners[type] = (listeners[type] ?? []).filter((item) => item !== fn)
    },
    /** Giả lập lúc trình duyệt nạp xong danh sách giọng. */
    emitVoicesChanged: (next: SpeechSynthesisVoice[]) => {
      voices.splice(0, voices.length, ...next)
      listeners.voiceschanged?.forEach((fn) => fn())
    },
  }

  return synth
}

function install(voices: SpeechSynthesisVoice[]) {
  const synth = fakeSynth(voices)
  vi.stubGlobal('speechSynthesis', synth)
  // `SpeechSynthesisUtterance` không có trong jsdom.
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      onend: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      constructor(public text: string) {}
    },
  )
  return synth
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('findChineseVoice', () => {
  it('không có giọng nào thì trả về null', () => {
    install([])
    expect(findChineseVoice()).toBeNull()
  })

  it('bỏ qua giọng không phải tiếng Trung', () => {
    install([voice('en-US'), voice('vi-VN')])
    expect(findChineseVoice()).toBeNull()
  })

  it('chọn được giọng tiếng Trung giữa các giọng khác', () => {
    install([voice('en-US'), voice('zh-CN'), voice('vi-VN')])
    expect(findChineseVoice()?.lang).toBe('zh-CN')
  })

  it('ưu tiên tiếng phổ thông đại lục hơn các biến thể khác', () => {
    install([voice('zh-HK'), voice('zh-TW'), voice('zh-CN')])
    expect(findChineseVoice()?.lang).toBe('zh-CN')
  })

  it('nhận cả mã cmn và yue', () => {
    install([voice('yue-HK')])
    expect(findChineseVoice()?.lang).toBe('yue-HK')
  })

  it('không phân biệt hoa thường hay gạch dưới trong mã ngôn ngữ', () => {
    install([voice('ZH_cn')])
    expect(findChineseVoice()?.lang).toBe('ZH_cn')
  })
})

describe('getAudioStatus', () => {
  it('trình duyệt không đọc được thì báo unsupported', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(getAudioStatus()).toBe('unsupported')
  })

  it('đọc được nhưng thiếu giọng tiếng Trung thì báo no-chinese-voice', () => {
    install([voice('en-US')])
    expect(getAudioStatus()).toBe('no-chinese-voice')
  })

  it('có giọng tiếng Trung thì sẵn sàng', () => {
    install([voice('zh-CN')])
    expect(getAudioStatus()).toBe('ready')
  })
})

describe('subscribeAudioStatus', () => {
  it('báo lại khi trình duyệt nạp xong danh sách giọng', () => {
    const synth = install([])
    const seen: string[] = []

    const stop = subscribeAudioStatus((status) => seen.push(status))
    synth.emitVoicesChanged([voice('zh-CN')])
    stop()

    expect(seen).toEqual(['ready'])
  })

  it('không báo lại khi tình trạng không đổi', () => {
    const synth = install([voice('en-US')])
    const onChange = vi.fn()

    const stop = subscribeAudioStatus(onChange)
    synth.emitVoicesChanged([voice('en-GB')])
    stop()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('huỷ theo dõi rồi thì thôi không báo nữa', () => {
    const synth = install([])
    const onChange = vi.fn()

    const stop = subscribeAudioStatus(onChange)
    stop()
    synth.emitVoicesChanged([voice('zh-CN')])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('trình duyệt không đọc được thì trả về hàm huỷ vô hại', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(() => subscribeAudioStatus(vi.fn())()).not.toThrow()
  })
})

describe('playWord', () => {
  it('đọc bằng giọng tiếng Trung đã chọn', async () => {
    const synth = install([voice('en-US'), voice('zh-CN')])

    await expect(playWord({ text: '你好' })).resolves.toBe('played')
    expect(synth.spoken).toHaveLength(1)
    expect(synth.spoken[0].text).toBe('你好')
    expect(synth.spoken[0].voice?.lang).toBe('zh-CN')
  })

  it('đọc chậm lại để người mới nghe kịp', async () => {
    const synth = install([voice('zh-CN')])

    await playWord({ text: '你好' })

    expect(synth.spoken[0].rate).toBeLessThan(1)
  })

  it('cắt ngang câu đang đọc trước khi đọc câu mới', async () => {
    const synth = install([voice('zh-CN')])

    await playWord({ text: '你好' })

    expect(synth.cancel).toHaveBeenCalled()
  })

  it('thiếu giọng tiếng Trung thì báo lại thay vì im lặng', async () => {
    const synth = install([voice('en-US')])

    await expect(playWord({ text: '你好' })).resolves.toBe('no-chinese-voice')
    expect(synth.spoken).toHaveLength(0)
  })

  it('trình duyệt không đọc được thì báo unsupported', async () => {
    vi.stubGlobal('speechSynthesis', undefined)
    await expect(playWord({ text: '你好' })).resolves.toBe('unsupported')
  })

  it('không kẹt mãi khi trình duyệt nuốt luôn câu đang đọc', async () => {
    // Chrome thỉnh thoảng không bắn sự kiện `end`. Nút phát âm phải tự thoát
    // trạng thái "đang đọc" thay vì quay mãi.
    install([voice('zh-CN')])
    vi.stubGlobal('speechSynthesis', {
      ...window.speechSynthesis,
      getVoices: () => [voice('zh-CN')],
      cancel: vi.fn(),
      speak: vi.fn(), // nhận câu rồi im lặng, không bao giờ báo xong
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.useFakeTimers()

    const playing = playWord({ text: '你好' })
    await vi.advanceTimersByTimeAsync(11_000)

    await expect(playing).resolves.toBe('error')
    vi.useRealTimers()
  })

  it('giọng đọc lỗi thì báo error chứ không ném ra ngoài', async () => {
    install([voice('zh-CN')])
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        constructor() {
          throw new TypeError('giọng không hợp lệ')
        }
      },
    )

    await expect(playWord({ text: '你好' })).resolves.toBe('error')
  })
})
