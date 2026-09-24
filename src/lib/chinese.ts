/**
 * Tách câu tiếng Trung thành từng từ.
 *
 * Tiếng Trung viết liền, không có dấu cách giữa các từ, nên muốn làm bài ghép
 * câu thì phải tự cắt. Cắt từng chữ một là hỏng bài học: 学生 là "học sinh",
 * tách ra thành 学 và 生 là hai mảnh vô nghĩa với người mới.
 *
 * Cách làm: khớp tham lam từ dài nhất trước, dựa trên chính kho từ của khoá
 * học. Chữ nào không thuộc từ nào thì đứng riêng một mảnh — vẫn chơi được,
 * chỉ là bấm nhiều mảnh hơn.
 *
 * Toàn bộ logic ở đây là hàm thuần để test trực tiếp, không cần dựng React.
 */

/** Khoảng mã của chữ Hán thường gặp. */
const HAN = /[一-鿿]/

/** Dấu câu của cả tiếng Trung lẫn tiếng Việt, bỏ hết trước khi cắt. */
const PUNCTUATION = /[，。、？！：；「」『』（）《》〈〉…·,.?!:;()[\]{}"'“”‘’—–-]/g

/**
 * Những từ nhiều chữ xuất hiện trong câu ví dụ nhưng không nằm trong 60 từ
 * HSK 1. Thiếu chúng thì câu bị cắt vụn ra từng chữ ở đúng những chỗ khó nhất.
 *
 * Danh sách cố ý ngắn và chỉ gồm từ thật sự có trong dữ liệu — thêm câu ví dụ
 * mới mà quên bổ sung ở đây thì câu đó chỉ bị cắt vụn hơn, không vỡ gì cả.
 */
export const EXTRA_LEXICON = [
  '哥哥',
  '高兴',
  '知道',
  '学习',
  '上课',
  '这个',
  '很多',
  '没有',
  '可以',
  '喝茶',
  '今年',
] as const

/** Bỏ dấu câu, gom khoảng trắng. */
export function stripPunctuation(text: string): string {
  return text.replace(PUNCTUATION, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Cắt một câu thành các mảnh để ghép.
 *
 * Chữ Latin và chữ số đi liền nhau được giữ nguyên thành một mảnh, để tên
 * riêng như "Tom" không bị xé thành ba chữ cái.
 *
 * Bất biến: ghép các mảnh lại phải ra đúng câu gốc sau khi bỏ dấu câu và
 * khoảng trắng — không mất chữ nào, không nhân đôi chữ nào.
 */
export function tokenizeChinese(text: string, lexicon: readonly string[]): string[] {
  const dictionary = new Set(lexicon.filter((word) => word.length > 1))
  const longest = dictionary.size === 0 ? 1 : Math.max(...[...dictionary].map((w) => w.length))

  const clean = stripPunctuation(text)
  const tokens: string[] = []
  let index = 0

  while (index < clean.length) {
    const char = clean[index]

    if (char === ' ') {
      index += 1
      continue
    }

    // Một cụm chữ Latin hoặc chữ số là một mảnh.
    if (!HAN.test(char)) {
      let end = index
      while (end < clean.length && clean[end] !== ' ' && !HAN.test(clean[end])) end += 1
      tokens.push(clean.slice(index, end))
      index = end
      continue
    }

    // Chữ Hán: thử từ dài nhất trước, không khớp thì đứng riêng một chữ.
    let matched = ''
    for (let length = Math.min(longest, clean.length - index); length >= 2; length -= 1) {
      const piece = clean.slice(index, index + length)
      if (dictionary.has(piece)) {
        matched = piece
        break
      }
    }

    tokens.push(matched || char)
    index += (matched || char).length
  }

  return tokens
}
