import { cn } from '../../lib/cn'

export type MicStatus = 'idle' | 'starting' | 'recording' | 'scoring'

const LABELS: Record<MicStatus, string> = {
  idle: 'Bấm để đọc',
  starting: 'Đang mở micro',
  recording: 'Dừng ghi âm',
  scoring: 'Đang chấm',
}

interface MicButtonProps {
  status: MicStatus
  /** Âm lượng đang thu, 0–1 — vòng sáng nở theo. */
  level: number
  onPress: () => void
}

/**
 * Nút micro to, dễ bấm bằng ngón cái.
 *
 * Bấm một lần để bắt đầu; đang thu thì bấm lần nữa để dừng — hoặc cứ đọc xong
 * rồi im, máy tự dừng. Vòng sáng phía sau nở ra theo âm lượng, để người học
 * thấy máy đang nghe mình.
 */
export function MicButton({ status, level, onPress }: MicButtonProps) {
  const busy = status === 'starting' || status === 'scoring'
  const recording = status === 'recording'

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      aria-label={LABELS[status]}
      aria-pressed={recording}
      data-state={status}
      style={{ '--level': recording ? level : 0 } as React.CSSProperties}
      className={cn(
        'mic-button flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95',
        'disabled:cursor-wait disabled:opacity-70',
        recording ? 'bg-rose-500 text-rose-500' : 'bg-brand-500 text-brand-500 dark:bg-brand-600',
      )}
    >
      <span className="mic-ring" aria-hidden="true" />
      <span className="text-white" aria-hidden="true">
        {recording ? (
          // Ô vuông "dừng", như mọi máy ghi âm.
          <svg viewBox="0 0 24 24" width="34" height="34">
            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  )
}
