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
      const face = container.innerHTML.replace(/zibi-[\w-]+/g, '')
      unmount()
      return face
    })

    expect(new Set(faces).size).toBe(MOODS.length)
  })

  it('tâm trạng nào cũng giữ cái mầm và cái mũi nhỏ, để vẫn nhận ra là một nhân vật', () => {
    for (const mood of MOODS) {
      const { unmount } = render(<Mascot mood={mood} />)
      expect(parts('sprout'), mood).toHaveLength(1)
      expect(parts('nose'), mood).toHaveLength(1)
      unmount()
    }
  })

  it('vui thì nháy một mắt, le lưỡi', () => {
    render(<Mascot mood="vui" />)

    expect(parts('eye')).toHaveLength(1)
    expect(parts('tongue')).toHaveLength(1)
  })

  it('chào thì hai mắt long lanh và vẫy tay; tâm trạng khác thì không vẫy', () => {
    const { rerender } = render(<Mascot mood="chao" />)
    expect(parts('eye')).toHaveLength(2)
    expect(document.querySelector('.mascot .mascot-wave')).not.toBeNull()

    rerender(<Mascot mood="nghi" />)
    expect(document.querySelector('.mascot .mascot-wave')).toBeNull()
  })

  it('đang nghĩ thì có bốn chấm "…." lơ lửng', () => {
    const { rerender } = render(<Mascot mood="nghi" />)
    expect(parts('dots')).toHaveLength(1)
    expect(parts('dots')[0].querySelectorAll('circle')).toHaveLength(4)

    rerender(<Mascot mood="vui" />)
    expect(parts('dots')).toHaveLength(0)
  })

  it('reo mừng thì cười tít mắt, lấp lánh quanh đầu', () => {
    const { rerender } = render(<Mascot mood="mung" />)
    expect(parts('eye')).toHaveLength(0)
    expect(parts('sparkles')).toHaveLength(1)

    rerender(<Mascot mood="chao" />)
    expect(parts('sparkles')).toHaveLength(0)
  })

  it('tiếc thì mắt rơm rớm, nước mắt thành suối, thêm bong bóng mũi', () => {
    const { rerender } = render(<Mascot mood="tiec" />)
    expect(parts('eye')).toHaveLength(2)
    expect(parts('tears')).toHaveLength(1)
    expect(parts('snot')).toHaveLength(1)

    rerender(<Mascot mood="vui" />)
    expect(parts('tears')).toHaveLength(0)
    expect(parts('snot')).toHaveLength(0)
  })

  it('hai Zibi cùng một trang không giẫm id vùng cắt của nhau', () => {
    render(
      <>
        <Mascot mood="tiec" />
        <Mascot mood="tiec" />
      </>,
    )

    const svgs = [...document.querySelectorAll('.mascot')]
    const ids = svgs.flatMap((svg) => [...svg.querySelectorAll('clipPath')].map((clip) => clip.id))
    expect(ids.length).toBeGreaterThan(2)
    expect(new Set(ids).size).toBe(ids.length)
    // Mọi chỗ dùng vùng cắt đều trỏ vào vùng cắt nằm trong chính hình đó.
    for (const svg of svgs) {
      for (const user of svg.querySelectorAll('[clip-path]')) {
        const id = /url\(#(.+)\)/.exec(user.getAttribute('clip-path')!)![1]
        expect(svg.querySelector(`clipPath[id="${id}"]`)).not.toBeNull()
      }
    }
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
