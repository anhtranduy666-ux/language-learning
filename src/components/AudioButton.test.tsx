import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioButton } from './AudioButton'
import { resetRemoteAudioCache } from '../lib/remoteAudio'

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

describe('AudioButton — audio tải từ Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    resetRemoteAudioCache()
  })

  it('hiện trạng thái chờ trong lúc tải file về', async () => {
    install([voice('zh-CN')])
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

    // CDN trả lời chậm, giữ nút ở chặng "đang tải" để test bắt được.
    let answer: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
    )

    const user = userEvent.setup()
    render(<AudioButton text="你好" />)
    const button = screen.getByRole('button', { name: 'Nghe phát âm' })

    await user.click(button)

    await waitFor(() => expect(button).toHaveAttribute('data-state', 'loading'))
    expect(button).toHaveAttribute('aria-busy', 'true')

    answer(new Response(null, { status: 404 }))
  })

  it('mạng hỏng thì hiện lời nhắc chứ không kẹt ở trạng thái đang đọc', async () => {
    install([voice('en-US')])
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )

    const user = userEvent.setup()
    render(<AudioButton text="你好" />)
    const button = screen.getByRole('button', { name: 'Nghe phát âm' })

    await user.click(button)

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    // Quay về `idle` chứ không phải `unavailable`: có Supabase nghĩa là máy này
    // phát âm được, chỉ là lần này hỏng mạng — người học bấm lại được ngay.
    expect(button).toHaveAttribute('data-state', 'idle')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })
})
