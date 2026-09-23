import { StatBar } from '../components/StatBar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useProgress } from '../context/ProgressContext'
import { TOTAL_LESSONS, courseCompletion } from '../lib/course'
import { cn } from '../lib/cn'
import { ACHIEVEMENTS, effectiveStreak, learnedWordCount, levelFromXp } from '../lib/gamification'

/** Màn hình Progress: mọi con số người học cần thấy, theo mục 10 của bản thiết kế. */
export function ProgressPage() {
  const { progress, today } = useProgress()

  const level = levelFromXp(progress.xp)
  const streak = effectiveStreak(progress, today)
  const unlocked = new Set(progress.unlockedAchievementIds)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tiến độ</h1>
        <StatBar />
      </header>

      {/* Level */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Level {level.level}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {level.xpIntoLevel}/{level.xpForLevel} XP
          </p>
        </div>
        <ProgressBar value={level.percent} label="Tiến độ level" className="mt-3" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Còn {level.xpForLevel - level.xpIntoLevel} XP nữa là lên Level {level.level + 1}.
        </p>
      </section>

      {/* Các chỉ số */}
      <section className="grid grid-cols-2 gap-3">
        <MetricCard icon="🔥" value={streak} label="ngày streak" />
        <MetricCard icon="⭐" value={progress.xp} label="tổng XP" />
        <MetricCard icon="📚" value={learnedWordCount(progress)} label="từ đã nhớ" />
        <MetricCard
          icon="📖"
          value={`${progress.completedLessonIds.length}/${TOTAL_LESSONS}`}
          label="bài đã xong"
        />
      </section>

      {/* Khoá học */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Khoá HSK 1</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {courseCompletion(progress.completedLessonIds)}%
          </p>
        </div>
        <ProgressBar
          value={courseCompletion(progress.completedLessonIds)}
          tone="emerald"
          label="Tiến độ khoá HSK 1"
          className="mt-3"
        />
      </section>

      {/* Mục tiêu hôm nay */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Hôm nay</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {progress.xpToday}/{progress.dailyGoal} XP
          </p>
        </div>
        <ProgressBar
          value={(progress.xpToday / progress.dailyGoal) * 100}
          tone={progress.xpToday >= progress.dailyGoal ? 'emerald' : 'brand'}
          label="Tiến độ mục tiêu hôm nay"
          className="mt-3"
        />
      </section>

      {/* Thành tích */}
      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">
          Thành tích{' '}
          <span className="font-normal text-slate-500 dark:text-slate-400">
            ({unlocked.size}/{ACHIEVEMENTS.length})
          </span>
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked.has(achievement.id)
            return (
              <li
                key={achievement.id}
                title={achievement.description}
                className={cn(
                  'rounded-2xl p-3 text-center shadow-sm ring-1 transition',
                  isUnlocked
                    ? 'bg-gold-400/15 ring-gold-400/40 dark:bg-gold-400/10'
                    : 'bg-white opacity-50 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800',
                )}
              >
                <p aria-hidden="true" className="text-2xl">
                  {isUnlocked ? achievement.icon : '🔒'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">{achievement.title}</p>
                <span className="sr-only">
                  {isUnlocked ? 'Đã mở khoá' : 'Chưa mở khoá'}: {achievement.description}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: string
  value: number | string
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
    >
      <p aria-hidden="true" className="text-2xl">
        {icon}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
