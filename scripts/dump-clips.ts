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
import { sentenceAudioKey } from '../src/lib/sentences.ts'
import { expectedTones, speechTokens } from '../src/lib/speechTokens.ts'

interface Clip {
  path: string
  kind: 'word' | 'sentence'
  hanzi: string
  tokens: string[]
  expect: number[]
}

function clip(path: string, kind: Clip['kind'], hanzi: string, pinyin: string): Clip {
  const tokens = speechTokens(pinyin)
  return { path, kind, hanzi, tokens, expect: expectedTones(tokens) }
}

const words = WORDS.map((word) => clip(`${word.id}.mp3`, 'word', word.hanzi, word.pinyin))

// Một câu có thể là câu mẫu của hai từ (你叫什么名字 của cả 你 lẫn 叫) — tên file
// băm từ nội dung nên trùng nhau, và chỉ cần sinh một lần.
const sentences = new Map<string, Clip>()
for (const sentence of WORDS.flatMap((word) => word.examples)) {
  const path = `sentences/${sentenceAudioKey(sentence)}.mp3`
  if (!sentences.has(path)) {
    sentences.set(path, clip(path, 'sentence', sentence.hanzi, sentence.pinyin))
  }
}

process.stdout.write(JSON.stringify([...words, ...sentences.values()]))
