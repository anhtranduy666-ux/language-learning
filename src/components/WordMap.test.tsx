import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ONBOARDED, renderApp } from '../test/renderApp'
import { HSK1 } from '../data/hsk1'
import { THEME_KEY } from '../lib/theme'
import type { WordProgress } from '../types'

/** Bản ghi "đã nhớ" cho đúng những từ được nêu. */
function learned(...wordIds: string[]): Record<string, WordProgress> {
  const words: Record<string, WordProgress> = {}
  for (const wordId of wordIds) {
    words[wordId] = { wordId, known: 1, unknown: 0, lastReviewed: '2026-09-23' }
  }
  return words
}

const UNIT_1_WORDS = HSK1.units[0].lessons.flatMap((lesson) => lesson.wordIds)

/** Bản đồ cố ý là `role="img"`: 60 chấm rời rạc thì đọc từng cái ra vô nghĩa. */
const map = () => screen.getByRole('img', { name: /Bản đồ 60 từ HSK 1/ })

describe('WordMap', () => {
  it('chế độ tối gọi là bầu trời', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    renderApp('/progress', ONBOARDED)

    expect(screen.getByRole('heading', { name: 'Bầu trời của bạn' })).toBeInTheDocument()
  })

  it('chế độ sáng gọi là khu vườn, không mất tính năng', () => {
    localStorage.setItem(THEME_KEY, 'light')
    renderApp('/progress', ONBOARDED)

    expect(screen.getByRole('heading', { name: 'Khu vườn của bạn' })).toBeInTheDocument()
    expect(map()).toBeInTheDocument()
  })

  it('chưa nhớ từ nào thì mời học từ đầu tiên', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    renderApp('/progress', ONBOARDED)

    expect(screen.getByText(/Nhớ được từ đầu tiên là có ngôi sao đầu tiên/)).toBeInTheDocument()
    expect(map()).toHaveAccessibleName(/đã nhớ 0 từ/)
  })

  it('đếm đúng số từ đã nhớ, cả trên nhãn lẫn trong tên đọc được', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    renderApp('/progress', { ...ONBOARDED, words: learned('nihao', 'xiexie', 'wo') })

    expect(screen.getByText('/60 sao', { exact: false })).toBeInTheDocument()
    expect(map()).toHaveAccessibleName(/đã nhớ 3 từ/)
    expect(screen.getByText(/Còn 57 từ nữa là đủ cả khoá/)).toBeInTheDocument()
  })

  it('chú thích cho biết từng chòm đi tới đâu', () => {
    renderApp('/progress', { ...ONBOARDED, words: learned('nihao', 'xiexie') })

    expect(screen.getByText(/Chào hỏi 2\/12/)).toBeInTheDocument()
    expect(screen.getByText(/Gia đình 0\/12/)).toBeInTheDocument()
  })

  it('nhớ hết một unit thì chòm đó được đánh dấu xong', () => {
    renderApp('/progress', { ...ONBOARDED, words: learned(...UNIT_1_WORDS) })

    expect(screen.getByText(/Chào hỏi 12\/12/)).toBeInTheDocument()
    expect(screen.getByLabelText('đã xong')).toBeInTheDocument()
    expect(map()).toHaveAccessibleName(/Chào hỏi 12\/12/)
  })

  it('người dùng bàn phím và trình đọc màn hình vẫn nắm được tiến độ từng chòm', () => {
    renderApp('/progress', { ...ONBOARDED, words: learned('nihao') })

    expect(map()).toHaveAccessibleName(
      /Chào hỏi 1\/12.*Giới thiệu bản thân 0\/12.*Gia đình 0\/12.*Số đếm 0\/12.*Thời gian 0\/12/,
    )
  })
})
