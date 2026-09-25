import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { ExampleSentences } from '../components/ExampleSentences'
import { FocusHeader } from '../components/FocusHeader'
import { MicIcon } from '../components/icons/UiIcons'
import { MascotSays } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { ALL_LESSONS, wordsOfLesson } from '../data/hsk1'
import { prefetchAudio } from '../lib/remoteAudio'

/** Bước 1 của bài học: xem trước toàn bộ từ vựng, nghe phát âm từng từ và cả câu mẫu. */
export function Lesson() {
  const { lessonId = '' } = useParams()
  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)
  const words = wordsOfLesson(lessonId)

  // Nạp sẵn audio của cả bài ngay khi mở trang. Mỗi bài chỉ khoảng sáu từ nên
  // thường tải xong trước lúc người học đọc hết danh sách và bấm loa.
  //
  // Phụ thuộc theo `lessonId` chứ không theo `words`: `wordsOfLesson` trả về
  // mảng mới mỗi lần render, nên để `words` ở đây là nạp lại sau mỗi render.
  useEffect(() => {
    prefetchAudio(wordsOfLesson(lessonId).map((word) => word.hanzi))
  }, [lessonId])

  if (!lesson) return <Navigate to="/learn" replace />

  return (
    <>
      <FocusHeader title={`${lesson.unitTitle} · ${lesson.title}`} progress={25} backTo="/learn" />

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Từ mới</h1>

        <MascotSays mood="vui" className="mt-4">
          {words.length} từ thôi. Nghe từng từ, rồi nghe cả câu mẫu để biết nó đi với chữ khác ra
          sao — xong mình luyện flashcard nhé.
        </MascotSays>

        <ul className="mt-5 space-y-3">
          {words.map((word) => (
            <li
              key={word.id}
              className="surface rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                <p className="font-hanzi text-3xl font-semibold text-slate-900 dark:text-slate-100">{word.hanzi}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-brand-600 dark:text-brand-300">{word.pinyin}</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{word.meaning}</p>
                </div>
                <AudioButton text={word.hanzi} wordId={word.id} label={word.hanzi} size="sm" />
              </div>

              <ExampleSentences word={word} className="mt-3" />
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 bg-slate-50/95 px-4 dark:bg-slate-950/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="grid grid-cols-[auto_1fr] gap-3">
          {/* Luyện nói là bước tuỳ chọn: đọc to từng từ, máy chấm thanh điệu. */}
          <Link to={`/lesson/${lesson.id}/speaking`}>
            <Button variant="secondary" size="lg">
              <MicIcon size={20} /> Luyện nói
            </Button>
          </Link>
          <Link to={`/lesson/${lesson.id}/flashcards`}>
            <Button size="lg" fullWidth>
              Luyện flashcard
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
