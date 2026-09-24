import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BubbleSwitch } from './BubbleSwitch'

const OPTIONS = [
  { value: 'light', label: 'Sáng', icon: '☀️' },
  { value: 'dark', label: 'Tối', icon: '🌙' },
  { value: 'system', label: 'Theo máy', icon: '🌓' },
] as const

type Choice = (typeof OPTIONS)[number]['value']

function Harness({ initial = 'dark' as Choice }) {
  const [value, setValue] = useState<Choice>(initial)
  return (
    <>
      <h2 id="nhan">Giao diện</h2>
      <BubbleSwitch labelledBy="nhan" options={OPTIONS} value={value} onChange={setValue} />
    </>
  )
}

const group = () => screen.getByRole('group', { name: 'Giao diện' })

describe('BubbleSwitch', () => {
  it('là một nhóm nút có tên, đọc được bằng trình đọc màn hình', () => {
    render(<Harness />)

    expect(group()).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('tên nút là chữ, không lẫn emoji trang trí', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Theo máy' })).toBeInTheDocument()
  })

  it('đánh dấu đúng lựa chọn hiện tại', () => {
    render(<Harness initial="dark" />)

    expect(screen.getByRole('button', { name: 'Tối' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Sáng' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('bấm lựa chọn khác thì bong bóng dời sang đó', async () => {
    const user = userEvent.setup()
    render(<Harness initial="light" />)
    expect(group()).toHaveAttribute('data-active-index', '0')

    await user.click(screen.getByRole('button', { name: 'Theo máy' }))

    expect(group()).toHaveAttribute('data-active-index', '2')
    expect(screen.getByRole('button', { name: 'Theo máy' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('bong bóng chỉ là hình, trình đọc màn hình bỏ qua', () => {
    render(<Harness />)

    expect(group().querySelector('.bubble-thumb')).toHaveAttribute('aria-hidden', 'true')
  })

  it('giá trị không có trong danh sách thì ẩn bong bóng, không đứng nhầm chỗ', () => {
    render(
      <>
        <h2 id="muc-tieu">Mục tiêu</h2>
        <BubbleSwitch
          labelledBy="muc-tieu"
          options={[
            { value: 30, label: 'Nhẹ nhàng' },
            { value: 50, label: 'Vừa sức' },
          ]}
          value={70}
          onChange={() => {}}
        />
      </>,
    )

    const thumb = screen.getByRole('group', { name: 'Mục tiêu' }).querySelector('.bubble-thumb')
    expect(thumb).toHaveAttribute('data-hidden', 'true')
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })
})
