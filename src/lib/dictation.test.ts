import { afterEach, describe, expect, it, vi } from 'vitest'
import { classifyDictationError, dictationSupported, startDictation } from './dictation'

/** `SpeechRecognition` giả: ghi lại cấu hình, và cho test tự bắn kết quả, lỗi, kết thúc. */
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  interimResults = false
  continuous = true
  maxAlternatives = 0
  started = false
  onresult: ((event: { results: unknown }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null

  constructor() {
    FakeRecognition.last = this
  }

  start() {
    this.started = true
  }

  stop() {
    this.onend?.()
  }

  abort() {
    this.onerror?.({ error: 'aborted' })
    this.onend?.()
  }

  /** Trình duyệt nghe ra chữ: mỗi phần tử là một đoạn [chữ, đã chốt chưa]. */
  hear(...parts: Array<[string, boolean]>) {
    const results = parts.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript } }))
    this.onresult?.({ results })
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  FakeRecognition.last = null
})

function install() {
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition)
}

describe('dictationSupported', () => {
  it('không có nhận dạng giọng nói thì báo không hỗ trợ', () => {
    expect(dictationSupported()).toBe(false)
  })

  it('có bản webkit (Chrome, Safari) là đủ', () => {
    install()
    expect(dictationSupported()).toBe(true)
  })
})

describe('startDictation', () => {
  it('nghe đúng ngôn ngữ, hiện chữ trong lúc nói, xong thì trả cả câu', () => {
    install()
    const onText = vi.fn()
    const onEnd = vi.fn()
    startDictation({ lang: 'zh-CN', onText, onEnd })

    const recognition = FakeRecognition.last!
    expect(recognition).toMatchObject({ lang: 'zh-CN', interimResults: true, continuous: false, started: true })

    recognition.hear(['你好', false])
    expect(onText).toHaveBeenLastCalledWith('你好')
    recognition.hear(['你好', true], ['，我想喝茶', true])
    expect(onText).toHaveBeenLastCalledWith('你好，我想喝茶')

    recognition.onend?.()
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ text: '你好，我想喝茶', failure: null })
  })

  it('dừng giữa chừng thì vẫn giữ những gì đã nghe được', () => {
    install()
    const onEnd = vi.fn()
    const dictation = startDictation({ lang: 'vi-VN', onText: () => {}, onEnd })

    FakeRecognition.last!.hear(['xin chào', false])
    dictation.stop()
    expect(onEnd).toHaveBeenCalledWith({ text: 'xin chào', failure: null })
  })

  it('không nghe thấy gì thì báo no-speech, kể cả khi trình duyệt không báo lỗi', () => {
    install()
    const onEnd = vi.fn()
    startDictation({ lang: 'vi-VN', onText: () => {}, onEnd })
    FakeRecognition.last!.onend?.()
    expect(onEnd).toHaveBeenCalledWith({ text: '', failure: 'no-speech' })
  })

  it('bị chặn micro thì nói rõ là bị chặn', () => {
    install()
    const onEnd = vi.fn()
    startDictation({ lang: 'vi-VN', onText: () => {}, onEnd })
    FakeRecognition.last!.onerror?.({ error: 'not-allowed' })
    FakeRecognition.last!.onend?.()
    expect(onEnd).toHaveBeenCalledWith({ text: '', failure: 'denied' })
  })

  it('huỷ thì im luôn, không báo kết thúc', () => {
    install()
    const onEnd = vi.fn()
    const dictation = startDictation({ lang: 'vi-VN', onText: () => {}, onEnd })
    dictation.cancel()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('trình duyệt không hỗ trợ thì báo ngay, không ném lỗi', () => {
    const onEnd = vi.fn()
    const dictation = startDictation({ lang: 'vi-VN', onText: () => {}, onEnd })
    expect(onEnd).toHaveBeenCalledWith({ text: '', failure: 'unsupported' })
    expect(() => dictation.stop()).not.toThrow()
  })
})

describe('classifyDictationError', () => {
  it('đổi mã lỗi của trình duyệt ra lý do dễ hiểu', () => {
    expect(classifyDictationError('not-allowed')).toBe('denied')
    expect(classifyDictationError('service-not-allowed')).toBe('denied')
    expect(classifyDictationError('no-speech')).toBe('no-speech')
    expect(classifyDictationError('audio-capture')).toBe('no-mic')
    expect(classifyDictationError('network')).toBe('network')
    expect(classifyDictationError('language-not-supported')).toBe('error')
  })

  it('app tự dừng nghe thì không phải lỗi', () => {
    expect(classifyDictationError('aborted')).toBeNull()
  })
})
