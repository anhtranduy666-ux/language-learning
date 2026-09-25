import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Giao diện không dùng emoji.
 *
 * Emoji mỗi hệ điều hành vẽ một kiểu và trông như đồ dùng chung của mọi app —
 * người dùng đã chê là "máy móc, không thẩm mĩ". Mọi icon trong app vẽ tay ở
 * `src/components/icons/`: `GameIcons.tsx` cho chỉ số và thành tích,
 * `UiIcons.tsx` cho nút bấm.
 *
 * Bộ test này quét toàn bộ mã nguồn (trừ file test) để emoji không lẻn vào lại.
 */

const ROOT = join(process.cwd(), 'src')

/** Mọi file mã nguồn, trừ file test. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('không emoji trong giao diện', () => {
  it('quét được mã nguồn', () => {
    expect(sourceFiles(ROOT).length).toBeGreaterThan(50)
  })

  it('không file nào còn emoji — icon thì vẽ tay trong src/components/icons', () => {
    const offenders: string[] = []
    for (const path of sourceFiles(ROOT)) {
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          const match = line.match(/\p{Extended_Pictographic}/u)
          if (match) offenders.push(`${relative(ROOT, path)}:${index + 1} ${match[0]}`)
        })
    }
    expect(offenders).toEqual([])
  })
})
