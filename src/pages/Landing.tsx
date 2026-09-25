import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { StreakIcon, TargetIcon, WordsIcon } from '../components/icons/GameIcons'
import { MascotSays } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { useProgress } from '../context/ProgressContext'
import { isOnboarded } from '../lib/progress'

/**
 * Màn hình chào.
 * Bản thiết kế dự tính có Register/Login thật; giai đoạn này mới chỉ hỏi tên
 * và lưu ở máy, phần Authentication sẽ nối vào đây ở Phase 3.
 */
export function Landing() {
  const { progress, updateName } = useProgress()
  const [name, setName] = useState('')
  const navigate = useNavigate()

  if (isOnboarded(progress)) return <Navigate to="/" replace />

  const trimmed = name.trim()

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-gradient-to-b from-brand-50 to-slate-50 dark:from-brand-500/10 dark:to-slate-950 px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <p className="font-hanzi text-6xl">你好</p>
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-slate-100">Học tiếng Trung</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Mỗi ngày một chút: từ vựng, pinyin, phát âm và bài tập ngắn. Không cần biết gì trước.
        </p>

        <MascotSays mood="chao" size={84} className="mt-7">
          Chào bạn! Mình là Zibi. Mình sẽ đi cùng bạn suốt khoá này nhé.
        </MascotSays>

        <ul className="mt-6 space-y-3 text-slate-700 dark:text-slate-300">
          <li className="flex items-center gap-3">
            <WordsIcon size={26} /> 60 từ HSK 1 kèm phát âm
          </li>
          <li className="flex items-center gap-3">
            <TargetIcon size={26} /> Bài tập ngắn, làm xong trong 5 phút
          </li>
          <li className="flex items-center gap-3">
            <StreakIcon size={26} /> XP và streak để giữ thói quen
          </li>
        </ul>
      </div>

      <form
        className="mx-auto mt-10 w-full max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          if (!trimmed) return
          updateName(trimmed)
          navigate('/', { replace: true })
        }}
      >
        <label htmlFor="learner-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Gọi bạn là gì nhỉ?
        </label>
        <input
          id="learner-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tên của bạn"
          autoComplete="given-name"
          className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
        />
        <Button type="submit" size="lg" fullWidth className="mt-4" disabled={!trimmed}>
          Bắt đầu học
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Tiến độ được lưu ngay trên máy bạn.
        </p>
      </form>
    </div>
  )
}
