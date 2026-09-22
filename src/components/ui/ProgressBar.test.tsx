import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('báo đúng giá trị cho trình đọc màn hình', () => {
    render(<ProgressBar value={42} label="Tiến độ level" />)
    const bar = screen.getByRole('progressbar', { name: 'Tiến độ level' })
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('kẹp giá trị vượt ngưỡng về 100', () => {
    render(<ProgressBar value={180} label="Quá đà" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('kẹp giá trị âm về 0', () => {
    render(<ProgressBar value={-20} label="Âm" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('làm tròn giá trị lẻ', () => {
    render(<ProgressBar value={33.6} label="Lẻ" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '34')
  })
})
