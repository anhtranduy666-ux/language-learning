import { useProgress } from '../context/ProgressContext'
import { effectiveStreak, levelFromXp } from '../lib/gamification'

/** Dải chỉ số ở đầu màn hình: streak, XP và level hiện tại. */
export function StatBar() {
  const { progress, today } = useProgress()
  const streak = effectiveStreak(progress, today)
  const { level } = levelFromXp(progress.xp)

  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25"
        title="Chuỗi ngày học liên tiếp"
      >
        <span aria-hidden="true">🔥</span>
        <span>{streak}</span>
        <span className="sr-only">ngày streak</span>
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25"
        title="Tổng XP"
      >
        <span aria-hidden="true">⭐</span>
        <span>{progress.xp}</span>
        <span className="sr-only">XP</span>
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        title="Level hiện tại"
      >
        Lv {level}
      </span>
    </div>
  )
}
