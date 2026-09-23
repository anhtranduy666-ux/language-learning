import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_ATTRIBUTE,
  THEME_KEY,
  applyTheme,
  loadThemeChoice,
  prefersDark,
  resolveTheme,
  saveThemeChoice,
  subscribeSystemTheme,
} from './theme'

/** Storage giả luôn ném lỗi, giống chế độ riêng tư chặn đọc/ghi. */
const BROKEN_STORAGE = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
} as Storage

/**
 * Thay `matchMedia` bằng bản giả điều khiển được.
 * jsdom có sẵn `matchMedia` nhưng luôn trả `false` và không bắn sự kiện.
 */
function stubMatchMedia(initiallyDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initiallyDark

  const query = {
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
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )

  return {
    /** Giả lập người dùng đổi chế độ ở cấp hệ điều hành. */
    set(dark: boolean) {
      matches = dark
      listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent))
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  document.documentElement.style.colorScheme = ''
})

describe('resolveTheme', () => {
  it('giữ nguyên lựa chọn cố định, bất kể hệ điều hành', () => {
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })

  it('bám theo hệ điều hành khi chọn "theo hệ thống"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('loadThemeChoice', () => {
  it('mặc định là "theo hệ thống" khi chưa lưu gì', () => {
    expect(loadThemeChoice()).toBe('system')
  })

  it('đọc lại đúng lựa chọn đã lưu', () => {
    saveThemeChoice('dark')
    expect(loadThemeChoice()).toBe('dark')
  })

  it('bỏ qua giá trị lạ trong localStorage', () => {
    localStorage.setItem(THEME_KEY, 'xanh lá')
    expect(loadThemeChoice()).toBe('system')
  })

  it('không vỡ khi localStorage chặn đọc', () => {
    expect(loadThemeChoice(BROKEN_STORAGE)).toBe('system')
  })
})

describe('saveThemeChoice', () => {
  it('ghi vào đúng khoá mà script nội tuyến trong index.html đang đọc', () => {
    saveThemeChoice('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(THEME_KEY).toBe('chinese-learning-app:theme:v1')
  })

  it('không ném lỗi khi localStorage từ chối ghi', () => {
    expect(() => saveThemeChoice('dark', BROKEN_STORAGE)).not.toThrow()
  })
})

describe('applyTheme', () => {
  it('đặt thuộc tính mà biến thể dark: của Tailwind trỏ vào', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark')
    expect(THEME_ATTRIBUTE).toBe('data-theme')
  })

  it('đặt color-scheme để thanh cuộn và ô nhập liệu đổi theo', () => {
    applyTheme('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})

describe('prefersDark', () => {
  it('trả về đúng chế độ của hệ điều hành', () => {
    stubMatchMedia(true)
    expect(prefersDark()).toBe(true)

    stubMatchMedia(false)
    expect(prefersDark()).toBe(false)
  })

  it('coi như chế độ sáng khi trình duyệt không có matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersDark()).toBe(false)
  })
})

describe('subscribeSystemTheme', () => {
  it('báo lại khi hệ điều hành đổi chế độ', () => {
    const media = stubMatchMedia(false)
    const seen: boolean[] = []

    const unsubscribe = subscribeSystemTheme((dark) => seen.push(dark))
    media.set(true)
    media.set(false)

    expect(seen).toEqual([true, false])
    unsubscribe()
  })

  it('huỷ theo dõi thì thôi không nhận tin nữa', () => {
    const media = stubMatchMedia(false)
    const seen: boolean[] = []

    subscribeSystemTheme((dark) => seen.push(dark))()
    media.set(true)

    expect(seen).toEqual([])
    expect(media.listenerCount).toBe(0)
  })

  it('không vỡ khi trình duyệt không có matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(() => subscribeSystemTheme(() => {})()).not.toThrow()
  })
})
