import { describe, expect, it } from 'vitest'
import { isNextDay, previousDay, toIsoDate, todayIso } from './date'

describe('toIsoDate', () => {
  it('trả về YYYY-MM-DD theo giờ địa phương', () => {
    expect(toIsoDate(new Date(2026, 8, 22))).toBe('2026-09-22')
  })

  it('đệm 0 cho tháng và ngày một chữ số', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('không bị lùi ngày với thời điểm cuối ngày', () => {
    expect(toIsoDate(new Date(2026, 8, 22, 23, 59, 59))).toBe('2026-09-22')
  })
})

describe('todayIso', () => {
  it('dùng thời điểm truyền vào', () => {
    expect(todayIso(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('previousDay', () => {
  it('lùi một ngày trong cùng tháng', () => {
    expect(previousDay('2026-09-22')).toBe('2026-09-21')
  })

  it('lùi qua đầu tháng', () => {
    expect(previousDay('2026-09-01')).toBe('2026-08-31')
  })

  it('lùi qua đầu năm', () => {
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
  })

  it('xử lý đúng năm nhuận', () => {
    expect(previousDay('2028-03-01')).toBe('2028-02-29')
  })
})

describe('isNextDay', () => {
  it('nhận ra hai ngày liên tiếp', () => {
    expect(isNextDay('2026-09-21', '2026-09-22')).toBe(true)
  })

  it('từ chối khi cách quãng', () => {
    expect(isNextDay('2026-09-20', '2026-09-22')).toBe(false)
  })

  it('từ chối khi trùng ngày', () => {
    expect(isNextDay('2026-09-22', '2026-09-22')).toBe(false)
  })

  it('từ chối khi thiếu dữ liệu', () => {
    expect(isNextDay('', '2026-09-22')).toBe(false)
    expect(isNextDay('2026-09-22', '')).toBe(false)
  })
})
