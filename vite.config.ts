import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `vite.config.ts` chạy trên Node, nhưng tsconfig cố tình giới hạn `types` nên
// `process` chưa có kiểu. Khai một dòng còn hơn kéo cả @types/node vào.
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  // GitHub Pages phục vụ site ở `/<tên repo>/`, Vercel thì ở gốc. Workflow
  // deploy đặt biến này; chạy máy hoặc build thường thì vẫn là `/`.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    // Mặc định Vite nhúng file dưới 4KB thẳng vào bundle JS dưới dạng base64.
    // Với mp3 thì đó là tính sai: người học mở trang là phải tải luôn phần
    // audio của những từ họ chưa xem tới. Để riêng thì trình duyệt chỉ tải
    // lúc bấm nút, và lần sau đọc từ cache.
    assetsInlineLimit: (filePath: string) => (filePath.endsWith('.mp3') ? false : undefined),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
  },
})
