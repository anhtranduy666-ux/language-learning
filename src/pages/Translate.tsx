import { useEffect, useRef, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { BookIcon, MicIcon, SpeakerIcon, SwapIcon } from '../components/icons/UiIcons'
import { MascotSays } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'
import { startDictation, type Dictation, type DictationFailure, type DictationLang } from '../lib/dictation'
import { playWord, speakVietnamese, stopPlayback } from '../lib/speech'
import {
  MAX_INPUT_LENGTH,
  TranslateError,
  flip,
  translate,
  type Direction,
  type TranslateFailure,
  type Translation,
} from '../lib/translate'

/** Những gì đổi theo chiều dịch. */
const SIDES: Record<
  Direction,
  { from: string; to: string; placeholder: string; submit: string; listen: DictationLang; mic: string; suggestions: string[] }
> = {
  'vi-zh': {
    from: 'Tiếng Việt',
    to: 'Tiếng Trung',
    placeholder: 'Gõ, hoặc bấm micro để nói. Ví dụ: con mèo',
    submit: 'Dịch sang tiếng Trung',
    listen: 'vi-VN',
    mic: 'Nói tiếng Việt',
    suggestions: ['xin chào', 'cảm ơn', 'bạn tên là gì?', 'tôi muốn uống trà'],
  },
  'zh-vi': {
    from: 'Tiếng Trung',
    to: 'Tiếng Việt',
    placeholder: 'Gõ chữ Hán, hoặc bấm micro để nói. Ví dụ: 你好',
    submit: 'Dịch sang tiếng Việt',
    listen: 'zh-CN',
    mic: 'Nói tiếng Trung',
    suggestions: ['你好', '谢谢', '你叫什么名字？', '我想喝茶'],
  },
}

/** Zibi nói gì khi không dịch được. Ô trống thì nút đã tắt, không cần lời. */
const FAILURES: Record<Exclude<TranslateFailure, 'empty'>, string> = {
  'too-long': `Dài quá — mỗi lần mình dịch tối đa ${MAX_INPUT_LENGTH} chữ thôi nhé.`,
  'not-chinese': 'Chiều này cần chữ Hán. Gõ chữ Hán, hoặc bấm micro rồi nói tiếng Trung nhé.',
  'looks-chinese': 'Đây là chữ Hán — đổi sang chiều Trung → Việt để dịch nhé.',
  offline: 'Đang mất mạng nên mình chỉ tra được từ và câu có trong bài học. Có mạng lại thì thử lần nữa nhé.',
  blocked: 'Google Dịch đang tạm từ chối vì bị hỏi dồn dập. Đợi vài phút rồi thử lại nhé.',
  failed: 'Chưa dịch được lần này. Bạn thử lại nhé.',
}

/** Zibi nói gì khi không nghe được. */
const HEARING: Record<DictationFailure, string> = {
  unsupported: 'Trình duyệt này chưa nghe được giọng nói. Hãy mở bằng Chrome hoặc Safari, hoặc gõ vào ô nhé.',
  denied:
    'Micro đang bị chặn. Cho phép Micro trong cài đặt của trang rồi thử lại. Trên iPhone, nếu mở app từ màn hình chính mà không nghe được, hãy thử mở bằng Safari.',
  'no-speech': 'Mình chưa nghe thấy gì. Bấm micro rồi nói to, rõ một chút nhé.',
  'no-mic': 'Không tìm thấy micro nào trên máy này.',
  network: 'Nghe giọng nói cần có mạng. Có mạng lại thì thử lần nữa nhé.',
  error: 'Chưa nghe được lần này. Bạn thử lại nhé.',
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: Translation }
  | { status: 'error'; reason: TranslateFailure }

/** Dịch xong thì đọc bản dịch một lần: tiếng Trung bằng giọng thu sẵn nếu có, tiếng Việt bằng giọng của máy. */
function speakResult(result: Translation) {
  if (result.direction === 'vi-zh') void playWord({ text: result.hanzi, wordId: result.wordId, clipUrl: result.clipUrl })
  else void speakVietnamese(result.vietnamese)
}

/**
 * Màn Dịch: hai chiều Việt ⇄ Trung, gõ hoặc nói, rồi Zibi đọc bản dịch lên.
 *
 * Tra khoá học trước, không có mới hỏi Google Dịch — xem `src/lib/translate.ts`
 * và `docs/translate.md`. Nói thì dùng nhận dạng giọng nói của trình duyệt —
 * `src/lib/dictation.ts`.
 */
export function Translate() {
  const [direction, setDirection] = useState<Direction>('vi-zh')
  const [text, setText] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const [listening, setListening] = useState(false)
  const [hearing, setHearing] = useState<DictationFailure | null>(null)

  // Người học có thể dịch câu mới khi câu cũ chưa về: chỉ nhận câu mới nhất.
  const latest = useRef(0)
  const dictation = useRef<Dictation | null>(null)

  // Rời màn hình thì thôi nghe, thôi đọc.
  useEffect(
    () => () => {
      dictation.current?.cancel()
      stopPlayback()
    },
    [],
  )

  const side = SIDES[direction]
  const loading = state.status === 'loading'

  async function run(query: string, dir: Direction = direction) {
    const ticket = ++latest.current
    setHearing(null)
    setState({ status: 'loading' })
    try {
      const result = await translate(query, { direction: dir })
      if (ticket !== latest.current) return
      setState({ status: 'done', result })
      speakResult(result)
    } catch (error) {
      if (ticket !== latest.current) return
      setState({ status: 'error', reason: error instanceof TranslateError ? error.reason : 'failed' })
    }
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault()
    if (text.trim() && !loading && !listening) void run(text)
  }

  /** Đổi chiều. Vừa dịch xong thì lật luôn cặp câu, khỏi gọi mạng lần nữa. */
  function swap() {
    dictation.current?.cancel()
    setListening(false)
    stopPlayback()
    latest.current += 1
    setHearing(null)

    const next = flip(direction)
    setDirection(next)
    if (state.status === 'done') {
      const { result } = state
      setText(next === 'zh-vi' ? result.hanzi : result.vietnamese)
      setState({ status: 'done', result: { ...result, direction: next, alternatives: undefined } })
    } else {
      setState({ status: 'idle' })
    }
  }

  /** Gõ nhầm chữ Hán ở chiều Việt → Trung: đổi chiều rồi dịch luôn câu đó. */
  function swapAndTranslate() {
    const next = flip(direction)
    setDirection(next)
    void run(text, next)
  }

  function toggleListening() {
    if (listening) {
      // Thôi nghe nhưng giữ những gì đã nghe được — onEnd sẽ dịch.
      dictation.current?.stop()
      return
    }

    stopPlayback()
    latest.current += 1
    setHearing(null)
    setState({ status: 'idle' })
    setListening(true)

    const dir = direction
    dictation.current = startDictation({
      lang: SIDES[dir].listen,
      onText: setText,
      onEnd: ({ text: heard, failure }) => {
        setListening(false)
        if (heard) {
          setText(heard)
          void run(heard, dir)
        } else if (failure) {
          setHearing(failure)
        }
      },
    })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dịch</h1>

      <MascotSays mood="chao">
        Gõ hoặc bấm micro để nói — mình dịch qua lại tiếng Việt và tiếng Trung, rồi đọc cho bạn nghe.
      </MascotSays>

      <form onSubmit={submit} className="surface space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-center font-semibold text-slate-900 dark:text-slate-100">{side.from}</span>
          <button
            type="button"
            onClick={swap}
            aria-label="Đổi chiều dịch"
            title="Đổi chiều dịch"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-600 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-90 dark:text-brand-300 dark:ring-slate-700 dark:hover:bg-slate-800"
          >
            <SwapIcon size={20} />
          </button>
          <span className="flex-1 text-center font-semibold text-slate-900 dark:text-slate-100">{side.to}</span>
        </div>

        <label htmlFor="translate-input" className="sr-only">
          {side.from}
        </label>
        <div className="relative">
          <textarea
            id="translate-input"
            lang={direction === 'zh-vi' ? 'zh-CN' : 'vi'}
            value={text}
            rows={2}
            maxLength={MAX_INPUT_LENGTH}
            readOnly={listening}
            placeholder={listening ? 'Đang nghe…' : side.placeholder}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              // Enter là dịch; Shift + Enter mới xuống dòng.
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                submit()
              }
            }}
            className={cn(
              'block w-full resize-none rounded-2xl border border-slate-200 py-3 pr-16 pl-4 text-base dark:border-slate-700 dark:bg-slate-800',
              direction === 'zh-vi' && 'font-hanzi',
            )}
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={loading}
            aria-label={listening ? 'Dừng nghe' : side.mic}
            aria-pressed={listening}
            title={listening ? 'Dừng nghe' : side.mic}
            className={cn(
              'absolute right-2 bottom-2 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40',
              listening
                ? 'animate-pulse bg-brand-500 text-white ring-4 ring-brand-500/25 motion-reduce:animate-none'
                : 'bg-brand-50 text-brand-600 ring-1 ring-brand-100 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25',
            )}
          >
            <MicIcon size={22} />
          </button>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={!text.trim() || loading || listening}>
          {listening ? 'Đang nghe…' : loading ? 'Đang dịch…' : side.submit}
        </Button>

        <div className="flex flex-wrap gap-2" aria-label="Gợi ý">
          {side.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              lang={direction === 'zh-vi' ? 'zh-CN' : 'vi'}
              disabled={loading || listening}
              onClick={() => {
                setText(suggestion)
                void run(suggestion)
              }}
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite">
        {hearing && (
          <div role="status">
            <MascotSays mood="nghi">{HEARING[hearing]}</MascotSays>
          </div>
        )}
        {state.status === 'done' && <TranslationCard result={state.result} />}
        {state.status === 'error' && state.reason !== 'empty' && (
          <div role="status" className="space-y-3">
            <MascotSays mood="tiec" tone="wrong">
              {FAILURES[state.reason]}
            </MascotSays>
            {state.reason === 'looks-chinese' && (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={swapAndTranslate}>
                  <SwapIcon size={18} /> Đổi chiều và dịch
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Từ và câu có trong bài học được tra ngay trên máy, kèm giọng đọc thu sẵn. Còn lại được gửi tới Google
        Dịch để dịch. Khi bấm micro, trình duyệt gửi giọng nói tới dịch vụ nhận dạng của hãng (Google trên
        Chrome, Apple trên Safari) để đổi thành chữ.
      </p>
    </div>
  )
}

/** Dòng nói rõ bản dịch lấy từ đâu. */
function SourceNote({ result }: { result: Translation }) {
  return (
    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
      {result.source === 'course' ? (
        <>
          <BookIcon size={16} className="mr-1 inline-block align-[-3px]" />
          Có trong bài học
          {result.direction === 'vi-zh' && `: “${result.vietnamese}”`}
        </>
      ) : (
        'Dịch bởi Google Dịch'
      )}
    </p>
  )
}

function TranslationCard({ result }: { result: Translation }) {
  return result.direction === 'vi-zh' ? <ChineseCard result={result} /> : <VietnameseCard result={result} />
}

/** Việt → Trung: chữ Hán to, pinyin, nút nghe lại. */
function ChineseCard({ result }: { result: Translation }) {
  const long = result.hanzi.length > 8

  return (
    <section aria-label="Bản dịch" className="surface p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p
            lang="zh-CN"
            className={cn(
              'font-hanzi font-semibold break-words text-slate-900 dark:text-slate-100',
              long ? 'text-3xl' : 'text-5xl',
            )}
          >
            {result.hanzi}
          </p>
          {result.pinyin && <p className="mt-2 text-lg text-brand-600 dark:text-brand-300">{result.pinyin}</p>}
        </div>
        <AudioButton text={result.hanzi} wordId={result.wordId} clipUrl={result.clipUrl} label={result.hanzi} size="lg" />
      </div>

      <SourceNote result={result} />

      {result.alternatives && result.alternatives.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Cũng mang nghĩa này trong bài học:</p>
          <ul className="mt-2 space-y-2">
            {result.alternatives.map((entry) => (
              <li key={entry.hanzi} className="flex items-center gap-3">
                <span lang="zh-CN" className="font-hanzi text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {entry.hanzi}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="text-brand-600 dark:text-brand-300">{entry.pinyin}</span>
                  <span className="text-slate-500 dark:text-slate-400"> · {entry.vietnamese}</span>
                </span>
                <AudioButton text={entry.hanzi} wordId={entry.wordId} clipUrl={entry.clipUrl} label={entry.hanzi} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/**
 * Trung → Việt: nghĩa tiếng Việt to, bên dưới là câu tiếng Trung kèm pinyin —
 * người học vẫn thấy và nghe được phía tiếng Trung, thứ họ đang học.
 */
function VietnameseCard({ result }: { result: Translation }) {
  return (
    <section aria-label="Bản dịch" className="surface p-5">
      <div className="flex items-start gap-4">
        <p className="min-w-0 flex-1 text-2xl font-bold break-words text-slate-900 dark:text-slate-100">
          {result.vietnamese}
        </p>
        <VietnameseSpeakButton text={result.vietnamese} />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <div className="min-w-0 flex-1">
          <p lang="zh-CN" className="font-hanzi text-2xl font-semibold break-words text-slate-900 dark:text-slate-100">
            {result.hanzi}
          </p>
          {result.pinyin && <p className="text-brand-600 dark:text-brand-300">{result.pinyin}</p>}
        </div>
        <AudioButton text={result.hanzi} wordId={result.wordId} clipUrl={result.clipUrl} label={result.hanzi} size="md" />
      </div>

      <SourceNote result={result} />
    </section>
  )
}

/** Nút đọc câu tiếng Việt bằng giọng của máy. */
function VietnameseSpeakButton({ text }: { text: string }) {
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  async function speak() {
    setHint(null)
    setBusy(true)
    const result = await speakVietnamese(text)
    setBusy(false)
    if (result === 'no-voice') setHint('Máy chưa có giọng đọc tiếng Việt nên mình chưa đọc được câu này.')
    else if (result === 'unsupported') setHint('Trình duyệt này chưa đọc được thành tiếng.')
    else if (result === 'error') setHint('Không đọc được lần này. Thử bấm lại nhé.')
  }

  return (
    <span className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={speak}
        aria-label="Nghe câu tiếng Việt"
        aria-busy={busy}
        className={cn(
          'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition hover:bg-brand-100 active:scale-95 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25 dark:hover:bg-brand-500/25',
          busy && 'animate-pulse motion-reduce:animate-none',
        )}
      >
        <SpeakerIcon size={24} />
      </button>
      {hint && (
        <span
          role="status"
          className="absolute top-full right-0 z-10 mt-2 w-60 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs leading-snug font-normal text-white shadow-lg dark:bg-slate-700"
        >
          {hint}
        </span>
      )}
    </span>
  )
}
