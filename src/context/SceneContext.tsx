import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SceneChoice, SceneMotion } from '../lib/scene'
import {
  applyScene,
  loadSceneChoice,
  prefersReducedMotion,
  resolveSceneMotion,
  saveSceneChoice,
  subscribeReducedMotion,
} from '../lib/scene'

export interface SceneContextValue {
  /** Lựa chọn của người học: đầy đủ, tĩnh, hoặc tắt. */
  choice: SceneChoice
  /** Mức chuyển động thật sự, sau khi đã tính cả tuỳ chọn của hệ điều hành. */
  motion: SceneMotion
  setChoice: (choice: SceneChoice) => void
}

const SceneContext = createContext<SceneContextValue | null>(null)

export function SceneProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<SceneChoice>(() => loadSceneChoice())
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => prefersReducedMotion())

  const motion = resolveSceneMotion(choice, reducedMotion)

  // Nghe cả khi người học đang chọn "tắt": họ bật lại lúc nào cũng được, và
  // lúc đó giá trị phải sẵn sàng chứ không đợi hệ điều hành đổi lần nữa.
  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
    return subscribeReducedMotion(setReducedMotion)
  }, [])

  useEffect(() => {
    applyScene(motion)
  }, [motion])

  const setChoice = useCallback((next: SceneChoice) => {
    saveSceneChoice(next)
    setChoiceState(next)
  }, [])

  const value = useMemo<SceneContextValue>(
    () => ({ choice, motion, setChoice }),
    [choice, motion, setChoice],
  )

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

/** Truy cập nền động. Phải nằm trong `SceneProvider`. */
export function useScene(): SceneContextValue {
  const context = useContext(SceneContext)
  if (!context) throw new Error('useScene phải được dùng bên trong SceneProvider')
  return context
}
