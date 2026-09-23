import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Luật hiện/ẩn của nền động nằm trong CSS chứ không trong JavaScript, vì cho
 * trình duyệt tự chọn theo `data-*` rẻ hơn hẳn việc React dựng lại cây phần tử
 * mỗi lần tiến độ đổi. Cái giá là những luật đó không test bằng jsdom được —
 * jsdom không tính CSS.
 *
 * Nên bộ test này đọc thẳng file CSS. Nó chỉ chốt đúng một điều, nhưng là điều
 * đã từng hỏng thật: **cảnh không bao giờ được vắng tanh**. Bản đầu tắt sạch
 * ong bướm và sao băng ở mốc `dawn`, nghĩa là người mới mở app — đúng lúc cần
 * gây ấn tượng nhất — không thấy gì chuyển động cả.
 *
 * Cùng lối với `src/test/pwa-assets.test.ts` và `src/lib/audioFiles.test.ts`:
 * kiểm tra thứ nằm ngoài tầm với của test thông thường.
 */

const CSS = readFileSync(join(process.cwd(), 'src/styles/scene.css'), 'utf8')

interface Rule {
  selector: string
  body: string
}

/**
 * Các quy tắc ở mức ngoài cùng, bỏ qua chú thích, `@media` và `@keyframes`.
 * Đủ dùng cho file này; không phải một bộ phân tích CSS đầy đủ.
 */
function topLevelRules(source: string): Rule[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: Rule[] = []

  let index = 0
  while (index < withoutComments.length) {
    const open = withoutComments.indexOf('{', index)
    if (open === -1) break

    const selector = withoutComments.slice(index, open).trim()

    // Tìm dấu đóng khớp với dấu mở này, để `@media` lồng trong không cắt nhầm.
    let depth = 1
    let cursor = open + 1
    while (cursor < withoutComments.length && depth > 0) {
      if (withoutComments[cursor] === '{') depth += 1
      if (withoutComments[cursor] === '}') depth -= 1
      cursor += 1
    }

    const body = withoutComments.slice(open + 1, cursor - 1)
    if (selector.startsWith('@media')) {
      rules.push(...topLevelRules(body))
    } else if (!selector.startsWith('@')) {
      rules.push({ selector: selector.replace(/\s+/g, ' '), body })
    }

    index = cursor
  }

  return rules
}

const RULES = topLevelRules(CSS)

/** Các quy tắc có selector khớp chính xác chuỗi cho trước. */
function rulesFor(selector: string): Rule[] {
  return RULES.filter((rule) => rule.selector === selector)
}

/** Selector có nhắc tới đúng class này không (không tính `.scene-fly--a` khi hỏi `.scene-fly`). */
function mentions(selector: string, className: string): boolean {
  return new RegExp(`\\${className}(?![\\w-])`).test(selector)
}

describe('luật hiện/ẩn của nền động', () => {
  it('đọc được file CSS và phân tích ra quy tắc', () => {
    expect(RULES.length).toBeGreaterThan(50)
    expect(rulesFor('.scene')).toHaveLength(1)
  })

  it('bướm và ong có mặt sẵn, không phải chờ học mới hiện', () => {
    for (const rule of rulesFor('.scene-fly')) {
      expect(rule.body).not.toContain('display: none')
    }
  })

  it('một vệt sao băng luôn có, kể cả khi hôm nay chưa học gì', () => {
    const always = rulesFor('.scene-meteor--1')
    expect(always.some((rule) => rule.body.includes('display: block'))).toBe(true)
  })

  it('mốc sương sớm chỉ làm cảnh nhạt đi, không tắt thứ gì', () => {
    const dawnRules = RULES.filter((rule) => rule.selector.includes("[data-stage='dawn']"))

    expect(dawnRules.length).toBeGreaterThan(0)
    for (const rule of dawnRules) {
      expect(rule.body).not.toContain('display: none')
    }
  })

  it('chỉ màn hình học và chế độ tắt mới được giấu hạt sống', () => {
    const hiding = RULES.filter(
      (rule) =>
        rule.body.includes('display: none') &&
        (mentions(rule.selector, '.scene-fly') ||
          mentions(rule.selector, '.scene-bird') ||
          mentions(rule.selector, '.scene-meteor')),
    )

    for (const rule of hiding) {
      const allowed =
        rule.selector.includes("[data-variant='focus']") ||
        rule.selector.includes("[data-motion='still']") ||
        // Danh sách ẩn mặc định của những con chỉ hiện khi học nhiều hơn.
        rule.selector === '.scene-fly--b, .scene-fly--c, .scene-fly--e' ||
        rule.selector === '.scene-meteor' ||
        rule.selector === '.scene .scene-petal, .scene .scene-meteor'

      expect(allowed, `luật ẩn không mong đợi: ${rule.selector}`).toBe(true)
    }
  })

  it('chế độ tĩnh vẫn giữ lại một vệt sao băng đứng yên', () => {
    const still = rulesFor(".scene[data-motion='still'] .scene-meteor--1")

    expect(still).toHaveLength(1)
    expect(still[0].body).toContain('display: block')
    expect(still[0].body).toContain('opacity: 1')
  })
})
