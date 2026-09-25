import { useId } from 'react'
import { cn } from '../lib/cn'

/**
 * Tâm trạng của Zibi. Mỗi tâm trạng đổi mắt, miệng và tay — thân, mầm và cái mũi
 * thì giữ nguyên, để người học nhận ra vẫn là một nhân vật.
 */
export type MascotMood = 'chao' | 'vui' | 'nghi' | 'mung' | 'tiec'

const INK = '#2c5e3a'
const EYE = '#1d2b22'
const SKIN = '#86cc93'
const SHADE = '#72b980'
const MOUTH = '#7a2a3a'
const TONGUE = '#ff7f9c'
const TONGUE_LINE = '#d94f73'
const CHEEK = '#ff9fb4'
const WATER = '#8fd3ff'
const SNOT = '#c9eeff'
const SPARKLE = '#ffd166'

/**
 * Zibi — nhân vật dẫn đường của app.
 *
 * Một mầm cây tròn, vẽ hoàn toàn bằng SVG nên nhẹ như phần nền và không thêm
 * file nào vào bản offline. Cái mầm trên đầu là chủ ý: nó nối nhân vật với khu
 * vườn ở nền động, và với chính việc học — mới nhú, rồi lớn dần.
 *
 * Vừa dễ thương vừa buồn cười: phần dễ thương là mắt to long lanh, má hồng,
 * mũi bé xíu, thân xanh tươi; phần buồn cười nằm ở chỗ cảm xúc nào cũng làm
 * quá lên — nháy mắt le lưỡi, cười tít mắt giữa một trời lấp lánh, khóc thì
 * nước mắt thành suối kèm bong bóng mũi. Bản trước chép nét mặt của một bộ
 * sticker (răng người, mắt híp không con ngươi, mũi vệt mực) và trông ghê ghê,
 * nên đừng quay lại kiểu đó.
 *
 * - `vui`  — nháy một mắt, miệng ω le lưỡi.
 * - `chao` — nhướn mày, cười toe, vẫy tay.
 * - `nghi` — mắt ngước lên một góc, chu môi sang bên, bốn chấm "…." lơ lửng.
 * - `mung` — mắt tít > <, cười há miệng, hai tay giơ, lấp lánh quanh đầu.
 * - `tiec` — mắt rơm rớm, nước mắt chảy thành suối, miệng mếu, bong bóng mũi.
 *
 * Nhân vật này là trang trí, nên luôn `aria-hidden`. Lời thoại mới là nội dung
 * thật, và nằm ở `MascotSays`.
 */
export function Mascot({
  mood = 'vui',
  size = 96,
  className,
}: {
  mood?: MascotMood
  size?: number
  className?: string
}) {
  // Id riêng cho các vùng cắt: hai Zibi cùng trang không được giẫm id của nhau.
  const uid = `zibi-${useId().replace(/[^\w-]/g, '')}`

  return (
    <svg
      viewBox="0 0 120 124"
      width={size}
      height={(size * 124) / 120}
      aria-hidden="true"
      className={cn('mascot', className)}
      data-mood={mood}
    >
      {mood === 'nghi' && <ThinkingDots />}
      {mood === 'mung' && <Sparkles />}

      {/* Cái mầm trên đầu */}
      <g className="mascot-sprout" data-part="sprout">
        <path d="M60 32c0-9 1-15 3-20" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M63 16c7-6 14-6 17-3-1 5-7 10-14 9-2 0-3-3-3-6Z"
          fill="#6cc07a"
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M60 22c-7-4-13-3-15 0 2 4 8 7 13 5 2-1 3-3 2-5Z"
          fill="#9ee0a8"
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>

      <Arms mood={mood} />

      {/* Hai bàn chân ló ra dưới thân */}
      <g fill={SHADE} stroke={INK} strokeWidth="2.6">
        <ellipse cx="46" cy="112.4" rx="6.6" ry="4" />
        <ellipse cx="74" cy="112.4" rx="6.6" ry="4" />
      </g>

      {/* Thân, mảng tối ở đáy, và vệt bóng trên đầu cho tròn trịa */}
      <path
        d="M60 30c26 0 44 18 44 43 0 25-19 40-44 40S16 98 16 73c0-25 18-43 44-43Z"
        fill={SKIN}
        stroke={INK}
        strokeWidth="3.2"
      />
      <path d="M22 89c7 13 21 20 38 20s31-7 38-20c-9 9-23 14-38 14s-29-5-38-14Z" fill={SHADE} />
      <path d="M42 38c-9 4-15 11-18 20" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".45" />

      {/* Má hồng */}
      <g fill={CHEEK} opacity=".6">
        <ellipse cx="33.6" cy="74.6" rx="6.4" ry="4" />
        <ellipse cx="86.4" cy="74.6" rx="6.4" ry="4" />
      </g>

      {mood === 'tiec' && <Tears />}
      <Eyes mood={mood} uid={uid} />
      <path data-part="nose" d="M57.4 68.8q2.6-1.8 5.2 0-.5 2.8-2.6 3.2-2.1-.4-2.6-3.2Z" fill={EYE} />
      <Mouth mood={mood} clipId={`${uid}-mouth`} />
    </svg>
  )
}

/** Một nét vẽ. */
function Line({ d, width = 2.8, color = INK }: { d: string; width?: number; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

/** Tay tròn như ngón tay găng: nét màu thân, viền đậm hai bên. */
function Limb({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth="6.4" strokeLinecap="round" />
    </>
  )
}

const ARM_DOWN_LEFT = 'M24 82C16 84 12 90 11 96'
const ARM_DOWN_RIGHT = 'M96 82c8 2 12 8 13 14'
const ARM_UP_LEFT = 'M24 76C15 70 11 60 12 52'
const ARM_UP_RIGHT = 'M96 76c9-6 13-16 12-24'

/** Hai tay, vẽ sau lưng thân. */
function Arms({ mood }: { mood: MascotMood }) {
  if (mood === 'chao') {
    return (
      <>
        <g className="mascot-wave">
          <Limb d={ARM_UP_LEFT} />
        </g>
        <Limb d={ARM_DOWN_RIGHT} />
      </>
    )
  }
  return (
    <>
      <Limb d={mood === 'mung' ? ARM_UP_LEFT : ARM_DOWN_LEFT} />
      <Limb d={mood === 'mung' ? ARM_UP_RIGHT : ARM_DOWN_RIGHT} />
    </>
  )
}

/** Mắt đen láy với hai đốm sáng — chỗ dễ thương nhất của cả khuôn mặt. */
function ShinyEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g data-part="eye">
      <ellipse cx={cx} cy={cy} rx="6.4" ry="7.6" fill={EYE} />
      <circle cx={cx + 2.2} cy={cy - 2.6} r="2.4" fill="#ffffff" />
      <circle cx={cx - 2} cy={cy + 2.7} r="1.1" fill="#ffffff" />
    </g>
  )
}

/** Mắt ngấn nước: nửa dưới long lanh xanh, đốm sáng to hơn. */
function TearyEye({ cx, cy, clipId }: { cx: number; cy: number; clipId: string }) {
  return (
    <g data-part="eye">
      <clipPath id={clipId}>
        <ellipse cx={cx} cy={cy} rx="7.4" ry="8.6" />
      </clipPath>
      <ellipse cx={cx} cy={cy} rx="7.4" ry="8.6" fill={EYE} />
      <path
        clipPath={`url(#${clipId})`}
        d={`M${cx - 7.4} ${cy + 2}q3.7-2 7.4 0t7.4 0V${cy + 8.6}H${cx - 7.4}Z`}
        fill={WATER}
        opacity=".85"
      />
      <circle cx={cx + 2.6} cy={cy - 3.2} r="3" fill="#ffffff" />
      <circle cx={cx - 2.8} cy={cy - 0.6} r="1.3" fill="#ffffff" />
    </g>
  )
}

/** Mắt trắng, con ngươi ngước lên một góc — đang nghĩ. */
function LookUpEye({ cx }: { cx: number }) {
  return (
    <g data-part="eye">
      <ellipse cx={cx} cy="63" rx="6.6" ry="7.6" fill="#ffffff" stroke={EYE} strokeWidth="2.2" />
      <circle cx={cx - 2.2} cy="59.6" r="3" fill={EYE} />
      <circle cx={cx - 1.2} cy="58.6" r="1" fill="#ffffff" />
    </g>
  )
}

function Eyes({ mood, uid }: { mood: MascotMood; uid: string }) {
  switch (mood) {
    case 'chao':
      return (
        <g>
          <Line d="M38.4 52q6-4.4 12-.6" width={2.6} color={EYE} />
          <Line d="M69.6 51.4q6-3.8 12 .6" width={2.6} color={EYE} />
          <g className="mascot-blink">
            <ShinyEye cx={45} cy={63} />
            <ShinyEye cx={75} cy={63} />
          </g>
        </g>
      )
    case 'nghi':
      // Một bên mày nhướn cao, một bên hơi chau.
      return (
        <g>
          <Line d="M36 49.6q6-5 12-1.4" width={2.6} color={EYE} />
          <Line d="M71 54q6-1.6 11 .6" width={2.6} color={EYE} />
          <g className="mascot-blink">
            <LookUpEye cx={45} />
            <LookUpEye cx={75} />
          </g>
        </g>
      )
    case 'mung':
      // Cười tít mắt > <.
      return (
        <g>
          <Line d="M38 58.4l8.4 5-8.4 5" width={3.4} color={EYE} />
          <Line d="M82 58.4l-8.4 5 8.4 5" width={3.4} color={EYE} />
        </g>
      )
    case 'tiec':
      // Mày chau, mắt rơm rớm.
      return (
        <g>
          <Line d="M37 51.6q5-4.6 11-5.4" width={2.6} color={EYE} />
          <Line d="M83 51.6q-5-4.6-11-5.4" width={2.6} color={EYE} />
          <TearyEye cx={45} cy={63} clipId={`${uid}-eye-left`} />
          <TearyEye cx={75} cy={63} clipId={`${uid}-eye-right`} />
        </g>
      )
    default:
      // Nháy một mắt.
      return (
        <g>
          <ShinyEye cx={45} cy={63} />
          <Line d="M69 65q6-6.6 12 0" width={3.2} color={EYE} />
        </g>
      )
  }
}

/** Nước mắt chảy thành suối từ khoé mắt xuống, bắn vài giọt ở cuối. */
const TEAR_STREAMS = ['M41.6 71C39.6 80 40.6 92 38.6 103', 'M78.4 71C80.4 80 79.4 92 81.4 103']

function Tears() {
  return (
    <g data-part="tears">
      {TEAR_STREAMS.map((d) => (
        <g key={d}>
          <Line d={d} width={7.2} />
          <Line d={d} width={5} color={WATER} />
          {/* Vệt sáng trôi xuống cho ra dòng nước đang chảy. */}
          <path
            className="mascot-tears"
            d={d}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="2 9"
            opacity=".85"
          />
        </g>
      ))}
      <g fill={WATER} stroke={INK} strokeWidth="1.2">
        <circle cx="33.6" cy="104" r="2" />
        <circle cx="86.4" cy="104" r="2" />
        <circle cx="30.4" cy="99" r="1.4" />
        <circle cx="89.6" cy="99" r="1.4" />
      </g>
    </g>
  )
}

/** Miệng há: lòng miệng đỏ sẫm, lưỡi hồng cắt gọn theo viền, rồi kẻ viền đè lên. */
function OpenMouth({
  clipId,
  outline,
  tongue,
}: {
  clipId: string
  outline: string
  tongue: { cx: number; cy: number; rx: number; ry: number }
}) {
  return (
    <g>
      <clipPath id={clipId}>
        <path d={outline} />
      </clipPath>
      <path d={outline} fill={MOUTH} />
      <ellipse clipPath={`url(#${clipId})`} {...tongue} fill={TONGUE} />
      <path d={outline} fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
    </g>
  )
}

function Mouth({ mood, clipId }: { mood: MascotMood; clipId: string }) {
  switch (mood) {
    case 'chao':
      return (
        <OpenMouth
          clipId={clipId}
          outline="M50 74C51 87 69 87 70 74C63 76.4 57 76.4 50 74Z"
          tongue={{ cx: 60, cy: 84.6, rx: 6.4, ry: 4.4 }}
        />
      )
    case 'mung':
      return (
        <OpenMouth
          clipId={clipId}
          outline="M45 73C45 94 75 94 75 73C67 76 53 76 45 73Z"
          tongue={{ cx: 60, cy: 88.4, rx: 9, ry: 6 }}
        />
      )
    case 'nghi':
      // Chu môi lệch sang một bên: "hừm?".
      return <ellipse cx="66" cy="79" rx="2.8" ry="2.4" fill={MOUTH} stroke={INK} strokeWidth="2.2" />
    case 'tiec':
      // Miệng mếu run run, và cái bong bóng mũi phập phồng.
      return (
        <g>
          <Line d="M51 83q2.25-2.6 4.5 0t4.5 0 4.5 0 4.5 0" width={2.6} />
          <g className="mascot-snot" data-part="snot">
            <circle cx="65.4" cy="75.6" r="4.2" fill={SNOT} opacity=".9" stroke={INK} strokeWidth="1.2" />
            <circle cx="64.2" cy="74.4" r="1.2" fill="#ffffff" />
          </g>
        </g>
      )
    default:
      // Miệng ω, le cái lưỡi ra một bên.
      return (
        <g>
          <g className="mascot-tongue" data-part="tongue">
            <path d="M60.6 76.2C60.6 85.4 69.4 85.4 69.4 76.8Z" fill={TONGUE} stroke={INK} strokeWidth="2" />
            <Line d="M65 78v3.6" width={1.2} color={TONGUE_LINE} />
          </g>
          <Line d="M52 74.6q4 4.6 8 0q4 4.6 8 0" />
        </g>
      )
  }
}

/** Bốn chấm lơ lửng khi đang nghĩ — sáng lên lần lượt như đang gõ dở. */
function ThinkingDots() {
  return (
    <g className="fill-slate-700 dark:fill-slate-200" data-part="dots">
      {[8, 15, 22, 29].map((x, index) => (
        <circle
          key={x}
          className="mascot-dot"
          cx={x}
          cy="17"
          r="2.4"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </g>
  )
}

/** Ngôi sao bốn cánh. */
function star(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`
}

/** Ba ngôi sao lấp lánh quanh đầu: [cx, cy, bán kính]. */
const SPARKLES: Array<[number, number, number]> = [
  [24, 34, 5.4],
  [99, 30, 4.4],
  [106, 46, 3],
]

/** Lấp lánh quanh đầu lúc reo mừng. */
function Sparkles() {
  return (
    <g data-part="sparkles" fill={SPARKLE} stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
      {SPARKLES.map(([cx, cy, r], index) => (
        <path
          key={index}
          className="mascot-sparkle"
          d={star(cx, cy, r)}
          style={{ animationDelay: `${index * 0.25}s` }}
        />
      ))}
    </g>
  )
}

/**
 * Zibi nói một câu.
 *
 * Nhân vật là hình trang trí, còn lời thoại là chữ thật trong DOM — người dùng
 * trình đọc màn hình nghe được đúng câu đó, không phải nghe mô tả một bức ảnh.
 */
export function MascotSays({
  mood = 'vui',
  size = 76,
  tone = 'neutral',
  children,
  className,
}: {
  mood?: MascotMood
  size?: number
  tone?: 'neutral' | 'right' | 'wrong'
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end gap-2', className)}>
      <Mascot mood={mood} size={size} className="shrink-0" />
      <p
        className={cn(
          'mascot-bubble relative min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm leading-snug font-medium',
          tone === 'right' &&
            'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100',
          tone === 'wrong' && 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100',
          tone === 'neutral' &&
            'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
        )}
        data-tone={tone}
      >
        {children}
      </p>
    </div>
  )
}
