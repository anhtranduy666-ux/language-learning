import { describe, expect, it } from 'vitest'
import {
  WORD_MAP_VIEWBOX,
  buildWordMap,
  clusterBounds,
  labelAnchor,
  shortUnitTitle,
  wordMapTotals,
} from './wordMap'
import { HSK1, WORDS } from '../data/hsk1'
import { createProgress } from './progress'
import type { UserProgress, WordProgress } from '../types'

/** Tiến độ với đúng những từ được nêu là "đã nhớ". */
function withLearned(...wordIds: string[]): UserProgress {
  const words: Record<string, WordProgress> = {}
  for (const wordId of wordIds) {
    words[wordId] = { wordId, known: 1, unknown: 0, lastReviewed: '2026-09-23' }
  }
  return { ...createProgress('Duy'), words }
}

describe('shortUnitTitle', () => {
  it('bỏ tiền tố số thứ tự của unit', () => {
    expect(shortUnitTitle('Unit 3 · Gia đình')).toBe('Gia đình')
  })

  it('giữ nguyên tên không có dấu chấm giữa', () => {
    expect(shortUnitTitle('Gia đình')).toBe('Gia đình')
  })
})

describe('buildWordMap', () => {
  it('dựng đúng một cụm cho mỗi unit', () => {
    const clusters = buildWordMap(createProgress('Duy'))

    expect(clusters).toHaveLength(HSK1.units.length)
    expect(clusters.map((cluster) => cluster.unitId)).toEqual(HSK1.units.map((unit) => unit.id))
  })

  it('đặt được chỗ cho toàn bộ từ của khoá — không từ nào bị rơi khỏi bản đồ', () => {
    const clusters = buildWordMap(createProgress('Duy'))
    const placed = clusters.flatMap((cluster) => cluster.marks.map((mark) => mark.wordId))

    expect(placed).toHaveLength(WORDS.length)
    expect(new Set(placed).size).toBe(WORDS.length)
  })

  it('giữ mọi toạ độ nằm trong khung của bản đồ', () => {
    const marks = buildWordMap(createProgress('Duy')).flatMap((cluster) => cluster.marks)

    for (const mark of marks) {
      expect(mark.x).toBeGreaterThanOrEqual(0)
      expect(mark.x).toBeLessThanOrEqual(WORD_MAP_VIEWBOX.width)
      expect(mark.y).toBeGreaterThanOrEqual(0)
      expect(mark.y).toBeLessThanOrEqual(WORD_MAP_VIEWBOX.height)
    }
  })

  it('không xếp hai từ lên cùng một chỗ', () => {
    const marks = buildWordMap(createProgress('Duy')).flatMap((cluster) => cluster.marks)
    const spots = new Set(marks.map((mark) => `${mark.x},${mark.y}`))

    expect(spots.size).toBe(marks.length)
  })

  it('chưa học gì thì cả bản đồ còn tối', () => {
    const clusters = buildWordMap(createProgress('Duy'))

    expect(clusters.every((cluster) => cluster.litCount === 0)).toBe(true)
    expect(clusters.some((cluster) => cluster.complete)).toBe(false)
  })

  it('chỉ thắp đúng những từ đã nhớ', () => {
    const clusters = buildWordMap(withLearned('nihao', 'xiexie'))
    const litIds = clusters.flatMap((cluster) =>
      cluster.marks.filter((mark) => mark.lit).map((mark) => mark.wordId),
    )

    expect(litIds).toEqual(['nihao', 'xiexie'])
  })

  it('từ mới "chưa nhớ" thì không tính là đã sáng', () => {
    const progress = createProgress('Duy')
    progress.words.nihao = { wordId: 'nihao', known: 0, unknown: 3, lastReviewed: '2026-09-23' }

    const clusters = buildWordMap(progress)

    expect(wordMapTotals(clusters).lit).toBe(0)
  })

  it('nhớ hết một unit thì cả chòm đó xong, các chòm khác không ăn theo', () => {
    const unit = HSK1.units[0]
    const wordIds = unit.lessons.flatMap((lesson) => lesson.wordIds)

    const clusters = buildWordMap(withLearned(...wordIds))
    const first = clusters.find((cluster) => cluster.unitId === unit.id)!

    expect(first.complete).toBe(true)
    expect(first.litCount).toBe(first.marks.length)
    expect(clusters.filter((cluster) => cluster.complete)).toHaveLength(1)
  })

  it('nối đường theo đúng thứ tự các sao trong chòm', () => {
    const cluster = buildWordMap(createProgress('Duy'))[0]

    expect(cluster.path).toBe(cluster.marks.map((mark) => `${mark.x},${mark.y}`).join(' '))
    expect(cluster.path.split(' ')).toHaveLength(cluster.marks.length)
  })

  it('mang theo Hanzi và nghĩa để dán nhãn lên bản đồ', () => {
    const clusters = buildWordMap(createProgress('Duy'))
    const mark = clusters[0].marks.find((item) => item.wordId === 'nihao')!

    expect(mark.hanzi).toBe('你好')
    expect(mark.meaning).toBe('xin chào')
  })
})

describe('wordMapTotals', () => {
  it('cộng dồn cả bản đồ', () => {
    expect(wordMapTotals(buildWordMap(createProgress('Duy')))).toEqual({
      lit: 0,
      total: WORDS.length,
    })
  })

  it('đếm đúng số từ đã nhớ', () => {
    expect(wordMapTotals(buildWordMap(withLearned('nihao', 'wo', 'jia'))).lit).toBe(3)
  })

  it('bản đồ rỗng thì không vỡ', () => {
    expect(wordMapTotals([])).toEqual({ lit: 0, total: 0 })
  })
})

describe('clusterBounds', () => {
  it('ôm trọn cụm, có nới thêm để không cắt ngang bông ngoài cùng', () => {
    const bounds = clusterBounds([
      { wordId: 'a', hanzi: '一', meaning: 'một', x: 100, y: 200, lit: false },
      { wordId: 'b', hanzi: '二', meaning: 'hai', x: 140, y: 260, lit: false },
    ])!

    expect(bounds.cx).toBe(120)
    expect(bounds.cy).toBe(230)
    expect(bounds.rx).toBeGreaterThan(20)
    expect(bounds.ry).toBeGreaterThan(30)
  })

  it('một điểm vẫn ra một luống tròn quanh nó', () => {
    const bounds = clusterBounds([
      { wordId: 'a', hanzi: '一', meaning: 'một', x: 50, y: 50, lit: true },
    ])!

    expect(bounds.cx).toBe(50)
    expect(bounds.cy).toBe(50)
    expect(bounds.rx).toBeGreaterThan(0)
    expect(bounds.ry).toBeGreaterThan(0)
  })

  it('cụm rỗng thì không có luống nào để vẽ', () => {
    expect(clusterBounds([])).toBeNull()
  })
})

describe('labelAnchor', () => {
  it('nhãn giữa khung thì căn giữa', () => {
    expect(labelAnchor(WORD_MAP_VIEWBOX.width / 2)).toBe('middle')
  })

  it('nhãn sát mép trái thì neo sang phải để khỏi bị cắt', () => {
    expect(labelAnchor(20)).toBe('start')
  })

  it('nhãn sát mép phải thì neo sang trái', () => {
    expect(labelAnchor(WORD_MAP_VIEWBOX.width - 18)).toBe('end')
  })

  it('mọi nhãn thật trên bản đồ đều nằm trọn trong khung', () => {
    // Nửa bề rộng của một nhãn hai chữ Hán cỡ 12px, làm tròn lên cho chắc.
    const half = 14
    const labels = buildWordMap(createProgress('Duy')).map((cluster) => cluster.marks[0])

    for (const label of labels) {
      const anchor = labelAnchor(label.x)
      const left = anchor === 'start' ? label.x : anchor === 'end' ? label.x - half * 2 : label.x - half
      const right = left + half * 2

      expect(left).toBeGreaterThanOrEqual(0)
      expect(right).toBeLessThanOrEqual(WORD_MAP_VIEWBOX.width)
    }
  })
})
