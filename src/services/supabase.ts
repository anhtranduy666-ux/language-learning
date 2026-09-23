/**
 * Cấu hình Supabase phía client.
 *
 * Bản này **không** dùng `@supabase/supabase-js`: phần audio chỉ cần hai thứ —
 * tải một file công khai từ CDN, và gọi một Edge Function. Cả hai đều là
 * `fetch` thuần, nên thêm SDK chỉ làm nặng bundle mà không được gì.
 *
 * Thiếu biến môi trường thì mọi thứ liên quan Supabase tự tắt, app lùi về
 * giọng đọc của hệ điều hành. Nhờ vậy `npm run dev` của người mới clone repo
 * vẫn chạy ngay, không cần tài khoản Supabase.
 */

function readEnv(key: string): string {
  const value = import.meta.env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export interface SupabaseConfig {
  url: string
  anonKey: string
}

/** Cấu hình hiện có, hoặc null khi chưa khai báo biến môi trường. */
export function supabaseConfig(): SupabaseConfig | null {
  const url = readEnv('VITE_SUPABASE_URL')
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null
  return { url, anonKey }
}

/** Đã cấu hình Supabase hay chưa. */
export function hasSupabase(): boolean {
  return supabaseConfig() !== null
}

/** URL của Edge Function sinh audio. */
export function speakFunctionUrl(config: SupabaseConfig): string {
  return `${config.url.replace(/\/+$/, '')}/functions/v1/speak`
}
