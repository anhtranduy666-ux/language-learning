/** Ghép class name, bỏ qua giá trị rỗng/false/undefined. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
