import { useId } from 'react'
import { cn } from '../lib/cn'

/**
 * Tâm trạng của Zibi. Mỗi tâm trạng đổi mắt, miệng và tay — thân, mầm và cái mũi
 * thì giữ nguyên, để người học nhận ra vẫn là một nhân vật.
 */
export type MascotMood = 'chao' | 'vui' | 'nghi' | 'mung' | 'tiec'

/*
 * Bảng màu kiểu sticker: nét mực gần đen, dày; thân xanh xám tô phẳng.
 */
const INK = '#1f2a21'
const SKIN = '#8cb483'
const SHADE = '#78a270'
const MOUTH = '#5a1f25'
const TONGUE = '#ef7086'
const WATER = '#8fd3ff'
const BLUSH = '#f38ba0'

/**
 * Zibi — nhân vật dẫn đường của app.
 *
 * Một mầm cây tròn, vẽ hoàn toàn bằng SVG nên nhẹ như phần nền và không thêm
 * file nào vào bản offline. Cái mầm trên đầu là chủ ý: nó nối nhân vật với khu
 * vườn ở nền động, và với chính việc học — mới nhú, rồi lớn dần.
 *
 * Khuôn mặt vẽ theo kiểu sticker hài: mũi đen to, mắt lờ đờ, miệng há nhe
 * răng, và cảm xúc nào cũng làm quá lên — cười thì cười sặc, buồn thì khóc bù
 * lu kèm bong bóng mũi. Chữa bài sai mà nhân vật khóc lố thì người học bật cười,
 * không thấy bị chê.
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
  // Mỗi hình một id riêng cho vùng cắt miệng: hai Zibi cùng trang không được giẫm id của nhau.
  const clipId = `zibi-mouth-${useId().replace(/[^\w-]/g, '')}`

  return (
    <svg
      viewBox="0 0 120 124"
      width={size}
      height={(size * 124) / 120}
      aria-hidden="true"
      className={cn('mascot', className)}
      data-mood={mood}
    >
      {/* Cái mầm trên đầu */}
      <g className="mascot-sprout">
        <path d="M60 32c0-9 1-15 3-20" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        <path
          d="M63 16c7-6 14-6 17-3-1 5-7 10-14 9-2 0-3-3-3-6Z"
          fill="#6cc07a"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M60 22c-7-4-13-3-15 0 2 4 8 7 13 5 2-1 3-3 2-5Z"
          fill="#8bd396"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>

      <Arms mood={mood} />

      {/* Thân, và mảng tối ở đáy cho có khối */}
      <path
        d="M60 30c26 0 44 18 44 43 0 25-19 40-44 40S16 98 16 73c0-25 18-43 44-43Z"
        fill={SKIN}
        stroke={INK}
        strokeWidth="3.6"
      />
      <path d="M23 90c7 13 21 20 37 20s30-7 37-20c-9 9-22 13-37 13s-28-4-37-13Z" fill={SHADE} />

      {(mood === 'vui' || mood === 'mung') && (
        <g fill={BLUSH} opacity=".55">
          <ellipse cx="29" cy="72" rx="6" ry="3.6" />
          <ellipse cx="91" cy="72" rx="6" ry="3.6" />
        </g>
      )}

      <Eyes mood={mood} />
      <Nose />
      <Mouth mood={mood} clipId={clipId} />

      {mood === 'nghi' && (
        // Bàn tay gãi đầu vẽ đè lên mép đầu, kèm hai nét gãi.
        <g className="mascot-scratch">
          <ellipse cx="99" cy="45" rx="6.4" ry="5.6" fill={SKIN} stroke={INK} strokeWidth="2.8" />
          <Line d="M104 33l3-4M109 38l4-2" width={2.4} />
        </g>
      )}

      {/* Chân */}
      <path d="M46 112v5M74 112v5" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

/** Một nét mực. */
function Line({ d, width = 3.2 }: { d: string; width?: number }) {
  return <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

/** Tay chân kiểu sticker: nét màu thân, viền mực hai bên. */
function Limb({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="12.4" strokeLinecap="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />
    </>
  )
}

/** Hai tay, vẽ sau lưng thân. */
function Arms({ mood }: { mood: MascotMood }) {
  const left =
    mood === 'mung' || mood === 'chao' ? 'M24 76C14 70 10 60 11 52' : 'M24 82C15 84 11 90 10 97'
  const right =
    mood === 'mung'
      ? 'M96 76c10-6 14-16 13-24'
      : mood === 'nghi'
        ? 'M97 82c10-5 13-20 3-36' // với lên gãi đầu
        : 'M96 82c9 2 13 8 14 15'

  return (
    <>
      {mood === 'chao' ? (
        <g className="mascot-wave">
          <Line d="M4 50c1-4 3-7 6-9M2 60c1-2 2-4 4-5" width={2.4} />
          <Limb d={left} />
        </g>
      ) : (
        <Limb d={left} />
      )}
      <Limb d={right} />
    </>
  )
}

/** Mắt lờ đờ: tròng trắng, con ngươi nhỏ liếc sang, mí trên sụp nửa chừng. */
function SleepyEye({ cx, cy, look }: { cx: number; cy: number; look: number }) {
  const rx = 7.6
  const ry = 6.6
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" />
      <circle data-part="pupil" cx={cx + look} cy={cy + 2.4} r="2.7" fill={INK} />
      <path d={`M${cx - rx} ${cy + 0.6}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy + 0.6}Z`} fill={SKIN} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth="2.6" />
      <Line d={`M${cx - rx - 1} ${cy + 1}C${cx - 4} ${cy - 1.4} ${cx + 4} ${cy - 1.4} ${cx + rx + 1} ${cy + 1}`} width={3.4} />
    </g>
  )
}

/** Mắt trố, con ngươi nhỏ xíu. */
function WideEye({ cx, cy, look = 0, lift = 0, pupil = 2.3 }: { cx: number; cy: number; look?: number; lift?: number; pupil?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="7.4" ry="8.2" fill="#ffffff" stroke={INK} strokeWidth="2.6" />
      <circle data-part="pupil" cx={cx + look} cy={cy + lift} r={pupil} fill={INK} />
    </g>
  )
}

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'mung':
      // Cười sặc: nhắm tịt thành hai dấu > <, nước mắt vui bắn ra hai bên.
      return (
        <g>
          <Line d="M33 52l11 6-11 6" width={3.8} />
          <Line d="M87 52l-11 6 11 6" width={3.8} />
          <g className="mascot-joy" fill={WATER} stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
            <path d="M28 54c-5-2-9 0-10 4 4 2 8 0 10-4Z" />
            <path d="M92 54c5-2 9 0 10 4-4 2-8 0-10-4Z" />
          </g>
        </g>
      )
    case 'tiec':
      // Khóc bù lu bù loa: mắt nhắm nghiền, nước mắt chảy thành hai dòng suối.
      return (
        <g>
          <path
            className="mascot-tears"
            data-part="tears"
            d="M38 63c-3 11 1 24-3 36M82 63c3 11-1 24 3 36"
            fill="none"
            stroke={WATER}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <Line d="M32 63c4-4 11-4 14 0" width={3.6} />
          <Line d="M74 63c3-4 10-4 14 0" width={3.6} />
          <Line d="M31 52c5-2 10-5 13-10" width={3.4} />
          <Line d="M89 52c-5-2-10-5-13-10" width={3.4} />
        </g>
      )
    case 'nghi':
      // Nghi ngờ: một mắt híp, một mắt trố, lông mày nhướn lệch, rịn mồ hôi.
      return (
        <g>
          <Line d="M34 60c4-1.4 10-1.4 14 0" width={3.6} />
          <Line d="M33 51c5 .6 10 1.6 15 4.4" width={3.4} />
          <Line d="M70 45c5-6 13-6 18-1" width={3.4} />
          <WideEye cx={78} cy={59} look={2.8} lift={-0.5} pupil={2.1} />
          <path
            className="mascot-sweat"
            d="M27 44c-2.6 3.6-2.6 7 0 8.4 2.6-1.4 2.6-4.8 0-8.4Z"
            fill={WATER}
            stroke={INK}
            strokeWidth="1.4"
          />
        </g>
      )
    case 'chao':
      // Hớn hở: mắt mở to, lông mày nhướn tận trán.
      return (
        <g>
          <Line d="M33 46c3-5 10-6 14-3" width={3.4} />
          <Line d="M87 46c-3-5-10-6-14-3" width={3.4} />
          <WideEye cx={42} cy={58} lift={1} />
          <WideEye cx={78} cy={58} lift={1} />
        </g>
      )
    default:
      // Cười đểu: mí sụp, liếc ngang, lông mày thỉnh thoảng nhướn "hehe".
      return (
        <g>
          <g className="mascot-brows">
            <Line d="M33 48c4-3 10-3.4 14-.6" />
            <Line d="M73 49c4-1.4 10-1 14 1.4" />
          </g>
          <SleepyEye cx={42} cy={58} look={2.2} />
          <SleepyEye cx={78} cy={58} look={2.2} />
        </g>
      )
  }
}

/** Cái mũi đen to — nét nhận diện của kiểu sticker này, tâm trạng nào cũng giữ. */
function Nose() {
  return (
    <g data-part="nose">
      <path
        d="M52 66.4c1.8-3.4 5.2-3.8 8-2.9 2.9-1 6.3-.4 8 2.9 1.7 2.1.8 5.1-.9 6.5-1.4 2.6-4.6 3.4-7.1 2.5-2.7 1-5.9.1-7.3-2.6-1.8-1.7-2.2-4.5-.7-6.4Z"
        fill={INK}
      />
      <ellipse cx="57" cy="66.6" rx="2.2" ry="1.2" fill="#ffffff" opacity=".5" />
    </g>
  )
}

/**
 * Miệng há: tô màu trong, hàm răng trên, cái lưỡi dưới — cắt gọn theo viền
 * miệng rồi mới kẻ viền đè lên.
 */
function OpenMouth({
  clipId,
  outline,
  teeth,
  gaps,
  tongue,
}: {
  clipId: string
  outline: string
  teeth: string
  gaps: string
  tongue: { cx: number; cy: number; rx: number; ry: number }
}) {
  return (
    <g>
      <clipPath id={clipId}>
        <path d={outline} />
      </clipPath>
      <path d={outline} fill={MOUTH} />
      <g clipPath={`url(#${clipId})`}>
        <path d={teeth} fill="#ffffff" />
        <Line d={gaps} width={1.5} />
        <ellipse {...tongue} fill={TONGUE} />
      </g>
      <path d={outline} fill="none" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
    </g>
  )
}

function Mouth({ mood, clipId }: { mood: MascotMood; clipId: string }) {
  switch (mood) {
    case 'mung':
      // Há hết cỡ mà cười.
      return (
        <OpenMouth
          clipId={clipId}
          outline="M35 77c0 30 50 30 50 0-15 4-35 4-50 0Z"
          teeth="M33 75h54v8c-17 3.4-37 3.4-54 0Z"
          gaps="M47 79.6v4.6M60 80.4v4.8M73 79.6v4.6"
          tongue={{ cx: 60, cy: 101, rx: 14, ry: 9 }}
        />
      )
    case 'tiec':
      // Mếu máo gào khóc, thêm cái bong bóng mũi phập phồng.
      return (
        <g>
          <OpenMouth
            clipId={clipId}
            outline="M42 99c0-18 36-18 36 0-9 3.4-27 3.4-36 0Z"
            teeth="M40 80h40v10c-12-5-28-5-40 0Z"
            gaps="M53 84.6v3.4M60 84v3.6M67 84.6v3.4"
            tongue={{ cx: 60, cy: 101, rx: 10, ry: 5.6 }}
          />
          <g className="mascot-snot" data-part="snot">
            <circle cx="68" cy="77" r="4.6" fill={WATER} opacity=".85" stroke={INK} strokeWidth="1.3" />
            <circle cx="66.5" cy="75.5" r="1.3" fill="#ffffff" />
          </g>
        </g>
      )
    case 'nghi':
      // Mím môi méo xệch sang một bên: "hừmmm".
      return <Line d="M50 89c3-2 6 1 9-1s6-2 9 0 4 1 6-1" />
    case 'chao':
      // Há miệng "Ê!" thật to.
      return (
        <OpenMouth
          clipId={clipId}
          outline="M48 79c0-3 24-3 24 0 1 14-4 21-12 21s-13-7-12-21Z"
          teeth="M46 77h28v6c-9 1.8-19 1.8-28 0Z"
          gaps="M55 79.5v3.4M65 79.5v3.4"
          tongue={{ cx: 60, cy: 98, rx: 9, ry: 5.6 }}
        />
      )
    default:
      // Cười nhe răng lệch một bên, khoé miệng hếch, môi dưới dày.
      return (
        <g>
          <OpenMouth
            clipId={clipId}
            outline="M35 79c7 17 42 16 50-4-15 6-35 7-50 4Z"
            teeth="M33 74h54v10c-17 3-37 3-54 0Z"
            gaps="M47 81.5v4M59 81.8v4.4M71 80.4v4.2"
            tongue={{ cx: 60, cy: 93, rx: 10, ry: 4 }}
          />
          <Line d="M33 77.5c1.2 2 2.8 3 4.6 3.2M87 72.6c-.6 2.2-2 3.6-3.8 4.2" width={2.6} />
          <Line d="M45 96c8 4.4 22 4 31-2.6" width={2.8} />
        </g>
      )
  }
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
