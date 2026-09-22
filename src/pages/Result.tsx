import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ALL_LESSONS } from '../data/hsk1'
import { useProgress } from '../context/ProgressContext'
import { lessonAfter } from '../lib/course'
import { effectiveStreak } from '../lib/gamification'
import type { Achievement } from '../types'

interface ResultState {
  correct: number
  total: number
  xpEarned: number
}

/** Bước 4: kết quả, XP nhận được và thành tích vừa mở khoá. */
export function Result() {
  const { lessonId = '' } = useParams()
  const location = useLocation()
  const { progress, today, newAchievements, clearNewAchievements } = useProgress()

  // Giữ lại danh sách thành tích ngay khi vào màn hình, rồi dọn hàng chờ
  // để lần học sau không hiển thị lại những thứ cũ.
  const [unlocked] = useState<Achievement[]>(newAchievements)
  useEffect(() => {
    clearNewAchievements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const state = location.state as ResultState | null
  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)

  // Vào thẳng URL này hoặc tải lại trang thì không có dữ liệu bài vừa làm.
  if (!lesson || !state) return <Navigate to="/learn" replace />

  const percent = Math.round((state.correct / state.total) * 100)
  const nextId = lessonAfter(lessonId)
  const streak = effectiveStreak(progress, today)
  const goalMet = progress.xpToday >= progress.dailyGoal

  return (
    <div className="flex min-h-dvh flex-col justify-center py-8">
      <div className="text-center">
        <p aria-hidden="true" className="text-6xl">
          {percent === 100 ? '🎉' : percent >= 60 ? '👏' : '💪'}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {percent === 100 ? 'Hoàn hảo!' : percent >= 60 ? 'Làm tốt lắm!' : 'Cứ từ từ thôi'}
        </h1>
        <p className="mt-2 text-slate-600">
          {lesson.unitTitle} · {lesson.title}
        </p>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-slate-900">Kết quả bài tập</span>
          <span className="text-sm font-medium text-slate-500">
            {state.correct}/{state.total} câu đúng
          </span>
        </div>
        <ProgressBar
          value={percent}
          tone={percent >= 60 ? 'emerald' : 'brand'}
          label="Tỉ lệ trả lời đúng"
          className="mt-3"
        />

        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="XP nhận được" value={`+${state.xpEarned}`} />
          <Stat label="Tổng XP" value={progress.xp} />
          <Stat label="Streak" value={`${streak} 🔥`} />
        </dl>
      </div>

      {goalMet && (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800">
          Bạn đã đạt mục tiêu {progress.dailyGoal} XP hôm nay. Hẹn gặp lại ngày mai!
        </p>
      )}

      {unlocked.length > 0 && (
        <section className="mt-4 rounded-3xl bg-gold-400/15 p-5 ring-1 ring-gold-400/40">
          <h2 className="font-semibold text-slate-900">Thành tích mới</h2>
          <ul className="mt-3 space-y-2">
            {unlocked.map((achievement) => (
              <li key={achievement.id} className="flex items-center gap-3">
                <span aria-hidden="true" className="text-2xl">
                  {achievement.icon}
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{achievement.title}</span>
                  <span className="block text-sm text-slate-600">{achievement.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-3">
        {nextId ? (
          <Link to={`/lesson/${nextId}`}>
            <Button size="lg" fullWidth>
              Học bài tiếp theo
            </Button>
          </Link>
        ) : (
          <Link to="/progress">
            <Button size="lg" fullWidth>
              Xem tiến độ của bạn
            </Button>
          </Link>
        )}
        <Link to="/">
          <Button variant="secondary" size="lg" fullWidth>
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-bold text-slate-900">{value}</dd>
    </div>
  )
}
