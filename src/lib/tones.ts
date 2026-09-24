/**
 * Thanh điệu tiếng Trung: đọc ra, gỡ đi, và gắn lại vào pinyin.
 *
 * Tiếng Trung chỉ có khoảng 400 âm tiết gốc, nhân với thanh điệu mới thành
 * ~1.300. Mật độ từ đồng âm vì thế rất dày: `shī / shí / shǐ / shì` là bốn từ
 * khác hẳn nhau. Nghe không ra thanh thì mọi thứ phía sau đều hỏng — nên bài
 * tập thanh điệu cần dựng được bốn phương án chỉ khác nhau đúng cái thanh.
 *
 * Khác với `src/lib/pinyin.ts` — nơi dấu thanh bị **bỏ đi** để chấm bài gõ —
 * ở đây dấu thanh chính là thứ đang được dạy, nên phải giữ và dựng lại chính xác.
 *
 * Toàn bộ là hàm thuần, test trực tiếp không cần dựng React.
 */

/** Dấu thanh dạng ký tự tổ hợp, xếp theo thanh 1 → 4. */
const TONE_MARKS = ['̄', '́', '̌', '̀'] as const

/** Chỉ bắt bốn dấu thanh. Hai chấm của ü (U+0308) phải được giữ nguyên. */
const TONE_MARK_RE = /[̄́̌̀]/g

/** Ký hiệu thanh điệu để hiện trên nút bấm. */
export const TONE_SYMBOLS = ['ˉ', 'ˊ', 'ˇ', 'ˋ'] as const

/** Mô tả ngắn từng thanh bằng tiếng Việt, cho người mới hình dung cao độ. */
export const TONE_NAMES = [
  { tone: 1, symbol: 'ˉ', label: 'Thanh 1', hint: 'cao và đều' },
  { tone: 2, symbol: 'ˊ', label: 'Thanh 2', hint: 'đi lên' },
  { tone: 3, symbol: 'ˇ', label: 'Thanh 3', hint: 'xuống rồi lên' },
  { tone: 4, symbol: 'ˋ', label: 'Thanh 4', hint: 'xuống gắt' },
] as const

/** Nguyên âm có thể mang dấu thanh. `v` là cách gõ thay cho ü. */
const VOWELS = 'aoeiuüv'

/** Thanh của một âm tiết: 1–4, hoặc 0 cho thanh nhẹ. */
export function toneOf(syllable: string): number {
  const decomposed = syllable.normalize('NFD')
  const index = TONE_MARKS.findIndex((mark) => decomposed.includes(mark))
  return index === -1 ? 0 : index + 1
}

/** Bỏ dấu thanh, giữ nguyên hai chấm của ü: `hǎo` → `hao`, `nǚ` → `nü`. */
export function stripTone(syllable: string): string {
  return syllable.normalize('NFD').replace(TONE_MARK_RE, '').normalize('NFC')
}

/**
 * Vị trí nguyên âm mang dấu, theo quy tắc chuẩn: `a` trước, rồi `o`, rồi `e`,
 * còn lại thì nguyên âm cuối — nhờ vế cuối này mà `iu` ra `iù` và `ui` ra `uì`.
 *
 * Trả về -1 khi âm tiết không có nguyên âm nào (ví dụ `hm`, `n`).
 */
function markTarget(base: string): number {
  const lower = base.toLowerCase()
  for (const vowel of 'aoe') {
    const found = lower.indexOf(vowel)
    if (found !== -1) return found
  }
  for (let i = lower.length - 1; i >= 0; i -= 1) {
    if (VOWELS.includes(lower[i])) return i
  }
  return -1
}

/**
 * Gắn thanh `tone` (1–4) vào một âm tiết, thay cho thanh sẵn có.
 * `tone` là 0 hoặc ngoài khoảng thì trả về âm tiết không dấu.
 */
export function applyTone(syllable: string, tone: number): string {
  const base = stripTone(syllable)
  if (tone < 1 || tone > 4) return base

  const target = markTarget(base)
  if (target === -1) return base

  const marked = base.slice(0, target + 1) + TONE_MARKS[tone - 1] + base.slice(target + 1)
  return marked.normalize('NFC')
}

/** Bốn biến thể của một âm tiết, theo thứ tự thanh 1 → 4. */
export function toneVariants(syllable: string): string[] {
  return [1, 2, 3, 4].map((tone) => applyTone(syllable, tone))
}

/** Cắt pinyin nhiều âm tiết thành từng âm tiết: `nǐ hǎo` → `['nǐ', 'hǎo']`. */
export function splitSyllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean)
}

/** Từ này chỉ có một âm tiết, và âm tiết đó có thanh rõ ràng (không phải thanh nhẹ). */
export function isSingleToned(pinyin: string): boolean {
  const syllables = splitSyllables(pinyin)
  return syllables.length === 1 && toneOf(syllables[0]) !== 0
}

/**
 * Vị trí âm tiết sẽ bị đổi thanh để dựng phương án nhiễu.
 * Lấy âm tiết đầu tiên có thanh rõ ràng; toàn thanh nhẹ thì trả -1.
 */
export function tonedSyllableIndex(pinyin: string): number {
  return splitSyllables(pinyin).findIndex((syllable) => toneOf(syllable) !== 0)
}

/**
 * Bốn cách đọc một từ, chỉ khác nhau đúng thanh của âm tiết thứ `index`.
 *
 * Đây là điểm mấu chốt của bài phân biệt thanh: mọi phương án giống hệt nhau
 * trừ cái thanh, nên không thể loại trừ bằng phụ âm hay vần — bắt buộc phải nghe.
 */
export function wordToneVariants(pinyin: string, index: number): string[] {
  const syllables = splitSyllables(pinyin)
  if (index < 0 || index >= syllables.length) return []

  return [1, 2, 3, 4].map((tone) =>
    syllables
      .map((syllable, position) => (position === index ? applyTone(syllable, tone) : syllable))
      .join(' '),
  )
}
