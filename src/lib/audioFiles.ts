/**
 * Danh mục file audio thu sẵn đặt trong `src/assets/audio/`.
 *
 * Tên file chính là `id` của từ, ví dụ `nihao.mp3` cho từ `你好`. Vite quét thư
 * mục lúc build nên chỉ cần thả file vào là dùng được, không phải khai báo thêm.
 */

const MODULES = import.meta.glob('../assets/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** wordId -> URL file audio. Rỗng khi chưa thu file nào. */
export const AUDIO_FILE_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULES).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1).replace(/\.mp3$/, ''),
    url,
  ]),
)

/** URL file audio của một từ, hoặc null nếu từ đó chưa có file thu sẵn. */
export function audioUrlForWord(wordId: string | undefined): string | null {
  if (!wordId) return null
  return AUDIO_FILE_URLS[wordId] ?? null
}

/** Đã có ít nhất một file audio thu sẵn hay chưa. */
export function hasRecordedAudio(): boolean {
  return Object.keys(AUDIO_FILE_URLS).length > 0
}
