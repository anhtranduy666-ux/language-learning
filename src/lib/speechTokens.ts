/**
 * Pinyin → chuỗi âm tiết đánh số thanh, dạng mà máy đọc Piper cần.
 *
 * Audio của app không để máy tự đoán cách đọc chữ Hán. Giọng `zh_CN-xiao_ya`
 * nhận thẳng pinyin có số thanh, nên pinyin viết tay trong `src/data/hsk1.ts`
 * chính là thứ được đọc: chữ đa âm như 都 (dōu/dū) hay 觉 (jiào/jué) không có
 * cơ hội bị đọc sai. Lý do bỏ giọng cũ nằm ở `docs/audio-voice.md`.
 *
 * Quy ước của pinyin nguồn cũng là quy ước ghi trên giao diện:
 *
 * - Âm tiết cách nhau bằng dấu cách: `shén me`, không phải `shénme`.
 * - Thanh nhẹ không có dấu: `xiè xie`, `míng zi`. Máy đọc gọi đó là thanh 5.
 * - 一 và 不 ghi thanh **đã biến**: `bú shì`, `yí ge`. Đo trên giọng thật thì
 *   máy không tự biến hai chữ này, đưa `bu4 shi4` vào là đọc ra `bù shì`.
 * - Thanh 3 thì **không** ghi biến điệu: `nǐ hǎo`. Máy tự đọc thành `ní hǎo`,
 *   đúng như sách giáo khoa vẫn viết.
 * - Câu thì viết hoa chữ đầu và tên riêng, dấu câu dính vào âm tiết đứng trước:
 *   `Nǐ hǎo, wǒ jiào Xiǎo míng.`
 *
 * File này cố ý không import gì lúc chạy: `scripts/dump-clips.ts` chạy thẳng
 * bằng Node, mà Node không tự tìm file `.ts` khi đường dẫn thiếu đuôi.
 */

/** Dấu thanh dạng ký tự tổ hợp, theo thứ tự thanh 1 → 4. */
const TONE_MARKS = ['̄', '́', '̌', '̀'] as const

/** Dấu câu của pinyin → dấu câu tiếng Trung mà máy đọc hiểu là chỗ ngắt. */
const PUNCTUATION: Record<string, string> = {
  ',': '，',
  '.': '。',
  '?': '？',
  '!': '！',
}

/** Một âm tiết đánh số: `hao3`, `ma5`, `nv3`. */
const NUMBERED = /^[a-z]+[1-5]$/

/**
 * Một âm tiết có dấu → dạng đánh số.
 *
 * `hǎo` → `hao3`, `ma` → `ma5`, `Zhōng` → `zhong1`, `nǚ` → `nv3`. Chữ `ü` viết
 * thành `v` như máy đọc quen dùng; sau j/q/x/y thì pinyin chuẩn vốn đã viết `u`
 * (`qù`, `xué`) nên giữ nguyên.
 */
export function numberSyllable(syllable: string): string {
  const decomposed = syllable.normalize('NFD').toLowerCase()
  const tone = TONE_MARKS.findIndex((mark) => decomposed.includes(mark)) + 1
  const base = decomposed
    .replace(/[̄́̌̀]/g, '')
    .normalize('NFC')
    .replace(/ü/g, 'v')
  return `${base}${tone === 0 ? 5 : tone}`
}

/**
 * Cả một chuỗi pinyin → danh sách âm tiết đánh số, xen dấu ngắt câu.
 *
 * `Nǐ hǎo, wǒ jiào Xiǎo míng.` → `ni3 hao3 ， wo3 jiao4 xiao3 ming2 。`
 *
 * @throws khi có âm tiết không đọc được — thà hỏng lúc sinh audio còn hơn để
 * máy đọc lướt qua một chữ mà không ai hay.
 */
export function speechTokens(pinyin: string): string[] {
  const tokens: string[] = []

  for (const chunk of pinyin.trim().split(/\s+/)) {
    const match = /^(.*?)([,.?!]*)$/.exec(chunk)!
    const [, syllable, marks] = match

    if (syllable !== '') {
      const numbered = numberSyllable(syllable)
      if (!NUMBERED.test(numbered)) {
        throw new Error(`Âm tiết pinyin không hợp lệ: "${syllable}" trong "${pinyin}"`)
      }
      tokens.push(numbered)
    }

    for (const mark of marks) tokens.push(PUNCTUATION[mark])
  }

  return tokens
}

/** Token này có phải dấu ngắt câu không. */
export function isPauseToken(token: string): boolean {
  return Object.values(PUNCTUATION).includes(token)
}

/**
 * Thanh **nghe thấy** của từng âm tiết, để kiểm audio sau khi sinh.
 *
 * Khác với thanh viết ra ở một chỗ: thanh 3 đứng ngay trước một thanh 3 khác
 * thì đọc lên thành thanh 2 (`nǐ hǎo` nghe ra `ní hǎo`). Chuỗi từ ba thanh 3
 * trở lên thì cách đọc tuỳ ngắt nhịp, không có một đáp án duy nhất, nên các
 * âm tiết trước âm cuối được bỏ qua (trả 0) thay vì chấm theo một luật đoán mò.
 *
 * Thanh nhẹ cũng trả 0: nó ngắn và thấp, không có đường cao độ nào để chấm.
 * Dấu câu trả 0.
 */
export function expectedTones(tokens: readonly string[]): number[] {
  const tones = tokens.map((token) => (isPauseToken(token) ? 0 : Number(token.slice(-1))))
  const expected = tones.map((tone) => (tone === 5 ? 0 : tone))

  let index = 0
  while (index < tones.length) {
    if (tones[index] !== 3) {
      index += 1
      continue
    }

    let end = index
    while (end + 1 < tones.length && tones[end + 1] === 3) end += 1
    const length = end - index + 1

    if (length === 2) expected[index] = 2
    if (length > 2) for (let i = index; i < end; i += 1) expected[i] = 0

    index = end + 1
  }

  return expected
}
