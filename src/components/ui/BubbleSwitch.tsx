import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Giá trị của một lựa chọn: chuỗi như 'dark', hoặc số như mục tiêu 50 XP. */
type OptionValue = string | number

export interface BubbleOption<T extends OptionValue> {
  value: T
  label: string
  /** Icon vẽ tay đứng trước nhãn. Chỉ để trang trí, trình đọc màn hình bỏ qua. */
  icon?: ReactNode
}

interface BubbleSwitchProps<T extends OptionValue> {
  options: readonly BubbleOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Id của tiêu đề đặt tên cho nhóm lựa chọn này. */
  labelledBy: string
  className?: string
}

/**
 * Chọn một trong vài lựa chọn, kiểu bong bóng trượt.
 *
 * Cùng một cơ chế với thanh điều hướng — xem `src/styles/bubble.css`. Các nút
 * vẫn là nút thật có `aria-pressed`, nên bàn phím và trình đọc màn hình dùng y
 * như trước; bong bóng chỉ là hình, `aria-hidden`.
 */
export function BubbleSwitch<T extends OptionValue>({
  options,
  value,
  onChange,
  labelledBy,
  className,
}: BubbleSwitchProps<T>) {
  const index = options.findIndex((option) => option.value === value)

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      data-active-index={index}
      className={cn('bubble-track bubble-switch', className)}
      style={{ '--count': options.length, '--index': Math.max(index, 0) } as CSSProperties}
    >
      <span aria-hidden="true" className="bubble-thumb" data-hidden={index < 0} />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-full px-1 text-sm font-semibold whitespace-nowrap transition active:scale-95',
              active
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {option.icon && (
              <span aria-hidden="true" className="bubble-switch-icon flex leading-none">
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
