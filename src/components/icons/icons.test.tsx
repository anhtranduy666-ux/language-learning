import { render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '../../lib/gamification'
import { ONBOARDED, renderApp } from '../../test/renderApp'
import * as game from './GameIcons'
import * as ui from './UiIcons'

type Icon = (props: { size?: number }) => ReactElement

/** Mọi icon trong hai bộ, trừ `AchievementIcon` vốn cần thêm tên. */
const ICONS = Object.entries({ ...game, ...ui }).filter(
  ([name]) => name.endsWith('Icon') && name !== 'AchievementIcon',
) as Array<[string, Icon]>

describe('bộ icon vẽ tay', () => {
  it('có đủ icon cho chỉ số, thành tích và nút bấm', () => {
    expect(ICONS.length).toBeGreaterThanOrEqual(25)
  })

  it('icon nào cũng là SVG trang trí, đúng cỡ, trình đọc màn hình bỏ qua', () => {
    for (const [name, Icon] of ICONS) {
      const { container, unmount } = render(<Icon size={24} />)
      const svg = container.querySelector('svg')
      expect(svg, name).not.toBeNull()
      expect(svg, name).toHaveAttribute('aria-hidden', 'true')
      expect(svg, name).toHaveAttribute('width', '24')
      unmount()
    }
  })

  it('thành tích nào cũng có icon vẽ tay của riêng nó', () => {
    for (const achievement of ACHIEVEMENTS) {
      const { container, unmount } = render(<game.AchievementIcon name={achievement.icon} />)
      expect(container.querySelector('svg'), achievement.id).not.toBeNull()
      unmount()
    }
  })
})

describe('dải chỉ số', () => {
  it('streak, XP và level đều có icon vẽ tay, con số vẫn đọc được', () => {
    renderApp('/', { ...ONBOARDED, xp: 25 })

    const streak = screen.getByTitle('Chuỗi ngày học liên tiếp')
    const xp = screen.getByTitle('Tổng XP')
    const level = screen.getByTitle('Level hiện tại')
    for (const pill of [streak, xp, level]) expect(pill.querySelector('svg[aria-hidden="true"]')).not.toBeNull()

    expect(xp).toHaveTextContent('25')
    expect(within(level).getByText(/Level/)).toHaveClass('sr-only')
  })
})
