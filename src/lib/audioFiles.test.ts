import { describe, expect, it } from 'vitest'
import { WORD_BY_ID } from '../data/hsk1'
import { AUDIO_FILE_URLS, audioUrlForWord, hasRecordedAudio } from './audioFiles'

describe('audioFiles', () => {
  it('mọi file audio đều khớp với một từ có thật', () => {
    // Đặt sai tên file thì âm thanh im lặng mà không báo gì — test này bắt lỗi đó.
    const lạc = Object.keys(AUDIO_FILE_URLS).filter((id) => !WORD_BY_ID[id])
    expect(lạc).toEqual([])
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
