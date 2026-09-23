import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'
import { THEME_ATTRIBUTE, THEME_KEY } from '../lib/theme'

/** `matchMedia` giả, điều khiển được — jsdom luôn trả `false` và không bắn sự kiện. */
function stubMatchMedia(initiallyDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initiallyDark

  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
  }))

  return {
    /** Giả lập hệ điều hành đổi chế độ. */
    set(dark: boolean) {
      act(() => {
        matches = dark
        listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent))
      })
    },
  }
}

function Harness() {
  const { choice, theme, setChoice } = useTheme()
  return (
    <div>
      <p data-testid="choice">{choice}</p>
      <p data-testid="theme">{theme}</p>
      <button onClick={() => setChoice('dark')}>Tối</button>
      <button onClick={() => setChoice('light')}>Sáng</button>
      <button onClick={() => setChoice('system')}>Theo hệ thống</button>
    </div>
  )
}

function renderHarness() {
  const user = userEvent.setup()
  render(
    <StrictMode>
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    </StrictMode>,
  )
  return { user }
}

const htmlTheme = () => document.documentElement.getAttribute(THEME_ATTRIBUTE)

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  document.documentElement.style.colorScheme = ''
})

describe('ThemeProvider', () => {
  it('mặc định bám theo hệ điều hành', () => {
    stubMatchMedia(true)
    renderHarness()

    expect(screen.getByTestId('choice')).toHaveTextContent('system')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(htmlTheme()).toBe('dark')
  })

  it('đổi thẻ html ngay khi người học chọn chế độ tối', async () => {
    stubMatchMedia(false)
    const { user } = renderHarness()
    expect(htmlTheme()).toBe('light')

    await user.click(screen.getByRole('button', { name: 'Tối' }))

    expect(htmlTheme()).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('nhớ lựa chọn cho lần mở sau', async () => {
    stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Tối' }))

    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('khôi phục lựa chọn đã lưu, bỏ qua chế độ của hệ điều hành', () => {
    localStorage.setItem(THEME_KEY, 'light')
    stubMatchMedia(true)
    renderHarness()

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(htmlTheme()).toBe('light')
  })

  it('đang theo hệ thống thì đổi theo khi hệ điều hành đổi', () => {
    const media = stubMatchMedia(false)
    renderHarness()
    expect(htmlTheme()).toBe('light')

    media.set(true)

    expect(htmlTheme()).toBe('dark')
  })

  it('đã chọn cố định thì hệ điều hành đổi cũng không ảnh hưởng', async () => {
    const media = stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Sáng' }))
    media.set(true)

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(htmlTheme()).toBe('light')
  })

  it('quay lại "theo hệ thống" thì bắt lại đúng chế độ hiện tại của máy', async () => {
    const media = stubMatchMedia(false)
    const { user } = renderHarness()

    await user.click(screen.getByRole('button', { name: 'Sáng' }))
    media.set(true)
    await user.click(screen.getByRole('button', { name: 'Theo hệ thống' }))

    expect(htmlTheme()).toBe('dark')
  })
})
