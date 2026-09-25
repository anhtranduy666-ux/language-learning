import { describe, expect, it } from 'vitest'
import {
  BASELINE_KEY,
  BASELINE_MAX_SAMPLES,
  BASELINE_MIN_SAMPLES,
  loadVoiceSamples,
  recordVoiceSample,
  voiceBaseline,
} from './voiceBaseline'

describe('voiceBaseline', () => {
  it('chưa đủ năm lượt đọc thì chưa có mặt bằng', () => {
    expect(voiceBaseline([])).toBeNull()
    expect(voiceBaseline([200, 210, 190, 205])).toBeNull()
  })

  it('đủ lượt thì lấy trung vị — một lượt đọc lạ không kéo lệch', () => {
    expect(voiceBaseline([200, 210, 190, 205, 600])).toBe(205)
    expect(BASELINE_MIN_SAMPLES).toBe(5)
  })
})

describe('loadVoiceSamples / recordVoiceSample', () => {
  it('ghi rồi đọc lại được, sau lần thứ năm thì có mặt bằng', () => {
    for (const hz of [200, 210, 190, 205]) recordVoiceSample(hz)
    expect(voiceBaseline(loadVoiceSamples())).toBeNull()

    recordVoiceSample(215)
    expect(voiceBaseline(loadVoiceSamples())).toBe(205)
  })

  it('chỉ giữ những lượt gần nhất', () => {
    for (let i = 0; i < BASELINE_MAX_SAMPLES + 5; i += 1) recordVoiceSample(100 + i)
    const samples = loadVoiceSamples()
    expect(samples).toHaveLength(BASELINE_MAX_SAMPLES)
    expect(samples[0]).toBe(105)
  })

  it('bỏ qua cao độ vô lý thay vì để nó làm lệch mặt bằng', () => {
    recordVoiceSample(Number.NaN)
    recordVoiceSample(-5)
    recordVoiceSample(5000)
    expect(loadVoiceSamples()).toEqual([])
  })

  it('dữ liệu hỏng thì coi như chưa có gì, không vỡ', () => {
    localStorage.setItem(BASELINE_KEY, '{không phải json')
    expect(loadVoiceSamples()).toEqual([])
    localStorage.setItem(BASELINE_KEY, JSON.stringify({ a: 1 }))
    expect(loadVoiceSamples()).toEqual([])
    localStorage.setItem(BASELINE_KEY, JSON.stringify([200, 'x', null, 210]))
    expect(loadVoiceSamples()).toEqual([200, 210])
  })

  it('bộ nhớ bị chặn thì vẫn trả danh sách, không ném lỗi ra giao diện', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    } as unknown as Storage
    expect(loadVoiceSamples(blocked)).toEqual([])
    expect(recordVoiceSample(200, blocked)).toEqual([200])
  })
})
