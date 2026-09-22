import { Navigate, Outlet } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext'
import { isOnboarded } from '../lib/progress'
import { BottomNav } from './BottomNav'

/**
 * Khung chung cho các màn hình có thanh điều hướng.
 * Người chưa khai tên sẽ bị đưa về màn hình chào.
 */
export function AppShell() {
  const { progress } = useProgress()

  if (!isOnboarded(progress)) return <Navigate to="/welcome" replace />

  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

/**
 * Khung cho luồng học trong một bài: không có thanh điều hướng,
 * đúng nguyên tắc "một màn hình — một mục tiêu".
 */
export function FocusShell() {
  const { progress } = useProgress()

  if (!isOnboarded(progress)) return <Navigate to="/welcome" replace />

  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
