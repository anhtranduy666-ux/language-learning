import { cn } from '../../lib/cn'

/**
 * Hình thanh mẫu theo thang năm bậc của Chao Yuanren: thanh 1 là 55, thanh 2
 * là 35, thanh 3 là 214, thanh 4 là 51 — đúng thứ sách giáo khoa vẫn vẽ.
 */
export const TONE_LEVELS: Record<number, number[]> = {
  1: [5, 5],
  2: [3, 5],
  3: [2, 1, 4],
  4: [5, 1],
}

const WIDTH = 64
const HEIGHT = 40
const PAD = 5

/** Bậc 1–5 → toạ độ dọc; bậc 5 ở trên. */
const y = (level: number) => HEIGHT - PAD - ((level - 1) / 4) * (HEIGHT - 2 * PAD)
const x = (index: number, count: number) => PAD + (index / Math.max(1, count - 1)) * (WIDTH - 2 * PAD)

/**
 * Đường cao độ của người học → các điểm để vẽ, cùng thang với hình thanh mẫu.
 *
 * Mỗi bậc cỡ ba nửa cung. Đường của người học được dời lên xuống cho trung bình
 * trùng với trung bình của hình mẫu: hình vẽ để so **dáng** — lên, xuống, trũng
 * — chứ không phải so giọng cao hay trầm.
 */
export function sketchPoints(contourSt: readonly number[], tone: number): Array<[number, number]> {
  if (contourSt.length === 0 || !TONE_LEVELS[tone]) return []
  const step = Math.max(1, Math.ceil(contourSt.length / 24))
  const sampled = contourSt.filter((_, index) => index % step === 0)
  const target = TONE_LEVELS[tone]
  const targetMean = target.reduce((a, b) => a + b, 0) / target.length
  const mean = sampled.reduce((a, b) => a + b, 0) / sampled.length
  return sampled.map((st, index) => {
    const level = Math.max(0.5, Math.min(5.5, targetMean + (st - mean) / 3))
    return [x(index, sampled.length), y(level)]
  })
}

const toPath = (points: Array<[number, number]>) =>
  points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')

interface PitchSketchProps {
  contourSt: readonly number[]
  tone: number
  score: number | null
  className?: string
}

/**
 * Hình nhỏ so đường giọng của người học với hình thanh mẫu.
 *
 * Nét đứt là thanh mẫu, nét liền là giọng của bạn. "Âm này của bạn lên giọng
 * thay vì đổ xuống" nhìn một cái là thấy, không cần đọc chữ. Hình là trang trí
 * cho lời Zibi nói, nên ẩn với trình đọc màn hình.
 */
export function PitchSketch({ contourSt, tone, score, className }: PitchSketchProps) {
  const target = TONE_LEVELS[tone]
  if (!target) return null
  const mine = sketchPoints(contourSt, tone)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
      data-tone={tone}
      className={cn('pitch-sketch overflow-visible', className)}
    >
      <polyline
        points={toPath(target.map((level, index) => [x(index, target.length), y(level)]))}
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-slate-300 dark:stroke-slate-600"
        data-line="target"
      />
      {mine.length > 1 && (
        <polyline
          points={toPath(mine)}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            score === null && 'stroke-slate-400',
            score !== null && score >= 80 && 'stroke-emerald-500',
            score !== null && score >= 60 && score < 80 && 'stroke-amber-500',
            score !== null && score < 60 && 'stroke-rose-500',
          )}
          data-line="mine"
        />
      )}
    </svg>
  )
}
