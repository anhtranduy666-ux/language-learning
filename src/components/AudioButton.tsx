import { useState } from 'react'
import { useAudioStatus } from '../hooks/useAudioStatus'
import { cn } from '../lib/cn'
import { playWord, type PlayStage } from '../lib/speech'
import { SpeakerIcon, SpeakerOffIcon, SpinnerIcon } from './icons/UiIcons'

interface AudioButtonProps {
  /** Chuỗi tiếng Trung cần đọc. */
  text: string
  /** Id của từ, để tìm file audio thu sẵn. */
  wordId?: string
  /** File thu sẵn cho đúng `text` — dùng cho câu mẫu, vốn không có id như từ. */
  clipUrl?: string | null
  /** Nhãn cho trình đọc màn hình, ví dụ tên từ đang nghe. */
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

/** Cỡ icon theo cỡ nút. */
const ICON_SIZES = { sm: 18, md: 24, lg: 30 }

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
export function AudioButton({
  text,
  wordId,
  clipUrl,
  label,
  size = 'md',
  className,
}: AudioButtonProps) {
  const status = useAudioStatus()
  const [stage, setStage] = useState<PlayStage | null>(null)
  const [hint, setHint] = useState<Hint>(null)

  const available = status === 'ready'
  const busy = stage !== null

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    event.preventDefault()

    if (!available || busy) {
      if (!available) setHint(status === 'unsupported' ? 'unsupported' : 'no-chinese-voice')
      return
    }

    setHint(null)
    setStage('speaking')
    const result = await playWord({ text, wordId, clipUrl, onStage: setStage })
    setStage(null)

    if (result === 'played') return
    setHint(result === 'unsupported' ? 'unsupported' : result === 'error' ? 'error' : 'no-chinese-voice')
  }

  return (
    <span className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        aria-label={label ? `Nghe phát âm ${label}` : 'Nghe phát âm'}
        aria-busy={busy}
        data-state={stage ?? (available ? 'idle' : 'unavailable')}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95',
          available
            ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-100 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25 dark:hover:bg-brand-500/25'
            : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700 dark:hover:bg-slate-700',
          busy && 'animate-pulse bg-brand-100 dark:bg-brand-500/30',
          SIZES[size],
          className,
        )}
      >
        {/* Tải file từ mạng có thể mất vài giây: lúc đó hiện vòng quay thay cho cái loa. */}
        {stage === 'loading' ? (
          <SpinnerIcon size={ICON_SIZES[size]} />
        ) : available ? (
          <SpeakerIcon size={ICON_SIZES[size]} />
        ) : (
          <SpeakerOffIcon size={ICON_SIZES[size]} />
        )}
      </button>

      {hint ? (
        <span
          role="status"
          className="absolute top-full z-10 mt-2 w-60 rounded-xl bg-slate-900 px-3 py-2 dark:bg-slate-700 text-center text-xs leading-snug font-normal text-white shadow-lg"
        >
          {HINTS[hint]}
        </span>
      ) : null}
    </span>
  )
}
