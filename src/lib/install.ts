/**
 * Nhận diện khi nào nên mời người dùng cài app lên màn hình chính.
 *
 * Chrome trên Android tự hiện lời mời cài. Safari trên iOS thì không — người
 * dùng phải tự biết bấm Chia sẻ → Thêm vào MH chính, mà hầu như không ai biết.
 * Vì vậy app phải tự nhắc, và đây là chỗ quyết định lúc nào nên nhắc.
 *
 * Toàn bộ là hàm thuần, nhận thông tin máy làm tham số, để test trực tiếp
 * không cần giả lập cả một trình duyệt — xem `docs/pwa.md` mục 7.
 */

/** Những gì cần biết về máy đang mở app. */
export interface Platform {
  userAgent: string
  /** iPadOS 13 trở lên khai mình là Macintosh; số điểm chạm là cách phân biệt. */
  maxTouchPoints: number
  /** Đang chạy ở chế độ đã cài lên màn hình chính. */
  standalone: boolean
}

/** Trình duyệt iOS **không phải** Safari. Chỉ Safari mới thêm được vào màn hình chính. */
const OTHER_IOS_BROWSERS = ['CriOS', 'FxiOS', 'EdgiOS', 'OPiOS']

export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true
  // iPad từ iPadOS 13 giả làm máy Mac. Mac thật thì không có màn hình cảm ứng.
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1
}

/** Máy iOS và đang mở bằng Safari, không phải Chrome hay Firefox bản iOS. */
export function isIosSafari(userAgent: string, maxTouchPoints: number): boolean {
  if (!isIosDevice(userAgent, maxTouchPoints)) return false
  return !OTHER_IOS_BROWSERS.some((browser) => userAgent.includes(browser))
}

/**
 * Có nên hiện hướng dẫn cài không.
 *
 * Đã cài rồi mà vẫn nhắc là phiền, nên `standalone` cắt ngay từ đầu.
 */
export function shouldOfferInstall(platform: Platform): boolean {
  if (platform.standalone) return false
  return isIosSafari(platform.userAgent, platform.maxTouchPoints)
}

/** App có đang chạy ở chế độ đã cài không. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  // iOS dùng thuộc tính riêng; các nền tảng khác dùng media query chuẩn.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  if (iosStandalone === true) return true

  try {
    return window.matchMedia?.('(display-mode: standalone)').matches ?? false
  } catch {
    return false
  }
}

/** Thông tin máy đang dùng. Trả về giá trị an toàn khi không có `window`. */
export function currentPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', maxTouchPoints: 0, standalone: false }
  }
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone: isStandalone(),
  }
}
