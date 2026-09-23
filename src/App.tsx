import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, FocusShell } from './components/AppShell'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { ExercisePage } from './pages/ExercisePage'
import { Flashcards } from './pages/Flashcards'
import { Home } from './pages/Home'
import { Landing } from './pages/Landing'
import { Learn } from './pages/Learn'
import { Lesson } from './pages/Lesson'
import { Profile } from './pages/Profile'
import { ProgressPage } from './pages/ProgressPage'
import { Result } from './pages/Result'

/**
 * Bản đồ màn hình theo mục 4 của bản thiết kế.
 * Luồng trong một bài học dùng `FocusShell` — bỏ thanh điều hướng để người học không phân tâm.
 */
export function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <Routes>
          <Route path="/welcome" element={<Landing />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<FocusShell />}>
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/lesson/:lessonId/flashcards" element={<Flashcards />} />
            <Route path="/lesson/:lessonId/exercise" element={<ExercisePage />} />
            <Route path="/lesson/:lessonId/result" element={<Result />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProgressProvider>
    </ThemeProvider>
  )
}
