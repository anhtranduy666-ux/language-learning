import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Achievement, UserProgress } from '../types'
import { todayIso } from '../lib/date'
import { newlyUnlocked } from '../lib/gamification'
import {
  completeLesson,
  createProgress,
  recordCorrectAnswer,
  recordWordReview,
  setDailyGoal,
  setName,
} from '../lib/progress'
import { clearProgress, loadProgress, saveProgress } from '../lib/storage'

export interface ProgressContextValue {
  progress: UserProgress
  /** Ngày hôm nay, dạng YYYY-MM-DD. Mọi thao tác ghi nhận đều quy về ngày này. */
  today: string
  /** Thành tích vừa mở khoá, để màn hình kết quả khoe ra. Gọi `clearNewAchievements` sau khi hiển thị. */
  newAchievements: Achievement[]
  clearNewAchievements: () => void
  reviewWord: (wordId: string, known: boolean) => void
  answerCorrect: () => void
  finishLesson: (lessonId: string) => void
  updateName: (name: string) => void
  updateDailyGoal: (goal: number) => void
  resetEverything: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress())
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const today = todayIso()

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  /** Áp dụng một phép biến đổi thuần và gom lại những thành tích vừa mở. */
  const apply = useCallback((transform: (current: UserProgress) => UserProgress) => {
    setProgress((current) => {
      const next = transform(current)
      const unlocked = newlyUnlocked(current, next)
      if (unlocked.length > 0) {
        setNewAchievements((pending) => [...pending, ...unlocked])
      }
      return next
    })
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      today,
      newAchievements,
      clearNewAchievements: () => setNewAchievements([]),
      reviewWord: (wordId, known) => apply((p) => recordWordReview(p, wordId, known, today)),
      answerCorrect: () => apply((p) => recordCorrectAnswer(p, today)),
      finishLesson: (lessonId) => apply((p) => completeLesson(p, lessonId, today)),
      updateName: (name) => apply((p) => setName(p, name)),
      updateDailyGoal: (goal) => apply((p) => setDailyGoal(p, goal)),
      resetEverything: () => {
        clearProgress()
        setNewAchievements([])
        setProgress(createProgress())
      },
    }),
    [apply, newAchievements, progress, today],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

/** Truy cập tiến độ người học. Phải nằm trong `ProgressProvider`. */
export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress phải được dùng bên trong ProgressProvider')
  return context
}
