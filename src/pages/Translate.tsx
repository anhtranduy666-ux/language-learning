import { useEffect, useRef, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { MascotSays } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'
import { playWord, stopPlayback } from '../lib/speech'
import {
  MAX_INPUT_LENGTH,
  TranslateError,
  translate,
  type TranslateFailure,
  type Translation,
} from '../lib/translate'

/** Gợi ý để người mới biết gõ gì vào — bấm là dịch luôn. */
const SUGGESTIONS = ['xin chào', 'cảm ơn', 'bạn tên là gì?', 'tôi muốn uống trà']

/** Zibi nói gì khi không dịch được. Ô trống thì nút đã tắt, không cần lời. */
const FAILURES: Record<Exclude<TranslateFailure, 'empty'>, string> = {
  'too-long': `Dài quá — mỗi lần mình dịch tối đa ${MAX_INPUT_LENGTH} chữ thôi nhé.`,
  offline: 'Đang mất mạng nên mình chỉ tra được từ và câu có trong bài học. Có mạng lại thì thử lần nữa nhé.',
  blocked: 'Google Dịch đang tạm từ chối vì bị hỏi dồn dập. Đợi vài phút rồi thử lại nhé.',
  failed: 'Chưa dịch được lần này. Bạn thử lại nhé.',
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: Translation }
  | { status: 'error'; reason: TranslateFailure }

/**
 * Màn Dịch: gõ tiếng Việt, ra chữ Hán kèm pinyin, rồi Zibi đọc to lên.
 *
 * Tra khoá học trước, không có mới hỏi Google Dịch — xem `src/lib/translate.ts`
 * và `docs/translate.md`. Dịch xong tự đọc một lần; nút loa để nghe lại.
 */
export function Translate() {
  const [text, setText] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  // Người học có thể bấm dịch câu mới khi câu cũ chưa về: chỉ nhận câu mới nhất.
  const latest = useRef(0)

  // Rời màn hình thì thôi đọc.
  useEffect(() => () => stopPlayback(), [])

  async function run(query: string) {
    const ticket = ++latest.current
    setState({ status: 'loading' })
    try {
      const result = await translate(query)
      if (ticket !== latest.current) return
      setState({ status: 'done', result })
      // Dịch xong thì đọc luôn một lần. Máy chưa đọc được thì im lặng — bấm loa sẽ hiện cách khắc phục.
      void playWord({ text: result.hanzi, wordId: result.wordId, clipUrl: result.clipUrl })
    } catch (error) {
      if (ticket !== latest.current) return
      setState({ status: 'error', reason: error instanceof TranslateError ? error.reason : 'failed' })
    }
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault()
    if (text.trim() && state.status !== 'loading') void run(text)
  }

  const loading = state.status === 'loading'

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dịch</h1>

      <MascotSays mood="chao">Gõ tiếng Việt vào đây, mình dịch sang tiếng Trung rồi đọc cho bạn nghe.</MascotSays>

      <form onSubmit={submit} className="surface space-y-3 p-4">
        <label htmlFor="translate-input" className="block font-semibold text-slate-900 dark:text-slate-100">
          Tiếng Việt
        </label>
        <textarea
          id="translate-input"
          value={text}
          rows={2}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="Ví dụ: con mèo, bạn tên là gì?"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Enter là dịch; Shift + Enter mới xuống dòng.
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
          className="block w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-800"
        />
        <Button type="submit" size="lg" fullWidth disabled={!text.trim() || loading}>
          {loading ? 'Đang dịch…' : 'Dịch sang tiếng Trung'}
        </Button>

        <div className="flex flex-wrap gap-2" aria-label="Gợi ý">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
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
        {state.status === 'done' && <TranslationCard result={state.result} />}
        {state.status === 'error' && state.reason !== 'empty' && (
          <div role="status">
            <MascotSays mood="tiec" tone="wrong">
              {FAILURES[state.reason]}
            </MascotSays>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Từ và câu có trong bài học được tra ngay trên máy, kèm giọng đọc thu sẵn. Còn lại được gửi tới Google
        Dịch để dịch.
      </p>
    </div>
  )
}

/** Bản dịch: chữ Hán to, pinyin, nút nghe lại, và nói rõ bản dịch lấy từ đâu. */
function TranslationCard({ result }: { result: Translation }) {
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
        <AudioButton
          text={result.hanzi}
          wordId={result.wordId}
          clipUrl={result.clipUrl}
          label={result.hanzi}
          size="lg"
        />
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {result.source === 'course' ? (
          <>
            <span aria-hidden="true">📘</span> Có trong bài học: “{result.courseMeaning}”
          </>
        ) : (
          'Dịch bởi Google Dịch'
        )}
      </p>

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
                  <span className="text-slate-500 dark:text-slate-400"> · {entry.courseMeaning}</span>
                </span>
                <AudioButton
                  text={entry.hanzi}
                  wordId={entry.wordId}
                  clipUrl={entry.clipUrl}
                  label={entry.hanzi}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
