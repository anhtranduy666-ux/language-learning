import type { CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { activeNavIndex } from '../lib/nav'

const ITEMS = [
  { to: '/', label: 'Trang chủ', end: true, Icon: HomeIcon },
  { to: '/learn', label: 'Học', end: false, Icon: BookIcon },
  { to: '/progress', label: 'Tiến độ', end: false, Icon: ChartIcon },
  { to: '/profile', label: 'Cá nhân', end: false, Icon: PersonIcon },
] as const

/**
 * Thanh điều hướng — bốn mục theo đúng mục 4 của bản thiết kế.
 *
 * Kiểu viên thuốc kính mờ nổi, mục đang chọn nằm trong một bong bóng trượt, và
 * icon chuyển từ nét viền sang tô đặc. Chỉ có icon, không có chữ: chữ ở đây
 * vẫn còn nhưng dành cho trình đọc màn hình (`aria-label`) và cho con trỏ chuột
 * dừng lại (`title`), để viên thuốc gọn như thanh tab của các app người học
 * dùng hằng ngày.
 *
 * Cơ chế bong bóng dùng chung với `BubbleSwitch` — xem `src/styles/bubble.css`.
 */
export function BottomNav() {
  const { pathname } = useLocation()
  const index = activeNavIndex(pathname, ITEMS)

  return (
    <nav
      aria-label="Điều hướng chính"
      data-active-index={index}
      className="bubble-track bubble-bar"
      style={{ '--count': ITEMS.length, '--index': Math.max(index, 0) } as CSSProperties}
    >
      <span aria-hidden="true" className="bubble-thumb" data-hidden={index < 0} />
      {ITEMS.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          title={label}
          className={({ isActive }) =>
            cn(
              'flex items-center justify-center rounded-full transition active:scale-90',
              isActive
                ? 'text-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
            )
          }
        >
          {({ isActive }) => <Icon filled={isActive} />}
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Khung chung của bốn icon: cùng cỡ, cùng độ dày nét. Mục đang chọn thì tô đặc
 * — cùng một hình, chỉ khác phần ruột, nên mắt nhận ra ngay đâu là chỗ mình
 * đang đứng mà không phải đọc gì.
 */
function IconFrame({ filled, children }: { filled: boolean; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      aria-hidden="true"
      data-filled={filled}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <IconFrame filled={filled}>
      <path d="M3.8 10.4 12 3.9l8.2 6.5v8.6a1.6 1.6 0 0 1-1.6 1.6h-3.5v-5.8H8.9v5.8H5.4a1.6 1.6 0 0 1-1.6-1.6Z" />
    </IconFrame>
  )
}

function BookIcon({ filled }: { filled: boolean }) {
  // Hai trang tách nhau ở gáy, để lúc tô đặc vẫn ra hình quyển sách mở.
  return (
    <IconFrame filled={filled}>
      <path d="M11.2 6.3C9.3 5 7 4.5 3.8 4.5v13c3.2 0 5.5.5 7.4 1.8Z" />
      <path d="M12.8 6.3c1.9-1.3 4.2-1.8 7.4-1.8v13c-3.2 0-5.5.5-7.4 1.8Z" />
    </IconFrame>
  )
}

function ChartIcon({ filled }: { filled: boolean }) {
  return (
    <IconFrame filled={filled}>
      <rect x="3.6" y="11" width="3.8" height="9.4" rx="1.4" />
      <rect x="10.1" y="3.8" width="3.8" height="16.6" rx="1.4" />
      <rect x="16.6" y="13.6" width="3.8" height="6.8" rx="1.4" />
    </IconFrame>
  )
}

function PersonIcon({ filled }: { filled: boolean }) {
  return (
    <IconFrame filled={filled}>
      <circle cx="12" cy="8" r="3.9" />
      <path d="M4.6 20.4c1.4-3.8 4.1-5.9 7.4-5.9s6 2.1 7.4 5.9Z" />
    </IconFrame>
  )
}
