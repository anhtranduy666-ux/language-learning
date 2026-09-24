/**
 * In danh sách clip audio cần sinh ra JSON, để `generate-audio.py` đọc được.
 *
 * Nội dung khoá học chỉ có một nguồn duy nhất là `src/data/hsk1.ts`, và cách
 * đổi pinyin sang dạng máy đọc chỉ có một chỗ là `src/lib/speechTokens.ts` —
 * nơi có test. Thà chạy thêm một tiến trình Node còn hơn để Python tự bóc file
 * TypeScript rồi lệch với bản thật lúc nào không biết.
 *
 * Mỗi clip gồm:
 *   path    đường dẫn file trong `src/assets/audio/`
 *   kind    `word` thì đọc trong câu đệm rồi cắt ra; `sentence` thì đọc nguyên câu
 *   tokens  pinyin đánh số đưa cho máy đọc
 *   expect  thanh nghe thấy của từng token, để chấm audio sau khi sinh (0 = bỏ qua)
 */

import { WORDS } from '../src/data/hsk1.ts'
import { expectedTones, speechTokens } from '../src/lib/speechTokens.ts'

interface Clip {
  path: string
  kind: 'word' | 'sentence'
  hanzi: string
  tokens: string[]
  expect: number[]
}

const clips: Clip[] = WORDS.map((word) => {
  const tokens = speechTokens(word.pinyin)
  return {
    path: `${word.id}.mp3`,
    kind: 'word',
    hanzi: word.hanzi,
    tokens,
    expect: expectedTones(tokens),
  }
})

process.stdout.write(JSON.stringify(clips))
