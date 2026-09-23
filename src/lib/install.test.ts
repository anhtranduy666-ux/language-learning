import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  currentPlatform,
  isIosDevice,
  isIosSafari,
  isStandalone,
  shouldOfferInstall,
} from './install'

/** User agent thật, rút gọn phần không liên quan. */
const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0 Mobile/15E148 Safari/604.1',
  iphoneFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15',
  // iPadOS 13 trở lên khai y hệt máy Mac.
  ipadOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isIosDevice', () => {
  it('nhận ra iPhone', () => {
    expect(isIosDevice(UA.iphoneSafari, 5)).toBe(true)
  })

  it('nhận ra iPad dù nó khai mình là máy Mac', () => {
    // Đây là chỗ dễ sót nhất: iPadOS 13 trở lên dùng user agent của macOS.
    expect(isIosDevice(UA.ipadOS, 5)).toBe(true)
  })

  it('không nhầm máy Mac thật thành iPad', () => {
    expect(isIosDevice(UA.macSafari, 0)).toBe(false)
  })

  it('không nhận nhầm Android hay Windows', () => {
    expect(isIosDevice(UA.androidChrome, 5)).toBe(false)
    expect(isIosDevice(UA.windowsChrome, 0)).toBe(false)
  })
})

describe('isIosSafari', () => {
  it('nhận ra Safari trên iPhone', () => {
    expect(isIosSafari(UA.iphoneSafari, 5)).toBe(true)
  })

  it('loại Chrome và Firefox bản iOS', () => {
    // Cùng là WebKit, nhưng chỉ Safari mới thêm được vào màn hình chính.
    expect(isIosSafari(UA.iphoneChrome, 5)).toBe(false)
    expect(isIosSafari(UA.iphoneFirefox, 5)).toBe(false)
  })
})

describe('shouldOfferInstall', () => {
  it('mời cài khi đang mở bằng Safari trên iPhone', () => {
    expect(
      shouldOfferInstall({ userAgent: UA.iphoneSafari, maxTouchPoints: 5, standalone: false }),
    ).toBe(true)
  })

  it('thôi mời khi app đã được cài', () => {
    expect(
      shouldOfferInstall({ userAgent: UA.iphoneSafari, maxTouchPoints: 5, standalone: true }),
    ).toBe(false)
  })

  it('không mời trên Chrome iOS, vì ở đó không cài được', () => {
    expect(
      shouldOfferInstall({ userAgent: UA.iphoneChrome, maxTouchPoints: 5, standalone: false }),
    ).toBe(false)
  })

  it('không mời trên Android — Chrome ở đó tự hiện lời mời của hệ thống', () => {
    expect(
      shouldOfferInstall({ userAgent: UA.androidChrome, maxTouchPoints: 5, standalone: false }),
    ).toBe(false)
  })

  it('không mời trên máy tính', () => {
    expect(
      shouldOfferInstall({ userAgent: UA.windowsChrome, maxTouchPoints: 0, standalone: false }),
    ).toBe(false)
    expect(
      shouldOfferInstall({ userAgent: UA.macSafari, maxTouchPoints: 0, standalone: false }),
    ).toBe(false)
  })
})

describe('isStandalone', () => {
  it('nhận ra chế độ đã cài kiểu iOS', () => {
    vi.stubGlobal('navigator', { ...navigator, standalone: true })
    expect(isStandalone()).toBe(true)
  })

  it('nhận ra chế độ đã cài qua media query chuẩn', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(isStandalone()).toBe(true)
  })

  it('mở bằng trình duyệt bình thường thì không phải chế độ đã cài', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(false)
  })

  it('không vỡ khi trình duyệt không có matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(() => isStandalone()).not.toThrow()
  })
})

describe('currentPlatform', () => {
  it('đọc được thông tin máy đang dùng', () => {
    vi.stubGlobal('navigator', { userAgent: UA.iphoneSafari, maxTouchPoints: 5 })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))

    expect(currentPlatform()).toEqual({
      userAgent: UA.iphoneSafari,
      maxTouchPoints: 5,
      standalone: false,
    })
  })
})
