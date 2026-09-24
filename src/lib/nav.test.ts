import { describe, expect, it } from 'vitest'
import { activeNavIndex } from './nav'

/** Bốn mục đúng như thanh điều hướng thật. */
const TARGETS = [
  { to: '/', end: true },
  { to: '/learn', end: false },
  { to: '/progress', end: false },
  { to: '/profile', end: false },
]

describe('activeNavIndex', () => {
  it('trả đúng vị trí của từng mục', () => {
    expect(activeNavIndex('/', TARGETS)).toBe(0)
    expect(activeNavIndex('/learn', TARGETS)).toBe(1)
    expect(activeNavIndex('/progress', TARGETS)).toBe(2)
    expect(activeNavIndex('/profile', TARGETS)).toBe(3)
  })

  it('trang chủ chỉ sáng khi đúng là trang chủ, không sáng theo mọi trang', () => {
    // Nếu mục "/" không có `end`, mọi đường dẫn đều bắt đầu bằng "/" và
    // trang chủ sẽ sáng ở khắp nơi.
    expect(activeNavIndex('/learn', TARGETS)).not.toBe(0)
  })

  it('trang con vẫn sáng mục cha của nó', () => {
    expect(activeNavIndex('/learn/u1', TARGETS)).toBe(1)
  })

  it('dấu gạch chéo thừa ở cuối không làm lệch', () => {
    expect(activeNavIndex('/profile/', TARGETS)).toBe(3)
  })

  it('không nhầm mục có tên bắt đầu giống nhau', () => {
    // "/profiles" không phải trang con của "/profile".
    expect(activeNavIndex('/profiles', TARGETS)).toBe(-1)
  })

  it('không mục nào khớp thì trả -1 để bong bóng ẩn đi', () => {
    expect(activeNavIndex('/lesson/u1l1', TARGETS)).toBe(-1)
  })

  it('đường dẫn rỗng coi như trang chủ', () => {
    expect(activeNavIndex('', TARGETS)).toBe(0)
  })
})
