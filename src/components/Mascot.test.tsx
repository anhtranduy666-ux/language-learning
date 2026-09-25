import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mascot, MascotSays, type MascotMood } from './Mascot'

/** Zibi là hình trang trí nên không có vai trò nào để hỏi — tìm thẳng bằng lớp. */
const mascot = () => document.querySelector('.mascot')
const parts = (name: string) => document.querySelectorAll(`.mascot [data-part="${name}"]`)

const MOODS: MascotMood[] = ['chao', 'vui', 'nghi', 'mung', 'tiec']

describe('Mascot', () => {
  it('là hình trang trí, trình đọc màn hình bỏ qua', () => {
    render(<Mascot mood="vui" />)

    expect(mascot()).toHaveAttribute('aria-hidden', 'true')
  })

  it('năm tâm trạng là năm khuôn mặt khác nhau', () => {
    const faces = MOODS.map((mood) => {
      const { container, unmount } = render(<Mascot mood={mood} />)
      // Bỏ id vùng cắt đi: id khác nhau giữa các lần vẽ, không phải khác mặt.
      const face = container.innerHTML.replace(/zibi-mouth-[\w-]+/g, '')
      unmount()
      return face
    })

    expect(new Set(faces).size).toBe(MOODS.length)
  })

  it('tâm trạng nào cũng giữ cái mũi đen, để vẫn nhận ra là một nhân vật', () => {
    for (const mood of MOODS) {
      const { unmount } = render(<Mascot mood={mood} />)
      expect(parts('nose'), mood).toHaveLength(1)
      unmount()
    }
  })

  it('cười sặc thì nhắm tịt mắt, không còn con ngươi', () => {
    const { rerender } = render(<Mascot mood="vui" />)
    expect(parts('pupil')).toHaveLength(2)

    rerender(<Mascot mood="mung" />)
    expect(parts('pupil')).toHaveLength(0)
  })

  it('nghi ngờ thì một mắt híp, một mắt trố', () => {
    render(<Mascot mood="nghi" />)

    expect(parts('pupil')).toHaveLength(1)
  })

  it('tiếc thì khóc bù lu: có nước mắt chảy và bong bóng mũi', () => {
    const { rerender } = render(<Mascot mood="tiec" />)
    expect(parts('tears')).toHaveLength(1)
    expect(parts('snot')).toHaveLength(1)

    rerender(<Mascot mood="vui" />)
    expect(parts('tears')).toHaveLength(0)
    expect(parts('snot')).toHaveLength(0)
  })

  it('chào thì vẫy tay, tâm trạng khác thì không', () => {
    const { rerender } = render(<Mascot mood="chao" />)
    expect(document.querySelector('.mascot .mascot-wave')).not.toBeNull()

    rerender(<Mascot mood="nghi" />)
    expect(document.querySelector('.mascot .mascot-wave')).toBeNull()
  })

  it('hai Zibi cùng một trang không giẫm id vùng cắt miệng của nhau', () => {
    render(
      <>
        <Mascot mood="vui" />
        <Mascot mood="vui" />
      </>,
    )

    const svgs = [...document.querySelectorAll('.mascot')]
    const ids = svgs.map((svg) => svg.querySelector('clipPath')!.id)
    expect(new Set(ids).size).toBe(2)
    // Miệng của hình nào trỏ đúng vùng cắt của chính hình đó.
    svgs.forEach((svg, index) => {
      expect(svg.querySelector(`[clip-path="url(#${ids[index]})"]`)).not.toBeNull()
    })
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
