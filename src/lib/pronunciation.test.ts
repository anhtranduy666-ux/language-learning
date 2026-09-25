import { describe, expect, it } from 'vitest'
import { SCORE_FLOOR, scoreAttempt, speechSeconds } from './pronunciation'
import { PASS_SCORE } from './toneScore'
import { RATE, concat, noise, silence, spokenWord, toneSyllable, vowel, withNoise } from '../test/synthVoice'

/** Chấm một bản đọc dựng tay, không có bản mẫu. */
function attempt(samples: Float32Array, pinyin: string, baselineHz: number | null = null) {
  return scoreAttempt({ samples, rate: RATE, pinyin, referenceSeconds: null, baselineHz })
}

describe('scoreAttempt — chấm thanh', () => {
  it('你好 đọc đúng cả biến điệu (ní hǎo) thì được điểm cao', () => {
    // expectedTones('nǐ hǎo') = [2, 3]: người đọc đúng sẽ lên giọng ở 你.
    const result = attempt(spokenWord([2, 3], 180), 'nǐ hǎo')

    expect(result.rejected).toBeNull()
    expect(result.syllables.map((s) => s.expectedTone)).toEqual([2, 3])
    expect(result.total).toBeGreaterThanOrEqual(80)
    expect(result.problem).toBeNull()
  })

  it('biến điệu không bị trừ điểm: đọc ní được điểm cao hơn đọc nǐ theo mặt chữ', () => {
    const sandhi = attempt(spokenWord([2, 3], 180), 'nǐ hǎo')
    const literal = attempt(spokenWord([4, 3], 180), 'nǐ hǎo')
    expect(sandhi.syllables[0].score!).toBeGreaterThan(literal.syllables[0].score!)
  })

  it('đọc sai thanh ở âm đầu (nì hǎo) thì bị đánh dấu đúng ở âm đầu', () => {
    const result = attempt(spokenWord([4, 3], 180), 'nǐ hǎo')

    expect(result.syllables[0].score!).toBeLessThan(PASS_SCORE)
    expect(result.syllables[1].score!).toBeGreaterThanOrEqual(PASS_SCORE)
    expect(result.weakest).toBe(0)
    expect(result.problem).toBe('no-rise')
  })

  it('thanh nhẹ không bị chấm, và không kéo điểm xuống', () => {
    const result = attempt(spokenWord([4, 1], 200), 'xiè xie')

    expect(result.syllables[1].expectedTone).toBe(0)
    expect(result.syllables[1].score).toBeNull()
    expect(result.tone).toBe(result.syllables[0].score)
  })

  it('giọng nam trầm và giọng trẻ em đọc đúng đều được điểm cao', () => {
    for (const base of [100, 420]) {
      const result = attempt(spokenWord([4, 4], base), 'zài jiàn')
      expect(result.total, `${base} Hz`).toBeGreaterThanOrEqual(80)
    }
  })

  it('từ một âm tiết dùng mặt bằng giọng dành dụm từ trước, nếu có', () => {
    // Thanh 1 phẳng nhưng thấp hẳn so với giọng thường: chỉ bắt được khi biết mặt bằng.
    const low = concat(silence(0.25, 0.002), vowel({ hz: [150, 151], seconds: 0.35 }), silence(0.3, 0.002))
    expect(attempt(low, 'tā', null).syllables[0].score).toBe(100)
    expect(attempt(low, 'tā', 240).syllables[0].problem).toBe('too-low')
  })

  it('trả cao độ giữa của lượt đọc, để cập nhật mặt bằng giọng', () => {
    const result = attempt(spokenWord([1], 220), 'tā')
    expect(result.medianHz!).toBeGreaterThan(220)
    expect(result.medianHz!).toBeLessThan(290)
  })

  it('đọc sai bét vẫn không dưới mức sàn', () => {
    const result = attempt(spokenWord([2, 2], 180), 'zài jiàn')
    expect(result.rejected).toBeNull()
    expect(result.total).toBe(SCORE_FLOOR)
  })
})

describe('scoreAttempt — từ chối chấm', () => {
  it('khoảng lặng thì mời đọc to hơn', () => {
    expect(attempt(silence(1, 0.001), 'nǐ hǎo').rejected).toBe('too-quiet')
  })

  it('chỉ có tiếng ồn, không có giọng nói, thì cũng là chưa nghe rõ', () => {
    expect(attempt(noise(1, 0.3), 'nǐ hǎo').rejected).toBe('too-quiet')
  })

  it('giọng nói chìm trong tiếng ồn thì từ chối thay vì cho điểm thấp', () => {
    expect(attempt(withNoise(spokenWord([2, 3], 180), 0.2), 'nǐ hǎo').rejected).toBe('too-noisy')
  })

  it('đọc cụt quá thì mời đọc trọn cả từ', () => {
    const clip = concat(silence(0.3, 0.002), vowel({ hz: [220], seconds: 0.12 }), silence(0.3, 0.002))
    expect(attempt(clip, 'tā').rejected).toBe('too-short')
  })

  it('từ ba âm tiết mà chỉ nghe thấy một tiếng cụt thì không cắt bừa', () => {
    const clip = concat(silence(0.3, 0.002), vowel({ hz: [220], seconds: 0.2 }), silence(0.3, 0.002))
    expect(attempt(clip, 'bú kè qi').rejected).toBe('too-short')
  })

  it('bản thu dài hơn hẳn một từ thì mời chỉ đọc đúng từ đó', () => {
    const long = concat(...Array.from({ length: 10 }, () => spokenWord([4, 1], 200)))
    expect(attempt(long, 'xiè xie').rejected).toBe('too-long')
  })

  it('từ chối chấm thì không có điểm nào, chỉ còn khung âm tiết để hiện', () => {
    const result = attempt(silence(1, 0.001), 'nǐ hǎo')
    expect(result.total).toBeNull()
    expect(result.syllables.map((s) => s.display)).toEqual(['nǐ', 'hǎo'])
    expect(result.syllables.every((s) => s.score === null)).toBe(true)
  })
})

describe('scoreAttempt — nhịp so với bản mẫu', () => {
  const referenceSeconds = speechSeconds(spokenWord([4, 4], 200), RATE)

  it('đo độ dài phần có tiếng, không kể khoảng lặng hai đầu', () => {
    // Hai âm tiết 0.32 s cách nhau 0.06 s, cộng cửa sổ phân tích.
    expect(referenceSeconds).toBeGreaterThan(0.65)
    expect(referenceSeconds).toBeLessThan(0.78)
  })

  it('đọc nhanh chậm ngang bản mẫu thì nhịp trọn điểm', () => {
    const result = scoreAttempt({
      samples: spokenWord([4, 4], 150),
      rate: RATE,
      pinyin: 'zài jiàn',
      referenceSeconds,
      baselineHz: null,
    })
    expect(result.rhythm).toBe(100)
    expect(result.total!).toBeGreaterThanOrEqual(85)
  })

  it('đọc chậm gấp ba bản mẫu thì nhắc đọc liền hơi', () => {
    const slow = concat(
      silence(0.25, 0.002),
      toneSyllable(4, 200, 0.9),
      silence(0.2, 0.002),
      toneSyllable(4, 200, 0.9),
      silence(0.3, 0.002),
    )
    const result = scoreAttempt({ samples: slow, rate: RATE, pinyin: 'zài jiàn', referenceSeconds, baselineHz: null })
    expect(result.rhythm!).toBeLessThan(PASS_SCORE)
    expect(result.problem).toBe('too-slow')
  })

  it('đọc vội bằng nửa bản mẫu thì nhắc chậm lại', () => {
    const fast = concat(
      silence(0.25, 0.002),
      toneSyllable(4, 200, 0.14),
      silence(0.03, 0.002),
      toneSyllable(4, 200, 0.14),
      silence(0.3, 0.002),
    )
    const result = scoreAttempt({ samples: fast, rate: RATE, pinyin: 'zài jiàn', referenceSeconds, baselineHz: null })
    expect(result.problem).toBe('too-fast')
  })

  it('lời khuyên về thanh điệu được ưu tiên hơn lời khuyên về nhịp', () => {
    const slowAndWrong = concat(
      silence(0.25, 0.002),
      toneSyllable(2, 200, 0.9),
      silence(0.2, 0.002),
      toneSyllable(4, 200, 0.9),
      silence(0.3, 0.002),
    )
    const result = scoreAttempt({
      samples: slowAndWrong,
      rate: RATE,
      pinyin: 'zài jiàn',
      referenceSeconds,
      baselineHz: null,
    })
    expect(result.problem).toBe('no-fall')
    expect(result.weakest).toBe(0)
  })

  it('không có bản mẫu thì điểm tổng chỉ tính theo thanh điệu', () => {
    const result = attempt(spokenWord([4, 4], 200), 'zài jiàn')
    expect(result.rhythm).toBeNull()
    expect(result.total).toBe(Math.max(SCORE_FLOOR, result.tone!))
  })
})
