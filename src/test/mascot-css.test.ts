import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Zibi nhún nhảy bằng CSS, và luật tắt chuyển động cũng nằm trong CSS — jsdom
 * không tính CSS, nên bộ test này đọc thẳng file, cùng lối với
 * `scene-css.test.ts`.
 *
 * Nó chốt đúng một điều, là điều đã từng hỏng thật: **xin giảm chuyển động thì
 * Zibi phải đứng yên hẳn.** Luật nhún theo tâm trạng `.mascot[data-mood='mung']`
 * nặng ký hơn luật tắt `.mascot`, nên lúc reo mừng Zibi vẫn nhún dù người dùng
 * đã bật giảm chuyển động trong máy.
 */

const CSS = readFileSync(join(process.cwd(), 'src/styles/mascot.css'), 'utf8')

interface Rule {
  selectors: string[]
  body: string
  /** Điều kiện `@media` bọc ngoài, chuỗi rỗng nếu nằm ở mức ngoài cùng. */
  media: string
  /** Thứ tự trong file: cùng độ nặng thì luật đứng sau thắng. */
  order: number
}

interface Selector {
  text: string
  order: number
}

/** Các quy tắc, kèm `@media` bọc ngoài; bỏ `@keyframes`. Đủ cho file này. */
function rules(source: string, media = '', counter = { next: 0 }): Rule[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const found: Rule[] = []

  let index = 0
  while (index < text.length) {
    const open = text.indexOf('{', index)
    if (open === -1) break
    const head = text.slice(index, open).trim()

    let depth = 1
    let cursor = open + 1
    while (cursor < text.length && depth > 0) {
      if (text[cursor] === '{') depth += 1
      if (text[cursor] === '}') depth -= 1
      cursor += 1
    }
    const body = text.slice(open + 1, cursor - 1)

    if (head.startsWith('@media')) found.push(...rules(body, head, counter))
    else if (!head.startsWith('@')) {
      const selectors = head.split(',').map((part) => part.trim().replace(/\s+/g, ' '))
      found.push({ selectors, body, media, order: counter.next++ })
    }
    index = cursor
  }

  return found
}

/**
 * Độ ưu tiên của selector, dạng [class + thuộc tính + pseudo-class, tên thẻ].
 * File này không dùng id. `*` không tính. `.mascot-dots circle` nặng hơn
 * `.mascot *` đúng một bậc tên thẻ — đủ để luật tắt thua.
 */
function specificity(selector: string): [number, number] {
  const classLike = /\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(\([^)]*\))?/g
  const classes = (selector.match(classLike) ?? []).length
  const rest = selector.replace(classLike, ' ').replace(/::[\w-]+/g, ' ')
  const types = (rest.match(/[a-z][\w-]*/gi) ?? []).length
  return [classes, types]
}

/** So độ ưu tiên: dương là `a` nặng hơn. */
function compare(a: string, b: string): number {
  const [ac, at] = specificity(a)
  const [bc, bt] = specificity(b)
  return ac - bc || at - bt
}

/** Selector nhắm chính hình SVG (`.mascot`, `.mascot[...]`) hay một phần bên trong nó. */
const targetsSvg = (selector: string) => /^\.mascot(\[[^\]]+\])*$/.test(selector)

const RULES = rules(CSS)

const selectorsOf = (rule: Rule): Selector[] => rule.selectors.map((text) => ({ text, order: rule.order }))

/** Giá trị `animation` của một quy tắc, null nếu nó không đặt. */
const animationOf = (rule: Rule) => /animation:\s*([^;]+)/.exec(rule.body)?.[1].trim() ?? null

/** Mọi selector đang cho Zibi chuyển động, ở mức ngoài cùng. */
const MOVING = RULES.filter((rule) => {
  const animation = animationOf(rule)
  return rule.media === '' && animation !== null && animation !== 'none'
}).flatMap(selectorsOf)

/**
 * Có luật tắt nào đè được selector này không: nhắm cùng loại mục tiêu, và nặng
 * ký hơn — hoặc nặng ngang mà đứng sau trong file.
 */
function stoppedBy(stoppers: Selector[], moving: Selector): boolean {
  return stoppers.some(
    (stopper) =>
      targetsSvg(stopper.text) === targetsSvg(moving.text) &&
      (compare(stopper.text, moving.text) > 0 ||
        (compare(stopper.text, moving.text) === 0 && stopper.order > moving.order)),
  )
}

describe('chuyển động của Zibi', () => {
  it('so độ ưu tiên selector như trình duyệt, kể cả tên thẻ và pseudo-class', () => {
    expect(compare(".mascot[data-mood='mung']", '.mascot')).toBeGreaterThan(0)
    expect(compare('.mascot[data-mood]', ".mascot[data-mood='mung']")).toBe(0)
    expect(compare('.mascot-dots circle', '.mascot *')).toBeGreaterThan(0)
    expect(compare('.mascot-dot:nth-child(2)', '.mascot *')).toBeGreaterThan(0)
  })

  it('đọc được file CSS và thấy các luật chuyển động', () => {
    const texts = MOVING.map((selector) => selector.text)
    expect(texts).toContain('.mascot')
    expect(texts).toContain(".mascot[data-mood='mung']")
    expect(texts.length).toBeGreaterThan(5)
  })

  it('xin giảm chuyển động thì mọi chuyển động đều dừng, kể cả luật riêng theo tâm trạng', () => {
    const stoppers = RULES.filter(
      (rule) => rule.media.includes('prefers-reduced-motion') && animationOf(rule) === 'none',
    ).flatMap(selectorsOf)

    for (const moving of MOVING) {
      expect(stoppedBy(stoppers, moving), `vẫn chuyển động khi giảm chuyển động: ${moving.text}`).toBe(true)
    }
  })

  it('tắt nền động thì Zibi cũng đứng yên', () => {
    const prefix = "[data-scene='off'] "
    const stoppers = RULES.filter((rule) => rule.media === '' && animationOf(rule) === 'none')
      .flatMap(selectorsOf)
      .filter((selector) => selector.text.startsWith(prefix))
      // Bỏ tiền tố cho dễ so loại mục tiêu; tiền tố chỉ làm luật tắt nặng ký thêm.
      .map((selector) => ({ ...selector, text: selector.text.slice(prefix.length) }))

    for (const moving of MOVING) {
      expect(stoppedBy(stoppers, moving), `vẫn chuyển động khi tắt nền: ${moving.text}`).toBe(true)
    }
  })
})
