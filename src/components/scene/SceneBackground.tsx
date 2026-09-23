import { useEffect, useState } from 'react'
import { useProgress } from '../../context/ProgressContext'
import { useScene } from '../../context/SceneContext'
import { useTheme } from '../../context/ThemeContext'
import { effectiveStreak } from '../../lib/gamification'
import { hasStreakBonus, isDocumentVisible, sceneStage, subscribeVisibility } from '../../lib/scene'
import { GardenScene } from './GardenScene'
import { NightSkyScene } from './NightSkyScene'

/**
 * `focus` dành cho luồng học trong một bài: cảnh lùi hẳn về sau, tắt ong bướm
 * và sao băng. Một màn hình — một mục tiêu, không có gì nhúc nhích cạnh câu hỏi.
 */
export type SceneVariant = 'app' | 'focus'

/**
 * Nền động phía sau toàn bộ ứng dụng.
 *
 * Chế độ sáng ra khu vườn, chế độ tối ra bầu trời sao — và cảnh nở theo XP
 * hôm nay, nên nhìn nền là biết đã học tới đâu mà không cần đọc con số.
 * Logic thuần ở `src/lib/scene.ts`, phần vẽ ở `src/styles/scene.css`.
 */
export function SceneBackground({ variant = 'app' }: { variant?: SceneVariant }) {
  const { motion } = useScene()
  const { theme } = useTheme()
  const { progress, today } = useProgress()
  const [visible, setVisible] = useState<boolean>(() => isDocumentVisible())

  // Cảnh đứng yên sẵn rồi thì không cần theo dõi làm gì.
  useEffect(() => {
    if (motion !== 'animate') return
    setVisible(isDocumentVisible())
    return subscribeVisibility(setVisible)
  }, [motion])

  if (motion === 'none') return null

  const stage = sceneStage(progress.xpToday, progress.dailyGoal)
  const streakBonus = hasStreakBonus(effectiveStreak(progress, today))
  const night = theme === 'dark'

  return (
    <div
      className="scene"
      aria-hidden="true"
      data-sky={night ? 'night' : 'day'}
      data-stage={stage}
      data-motion={motion}
      data-variant={variant}
      data-streak={streakBonus ? 'on' : 'off'}
      data-paused={visible ? 'false' : 'true'}
    >
      {night ? <NightSkyScene /> : <GardenScene />}
      <div className="scene-veil" />
      <div className="scene-dim" />
    </div>
  )
}
