import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ONBOARDED, renderApp } from '../test/renderApp'

const nav = () => screen.getByRole('navigation', { name: 'Điều hướng chính' })
const link = (name: string) => within(nav()).getByRole('link', { name })

describe('BottomNav', () => {
  it('có đủ bốn mục, mỗi mục có tên dù trên màn hình chỉ có icon', () => {
    renderApp('/', ONBOARDED)

    for (const name of ['Trang chủ', 'Học', 'Tiến độ', 'Cá nhân']) {
      expect(link(name)).toBeInTheDocument()
    }
  })

  it('mục đang đứng được đánh dấu cho trình đọc màn hình', () => {
    renderApp('/learn', ONBOARDED)

    expect(link('Học')).toHaveAttribute('aria-current', 'page')
    expect(link('Trang chủ')).not.toHaveAttribute('aria-current')
  })

  it('bong bóng đứng đúng dưới mục đang chọn', () => {
    renderApp('/progress', ONBOARDED)

    expect(nav()).toHaveAttribute('data-active-index', '2')
  })

  it('bấm sang mục khác thì bong bóng trượt theo', async () => {
    const { user } = renderApp('/', ONBOARDED)
    expect(nav()).toHaveAttribute('data-active-index', '0')

    await user.click(link('Cá nhân'))

    expect(nav()).toHaveAttribute('data-active-index', '3')
    expect(screen.getByRole('heading', { name: 'Cá nhân' })).toBeInTheDocument()
  })

  it('icon của mục đang chọn tô đặc, các mục khác chỉ có nét viền', () => {
    renderApp('/', ONBOARDED)

    expect(link('Trang chủ').querySelector('svg')).toHaveAttribute('data-filled', 'true')
    expect(link('Học').querySelector('svg')).toHaveAttribute('data-filled', 'false')
  })

  it('di chuột vào icon thì hiện tên mục', () => {
    renderApp('/', ONBOARDED)

    expect(link('Tiến độ')).toHaveAttribute('title', 'Tiến độ')
  })

  it('không có thanh điều hướng trong lúc đang học một bài', () => {
    renderApp('/lesson/u1l1', ONBOARDED)

    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).not.toBeInTheDocument()
  })
})
