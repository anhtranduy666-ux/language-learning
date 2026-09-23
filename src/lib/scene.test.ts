import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SCENE_ATTRIBUTE,
  SCENE_KEY,
  STREAK_BONUS_DAYS,
  applyScene,
  hasStreakBonus,
  isDocumentVisible,
  loadSceneChoice,
  prefersReducedMotion,
  resolveSceneMotion,
  saveSceneChoice,
  sceneStage,
  subscribeReducedMotion,
  subscribeVisibility,
} from './scene'

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
function stubMatchMedia(initiallyReduced: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initiallyReduced

  const query = {
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
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )

  return {
    /** Giả lập người dùng bật/tắt "giảm chuyển động" ở cấp hệ điều hành. */
    set(reduced: boolean) {
      matches = reduced
      listeners.forEach((listener) => listener({ matches: reduced } as MediaQueryListEvent))
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

/** Giả lập người học chuyển sang app khác rồi quay lại. */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  vi.unstubAllGlobals()
  setVisibility('visible')
  document.documentElement.removeAttribute(SCENE_ATTRIBUTE)
})

describe('resolveSceneMotion', () => {
  it('chạy đầy đủ khi người học chọn đầy đủ và hệ điều hành không xin gì', () => {
    expect(resolveSceneMotion('full', false)).toBe('animate')
  })

  it('đứng yên khi hệ điều hành xin giảm chuyển động', () => {
    expect(resolveSceneMotion('full', true)).toBe('still')
  })

  it('đứng yên khi người học tự chọn tĩnh', () => {
    expect(resolveSceneMotion('still', false)).toBe('still')
    expect(resolveSceneMotion('still', true)).toBe('still')
  })

  it('tắt hẳn là tắt hẳn, kể cả khi hệ điều hành không yêu cầu gì', () => {
    expect(resolveSceneMotion('off', false)).toBe('none')
    expect(resolveSceneMotion('off', true)).toBe('none')
  })
})

describe('sceneStage', () => {
  it('chưa học gì hôm nay thì còn là sương sớm', () => {
    expect(sceneStage(0, 50)).toBe('dawn')
  })

  it('đang học dở thì nắng lên', () => {
    expect(sceneStage(1, 50)).toBe('rising')
    expect(sceneStage(49, 50)).toBe('rising')
  })

  it('đạt mục tiêu thì cả vườn nở, và vượt mục tiêu cũng vậy', () => {
    expect(sceneStage(50, 50)).toBe('bloom')
    expect(sceneStage(120, 50)).toBe('bloom')
  })

  it('không vỡ khi dữ liệu hỏng', () => {
    expect(sceneStage(Number.NaN, 50)).toBe('dawn')
    expect(sceneStage(-10, 50)).toBe('dawn')
    expect(sceneStage(10, 0)).toBe('bloom')
  })
})

describe('hasStreakBonus', () => {
  it('thưởng khi giữ đủ một tuần liên tiếp', () => {
    expect(hasStreakBonus(STREAK_BONUS_DAYS - 1)).toBe(false)
    expect(hasStreakBonus(STREAK_BONUS_DAYS)).toBe(true)
    expect(hasStreakBonus(30)).toBe(true)
  })

  it('không thưởng khi chưa có streak', () => {
    expect(hasStreakBonus(0)).toBe(false)
  })
})

describe('applyScene', () => {
  it('báo cho mặt thẻ biết nền động đang bật', () => {
    applyScene('animate')
    expect(document.documentElement.getAttribute(SCENE_ATTRIBUTE)).toBe('on')

    applyScene('still')
    expect(document.documentElement.getAttribute(SCENE_ATTRIBUTE)).toBe('on')
  })

  it('tắt nền động thì thẻ quay lại màu đặc', () => {
    applyScene('none')
    expect(document.documentElement.getAttribute(SCENE_ATTRIBUTE)).toBe('off')
    expect(SCENE_ATTRIBUTE).toBe('data-scene')
  })
})

describe('loadSceneChoice', () => {
  it('mặc định là đầy đủ khi chưa lưu gì', () => {
    expect(loadSceneChoice()).toBe('full')
  })

  it('đọc lại đúng lựa chọn đã lưu', () => {
    saveSceneChoice('still')
    expect(loadSceneChoice()).toBe('still')
  })

  it('bỏ qua giá trị lạ trong localStorage', () => {
    localStorage.setItem(SCENE_KEY, 'lung linh')
    expect(loadSceneChoice()).toBe('full')
  })

  it('không vỡ khi localStorage chặn đọc', () => {
    expect(loadSceneChoice(BROKEN_STORAGE)).toBe('full')
  })
})

describe('saveSceneChoice', () => {
  it('ghi vào khoá riêng, tách khỏi khoá tiến độ và khoá giao diện', () => {
    saveSceneChoice('off')
    expect(localStorage.getItem(SCENE_KEY)).toBe('off')
    expect(SCENE_KEY).toBe('chinese-learning-app:scene:v1')
  })

  it('không ném lỗi khi localStorage từ chối ghi', () => {
    expect(() => saveSceneChoice('off', BROKEN_STORAGE)).not.toThrow()
  })
})

describe('prefersReducedMotion', () => {
  it('trả về đúng tuỳ chọn của hệ điều hành', () => {
    stubMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)

    stubMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('coi như không yêu cầu gì khi trình duyệt không có matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('subscribeReducedMotion', () => {
  it('báo lại khi hệ điều hành đổi tuỳ chọn', () => {
    const media = stubMatchMedia(false)
    const seen: boolean[] = []

    const unsubscribe = subscribeReducedMotion((reduced) => seen.push(reduced))
    media.set(true)
    media.set(false)

    expect(seen).toEqual([true, false])
    unsubscribe()
  })

  it('huỷ theo dõi thì thôi không nhận tin nữa', () => {
    const media = stubMatchMedia(false)
    const seen: boolean[] = []

    subscribeReducedMotion((reduced) => seen.push(reduced))()
    media.set(true)

    expect(seen).toEqual([])
    expect(media.listenerCount).toBe(0)
  })

  it('không vỡ khi trình duyệt không có matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(() => subscribeReducedMotion(() => {})()).not.toThrow()
  })
})

describe('subscribeVisibility', () => {
  it('báo lại khi người học chuyển sang app khác rồi quay lại', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeVisibility((visible) => seen.push(visible))

    setVisibility('hidden')
    setVisibility('visible')

    expect(seen).toEqual([false, true])
    unsubscribe()
  })

  it('huỷ theo dõi thì thôi không nhận tin nữa', () => {
    const seen: boolean[] = []
    subscribeVisibility((visible) => seen.push(visible))()

    setVisibility('hidden')

    expect(seen).toEqual([])
  })

  it('isDocumentVisible bám theo trạng thái thật của trang', () => {
    setVisibility('hidden')
    expect(isDocumentVisible()).toBe(false)

    setVisibility('visible')
    expect(isDocumentVisible()).toBe(true)
  })
})
