import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages phục vụ site ở `/<tên repo>/`, Vercel thì ở gốc. Workflow
  // deploy đặt biến này; chạy máy hoặc build thường thì vẫn là `/`.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    // Cài được lên màn hình chính điện thoại — xem docs/pwa.md.
    VitePWA({
      // Bản mới tải ngầm và áp dụng ở lần mở sau. Người học vào để học, không
      // phải để bấm "Có bản mới, cập nhật?".
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Học tiếng Trung từ con số 0',
        short_name: 'Học tiếng Trung',
        description:
          'Học tiếng Trung cho người mới bắt đầu — từ vựng, pinyin, phát âm, flashcard và bài tập HSK 1.',
        lang: 'vi',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        theme_color: '#e2483d',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // `mp3` không nằm trong danh sách mặc định. Thiếu nó thì mở app lúc
        // mất mạng vẫn vào được nhưng nút loa câm — hỏng đúng chức năng chính.
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,mp3}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
