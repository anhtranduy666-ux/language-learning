import { Link } from 'react-router-dom'
import { StatBar } from '../components/StatBar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { HSK1 } from '../data/hsk1'
import { useProgress } from '../context/ProgressContext'
import { TOTAL_LESSONS, courseCompletion, nextLessonId } from '../lib/course'
import { cn } from '../lib/cn'

/** Màn hình Course: toàn bộ unit và lesson của khoá HSK 1. */
export function Learn() {
  const { progress } = useProgress()
  const completed = new Set(progress.completedLessonIds)
  const upNextId = nextLessonId(progress.completedLessonIds)
  const percent = courseCompletion(progress.completedLessonIds)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{HSK1.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{HSK1.description}</p>
        </div>
        <StatBar />
      </header>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tiến độ khoá học</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {completed.size}/{TOTAL_LESSONS} bài
          </p>
        </div>
        <ProgressBar value={percent} label="Tiến độ khoá học" className="mt-3" />
      </section>

      {HSK1.units.map((unit) => (
        <section key={unit.id} className="space-y-3">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{unit.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{unit.description}</p>
          </div>

          <ul className="space-y-2">
            {unit.lessons.map((lesson) => {
              const isDone = completed.has(lesson.id)
              const isNext = lesson.id === upNextId

              return (
                <li key={lesson.id}>
                  <Link
                    to={`/lesson/${lesson.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800',
                      isNext ? 'ring-2 ring-brand-400' : 'ring-1 ring-slate-100 dark:ring-slate-800',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg',
                        isDone
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                      )}
                    >
                      {isDone ? '✓' : '📇'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
                        {lesson.title}
                      </span>
                      <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
                        {lesson.wordIds.length} từ · {lesson.description}
                      </span>
                    </span>
                    {isNext && !isDone && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        Tiếp theo
                      </span>
                    )}
                    {isDone && <span className="sr-only">Đã hoàn thành</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
