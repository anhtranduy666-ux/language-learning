import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioButton } from './AudioButton'

function voice(lang: string): SpeechSynthesisVoice {
  return { lang, name: lang, default: false, localService: true, voiceURI: lang } as SpeechSynthesisVoice
}

/** Cài bộ máy đọc giả vào window trước khi render. */
function install(voices: SpeechSynthesisVoice[]) {
  const spoken: string[] = []

  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    cancel: vi.fn(),
    speak: (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance.text)
      utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
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

  return spoken
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AudioButton', () => {
  it('đọc từ khi người học bấm nút', async () => {
    const spoken = install([voice('zh-CN')])
    const user = userEvent.setup()

    render(<AudioButton text="你好" label="你好" />)
    await user.click(screen.getByRole('button', { name: 'Nghe phát âm 你好' }))

    expect(spoken).toEqual(['你好'])
  })

  it('vẫn hiện nút khi máy chưa có giọng tiếng Trung', () => {
    install([voice('en-US')])

    render(<AudioButton text="你好" />)

    expect(screen.getByRole('button', { name: 'Nghe phát âm' })).toBeInTheDocument()
  })

  it('bấm nút lúc thiếu giọng tiếng Trung thì chỉ cách cài thêm', async () => {
    const spoken = install([voice('en-US')])
    const user = userEvent.setup()

    render(<AudioButton text="你好" />)
    await user.click(screen.getByRole('button', { name: 'Nghe phát âm' }))

    expect(screen.getByRole('status')).toHaveTextContent(/chưa cài giọng tiếng Trung/i)
    expect(spoken).toEqual([])
  })

  it('bấm nút trên trình duyệt không hỗ trợ thì khuyên đổi trình duyệt', async () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const user = userEvent.setup()

    render(<AudioButton text="你好" />)
    await user.click(screen.getByRole('button', { name: 'Nghe phát âm' }))

    expect(screen.getByRole('status')).toHaveTextContent(/Chrome, Edge hoặc Safari/i)
  })

  it('không hiện lời nhắc khi chưa bấm', () => {
    install([voice('en-US')])

    render(<AudioButton text="你好" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('đánh dấu trạng thái để CSS làm mờ nút khi không phát được', () => {
    install([voice('en-US')])

    render(<AudioButton text="你好" />)

    expect(screen.getByRole('button')).toHaveAttribute('data-state', 'unavailable')
  })

  it('không làm lật thẻ khi nút nằm trong flashcard', async () => {
    install([voice('zh-CN')])
    const onFlip = vi.fn()
    const user = userEvent.setup()

    render(
      <button type="button" onClick={onFlip}>
        <AudioButton text="你好" />
      </button>,
    )
    await user.click(screen.getByRole('button', { name: 'Nghe phát âm' }))

    expect(onFlip).not.toHaveBeenCalled()
  })
})
