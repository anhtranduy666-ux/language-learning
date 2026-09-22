import { useState } from 'react'
import { useAudioStatus } from '../hooks/useAudioStatus'
import { cn } from '../lib/cn'
import { playWord } from '../lib/speech'

interface AudioButtonProps {
  /** Chuỗi tiếng Trung cần đọc. */
  text: string
  /** Id của từ, để tìm file audio thu sẵn. */
  wordId?: string
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

/** Lời nhắc khi máy không phát âm được, kèm cách khắc phục. */
const HINTS = {
  'no-chinese-voice':
    'Máy chưa cài giọng tiếng Trung. Trên Windows: Cài đặt → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói → Chinese (Simplified). Xong thì tải lại trang.',
  unsupported: 'Trình duyệt này chưa phát âm được. Hãy mở bằng Chrome, Edge hoặc Safari bản mới.',
  error: 'Không phát được âm thanh lần này. Thử bấm lại nhé.',
}

type Hint = keyof typeof HINTS | null

/**
 * Nút phát âm.
 *
 * Nút luôn hiện, kể cả khi máy chưa phát âm được — bấm vào sẽ hiện hướng dẫn
 * thay vì im lặng không phản hồi.
 */
export function AudioButton({ text, wordId, label, size = 'md', className }: AudioButtonProps) {
  const status = useAudioStatus()
  const [playing, setPlaying] = useState(false)
  const [hint, setHint] = useState<Hint>(null)

  const available = status === 'ready'

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    event.preventDefault()

    if (!available) {
      setHint(status === 'unsupported' ? 'unsupported' : 'no-chinese-voice')
      return
    }

    setHint(null)
    setPlaying(true)
    const result = await playWord({ text, wordId })
    setPlaying(false)

    if (result === 'played') return
    setHint(result === 'unsupported' ? 'unsupported' : result === 'error' ? 'error' : 'no-chinese-voice')
  }

  return (
    <span className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        aria-label={label ? `Nghe phát âm ${label}` : 'Nghe phát âm'}
        data-state={playing ? 'playing' : available ? 'idle' : 'unavailable'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95',
          available
            ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-100 hover:bg-brand-100'
            : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200 hover:bg-slate-200',
          playing && 'animate-pulse bg-brand-100',
          SIZES[size],
          className,
        )}
      >
        <span aria-hidden="true">{available ? '🔊' : '🔇'}</span>
      </button>

      {hint ? (
        <span
          role="status"
          className="absolute top-full z-10 mt-2 w-60 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs leading-snug font-normal text-white shadow-lg"
        >
          {HINTS[hint]}
        </span>
      ) : null}
    </span>
  )
}
