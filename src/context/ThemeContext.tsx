import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ResolvedTheme, ThemeChoice } from '../lib/theme'
import {
  applyTheme,
  loadThemeChoice,
  prefersDark,
  resolveTheme,
  saveThemeChoice,
  subscribeSystemTheme,
} from '../lib/theme'

export interface ThemeContextValue {
  /** Lựa chọn của người học: sáng, tối, hoặc theo hệ thống. */
  choice: ThemeChoice
  /** Chế độ đang hiển thị thật sự, sau khi đã giải `system` ra. */
  theme: ResolvedTheme
  setChoice: (choice: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => loadThemeChoice())
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark())

  const theme = resolveTheme(choice, systemDark)

  // Script nội tuyến trong index.html đã đặt chế độ trước lần vẽ đầu tiên; từ
  // đây trở đi React giữ cho thẻ `html` khớp với lựa chọn hiện tại.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Chỉ nghe hệ điều hành khi lựa chọn là "theo hệ thống". Đã chọn cố định thì
  // hệ điều hành đổi cũng không liên quan.
  useEffect(() => {
    if (choice !== 'system') return
    setSystemDark(prefersDark())
    return subscribeSystemTheme(setSystemDark)
  }, [choice])

  const setChoice = useCallback((next: ThemeChoice) => {
    saveThemeChoice(next)
    setChoiceState(next)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, theme, setChoice }),
    [choice, setChoice, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Truy cập chế độ hiển thị. Phải nằm trong `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme phải được dùng bên trong ThemeProvider')
  return context
}
