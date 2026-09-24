import { useAudioStatus } from '../../hooks/useAudioStatus'
import { cn } from '../../lib/cn'
import { TONE_NAMES, applyTone } from '../../lib/tones'
import type { ToneExercise } from '../../types'
import { AudioButton } from '../AudioButton'
import { MascotSays } from '../Mascot'

interface ToneChoiceProps {
  exercise: ToneExercise
  /** Thanh người học đang chọn, 0 là chưa chọn. */
  picked: number
  checked: boolean
  onPick: (tone: number) => void
}

/**
 * Trạng thái mỗi ô. Nền khai đủ cho cả hai chế độ ngay trong từng trạng thái:
 * để nền chung ở lớp gốc thì Tailwind xếp CSS theo tên tiện ích và `dark:` của
 * lớp gốc sẽ đè mất `dark:` của trạng thái.
 */
const TONE_STYLES = {
  idle: 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
  selected: 'border-brand-500 bg-brand-50 dark:bg-brand-500/15',
  right: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
  wrong: 'border-amber-500 bg-amber-50 dark:bg-amber-500/15',
  dimmed: 'border-slate-200 bg-white opacity-60 dark:border-slate-700 dark:bg-slate-900',
}

function toneState(
  checked: boolean,
  selected: boolean,
  isRight: boolean,
): keyof typeof TONE_STYLES {
  if (!checked) return selected ? 'selected' : 'idle'
  if (isRight) return 'right'
  return selected ? 'wrong' : 'dimmed'
}

/**
 * Bài chọn thanh điệu — một cú chạm, nhưng tai phải làm việc thật.
 *
 * Đề bài đưa ra âm tiết **đã bỏ dấu** (`hao`), nên không đọc được thanh bằng
 * mắt. Bốn nút hiện đủ bốn biến thể có dấu (`hāo háo hǎo hào`), vừa để chọn vừa
 * để người học quen mặt dấu thanh.
 *
 * Không bắt gõ gì cả: gõ `ǎ` trên bàn phím thường là cực hình, và đó là lý do
 * bài nghe–viết phải bỏ qua dấu thanh khi chấm. Bài này lấp đúng chỗ trống ấy.
 *
 * Máy không phát được âm thì Mầm đưa chữ Hán ra thay — bài thành "chữ này đọc
 * thanh mấy", tức là ôn lại trí nhớ thay vì luyện tai. Vẫn đáng làm, và vẫn đi
 * hết được bài.
 */
export function ToneChoice({ exercise, picked, checked, onPick }: ToneChoiceProps) {
  const audioStatus = useAudioStatus()
  const canHear = audioStatus === 'ready'

  return (
    <div className="mt-5">
      <MascotSays mood="chao">
        {canHear ? (
          <span className="flex items-center gap-3">
            <AudioButton
              text={exercise.hanzi}
              wordId={exercise.wordId}
              label="từ Mầm đọc"
              size="md"
            />
            <span>Nghe mình đọc rồi chọn thanh điệu nhé.</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="font-hanzi text-3xl font-semibold">{exercise.hanzi}</span>
            <span>Máy chưa phát âm được, nên bạn chọn thanh của chữ này nhé.</span>
          </span>
        )}
      </MascotSays>

      <p className="mt-6 text-center text-5xl font-semibold tracking-wide text-slate-900 dark:text-slate-100">
        {exercise.syllable}
      </p>
      <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        nghĩa là “{exercise.meaning}”
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {TONE_NAMES.map((item) => {
          const selected = picked === item.tone
          const isRight = exercise.tone === item.tone
          return (
            <li key={item.tone}>
              <button
                type="button"
                disabled={checked}
                onClick={() => onPick(item.tone)}
                aria-pressed={selected}
                className={cn(
                  'w-full rounded-2xl border-2 p-4 text-center transition',
                  TONE_STYLES[toneState(checked, selected, isRight)],
                )}
              >
                <span className="block text-2xl font-semibold">
                  {applyTone(exercise.syllable, item.tone)}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true">{item.symbol}</span> {item.label}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {item.hint}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
