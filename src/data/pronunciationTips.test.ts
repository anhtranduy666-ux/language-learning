import { describe, expect, it } from 'vitest'
import { BANDS, MIC_PROBLEMS, PRAISE, PRIVACY_NOTE, REJECTIONS, TIPS, bandLabel, sandhiNote } from './pronunciationTips'

describe('pronunciationTips', () => {
  it('mỗi chỗ sai có đúng một lời khuyên, không lời nào trống', () => {
    const tips = Object.values(TIPS)
    expect(tips).toHaveLength(7)
    for (const tip of tips) expect(tip.trim().length).toBeGreaterThan(10)
    // Lời khuyên khác nhau thật, không chép đi chép lại.
    expect(new Set(tips).size).toBe(tips.length)
  })

  it('mỗi lý do từ chối chấm đều mời đọc lại bằng lời dễ hiểu', () => {
    expect(Object.keys(REJECTIONS).sort()).toEqual(['too-long', 'too-noisy', 'too-quiet', 'too-short'])
    for (const message of Object.values(REJECTIONS)) expect(message).toMatch(/nhé\.$/)
  })

  it('mỗi lỗi micro có cách gỡ riêng', () => {
    expect(Object.keys(MIC_PROBLEMS).sort()).toEqual(
      ['busy', 'denied', 'error', 'insecure', 'no-device', 'unsupported'],
    )
    expect(MIC_PROBLEMS.denied).toMatch(/Micro/)
  })

  it('nói rõ tiếng không rời khỏi máy trước khi xin quyền', () => {
    expect(PRIVACY_NOTE).toMatch(/không gửi đi/)
    expect(PRIVACY_NOTE).toMatch(/không được lưu/)
    expect(PRAISE.length).toBeGreaterThan(0)
  })

  it('âm bị biến điệu thì nói rõ vì sao chữ ghi thanh 3 mà đọc thành thanh 2', () => {
    expect(sandhiNote('nǐ')).toBe('Âm “nǐ” đứng trước một thanh 3 nên đọc thành thanh 2.')
  })

  it('dải điểm phủ kín từ 0 tới 100, chữ trước số', () => {
    expect(bandLabel(100)).toBe('Tuyệt vời!')
    expect(bandLabel(90)).toBe('Tuyệt vời!')
    expect(bandLabel(89)).toBe('Khá rồi!')
    expect(bandLabel(60)).toBe('Gần được rồi')
    expect(bandLabel(40)).toBe('Luyện thêm chút nữa')
    expect(bandLabel(0)).toBe('Luyện thêm chút nữa')
    expect(BANDS[BANDS.length - 1].min).toBe(0)
  })
})
