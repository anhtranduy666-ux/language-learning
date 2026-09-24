import { Navigate, Outlet } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext'
import { isOnboarded } from '../lib/progress'
import { BottomNav } from './BottomNav'
import { SceneBackground } from './scene/SceneBackground'

/**
 * Khung chung cho các màn hình có thanh điều hướng.
 * Người chưa khai tên sẽ bị đưa về màn hình chào.
 *
 * Nền động nằm dưới cùng; nội dung phải có `relative z-10` để nổi lên trên nó.
 */
export function AppShell() {
  const { progress } = useProgress()

  if (!isOnboarded(progress)) return <Navigate to="/welcome" replace />

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <SceneBackground />
      {/* Chừa chỗ cho thanh điều hướng nổi: cao 64px, cách đáy 12px, cộng
          vùng an toàn của iPhone — để thẻ cuối cùng không nằm dưới viên thuốc. */}
      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+7rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

/**
 * Khung cho luồng học trong một bài: không có thanh điều hướng,
 * đúng nguyên tắc "một màn hình — một mục tiêu".
 *
 * Nền động cũng theo nguyên tắc đó: ở đây nó lắng hẳn xuống.
 */
export function FocusShell() {
  const { progress } = useProgress()

  if (!isOnboarded(progress)) return <Navigate to="/welcome" replace />

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <SceneBackground variant="focus" />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
