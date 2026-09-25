import { useId } from 'react'
import { cn } from '../lib/cn'

/**
 * Tâm trạng của Zibi. Mỗi tâm trạng đổi mắt, miệng và tay — thân, mầm và cái mũi
 * thì giữ nguyên, để người học nhận ra vẫn là một nhân vật.
 */
export type MascotMood = 'chao' | 'vui' | 'nghi' | 'mung' | 'tiec'

/*
 * Bảng màu lấy từ bộ sticker mẫu: thân xanh xám tô phẳng, nét mực đen, môi màu
 * kem, trong miệng đen, răng trắng, lợi và lưỡi hồng.
 */
const INK = '#141814'
const SKIN = '#8ca48a'
const SHADE = '#7a917a'
const LIP = '#f2ead6'
const MOUTH = '#1c1212'
const GUM = '#e27d88'
const TONGUE = '#ea7b92'
const TEAR = '#b4ecf8'
const TEAR_EDGE = '#58b9d8'
const BLUSH = '#e8a0a0'
const TOOTH_GAP = '#a3a8a8'

/**
 * Zibi — nhân vật dẫn đường của app.
 *
 * Một mầm cây tròn, vẽ hoàn toàn bằng SVG nên nhẹ như phần nền và không thêm
 * file nào vào bản offline. Cái mầm trên đầu là chủ ý: nó nối nhân vật với khu
 * vườn ở nền động, và với chính việc học — mới nhú, rồi lớn dần.
 *
 * Nét mặt bám theo bộ sticker hài người dùng chọn: mắt chấm bé tí hoặc híp có
 * nếp nhăn, mũi là vệt mực loang, miệng nhe nguyên hàm răng, cười thì ngửa cổ
 * cười, khóc thì gào to tay giơ lên trời. Mỗi tâm trạng lấy từ một sticker:
 *
 * - `vui`  — cười nhe răng, lợi hồng, mắt híp đểu, nếp má hai bên.
 * - `chao` — mắt chấm, má hồng, chu môi "ồ", tay xoè vẫy.
 * - `nghi` — mặt đơ: mí sụp, môi dày mím chặt, bốn chấm "…." lơ lửng.
 * - `mung` — ngửa đầu cười sặc, mắt nhắm tít, hai tay giơ.
 * - `tiec` — gào khóc: miệng há hết cỡ, nước mắt chảy thành dòng.
 *
 * Chữa bài sai mà nhân vật khóc lố thì người học bật cười, không thấy bị chê.
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
        <path d="M60 32c0-9 1-15 3-20" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path
          d="M63 16c7-6 14-6 17-3-1 5-7 10-14 9-2 0-3-3-3-6Z"
          fill="#7fbf85"
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M60 22c-7-4-13-3-15 0 2 4 8 7 13 5 2-1 3-3 2-5Z"
          fill="#9fd4a2"
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>

      {mood === 'nghi' && (
        // Bốn chấm lơ lửng của mặt đơ — sáng lên lần lượt như đang gõ dở.
        <g className="mascot-dots fill-slate-800 dark:fill-slate-200" data-part="dots">
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
      )}

      <Arms mood={mood} />

      {/* Thân, và mảng tối ở đáy cho có khối */}
      <path
        d="M60 30c26 0 44 18 44 43 0 25-19 40-44 40S16 98 16 73c0-25 18-43 44-43Z"
        fill={SKIN}
        stroke={INK}
        strokeWidth="3.2"
      />
      <path d="M22 88c7 14 22 21 38 21s31-7 38-21c-9 10-23 15-38 15s-29-5-38-15Z" fill={SHADE} />

      {mood === 'chao' && (
        <g fill={BLUSH} opacity=".7">
          <ellipse cx="33" cy="65" rx="6" ry="3.8" />
          <ellipse cx="87" cy="65" rx="6" ry="3.8" />
        </g>
      )}

      {mood === 'tiec' && <Tears />}

      {/* Cười sặc thì ngửa cả mặt ra sau. */}
      <g transform={mood === 'mung' ? 'rotate(-9 60 72)' : undefined}>
        <Eyes mood={mood} />
        <Nose y={NOSE_Y[mood]} />
        <g transform={MOUTH_DROP[mood] ? `translate(0 ${MOUTH_DROP[mood]})` : undefined}>
          <Mouth mood={mood} clipId={clipId} />
        </g>
      </g>

      {/* Chân */}
      <path d="M47 112v5M73 112v5" stroke={INK} strokeWidth="5.4" strokeLinecap="round" />
    </svg>
  )
}

/** Gào khóc hay cười sặc thì mặt dúm lại: mũi nhích lên, miệng tụt xuống. */
const NOSE_Y: Record<MascotMood, number> = { vui: 63, chao: 63, nghi: 63, mung: 60.6, tiec: 58.6 }
const MOUTH_DROP: Record<MascotMood, number> = { vui: 0, chao: 0, nghi: 0, mung: 3, tiec: 4 }

/** Một nét mực. */
function Line({ d, width = 2.6, color = INK }: { d: string; width?: number; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

/** Tay kiểu sticker: mảnh như sợi mì, viền mực hai bên. */
function Limb({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="8.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Bốn ngón tay của bàn tay đang xoè, vẽ hướng lên: [x1, y1, x2, y2]. */
const FINGERS: Array<[number, number, number, number]> = [
  [-4.6, -1, -7.4, -6.6],
  [-1.8, -2.2, -2.6, -9.4],
  [1.2, -2.2, 2, -9.6],
  [3.8, -1.2, 6.4, -7.6],
]

/**
 * Bàn tay xoè bốn ngón, vẽ hướng lên rồi xoay theo cánh tay. Lớp ngoài để CSS
 * lắc tay — CSS `transform` đặt thẳng lên lớp trong thì mất luôn phép xoay.
 */
function Hand({ x, y, angle, className }: { x: number; y: number; angle: number; className?: string }) {
  const fingers = (color: string, width: number) =>
    FINGERS.map(([x1, y1, x2, y2]) => (
      <path key={x1} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={color} strokeWidth={width} strokeLinecap="round" />
    ))

  return (
    <g className={className} data-part="hand">
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        {fingers(INK, 4.4)}
        <ellipse cx="0" cy="0.6" rx="5" ry="4.2" fill={SKIN} stroke={INK} strokeWidth="2.2" />
        {fingers(SKIN, 2)}
      </g>
    </g>
  )
}

const ARM_DOWN_LEFT = 'M22 84C15 88 12 94 12 99'
const ARM_DOWN_RIGHT = 'M98 84C105 88 108 94 108 99'

/** Hai tay, vẽ sau lưng thân. */
function Arms({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'chao':
      return (
        <>
          <g className="mascot-wave">
            <Limb d="M22 78C14 72 11 62 12 52" />
            <Hand x={12} y={50} angle={-8} />
          </g>
          <Limb d={ARM_DOWN_RIGHT} />
        </>
      )
    case 'mung':
      return (
        <>
          <Limb d="M22 76C14 68 10 58 12 46" />
          <Hand x={12} y={44} angle={-14} className="mascot-hand" />
          <Limb d="M98 76C106 68 110 58 108 46" />
          <Hand x={108} y={44} angle={14} className="mascot-hand" />
        </>
      )
    case 'tiec':
      // Giơ cả hai tay lên trời mà gào.
      return (
        <>
          <Limb d="M22 74C12 66 8 52 12 40" />
          <Hand x={12} y={38} angle={-4} className="mascot-hand" />
          <Limb d="M98 74C108 66 112 52 108 40" />
          <Hand x={108} y={38} angle={4} className="mascot-hand" />
        </>
      )
    default:
      return (
        <>
          <Limb d={ARM_DOWN_LEFT} />
          <Limb d={ARM_DOWN_RIGHT} />
        </>
      )
  }
}

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'chao':
      // Mắt chấm bé tí, lông mày mảnh.
      return (
        <g>
          {[42, 78].map((x) => (
            <g key={x}>
              <circle data-part="pupil" cx={x} cy="54" r="2.5" fill={INK} />
              <Line d={`M${x - 3.4} 47.6q3.4-1.6 6.8 0`} width={1.6} />
            </g>
          ))}
        </g>
      )
    case 'nghi':
      // Mặt đơ: mí sụp nặng trịch, con ngươi ló nửa, bọng mắt. Đuôi mắt trễ ra ngoài.
      return (
        <g>
          {[
            { x: 42, lid: 'M35 53.8q7-1.6 14-.4', brow: 'M36 47.4q6-1.2 12-.6' },
            { x: 78, lid: 'M71 53.4q7-1.6 14 .4', brow: 'M72 46.8q6-1.2 12 .6' },
          ].map(({ x, lid, brow }) => (
            <g key={x}>
              <path data-part="pupil" d={`M${x - 3} 53.2a3 2.8 0 0 0 6 0Z`} fill={INK} />
              <Line d={lid} />
              <Line d={`M${x - 5} 58.2q5 2 10 0`} width={1.4} />
              <Line d={brow} width={1.6} />
            </g>
          ))}
        </g>
      )
    case 'mung':
      // Cười ngặt nghẽo: mắt nhắm tịt ^ ^, đuôi mắt nhăn tít.
      return (
        <g>
          <Line d="M36 55q6-6 12 0" />
          <Line d="M34.5 52l-3.4-1.8M34.5 56.4l-3.6.6" width={1.5} />
          <Line d="M72 55q6-6 12 0" />
          <Line d="M85.5 52l3.4-1.8M85.5 56.4l3.6.6" width={1.5} />
        </g>
      )
    case 'tiec':
      // Gào khóc: mắt nhắm nghiền > <, trán nhăn.
      return (
        <g>
          <Line d="M34 51l9 4-9 4" />
          <Line d="M86 51l-9 4 9 4" />
          <Line d="M49 44q3-2 6 0M65 44q3-2 6 0" width={1.4} />
        </g>
      )
    default:
      // Mắt híp nhìn đểu: một khe mảnh, nếp mí phía trên, đuôi mắt có nếp.
      return (
        <g className="mascot-hehe">
          {[36, 74].map((x) => (
            <g key={x}>
              <path d={`M${x} 53.4q6-4.2 12 0q-6 2.8-12 0Z`} fill={INK} />
              <Line d={`M${x + 1} 49q5-2.4 10 0`} width={1.6} />
              <Line d={x < 60 ? `M${x - 1.6} 53.4l-2.4 1.2` : `M${x + 13.6} 53.4l2.4 1.2`} width={1.4} />
            </g>
          ))}
        </g>
      )
  }
}

/** Hai dòng nước mắt chảy từ khoé mắt xuống tận chân. */
const TEAR_STREAMS = ['M37 59C33 71 33 88 36 106', 'M83 59C87 71 87 88 84 106']

function Tears() {
  return (
    <g data-part="tears">
      {TEAR_STREAMS.map((d) => (
        <g key={d}>
          <Line d={d} width={5} color={TEAR_EDGE} />
          <Line d={d} width={3} color={TEAR} />
          {/* Vệt sáng trôi xuống cho ra dòng nước đang chảy. */}
          <path
            className="mascot-tears"
            d={d}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="2 9"
            opacity=".8"
          />
        </g>
      ))}
    </g>
  )
}

/** Vị trí các cục của vệt mực làm mũi, quanh tâm mũi: [dx, dy, rx, ry]. */
const NOSE_BLOBS: Array<[number, number, number, number]> = [
  [0, 0.2, 6.4, 5.2],
  [-5, -2.8, 2.7, 2.5],
  [5, -3.2, 2.9, 2.6],
  [6.6, 1.6, 2, 1.9],
  [0.8, 5.2, 2.3, 2.1],
  [-5.8, 2.6, 1.9, 1.8],
]

/** Cái mũi: vệt mực đen loang — nét nhận diện của bộ sticker, tâm trạng nào cũng giữ. */
function Nose({ y }: { y: number }) {
  return (
    <g data-part="nose" fill={INK}>
      {NOSE_BLOBS.map(([dx, dy, rx, ry]) => (
        <ellipse key={`${dx} ${dy}`} cx={60 + dx} cy={y + dy} rx={rx} ry={ry} />
      ))}
    </g>
  )
}

/**
 * Miệng há: môi kem viền mực, lòng miệng đen, rồi răng, lợi, lưỡi cắt gọn theo
 * lòng miệng.
 */
function OpenMouth({
  clipId,
  lips,
  opening,
  children,
}: {
  clipId: string
  lips: string
  opening: string
  children: React.ReactNode
}) {
  return (
    <g>
      <clipPath id={clipId}>
        <path d={opening} />
      </clipPath>
      <path d={lips} fill={LIP} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={opening} fill={MOUTH} />
      <g clipPath={`url(#${clipId})`}>{children}</g>
      <path d={opening} fill="none" stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

/** Mép trên hàm răng của nụ cười nhe răng, theo đường cong của miệng. */
const grinTop = (x: number) => 73.4 + 4.9 * (1 - ((x - 60) / 33) ** 2)
const GRIN_GAPS = [38, 45.4, 52.8, 60, 67.2, 74.6, 82].map((x) => `M${x} ${grinTop(x).toFixed(1)}v9`).join('')

function Mouth({ mood, clipId }: { mood: MascotMood; clipId: string }) {
  switch (mood) {
    case 'chao':
      // Chu môi "ồ".
      return (
        <g>
          <ellipse cx="60" cy="79" rx="7.4" ry="6" fill={LIP} stroke={INK} strokeWidth="2.2" />
          <ellipse cx="60" cy="79.2" rx="3.4" ry="2.2" fill={MOUTH} />
        </g>
      )
    case 'nghi':
      // Môi dày mím chặt, không buồn nói.
      return (
        <g>
          <path
            d="M44 79C48.6 75 55 75.4 60 77.4C65 75.4 71.4 75 76 79C70 81 50 81 44 79Z"
            fill={LIP}
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M44 79C50 87.4 70 87.4 76 79C70 81 50 81 44 79Z"
            fill={LIP}
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <Line d="M52 90.6q8 2 16 0" width={1.4} />
        </g>
      )
    case 'mung':
      // Há miệng cười: răng trên, lưỡi hồng.
      return (
        <OpenMouth
          clipId={clipId}
          lips="M38 70C43 64.6 77 64.6 82 70C84 88 73 100 60 100C47 100 36 88 38 70Z"
          opening="M42.6 72C47 68.4 73 68.4 77.4 72C78.6 86 70 95.6 60 95.6C50 95.6 41.4 86 42.6 72Z"
        >
          <path d="M38 66H82V76.6C72 79.4 48 79.4 38 76.6Z" fill="#ffffff" />
          <ellipse cx="60" cy="94" rx="12.6" ry="8" fill={TONGUE} />
          <Line d="M60 88.6v5" width={1.2} color="#b34d66" />
        </OpenMouth>
      )
    case 'tiec':
      // Gào hết cỡ: lộ cả răng trên lẫn răng dưới.
      return (
        <OpenMouth
          clipId={clipId}
          lips="M40 68C45 61 75 61 80 68C84.6 84 80 105 60 107C40 105 35.4 84 40 68Z"
          opening="M44.4 70C48.6 65.6 71.4 65.6 75.6 70C79 84 75 101.6 60 103C45 101.6 41 84 44.4 70Z"
        >
          <path d="M40 62H80V75C70 77.6 50 77.6 40 75Z" fill="#ffffff" />
          <Line d="M50 70.6v5M56.6 70.6v5M63.4 70.6v5M70 70.6v5" width={1} color={TOOTH_GAP} />
          <path d="M40 108V97.6C50 95 70 95 80 97.6V108Z" fill="#ffffff" />
        </OpenMouth>
      )
    default:
      // Nhe nguyên hàm răng trắng, viền lợi hồng, môi dưới màu kem, nếp má hai bên.
      return (
        <g>
          <OpenMouth
            clipId={clipId}
            lips="M27 68C31 96 89 96 93 68C79 74.5 41 74.5 27 68Z"
            opening="M32 71C37.4 91 82.6 91 88 71C75 76.6 45 76.6 32 71Z"
          >
            <path d="M27 69C42 75.6 78 75.6 93 69V74.8C78 81.4 42 81.4 27 74.8Z" fill={GUM} />
            <path d="M27 73.4C42 80 78 80 93 73.4V84.4C78 91 42 91 27 84.4Z" fill="#ffffff" />
            <Line d={GRIN_GAPS} width={0.9} color={TOOTH_GAP} />
          </OpenMouth>
          <Line d="M24 61c-3.6 5.4-3.8 12-.4 17M96 61c3.6 5.4 3.8 12 .4 17" width={1.8} />
          <Line d="M43 99.6c10 4.6 24 4.6 34 0" width={1.6} />
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
