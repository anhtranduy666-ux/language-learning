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
 * Những từ nhiều chữ xuất hiện trong câu mẫu nhưng không nằm trong 60 từ
 * HSK 1. Thiếu chúng thì câu bị cắt vụn ra từng chữ ở đúng những chỗ khó nhất.
 *
 * Danh sách chỉ gồm từ thật sự có trong câu mẫu — `chinese.test.ts` kiểm điều
 * đó. Thêm câu mẫu mới mà quên bổ sung ở đây thì câu đó chỉ bị cắt vụn hơn,
 * không vỡ gì cả.
 *
 * Cố ý **không** gộp những cụm mà mỗi chữ đã là một từ trong khoá, như 回家
 * hay 星期天: tách ra thì người học được bấm lại đúng những từ vừa học.
 */
export const EXTRA_LEXICON = [
  // Người và nơi chốn
  '哥哥',
  '孩子',
  '他们',
  '小明',
  '学校',
  '医院',
  '北京',
  '越南',
  // Việc làm
  '学习',
  '上课',
  '下课',
  '工作',
  '休息',
  '起床',
  '睡觉',
  '吃饭',
  '喝茶',
  '认识',
  '知道',
  '喜欢',
  '欢迎',
  '回来',
  '请问',
  // Đồ vật và thời gian
  '苹果',
  '杯子',
  '早饭',
  '汉语',
  '天气',
  '问题',
  '生日',
  '新年',
  '今年',
  '明年',
  // Còn lại
  '高兴',
  '快乐',
  '好吃',
  '这个',
  '很多',
  '多少',
  '没有',
  '一起',
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
