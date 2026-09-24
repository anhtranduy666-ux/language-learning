import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WORD_BY_ID } from '../data/hsk1'
import { Flashcard } from './Flashcard'

const WORD = WORD_BY_ID.nihao

describe('Flashcard', () => {
  it('hiển thị chữ Hán của từ', () => {
    render(<Flashcard word={WORD} flipped={false} onFlip={() => {}} />)
    expect(screen.getAllByText(WORD.hanzi).length).toBeGreaterThan(0)
  })

  it('có pinyin, nghĩa và câu mẫu chính ở mặt sau', () => {
    render(<Flashcard word={WORD} flipped={true} onFlip={() => {}} />)
    const [sentence] = WORD.examples

    expect(screen.getByText(WORD.pinyin)).toBeInTheDocument()
    expect(screen.getByText(WORD.meaning)).toBeInTheDocument()
    expect(screen.getByText(sentence.meaning)).toBeInTheDocument()
    // Chữ Hán và pinyin của câu bị chia thành nhiều đoạn để tô từ đang học.
    expect(document.body).toHaveTextContent(sentence.pinyin)
  })

  it('câu mẫu ở mặt sau có nút nghe cả câu', () => {
    render(<Flashcard word={WORD} flipped={true} onFlip={() => {}} />)
    const [sentence] = WORD.examples

    expect(
      screen.getByRole('button', { name: `Nghe phát âm câu ${sentence.hanzi}` }),
    ).toBeInTheDocument()
  })

  it('mặt đang quay đi không nhận Tab, để không nhảy vào nút mắt không thấy', () => {
    const { rerender } = render(<Flashcard word={WORD} flipped={false} onFlip={() => {}} />)
    const faces = () => document.querySelectorAll('.flip-face')

    expect(faces()[0]).not.toHaveAttribute('inert')
    expect(faces()[1]).toHaveAttribute('inert')

    rerender(<Flashcard word={WORD} flipped={true} onFlip={() => {}} />)
    expect(faces()[0]).toHaveAttribute('inert')
    expect(faces()[1]).not.toHaveAttribute('inert')
  })

  it('đánh dấu trạng thái lật để CSS xoay thẻ', () => {
    const { rerender } = render(<Flashcard word={WORD} flipped={false} onFlip={() => {}} />)
    expect(screen.getByTestId('flashcard')).toHaveAttribute('data-flipped', 'false')

    rerender(<Flashcard word={WORD} flipped={true} onFlip={() => {}} />)
    expect(screen.getByTestId('flashcard')).toHaveAttribute('data-flipped', 'true')
  })

  it('gọi onFlip khi người dùng chạm vào thẻ', async () => {
    const onFlip = vi.fn()
    const user = userEvent.setup()

    render(<Flashcard word={WORD} flipped={false} onFlip={onFlip} />)
    await user.click(screen.getByTestId('flashcard'))

    expect(onFlip).toHaveBeenCalledOnce()
  })

  it('đổi nhãn trợ năng theo trạng thái lật', () => {
    const { rerender } = render(<Flashcard word={WORD} flipped={false} onFlip={() => {}} />)
    expect(screen.getByLabelText('Lật thẻ để xem nghĩa')).toBeInTheDocument()

    rerender(<Flashcard word={WORD} flipped={true} onFlip={() => {}} />)
    expect(screen.getByLabelText('Lật lại mặt trước')).toBeInTheDocument()
  })
})
