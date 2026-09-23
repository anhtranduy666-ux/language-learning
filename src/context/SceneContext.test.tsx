import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SceneProvider, useScene } from './SceneContext'
import { SCENE_ATTRIBUTE, SCENE_KEY } from '../lib/scene'

/** `matchMedia` giả, điều khiển được — jsdom luôn trả `false` và không bắn sự kiện. */
function stubMatchMedia(initiallyReduced: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initiallyReduced

  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
  }))

  return {
    /** Giả lập người dùng bật/tắt "giảm chuyển động" ở cấp hệ điều hành. */
    set(reduced: boolean) {
      act(() => {
        matches = reduced
        listeners.forEach((listener) => listener({ matches: reduced } as MediaQueryListEvent))
      })
    },
  }
}

function Harness() {
  const { choice, motion, setChoice } = useScene()
  return (
    <div>
      <p data-testid="choice">{choice}</p>
      <p data-testid="motion">{motion}</p>
      <button onClick={() => setChoice('full')}>Đầy đủ</button>
      <button onClick={() => setChoice('still')}>Tĩnh</button>
      <button onClick={() => setChoice('off')}>Tắt</button>
    </div>
  )
}

function renderHarness() {
  const user = userEvent.setup()
  render(
    <StrictMode>
      <SceneProvider>
        <Harness />
      </SceneProvider>
    </StrictMode>,
  )
  return { user }
}

const htmlScene = () => document.documentElement.getAttribute(SCENE_ATTRIBUTE)

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute(SCENE_ATTRIBUTE)
})

describe('SceneProvider', () => {
  it('mặc định chạy đầy đủ', () => {
    stubMatchMedia(false)
    renderHarness()

    expect(screen.getByTestId('choice')).toHaveTextContent('full')
    expect(screen.getByTestId('motion')).toHaveTextContent('animate')
    expect(htmlScene()).toBe('on')
  })

  it('máy đang xin giảm chuyển động thì cảnh đứng yên nhưng vẫn hiện', () => {
    stubMatchMedia(true)
    renderHarness()

    expect(screen.getByTestId('motion')).toHaveTextContent('still')
    expect(htmlScene()).toBe('on')
  })

  it('đổi ngay khi hệ điều hành bật giảm chuyển động giữa chừng', () => {
    const media = stubMatchMedia(false)
    renderHarness()
    expect(screen.getByTestId('motion')).toHaveTextContent('animate')

    media.set(true)

    expect(screen.getByTestId('motion')).toHaveTextContent('still')
  })

  it('tắt hẳn thì mặt thẻ quay lại màu đặc', async () => {
    stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Tắt' }))

    expect(screen.getByTestId('motion')).toHaveTextContent('none')
    expect(htmlScene()).toBe('off')
  })

  it('người học đã chọn tắt thì hệ điều hành nói gì cũng vẫn tắt', async () => {
    const media = stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Tắt' }))
    media.set(true)

    expect(screen.getByTestId('motion')).toHaveTextContent('none')
  })

  it('nhớ lựa chọn cho lần mở sau', async () => {
    stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Tĩnh' }))

    expect(localStorage.getItem(SCENE_KEY)).toBe('still')
  })

  it('khôi phục lựa chọn đã lưu', () => {
    localStorage.setItem(SCENE_KEY, 'off')
    stubMatchMedia(false)
    renderHarness()

    expect(screen.getByTestId('choice')).toHaveTextContent('off')
    expect(htmlScene()).toBe('off')
  })
})
