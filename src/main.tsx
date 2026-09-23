import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Không tìm thấy phần tử #root trong index.html')

createRoot(container).render(
  <StrictMode>
    {/* `basename` bám theo `base` của Vite, để bản deploy dưới đường dẫn con
        (GitHub Pages) và bản deploy ở gốc (Vercel) dùng chung một mã nguồn. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
