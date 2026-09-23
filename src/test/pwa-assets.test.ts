import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Icon của PWA — mục 4 của `docs/pwa.md`.
 *
 * Thiếu hoặc sai cỡ thì không có gì báo lỗi: trang vẫn chạy, build vẫn xanh,
 * chỉ tới lúc cầm iPhone cài thử mới thấy màn hình chính hiện một ảnh chụp
 * trang web bị thu nhỏ. Test này là chỗ duy nhất bắt được sớm.
 */

const PUBLIC_DIR = join(process.cwd(), 'public')
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Đọc kích thước từ khối IHDR của file PNG. */
function pngSize(file: string): { width: number; height: number; isPng: boolean } {
  const bytes = readFileSync(join(PUBLIC_DIR, file))
  return {
    isPng: bytes.subarray(0, 8).equals(PNG_SIGNATURE),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

const ICONS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

describe('icon của PWA', () => {
  it.each(ICONS)('$file có đủ và đúng cỡ $size', ({ file, size }) => {
    const png = pngSize(file)
    expect(png.isPng).toBe(true)
    expect(png.width).toBe(size)
    expect(png.height).toBe(size)
  })

  it('có apple-touch-icon, thứ iOS bắt buộc phải có riêng', () => {
    // iOS không đọc icon khai trong manifest — đây là lỗi hay gặp nhất khi
    // làm PWA cho iPhone, nên tách riêng một phép kiểm cho dễ thấy.
    expect(() => pngSize('apple-touch-icon.png')).not.toThrow()
  })
})
