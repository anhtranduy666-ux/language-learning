import { describe, expect, it } from 'vitest'
import { ONBOARDED, renderApp } from '../../test/renderApp'
import { todayIso } from '../../lib/date'
import { STREAK_BONUS_DAYS, SCENE_KEY } from '../../lib/scene'
import { THEME_KEY } from '../../lib/theme'

const LESSON_ID = 'u1l1'

/** Nền động là phần trang trí, cố ý `aria-hidden` nên không có vai trò nào để hỏi. */
const scene = () => document.querySelector('.scene')

describe('SceneBackground', () => {
  it('hiện sau trang chủ, và theo chế độ sáng thì ra khu vườn', () => {
    localStorage.setItem(THEME_KEY, 'light')
    renderApp('/', ONBOARDED)

    expect(scene()).toHaveAttribute('data-sky', 'day')
  })

  it('chế độ tối thì ra bầu trời sao', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    renderApp('/', ONBOARDED)

    expect(scene()).toHaveAttribute('data-sky', 'night')
  })

  it('chưa học gì hôm nay thì cảnh còn là sương sớm', () => {
    renderApp('/', { ...ONBOARDED, xpToday: 0, dailyGoal: 50 })

    expect(scene()).toHaveAttribute('data-stage', 'dawn')
  })

  it('đang học dở thì cảnh nở một nửa', () => {
    renderApp('/', { ...ONBOARDED, xpToday: 30, dailyGoal: 50 })

    expect(scene()).toHaveAttribute('data-stage', 'rising')
  })

  it('đạt mục tiêu thì cảnh nở hết', () => {
    renderApp('/', { ...ONBOARDED, xpToday: 50, dailyGoal: 50 })

    expect(scene()).toHaveAttribute('data-stage', 'bloom')
  })

  it('giữ streak đủ dài thì cảnh được thưởng thêm', () => {
    renderApp('/', {
      ...ONBOARDED,
      streak: STREAK_BONUS_DAYS,
      lastGoalDate: todayIso(),
    })

    expect(scene()).toHaveAttribute('data-streak', 'on')
  })

  it('streak đã đứt thì thôi không thưởng nữa', () => {
    renderApp('/', { ...ONBOARDED, streak: STREAK_BONUS_DAYS, lastGoalDate: '2020-01-01' })

    expect(scene()).toHaveAttribute('data-streak', 'off')
  })

  it('vào màn hình học thì nền lắng xuống', () => {
    renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)

    expect(scene()).toHaveAttribute('data-variant', 'focus')
  })

  it('ngoài luồng học thì nền chạy bình thường', () => {
    renderApp('/', ONBOARDED)

    expect(scene()).toHaveAttribute('data-variant', 'app')
  })

  it('người học tắt nền động thì không dựng gì cả', () => {
    localStorage.setItem(SCENE_KEY, 'off')
    renderApp('/', ONBOARDED)

    expect(scene()).toBeNull()
  })

  it('chọn tĩnh thì cảnh vẫn ở đó, chỉ là không chuyển động', () => {
    localStorage.setItem(SCENE_KEY, 'still')
    renderApp('/', ONBOARDED)

    expect(scene()).toHaveAttribute('data-motion', 'still')
  })
})
