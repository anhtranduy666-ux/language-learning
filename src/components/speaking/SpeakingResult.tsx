import { PRAISE, REJECTIONS, TIPS, bandLabel, sandhiNote, type AttemptProblem } from '../../data/pronunciationTips'
import { cn } from '../../lib/cn'
import type { Attempt, SyllableResult } from '../../lib/pronunciation'
import { PlayIcon } from '../icons/UiIcons'
import { MascotSays } from '../Mascot'
import { PitchSketch } from './PitchSketch'

/** Lời khuyên về thanh điệu thì nói rõ âm nào; lời khuyên về nhịp là cho cả từ. */
const TONE_PROBLEMS = new Set(['no-fall', 'no-rise', 'no-dip', 'not-level', 'too-low'])

/** Thanh ghi trên chữ: `ni3` → 3, `xie5` → 5 (thanh nhẹ). */
function writtenTone(syllable: SyllableResult): number {
  return Number(syllable.token.slice(-1))
}

/** Lời khuyên cho một âm tiết. Âm bị biến điệu thì nói lý do trước, kẻo chữ ghi một đằng lời nhắc một nẻo. */
function syllableTip(syllable: SyllableResult, problem: AttemptProblem): string {
  if (writtenTone(syllable) === 3 && syllable.expectedTone === 2) {
    return `${sandhiNote(syllable.display)} ${TIPS[problem]}`
  }
  return `Âm “${syllable.display}”: ${TIPS[problem]}`
}

/** Dòng chữ nhỏ dưới mỗi âm tiết. */
function syllableCaption(syllable: SyllableResult): string {
  if (syllable.expectedTone > 0) return syllable.score === null ? '—' : `${syllable.score} điểm`
  // Không chấm vì là thanh nhẹ, hoặc vì nằm trong chuỗi ba thanh 3 — chuỗi đó
  // đọc thế nào tuỳ ngắt nhịp, xem `expectedTones()`.
  return writtenTone(syllable) === 5 ? 'thanh nhẹ' : 'không chấm'
}

function scoreClass(score: number | null): string {
  if (score === null) return 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
  if (score >= 80) return 'bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/40'
  if (score >= 60) return 'bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/40'
  return 'bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/40'
}

interface SpeakingResultProps {
  attempt: Attempt
  /** Phát lại bản thu của chính người học. Không có thì không hiện nút. */
  onReplay?: () => void
}

/**
 * Kết quả một lượt đọc.
 *
 * Theo `docs/pronunciation-mvp.md` mục 10: **dải chữ trước, con số sau** — bộ
 * chấm nhiễu vài điểm, con số to giữa màn hình là mời người ta soi đúng chỗ yếu
 * nhất. Thứ hành động được nằm ở hàng âm tiết: mỗi âm một ô màu, kèm hình so
 * đường giọng với thanh mẫu, và đúng một lời khuyên của Zibi.
 */
export function SpeakingResult({ attempt, onReplay }: SpeakingResultProps) {
  if (attempt.rejected) {
    return (
      <div className="speaking-result" role="status">
        <MascotSays mood="nghi">{REJECTIONS[attempt.rejected]}</MascotSays>
      </div>
    )
  }

  const total = attempt.total ?? 0
  const weak = attempt.weakest === null ? null : attempt.syllables[attempt.weakest]
  const tip =
    attempt.problem === null
      ? PRAISE
      : TONE_PROBLEMS.has(attempt.problem) && weak
        ? syllableTip(weak, attempt.problem)
        : TIPS[attempt.problem]

  return (
    <section aria-label="Kết quả" className="speaking-result space-y-4">
      <p className="text-center">
        <span className="block text-2xl font-bold text-slate-900 dark:text-slate-100">{bandLabel(total)}</span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{total}/100 điểm</span>
      </p>

      <ol aria-label="Điểm từng âm tiết" className="flex flex-wrap justify-center gap-3">
        {attempt.syllables.map((syllable, index) => (
          <li
            key={index}
            className="flex flex-col items-center gap-1"
            data-weakest={index === attempt.weakest || undefined}
          >
            {syllable.expectedTone > 0 && (
              <PitchSketch contourSt={syllable.contourSt} tone={syllable.expectedTone} score={syllable.score} />
            )}
            <span
              className={cn(
                'rounded-full px-3 py-1 text-lg font-semibold ring-1',
                scoreClass(syllable.score),
                index === attempt.weakest && syllable.score !== null && syllable.score < 75 && 'ring-2',
              )}
            >
              {syllable.display}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{syllableCaption(syllable)}</span>
          </li>
        ))}
      </ol>

      <div role="status">
        <MascotSays mood={total >= 75 ? 'mung' : 'nghi'} tone={total >= 60 ? 'right' : 'wrong'}>
          {tip}
        </MascotSays>
      </div>

      {onReplay && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-brand-600 ring-1 ring-brand-200 transition hover:bg-brand-50 dark:text-brand-300 dark:ring-brand-500/40 dark:hover:bg-brand-500/10"
          >
            <PlayIcon size={14} /> Nghe lại giọng mình
          </button>
        </div>
      )}
    </section>
  )
}
