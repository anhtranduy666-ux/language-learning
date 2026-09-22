import { Link } from 'react-router-dom'
import { StatBar } from '../components/StatBar'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ALL_LESSONS } from '../data/hsk1'
import { useProgress } from '../context/ProgressContext'
import { TOTAL_LESSONS, courseCompletion, lessonPosition, nextLessonId } from '../lib/course'
import { effectiveStreak, learnedWordCount } from '../lib/gamification'

/** Trang chủ: người học luôn thấy ngay bước tiếp theo của mình. */
export function Home() {
  const { progress, today } = useProgress()

  const nextId = nextLessonId(progress.completedLessonIds)
  const nextLesson = ALL_LESSONS.find((lesson) => lesson.id === nextId)!
  const isReview = progress.completedLessonIds.includes(nextId)

  const goalPercent = (progress.xpToday / progress.dailyGoal) * 100
  const goalMet = progress.xpToday >= progress.dailyGoal
  const streak = effectiveStreak(progress, today)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Chào bạn,</p>
          <h1 className="text-2xl font-bold text-slate-900">{progress.name}</h1>
        </div>
        <StatBar />
      </header>

      {/* Mục tiêu hôm nay */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-slate-900">Mục tiêu hôm nay</h2>
          <p className="text-sm font-medium text-slate-500">
            {progress.xpToday}/{progress.dailyGoal} XP
          </p>
        </div>
        <ProgressBar
          value={goalPercent}
          tone={goalMet ? 'emerald' : 'brand'}
          label="Tiến độ mục tiêu hôm nay"
          className="mt-3"
        />
        <p className="mt-3 text-sm text-slate-600">
          {goalMet
            ? streak > 0
              ? `Xong rồi! Streak của bạn đang là ${streak} ngày. 🔥`
              : 'Xong mục tiêu hôm nay rồi. Tuyệt vời!'
            : `Còn ${progress.dailyGoal - progress.xpToday} XP nữa là đạt mục tiêu.`}
        </p>
      </section>

      {/* Bước tiếp theo */}
      <section className="rounded-3xl bg-brand-500 p-5 text-white shadow-sm">
        <p className="text-sm text-brand-100">
          {isReview ? 'Ôn lại' : `Bài ${lessonPosition(nextId)}/${TOTAL_LESSONS}`} ·{' '}
          {nextLesson.unitTitle}
        </p>
        <h2 className="mt-1 text-xl font-bold">{nextLesson.title}</h2>
        <p className="mt-1 text-brand-100">{nextLesson.description}</p>
        <Link to={`/lesson/${nextId}`} className="mt-4 block">
          <Button variant="secondary" size="lg" fullWidth className="text-brand-700">
            {isReview ? 'Ôn lại bài này' : 'Học tiếp'}
          </Button>
        </Link>
      </section>

      {/* Tổng quan nhanh */}
      <section className="grid grid-cols-3 gap-3">
        <SummaryCard icon="📚" value={learnedWordCount(progress)} label="từ đã nhớ" />
        <SummaryCard icon="📖" value={progress.completedLessonIds.length} label="bài đã xong" />
        <SummaryCard
          icon="🎓"
          value={`${courseCompletion(progress.completedLessonIds)}%`}
          label="khoá HSK 1"
        />
      </section>

      <Link
        to="/learn"
        className="block rounded-3xl bg-white p-4 text-center font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50"
      >
        Xem toàn bộ khoá học →
      </Link>
    </div>
  )
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: string
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-100">
      <p aria-hidden="true" className="text-xl">
        {icon}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
