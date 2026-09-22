import { cn } from '../../lib/cn'

interface ProgressBarProps {
  /** Phần trăm hoàn thành, 0–100. Giá trị ngoài khoảng sẽ được kẹp lại. */
  value: number
  label?: string
  className?: string
  tone?: 'brand' | 'gold' | 'emerald'
}

const TONES = {
  brand: 'bg-brand-500',
  gold: 'bg-gold-400',
  emerald: 'bg-emerald-500',
}

/** Thanh tiến độ ngang, dùng chung cho level, bài tập và mục tiêu ngày. */
export function ProgressBar({ value, label, className, tone = 'brand' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div
      className={cn('h-3 w-full overflow-hidden rounded-full bg-slate-200', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
