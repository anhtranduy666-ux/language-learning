/**
 * Cắt bản thu của một từ thành đúng số âm tiết đã biết trước.
 *
 * Số âm tiết lấy từ pinyin, nên bài toán không phải "có mấy âm tiết" mà là
 * "ranh giới nằm ở đâu" — dễ hơn nhiều. Hai loại dấu hiệu, theo thứ tự tin cậy:
 *
 * 1. **Khoảng vô thanh.** Phần lớn phụ âm đầu tiếng Phổ thông là vô thanh
 *    (b d g z zh j p t k c ch q f s sh x h), nên giữa hai âm tiết thường có một
 *    quãng không có cao độ: 谢|谢, 你|好, 老|师.
 * 2. **Chỗ trũng năng lượng.** Âm đầu hữu thanh (m n l r) hoặc bán nguyên âm
 *    (y w) không tạo khoảng vô thanh, nhưng vẫn làm năng lượng hụt xuống: 妈|妈,
 *    我|们, 上|午.
 *
 * Mọi thứ tính theo khung 10 ms, cùng nhịp với `f0Track`.
 */

/** Một đoạn khung [start, end). */
export interface FrameSpan {
  start: number
  end: number
}

/** Khoảng vô thanh ngắn hơn chừng này là bộ bám cao độ lỡ nhịp, không phải ranh giới âm tiết. */
const BRIDGE_FRAMES = 2

/** Đoạn hữu thanh ngắn hơn chừng này là tiếng động lẻ, không phải âm tiết. */
const MIN_RUN_FRAMES = 3

/** Âm tiết ngắn nhất cắt ra được bằng chỗ trũng năng lượng — kể cả thanh nhẹ cũng dài hơn. */
const MIN_SYLLABLE_FRAMES = 6

/**
 * Mẩu hữu thanh ở mép ngắn hơn chừng này (80 ms) thì không phải âm tiết mà là
 * tiếng chen vào — chỉ bỏ khi đang thừa đoạn so với số âm tiết cần có.
 */
const BLIP_FRAMES = 8

/** Các đoạn khung liên tục có cao độ. */
export function voicedRuns(f0: Float32Array, region?: FrameSpan): FrameSpan[] {
  const from = region?.start ?? 0
  const to = Math.min(region?.end ?? f0.length, f0.length)

  const runs: FrameSpan[] = []
  let start = -1
  for (let i = from; i < to; i += 1) {
    if (f0[i] > 0) {
      if (start === -1) start = i
    } else if (start !== -1) {
      runs.push({ start, end: i })
      start = -1
    }
  }
  if (start !== -1) runs.push({ start, end: to })

  // Nối lại những chỗ đứt do bộ bám cao độ lỡ một hai khung.
  const bridged: FrameSpan[] = []
  for (const run of runs) {
    const last = bridged[bridged.length - 1]
    if (last && run.start - last.end <= BRIDGE_FRAMES) last.end = run.end
    else bridged.push({ ...run })
  }
  return bridged.filter((run) => run.end - run.start >= MIN_RUN_FRAMES)
}

/** Làm mượt đường năng lượng bằng trung bình trượt 3 khung. */
function smooth(values: Float32Array): Float32Array {
  const out = new Float32Array(values.length)
  for (let i = 0; i < values.length; i += 1) {
    const a = values[Math.max(0, i - 1)]
    const b = values[i]
    const c = values[Math.min(values.length - 1, i + 1)]
    out[i] = (a + b + c) / 3
  }
  return out
}

interface Valley {
  frame: number
  depth: number
}

/** Những chỗ trũng năng lượng bên trong một đoạn hữu thanh, sâu nhất trước. */
function valleysIn(energy: Float32Array, run: FrameSpan): Valley[] {
  const out: Valley[] = []
  for (let i = run.start + MIN_SYLLABLE_FRAMES; i <= run.end - MIN_SYLLABLE_FRAMES; i += 1) {
    if (energy[i] > energy[i - 1] || energy[i] > energy[i + 1]) continue
    let left = -Infinity
    let right = -Infinity
    for (let j = run.start; j < i; j += 1) left = Math.max(left, energy[j])
    for (let j = i + 1; j < run.end; j += 1) right = Math.max(right, energy[j])
    out.push({ frame: i, depth: Math.min(left, right) - energy[i] })
  }
  return out.sort((a, b) => b.depth - a.depth)
}

/**
 * Chia vùng hữu thanh thành đúng `count` âm tiết.
 *
 * @param region vùng có tiếng nói (xem `speechRegion`), để tiếng động ở hai đầu
 * bản thu không bị tính thành âm tiết.
 * @returns null khi không cắt nổi — không có tiếng, hoặc quá ngắn so với số âm
 * tiết cần có. Nơi gọi coi đó là bản thu chưa dùng được và mời đọc lại.
 */
export function splitSyllables(
  f0: Float32Array,
  energyDb: Float32Array,
  count: number,
  region?: FrameSpan,
): FrameSpan[] | null {
  if (count < 1) return null
  let runs = voicedRuns(f0, region)
  if (runs.length === 0) return null

  // Thừa đoạn: bỏ những mẩu quá ngắn ở hai đầu trước — tiếng hắng giọng, tiếng
  // người bên cạnh, tiếng chạm micro; một âm tiết thật, kể cả thanh nhẹ, không
  // ngắn tới vậy. Rồi mới gộp những đoạn cách nhau gần nhất — thường là một âm
  // tiết bị đứt ở chỗ thanh 3 xuống thấp tới mức giọng rè đi.
  while (runs.length > count) {
    // Trong các mẩu ngắn ở mép, bỏ mẩu nằm tách xa phần còn lại nhất.
    const gapOf = (index: number) =>
      index === 0 ? runs[1].start - runs[0].end : runs[index].start - runs[index - 1].end
    const edges = [0, runs.length - 1]
      .filter((index) => runs[index].end - runs[index].start < BLIP_FRAMES)
      .sort((a, b) => gapOf(b) - gapOf(a))
    if (edges.length > 0) {
      runs = runs.filter((_, index) => index !== edges[0])
      continue
    }

    let closest = 0
    for (let i = 1; i < runs.length - 1; i += 1) {
      if (runs[i + 1].start - runs[i].end < runs[closest + 1].start - runs[closest].end) closest = i
    }
    runs = [
      ...runs.slice(0, closest),
      { start: runs[closest].start, end: runs[closest + 1].end },
      ...runs.slice(closest + 2),
    ]
  }

  // Thiếu đoạn: cắt thêm ở chỗ trũng năng lượng sâu nhất, các nhát cắt không
  // được sát nhau hay sát mép đoạn.
  const missing = count - runs.length
  if (missing > 0) {
    const energy = smooth(energyDb)
    const candidates = runs
      .flatMap((run) => valleysIn(energy, run).map((valley) => ({ ...valley, run })))
      .filter((valley) => valley.depth >= 1)
      .sort((a, b) => b.depth - a.depth)

    const cuts: number[] = []
    for (const candidate of candidates) {
      if (cuts.length === missing) break
      if (cuts.every((cut) => Math.abs(cut - candidate.frame) >= MIN_SYLLABLE_FRAMES)) {
        cuts.push(candidate.frame)
      }
    }

    // Không đủ chỗ trũng — âm tiết nối liền hơi, như 女儿. Chia đều đoạn dài
    // nhất, miễn là mỗi phần vẫn đủ dài để có một đường cao độ.
    while (cuts.length < missing) {
      const pieces = splitAt(runs, cuts)
      const longest = pieces.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a))
      if (longest.end - longest.start < 2 * MIN_SYLLABLE_FRAMES) return null
      cuts.push(Math.round((longest.start + longest.end) / 2))
    }

    runs = splitAt(runs, cuts)
  }

  return runs.length === count ? runs : null
}

/** Cắt các đoạn ở những khung cho trước. Khung cắt thuộc về đoạn sau. */
function splitAt(runs: FrameSpan[], cuts: number[]): FrameSpan[] {
  const out: FrameSpan[] = []
  for (const run of runs) {
    let start = run.start
    for (const cut of [...cuts].sort((a, b) => a - b)) {
      if (cut > run.start && cut < run.end) {
        out.push({ start, end: cut })
        start = cut
      }
    }
    out.push({ start, end: run.end })
  }
  return out
}
