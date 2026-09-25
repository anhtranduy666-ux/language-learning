/**
 * Bộ icon màu của app — vẽ tay bằng SVG, thay cho emoji.
 *
 * Emoji mỗi hệ điều hành vẽ một kiểu, và trông như đồ dùng chung của mọi app:
 * ngọn lửa, ngôi sao, chồng sách của bàn phím điện thoại làm màn hình trông
 * "máy móc". Bộ này vẽ cùng một giọng với Zibi:
 * khối tròn trịa, tô phẳng hai ba tông (sáng, tối cho có khối), một đốm bóng
 * trắng, không viền đen — nên đứng được trên cả nền sáng lẫn nền tối.
 *
 * Mọi icon đều là trang trí, luôn `aria-hidden`: con số và nhãn đi kèm mới là
 * nội dung. Không dùng gradient nên không có id, đặt bao nhiêu cái cùng trang
 * cũng được.
 */

import type { ReactElement, ReactNode } from 'react'
import type { AchievementIconName } from '../../types'

interface IconProps {
  /** Cạnh của hình vuông, tính bằng px. */
  size?: number
  className?: string
}

function Frame({ size = 28, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      data-icon=""
    >
      {children}
    </svg>
  )
}

/** Đường sao năm cánh quanh (cx, cy). */
function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

/** Ngọn lửa của chuỗi ngày học. */
export function StreakIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path
        d="M16.4 2.8c1 3.9 4.2 6.2 6.6 9.3 2 2.6 3.1 5.3 3.1 8.2 0 5.8-4.5 9.7-10.1 9.7S5.9 26.1 5.9 20.4c0-3.5 1.6-6.4 3.8-8.3.2 2.2 1 3.7 2.3 4.5-.4-5.5 1.3-10.1 4.4-13.8Z"
        fill="#ff7b2e"
      />
      <path
        d="M21.3 10.2c.6.6 1.2 1.3 1.7 1.9 2 2.6 3.1 5.3 3.1 8.2 0 5.8-4.5 9.7-10.1 9.7 3.9-1.2 6.4-4.6 6.4-8.8 0-4.1-1.9-7.4-1.1-11Z"
        fill="#f0521f"
      />
      <path
        d="M16.1 14.6c.9 2.3 2.7 3.5 3.8 5.3.6 1.1.9 2.2.9 3.3 0 2.8-2.1 4.8-4.8 4.8s-4.8-2-4.8-4.8c0-1.9.9-3.4 2-4.4.2 1.2.8 2 1.6 2.3-.3-2.6.4-4.8 1.3-6.5Z"
        fill="#ffd23f"
      />
      <ellipse cx="11.4" cy="17.6" rx="1.3" ry="2.6" transform="rotate(20 11.4 17.6)" fill="#ffffff" opacity=".45" />
    </Frame>
  )
}

/** Ngôi sao XP: mũi tròn, bóng đổ nhẹ cho nổi khối. */
export function XpIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d={starPath(16.8, 18, 12.4, 5.9)} fill="#f2a516" stroke="#f2a516" strokeWidth="3" strokeLinejoin="round" />
      <path d={starPath(16, 16.8, 12.4, 5.9)} fill="#ffcc33" stroke="#ffcc33" strokeWidth="3" strokeLinejoin="round" />
      <path d="M11.4 13.4l2.6-.6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <circle cx="10.4" cy="16.2" r="1" fill="#ffffff" opacity=".6" />
    </Frame>
  )
}

/** Ngôi sao XP lớn có tia lấp lánh — cho mốc 1.000 XP. */
export function ShineIcon(props: IconProps) {
  const sparkle = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`
  return (
    <Frame {...props}>
      <path d={starPath(16.6, 18.4, 11, 5.2)} fill="#f2a516" stroke="#f2a516" strokeWidth="3" strokeLinejoin="round" />
      <path d={starPath(16, 17.4, 11, 5.2)} fill="#ffcc33" stroke="#ffcc33" strokeWidth="3" strokeLinejoin="round" />
      <path d="M11.8 14.6l2.2-.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
      <path d={sparkle(27, 5.4, 3.6)} fill="#ffd95c" />
      <path d={sparkle(4.8, 8, 2.6)} fill="#ffd95c" />
      <path d={sparkle(28, 25.6, 2.2)} fill="#ffe89a" />
    </Frame>
  )
}

/** Huy hiệu cấp độ: cái khiên với hai vạch lon. */
export function LevelIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M16 3.2l10.4 3.9v8.2c0 6.6-4.3 11.4-10.4 13.6C9.9 26.7 5.6 21.9 5.6 15.3V7.1Z" fill="#7b8cff" />
      <path d="M16 3.2l10.4 3.9v8.2c0 6.6-4.3 11.4-10.4 13.6Z" fill="#5f6fe8" />
      <g fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.6 13.6l5.4 3.4 5.4-3.4" />
        <path d="M10.6 18.8l5.4 3.4 5.4-3.4" />
      </g>
      <path d="M9.2 8.6l3.6-1.3" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
    </Frame>
  )
}

/** Tấm thẻ từ có chữ 字 — "từ đã nhớ". */
export function WordsIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="5.4" y="5.6" width="15.6" height="20" rx="3.4" transform="rotate(-12 13.2 15.6)" fill="#ffb4a8" />
      <rect x="10" y="6.4" width="16" height="20.6" rx="3.4" fill="#fffaf5" />
      <rect x="10" y="6.4" width="16" height="20.6" rx="3.4" fill="none" stroke="#ffd9d2" strokeWidth="1.2" />
      {/* 字 viết tay: chấm, mái nhà, rồi 子. */}
      <g fill="none" stroke="#e5484d" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 9.6v1.4" />
        <path d="M13.6 13.8v-1.7h8.8v1.7" />
        <path d="M15.2 15.2h5l-2.4 2" />
        <path d="M17.8 17.4v5.4c0 1.1-.6 1.5-1.8 1.2" />
        <path d="M14 20.2h8" />
      </g>
    </Frame>
  )
}

/** Cuốn sách mở có dấu tích xanh — "bài đã xong". */
export function LessonsIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M2.8 9.6c4.2-1.6 8.8-1.2 13.2 1.4 4.4-2.6 9-3 13.2-1.4v15.8c-4.2-1.4-8.8-1-13.2 1.6-4.4-2.6-9-3-13.2-1.6Z" fill="#1f9d6b" />
      <path d="M4.4 8.4c3.8-1.2 7.8-.8 11.6 1.4v14.4c-3.8-2.2-7.8-2.6-11.6-1.4Z" fill="#fffaf0" />
      <path d="M27.6 8.4c-3.8-1.2-7.8-.8-11.6 1.4v14.4c3.8-2.2 7.8-2.6 11.6-1.4Z" fill="#fff3dc" />
      <g stroke="#e9dcc3" strokeWidth="1.1" strokeLinecap="round">
        <path d="M7 12.4c2.2-.5 4.4-.3 6.4.6M7 15.6c2.2-.5 4.4-.3 6.4.6" />
      </g>
      <circle cx="24" cy="23.6" r="5.6" fill="#16a34a" stroke="#ffffff" strokeWidth="1.6" />
      <path d="M21.4 23.8l1.8 1.8 3.4-3.6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  )
}

/** Ngọn núi cắm cờ trên đỉnh — đi được bao nhiêu phần của cả khoá. */
export function CourseIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M2.6 27L12.8 10.2 17.6 17.6 21.2 12.6 29.4 27Z" fill="#7b8cff" />
      <path d="M12.8 10.2L17.6 17.6 15.2 27H29.4L21.2 12.6 17.6 17.6Z" fill="#5f6fe8" />
      <path d="M12.8 10.2L9.9 15l1.9-.9 1.3 1.6 1.4-1.8 1.5.9Z" fill="#ffffff" />
      <path d="M21.2 12.6l-1.9 2.7 1.4-.5 1 1.2 1-1.3 1.2.4Z" fill="#ffffff" opacity=".9" />
      <path d="M12.8 10.4V3.4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.8 3.6l6.6 2.3-6.6 2.4Z" fill="#ef4444" />
    </Frame>
  )
}

/** Hồng tâm có mũi phi tiêu — "bài đầu tiên", "bài tập ngắn". */
export function TargetIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="14.6" cy="17.4" r="11.8" fill="#ef4444" />
      <circle cx="14.6" cy="17.4" r="8.4" fill="#fffaf5" />
      <circle cx="14.6" cy="17.4" r="5" fill="#ef4444" />
      <circle cx="14.6" cy="17.4" r="1.8" fill="#fffaf5" />
      <path d="M14.8 17.2L26.4 5.6" stroke="#7c4a1e" strokeWidth="2" strokeLinecap="round" />
      <path d="M26.4 5.6l.6-3 1.4 3.8-3.8-1.4Z" fill="#f59e0b" />
      <path d="M26.4 5.6l3-.6-3.8 1.4 1.4-3.8Z" fill="#fbbf24" />
      <circle cx="9.4" cy="11.8" r="1.4" fill="#ffffff" opacity=".45" />
    </Frame>
  )
}

/** Mầm cây nhú khỏi đất — cùng dáng với cái mầm trên đầu Zibi. */
export function SproutIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M4 27.4c2.4-3.6 6.9-5.6 12-5.6s9.6 2 12 5.6Z" fill="#b07d57" />
      <path d="M17.4 21.9c4.6.3 8.4 2.3 10.6 5.5h-6.2c-.4-2.2-1.9-4-4.4-5.5Z" fill="#94643f" />
      <path d="M16 22.6c0-4.6.4-8.2 1.4-11" stroke="#3f7a4d" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M17.2 12.4c2.4-4.6 6.6-6.6 10.2-5.6-.6 4.4-4.6 7.8-9.6 7.6-.6 0-.8-1.2-.6-2Z" fill="#5cb96b" />
      <path d="M16.6 14.6c-2.6-3.8-6.6-4.8-9.6-3.4 1 3.8 4.6 6 8.6 5 .8-.2 1.4-.8 1-1.6Z" fill="#8bd396" />
      <path d="M21.4 9.6l2.6-1" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
    </Frame>
  )
}

/** Chồng ba cuốn sách — "50 từ". */
export function BooksIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="4.2" y="21" width="23.6" height="6.4" rx="1.8" fill="#3b82f6" />
      <path d="M8 22.6h17.4v3.2H8Z" fill="#fff7e6" />
      <rect x="6.4" y="14.2" width="21" height="6.4" rx="1.8" transform="rotate(-4 16.9 17.4)" fill="#22b573" />
      <path d="M9.6 15.8l15.8-1.1.2 3.2-15.8 1.1Z" fill="#fff7e6" />
      <rect x="5.6" y="7.4" width="20.6" height="6.4" rx="1.8" fill="#ef4444" />
      <path d="M9.2 9h13.6v3.2H9.2Z" fill="#fff7e6" />
      <path d="M7.4 9.6h.1" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
    </Frame>
  )
}

/** Cúp vàng — "100 từ". */
export function TrophyIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <g fill="none" stroke="#f2a516" strokeWidth="2.4" strokeLinecap="round">
        <path d="M8.6 8.4H5.2c0 4.4 1.8 7 5 7.6" />
        <path d="M23.4 8.4h3.4c0 4.4-1.8 7-5 7.6" />
      </g>
      <path d="M8.2 5h15.6v5.4c0 5.4-3.4 9.2-7.8 9.2s-7.8-3.8-7.8-9.2Z" fill="#ffcc33" />
      <path d="M16 19.6c4.4 0 7.8-3.8 7.8-9.2V5H19c0 7.4-.6 12-3 14.6Z" fill="#f2a516" />
      <path d="M14.4 19.4h3.2v4.4h-3.2Z" fill="#e0940d" />
      <rect x="10" y="23.4" width="12" height="4.4" rx="1.4" fill="#8b5e34" />
      <rect x="10" y="23.4" width="12" height="1.6" rx=".8" fill="#a8743f" />
      <path d="M11.4 7.8v3.4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
    </Frame>
  )
}

/** Huy chương vàng có ruy băng — "Unit Master". */
export function MedalIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M8.2 2.8h5.4l4.6 9.2-3.4 3.6Z" fill="#ef4444" />
      <path d="M23.8 2.8h-5.4l-4.6 9.2 3.4 3.6Z" fill="#3b82f6" />
      <circle cx="16" cy="20.2" r="9" fill="#f2a516" />
      <circle cx="16" cy="20.2" r="6.8" fill="#ffcc33" />
      <path d={starPath(16, 20.6, 4.2, 1.9)} fill="#fff4c2" stroke="#fff4c2" strokeWidth="1" strokeLinejoin="round" />
      <path d="M10.6 16.4a6.8 6.8 0 0 1 2.2-2" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".6" />
    </Frame>
  )
}

/** Ổ khoá — thành tích chưa mở. */
export function LockIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M10.4 14V10a5.6 5.6 0 0 1 11.2 0v4" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <rect x="6.6" y="13.2" width="18.8" height="14.8" rx="3.6" fill="#94a3b8" />
      <path d="M16 13.2h5.8a3.6 3.6 0 0 1 3.6 3.6v7.6a3.6 3.6 0 0 1-3.6 3.6H16Z" fill="#7c8ba1" />
      <circle cx="16" cy="19.4" r="2.2" fill="#e2e8f0" />
      <path d="M16 20.6v3.2" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    </Frame>
  )
}

const ACHIEVEMENT_ICONS: Record<AchievementIconName, (props: IconProps) => ReactElement> = {
  target: TargetIcon,
  sprout: SproutIcon,
  books: BooksIcon,
  trophy: TrophyIcon,
  streak: StreakIcon,
  xp: XpIcon,
  shine: ShineIcon,
  medal: MedalIcon,
}

/** Icon của một thành tích, theo tên đặt trong `ACHIEVEMENTS`. */
export function AchievementIcon({ name, ...props }: IconProps & { name: AchievementIconName }) {
  const Icon = ACHIEVEMENT_ICONS[name]
  return <Icon {...props} />
}
