import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WORD_BY_ID } from '../data/hsk1'
import { SENTENCE_AUDIO_URLS } from '../lib/audioFiles'
import { sentenceAudioKey } from '../lib/sentences'
import { ExampleSentences, SentenceLine } from './ExampleSentences'

const WORD = WORD_BY_ID.ni

/** `Audio` giả: jsdom không phát được media thật. Ghi lại file nào được phát. */
function installAudio() {
  const played: string[] = []
  vi.stubGlobal(
    'Audio',
    class {
      private handlers: Record<string, () => void> = {}
      constructor(public src: string) {}
      addEventListener(type: string, fn: () => void) {
        this.handlers[type] = fn
      }
      pause() {}
      play() {
        played.push(this.src)
        queueMicrotask(() => this.handlers.ended?.())
        return Promise.resolve()
      }
    },
  )
  return played
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ExampleSentences', () => {
  it('liệt kê đủ câu mẫu của từ, câu nào cũng có chữ Hán, pinyin và nghĩa', () => {
    render(<ExampleSentences word={WORD} />)
    const items = within(screen.getByRole('list', { name: 'Câu mẫu với 你' })).getAllByRole('listitem')

    expect(items).toHaveLength(WORD.examples.length)
    WORD.examples.forEach((sentence, index) => {
      expect(items[index]).toHaveTextContent(sentence.hanzi)
      expect(items[index]).toHaveTextContent(sentence.pinyin)
      expect(items[index]).toHaveTextContent(sentence.meaning)
    })
  })

  it('bấm loa của câu nào thì phát đúng file đọc cả câu đó', async () => {
    const played = installAudio()
    const user = userEvent.setup()
    render(<ExampleSentences word={WORD} />)

    for (const sentence of WORD.examples) {
      await user.click(screen.getByRole('button', { name: `Nghe phát âm câu ${sentence.hanzi}` }))
    }

    expect(played).toEqual(
      WORD.examples.map((sentence) => SENTENCE_AUDIO_URLS[sentenceAudioKey(sentence)]),
    )
    // Không phải file của riêng từ 你.
    expect(played.every((url) => url.includes('/sentences/'))).toBe(true)
  })

  it('tô từ đang học ở cả dòng chữ Hán lẫn dòng pinyin', () => {
    render(<ExampleSentences word={WORD} />)
    const [first] = screen.getAllByRole('listitem')
    const marks = within(first).getAllByText((_, element) => element?.tagName === 'MARK')

    expect(marks.map((mark) => mark.textContent)).toEqual(['你', 'Nǐ'])
  })
})

describe('SentenceLine', () => {
  it('không có từ cần tô thì hiện nguyên câu', () => {
    const [sentence] = WORD.examples
    const { container } = render(<SentenceLine sentence={sentence} />)

    expect(container.querySelector('mark')).toBeNull()
    expect(container).toHaveTextContent(sentence.pinyin)
  })
})
