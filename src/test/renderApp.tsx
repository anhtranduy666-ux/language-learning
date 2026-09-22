import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import type { UserProgress } from '../types'
import { createProgress } from '../lib/progress'
import { saveProgress } from '../lib/storage'

/**
 * Dựng ứng dụng thật trong bộ nhớ để kiểm thử luồng end-to-end.
 * `progress` nếu có sẽ được nạp sẵn vào localStorage trước khi render.
 */
export function renderApp(route = '/', progress?: Partial<UserProgress>) {
  if (progress) saveProgress({ ...createProgress('Duy'), ...progress })

  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )

  return { user, ...utils }
}

/** Người học đã qua màn chào, dùng làm điểm xuất phát mặc định cho phần lớn test. */
export const ONBOARDED: Partial<UserProgress> = { name: 'Duy' }
