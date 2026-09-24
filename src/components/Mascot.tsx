import { cn } from '../lib/cn'

/**
 * Tâm trạng của Zibi. Mỗi tâm trạng đổi mắt, miệng và tay — thân thì giữ nguyên,
 * để người học nhận ra vẫn là một nhân vật.
 */
export type MascotMood = 'chao' | 'vui' | 'nghi' | 'mung' | 'tiec'

/**
 * Zibi — nhân vật dẫn đường của app.
 *
 * Một mầm cây tròn, vẽ hoàn toàn bằng SVG nên nhẹ như phần nền và không thêm
 * file nào vào bản offline. Cái mầm trên đầu là chủ ý: nó nối nhân vật với khu
 * vườn ở nền động, và với chính việc học — mới nhú, rồi lớn dần.
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
        <path
          d="M60 30c0-9 1-15 3-20"
          fill="none"
          stroke="#3f7a4d"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path d="M63 14c7-6 14-6 17-3-1 5-7 10-14 9-2 0-3-3-3-6Z" fill="#6cc07a" />
        <path d="M60 20c-7-4-13-3-15 0 2 4 8 7 13 5 2-1 3-3 2-5Z" fill="#8bd396" />
      </g>

      {/* Tay. Bên phải giơ lên hay hạ xuống tuỳ tâm trạng. */}
      <path
        d={mood === 'mung' || mood === 'chao' ? 'M26 78C16 72 12 62 13 54' : 'M26 80C17 82 12 88 11 95'}
        fill="none"
        stroke="#5fae6e"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d={
          mood === 'mung'
            ? 'M94 78c10-6 14-16 13-24'
            : mood === 'tiec'
              ? 'M94 74c8-8 9-18 4-24'
              : 'M94 80c9 2 14 8 15 15'
        }
        fill="none"
        stroke="#5fae6e"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Thân */}
      <path
        d="M60 28c26 0 43 19 43 43 0 25-19 41-43 41s-43-16-43-41c0-24 17-43 43-43Z"
        fill="#7ec58a"
        stroke="#3f7a4d"
        strokeWidth="3.2"
      />
      <path
        d="M60 31c-14 2-24 12-27 25"
        fill="none"
        stroke="rgba(255,255,255,.45)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Má */}
      <ellipse cx="33" cy="80" rx="7" ry="4.6" fill="rgba(255,132,158,.42)" />
      <ellipse cx="87" cy="80" rx="7" ry="4.6" fill="rgba(255,132,158,.42)" />

      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {/* Chân */}
      <path d="M45 112v6M75 112v6" stroke="#3f7a4d" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'mung') {
    // Cười tít: hai vòng cung thay cho tròng mắt.
    return (
      <g fill="none" stroke="#24402c" strokeWidth="4" strokeLinecap="round">
        <path d="M38 66c4-6 10-6 14 0" />
        <path d="M68 66c4-6 10-6 14 0" />
      </g>
    )
  }

  // Mắt nhìn lệch khi đang nghĩ, để rõ là đang cân nhắc chứ không phải ngơ ngác.
  const shift = mood === 'nghi' ? -2.4 : 0
  const lift = mood === 'nghi' ? -1.6 : 0

  return (
    <g>
      <circle cx="45" cy="66" r="6.4" fill="#24402c" />
      <circle cx="75" cy="66" r="6.4" fill="#24402c" />
      <circle cx={45 + shift} cy={64 + lift} r="2.2" fill="#ffffff" />
      <circle cx={75 + shift} cy={64 + lift} r="2.2" fill="#ffffff" />
      {mood === 'tiec' && (
        <g fill="none" stroke="#24402c" strokeWidth="2.6" strokeLinecap="round">
          <path d="M36 55c4-3 9-3 13-1" />
          <path d="M84 55c-4-3-9-3-13-1" />
        </g>
      )}
    </g>
  )
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'mung':
      // Miệng cười há to, có lưỡi — dùng cho lúc khen.
      return (
        <g>
          <path d="M46 82c4 12 24 12 28 0Z" fill="#24402c" />
          <path d="M55 92c2-4 8-4 10 0Z" fill="#ff8fa8" />
        </g>
      )
    case 'chao':
      return (
        <path
          d="M50 84c4 5 16 5 20 0"
          fill="none"
          stroke="#24402c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )
    case 'nghi':
      return <ellipse cx="60" cy="86" rx="5" ry="4" fill="#24402c" />
    case 'tiec':
      // Miệng méo: một nét lượn sóng, không phải nét buồn thẳng đuột.
      return (
        <path
          d="M48 88c4-5 8 1 12-2s8 3 12-1"
          fill="none"
          stroke="#24402c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )
    default:
      return (
        <path
          d="M48 83c5 7 19 7 24 0"
          fill="none"
          stroke="#24402c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
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
