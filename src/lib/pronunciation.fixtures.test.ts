import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeWav, median } from './dsp'
import { scoreAttempt } from './pronunciation'
import { PASS_SCORE } from './toneScore'
import { RATE, concat, silence } from '../test/synthVoice'

/**
 * Chấm trên bản đọc thật của máy — sinh bằng `scripts/generate-speech-fixtures.py`.
 *
 * Giọng `xiao_ya` đọc lại từ đầu rồi hạ hoặc nâng cao độ 20%, nên bộ chấm phải so
 * một giọng khác bản mẫu, như ngoài đời. Có cả bản **cố tình đọc sai thanh**:
 * bản đó phải bị đánh dấu đúng ở âm tiết sai. Tiêu chí nghiệm thu lấy từ mục 11
 * của `docs/pronunciation-mvp.md`.
 */

interface Fixture {
  id: string
  pinyin: string
  referenceSeconds: number
  correct: string
  wrong: Array<{ file: string; read: string; syllable: number }>
}

// Vitest chạy từ gốc repo; `import.meta.url` dưới jsdom là URL http, không dùng được.
const DIR = resolve('src/test/fixtures/speech')
const FIXTURES = JSON.parse(readFileSync(resolve(DIR, 'index.json'), 'utf8')) as Fixture[]

/** Đọc một bản mẫu, thêm khoảng lặng hai đầu và tiếng nền như bản thu thật. */
function recording(file: string): Float32Array {
  const bytes = readFileSync(resolve(DIR, file))
  const { samples, rate } = decodeWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  expect(rate).toBe(RATE)
  return concat(silence(0.25, 0.0015, 5), samples, silence(0.3, 0.0015, 6))
}

const voiceOf = (file: string) => (file.includes('-low') ? 'low' : 'high')
const multi = (fixture: Fixture) => fixture.pinyin.trim().split(/\s+/).length > 1

/**
 * Mặt bằng giọng của từng "người học", dành dụm từ các từ nhiều âm tiết họ đã
 * đọc — đúng cách app làm với người thật trước khi chấm từ một âm tiết.
 */
const BASELINES: Record<string, number> = (() => {
  const samples: Record<string, number[]> = { low: [], high: [] }
  for (const fixture of FIXTURES.filter(multi)) {
    const result = scoreAttempt({
      samples: recording(fixture.correct),
      rate: RATE,
      pinyin: fixture.pinyin,
      referenceSeconds: fixture.referenceSeconds,
      baselineHz: null,
    })
    if (result.medianHz) samples[voiceOf(fixture.correct)].push(result.medianHz)
  }
  return { low: median(samples.low), high: median(samples.high) }
})()

function score(file: string, fixture: Fixture) {
  return scoreAttempt({
    samples: recording(file),
    rate: RATE,
    pinyin: fixture.pinyin,
    referenceSeconds: fixture.referenceSeconds,
    baselineHz: multi(fixture) ? null : BASELINES[voiceOf(file)],
  })
}

describe('chấm bản đọc của máy — đọc đúng', () => {
  it('có đủ mười từ, cả giọng trầm lẫn giọng cao', () => {
    expect(FIXTURES).toHaveLength(10)
    expect(new Set(FIXTURES.map((f) => voiceOf(f.correct)))).toEqual(new Set(['low', 'high']))
  })

  for (const fixture of FIXTURES) {
    it(`${fixture.pinyin} đọc đúng thì từ 80 điểm, không âm tiết nào bị đánh dấu oan`, () => {
      const result = score(fixture.correct, fixture)

      expect(result.rejected, fixture.id).toBeNull()
      expect(result.total!, fixture.id).toBeGreaterThanOrEqual(80)
      for (const syllable of result.syllables) {
        if (syllable.score !== null) expect(syllable.score, `${fixture.id} ${syllable.token}`).toBeGreaterThanOrEqual(PASS_SCORE)
      }
    })
  }
})

describe('chấm bản đọc của máy — cố tình đọc sai thanh', () => {
  for (const fixture of FIXTURES) {
    for (const wrong of fixture.wrong) {
      it(`${fixture.pinyin} đọc thành ${wrong.read} thì bị đánh dấu đúng ở âm tiết sai`, () => {
        const result = score(wrong.file, fixture)

        expect(result.rejected, wrong.file).toBeNull()
        expect(result.syllables[wrong.syllable].score!, wrong.file).toBeLessThan(PASS_SCORE)
        expect(result.weakest, wrong.file).toBe(wrong.syllable)
        expect(result.problem, wrong.file).not.toBeNull()
        result.syllables.forEach((syllable, index) => {
          if (index !== wrong.syllable && syllable.score !== null) {
            expect(syllable.score, `${wrong.file} ${syllable.token}`).toBeGreaterThanOrEqual(PASS_SCORE)
          }
        })
      })
    }
  }

  it('bản sai luôn điểm thấp hơn bản đúng của cùng từ', () => {
    for (const fixture of FIXTURES) {
      const correct = score(fixture.correct, fixture).total!
      for (const wrong of fixture.wrong) {
        expect(score(wrong.file, fixture).total!, wrong.file).toBeLessThan(correct)
      }
    }
  })
})
