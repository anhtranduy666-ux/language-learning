import { describe, expect, it } from 'vitest'
import { WORDS, WORD_BY_ID } from '../data/hsk1'
import { AUDIO_FILE_URLS, audioUrlForWord, hasRecordedAudio } from './audioFiles'

describe('audioFiles', () => {
  it('mọi file audio đều khớp với một từ có thật', () => {
    // Đặt sai tên file thì âm thanh im lặng mà không báo gì — test này bắt lỗi đó.
    const lạc = Object.keys(AUDIO_FILE_URLS).filter((id) => !WORD_BY_ID[id])
    expect(lạc).toEqual([])
  })

  it('mọi từ trong khoá học đều đã có file phát âm', () => {
    // Đây là lưới an toàn cho lúc thêm từ mới: quên chạy `npm run generate-audio`
    // thì nút loa của từ đó câm lặng trên bản deploy mà không ai hay.
    const thiếu = WORDS.filter((word) => !AUDIO_FILE_URLS[word.id]).map((word) => word.id)
    expect(thiếu).toEqual([])
  })

  it('có đủ audio nên máy nào cũng phát âm được', () => {
    expect(hasRecordedAudio()).toBe(true)
  })

  it('không có wordId thì không có file', () => {
    expect(audioUrlForWord(undefined)).toBeNull()
    expect(audioUrlForWord('')).toBeNull()
  })

  it('từ chưa thu audio thì trả về null', () => {
    expect(audioUrlForWord('khong-ton-tai')).toBeNull()
  })

  it('hasRecordedAudio phản ánh đúng số file đang có', () => {
    expect(hasRecordedAudio()).toBe(Object.keys(AUDIO_FILE_URLS).length > 0)
  })
})
