import { Link, Navigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { FocusHeader } from '../components/FocusHeader'
import { Button } from '../components/ui/Button'
import { ALL_LESSONS, wordsOfLesson } from '../data/hsk1'

/** Bước 1 của bài học: xem trước toàn bộ từ vựng, nghe phát âm. */
export function Lesson() {
  const { lessonId = '' } = useParams()
  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)
  const words = wordsOfLesson(lessonId)

  if (!lesson) return <Navigate to="/learn" replace />

  return (
    <>
      <FocusHeader title={`${lesson.unitTitle} · ${lesson.title}`} progress={25} backTo="/learn" />

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-slate-900">Từ mới</h1>
        <p className="mt-1 text-slate-600">
          {words.length} từ. Chạm vào loa để nghe, xem xong thì luyện flashcard.
        </p>

        <ul className="mt-5 space-y-3">
          {words.map((word) => (
            <li
              key={word.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-4">
                <p className="font-hanzi text-3xl font-semibold text-slate-900">{word.hanzi}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-brand-600">{word.pinyin}</p>
                  <p className="font-medium text-slate-800">{word.meaning}</p>
                </div>
                <AudioButton text={word.hanzi} label={word.hanzi} size="sm" />
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                <p className="font-hanzi text-sm text-slate-700">{word.example}</p>
                <p className="text-xs text-slate-500">{word.exampleMeaning}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 bg-slate-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link to={`/lesson/${lesson.id}/flashcards`}>
          <Button size="lg" fullWidth>
            Luyện flashcard
          </Button>
        </Link>
      </div>
    </>
  )
}
