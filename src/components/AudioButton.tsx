import { cn } from '../lib/cn'
import { isSpeechSupported, speak } from '../lib/speech'

interface AudioButtonProps {
  /** Chuỗi tiếng Trung cần đọc. */
  text: string
  /** Nhãn cho trình đọc màn hình, ví dụ tên từ đang nghe. */
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-9 w-9 text-base',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-3xl',
}

/** Nút phát âm. Tự ẩn nếu trình duyệt không đọc được tiếng Trung. */
export function AudioButton({ text, label, size = 'md', className }: AudioButtonProps) {
  if (!isSpeechSupported()) return null

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        speak(text)
      }}
      aria-label={label ? `Nghe phát âm ${label}` : 'Nghe phát âm'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
        'transition hover:bg-brand-100 active:scale-95',
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  )
}
