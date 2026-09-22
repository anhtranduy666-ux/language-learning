/**
 * Phát âm tiếng Trung bằng Web Speech API của trình duyệt.
 *
 * Bản thiết kế dự tính dùng file audio đặt trong `public/audio/`. Bản demo này
 * dùng giọng đọc sẵn có của hệ điều hành để không phải kèm hàng chục file mp3;
 * khi có audio thu thật, chỉ cần thay phần thân hàm `speak` là đủ.
 */

/** Trình duyệt hiện tại có đọc được tiếng Trung không. */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Đọc to một chuỗi tiếng Trung. Không làm gì nếu trình duyệt không hỗ trợ. */
export function speak(text: string, lang = 'zh-CN'): void {
  if (!isSpeechSupported()) return

  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    // Chậm hơn bình thường một chút để người mới nghe kịp từng âm tiết.
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  } catch {
    // Không đọc được thì bỏ qua, phần còn lại của bài học vẫn dùng được.
  }
}
