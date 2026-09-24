import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mascot, MascotSays } from './Mascot'

/** Zibi là hình trang trí nên không có vai trò nào để hỏi — tìm thẳng bằng lớp. */
const mascot = () => document.querySelector('.mascot')

describe('Mascot', () => {
  it('là hình trang trí, trình đọc màn hình bỏ qua', () => {
    render(<Mascot mood="vui" />)

    expect(mascot()).toHaveAttribute('aria-hidden', 'true')
  })

  it('mỗi tâm trạng vẽ ra một bộ mặt khác nhau', () => {
    const { rerender } = render(<Mascot mood="vui" />)
    const happy = mascot()?.innerHTML

    rerender(<Mascot mood="tiec" />)
    const sorry = mascot()?.innerHTML

    expect(mascot()).toHaveAttribute('data-mood', 'tiec')
    expect(sorry).not.toBe(happy)
  })

  it('lúc reo mừng thì mắt cười tít chứ không còn tròng đen', () => {
    const { rerender } = render(<Mascot mood="vui" />)
    expect(document.querySelectorAll('.mascot circle[fill="#24402c"]')).toHaveLength(2)

    rerender(<Mascot mood="mung" />)
    expect(document.querySelectorAll('.mascot circle[fill="#24402c"]')).toHaveLength(0)
  })
})

describe('MascotSays', () => {
  it('lời thoại là chữ thật trong DOM, không phải mô tả một bức ảnh', () => {
    render(<MascotSays mood="chao">Chào bạn, mình là Zibi.</MascotSays>)

    expect(screen.getByText('Chào bạn, mình là Zibi.')).toBeInTheDocument()
    expect(mascot()).toHaveAttribute('aria-hidden', 'true')
  })

  it('đổi màu bong bóng theo việc trả lời đúng hay sai', () => {
    const { rerender } = render(<MascotSays tone="right">Chính xác!</MascotSays>)
    expect(screen.getByText('Chính xác!')).toHaveAttribute('data-tone', 'right')

    rerender(<MascotSays tone="wrong">Chưa đúng.</MascotSays>)
    expect(screen.getByText('Chưa đúng.')).toHaveAttribute('data-tone', 'wrong')
  })
})
