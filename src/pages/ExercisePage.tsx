import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { FocusHeader } from '../components/FocusHeader'
import { Button } from '../components/ui/Button'
import { ALL_LESSONS, WORDS, WORD_BY_ID, wordsOfLesson } from '../data/hsk1'
import { useProgress } from '../context/ProgressContext'
import { cn } from '../lib/cn'
import {
  KIND_LABEL,
  buildExercises,
  createRng,
  gradeChoice,
  gradeMatching,
  isChoiceExercise,
  seedFromText,
} from '../lib/exercises'
import { XP_REWARDS } from '../lib/gamification'

/** Bước 3: làm bài tập. Bốn dạng của Version 2 đều xuất hiện ở đây. */
export function ExercisePage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { answerCorrect, finishLesson } = useProgress()

  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)
  const exercises = useMemo(
    () => buildExercises(wordsOfLesson(lessonId), WORDS, createRng(seedFromText(lessonId))),
    [lessonId],
  )

  const [index, setIndex] = useState(0)
  const [choiceId, setChoiceId] = useState('')
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [activeLeft, setActiveLeft] = useState('')
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  if (!lesson || exercises.length === 0) return <Navigate to="/learn" replace />

  const exercise = exercises[index]
  const isLast = index === exercises.length - 1
  const isChoice = isChoiceExercise(exercise)

  const hasAnswer = isChoice
    ? choiceId !== ''
    : Object.keys(matches).length === Object.keys(exercise.answerKey).length
  const isCorrect = isChoice
    ? gradeChoice(exercise, choiceId)
    : gradeMatching(exercise, matches)

  function check() {
    setChecked(true)
    if (isCorrect) {
      setCorrectCount((count) => count + 1)
      answerCorrect()
    }
  }

  function goNext() {
    if (isLast) {
      finishLesson(lessonId)
      navigate(`/lesson/${lessonId}/result`, {
        replace: true,
        state: {
          correct: correctCount,
          total: exercises.length,
          xpEarned: correctCount * XP_REWARDS.correctAnswer + XP_REWARDS.lessonComplete,
        },
      })
      return
    }
    setIndex((current) => current + 1)
    setChoiceId('')
    setMatches({})
    setActiveLeft('')
    setChecked(false)
  }

  /** Chạm vào một ô bên trái: chọn nó, hoặc bỏ cặp đã ghép. */
  function tapLeft(leftId: string) {
    if (checked) return
    if (matches[leftId]) {
      setMatches((current) => {
        const next = { ...current }
        delete next[leftId]
        return next
      })
      setActiveLeft(leftId)
      return
    }
    setActiveLeft(leftId === activeLeft ? '' : leftId)
  }

  /** Chạm vào một ô bên phải: ghép với ô trái đang chọn. */
  function tapRight(rightId: string) {
    if (checked || !activeLeft) return
    if (Object.values(matches).includes(rightId)) return
    setMatches((current) => ({ ...current, [activeLeft]: rightId }))
    setActiveLeft('')
  }

  return (
    <>
      <FocusHeader
        title={`${KIND_LABEL[exercise.kind]} · ${index + 1}/${exercises.length}`}
        progress={50 + ((index + (checked ? 1 : 0)) / exercises.length) * 50}
        backTo={`/lesson/${lessonId}`}
      />

      <div className="flex-1">
        <h1 className="text-xl font-bold text-slate-900">{exercise.prompt}</h1>

        {isChoice ? (
          <>
            {exercise.kind === 'listening' ? (
              <div className="mt-6 flex justify-center">
                <AudioButton
                  text={WORD_BY_ID[exercise.wordId]?.hanzi ?? ''}
                  label="từ trong câu hỏi"
                  size="lg"
                />
              </div>
            ) : (
              <p className="font-hanzi mt-6 text-center text-6xl font-semibold text-slate-900">
                {WORD_BY_ID[exercise.wordId]?.hanzi}
              </p>
            )}

            <ul className="mt-8 space-y-3">
              {exercise.choices.map((choice) => {
                const selected = choice.id === choiceId
                const isRight = choice.id === exercise.correctChoiceId
                return (
                  <li key={choice.id}>
                    <button
                      type="button"
                      disabled={checked}
                      onClick={() => setChoiceId(choice.id)}
                      className={cn(
                        'w-full rounded-2xl border-2 bg-white p-4 text-left text-lg font-medium transition',
                        exercise.kind === 'listening' && 'font-hanzi text-2xl',
                        !checked && selected && 'border-brand-500 bg-brand-50',
                        !checked && !selected && 'border-slate-200 hover:border-slate-300',
                        checked && isRight && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                        checked && selected && !isRight && 'border-amber-500 bg-amber-50',
                        checked && !selected && !isRight && 'border-slate-200 opacity-60',
                      )}
                    >
                      {choice.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <ul className="space-y-3">
              {exercise.left.map((item) => {
                const pairedTo = matches[item.id]
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={checked}
                      onClick={() => tapLeft(item.id)}
                      className={cn(
                        'font-hanzi w-full rounded-2xl border-2 bg-white p-4 text-2xl font-semibold transition',
                        activeLeft === item.id && 'border-brand-500 bg-brand-50',
                        pairedTo && 'border-emerald-400 bg-emerald-50',
                        !pairedTo && activeLeft !== item.id && 'border-slate-200',
                        checked &&
                          matches[item.id] !== exercise.answerKey[item.id] &&
                          'border-amber-500 bg-amber-50',
                      )}
                    >
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>

            <ul className="space-y-3">
              {exercise.right.map((item) => {
                const used = Object.values(matches).includes(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={checked || used}
                      onClick={() => tapRight(item.id)}
                      className={cn(
                        'w-full rounded-2xl border-2 bg-white p-4 text-base font-medium transition',
                        used ? 'border-emerald-400 bg-emerald-50 opacity-70' : 'border-slate-200',
                      )}
                    >
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Khu vực chấm và đi tiếp */}
      <div
        className={cn(
          'sticky bottom-0 -mx-4 mt-6 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          !checked && 'bg-slate-50/95 backdrop-blur',
          checked && isCorrect && 'bg-emerald-50',
          checked && !isCorrect && 'bg-amber-50',
        )}
      >
        {checked && (
          <p
            role="status"
            className={cn(
              'mb-3 font-semibold',
              isCorrect ? 'text-emerald-700' : 'text-amber-700',
            )}
          >
            {isCorrect ? (
              `Chính xác! +${XP_REWARDS.correctAnswer} XP`
            ) : (
              <>
                Chưa đúng.{' '}
                {isChoice &&
                  `Đáp án là "${
                    exercise.choices.find((c) => c.id === exercise.correctChoiceId)?.label
                  }".`}
                {!isChoice && 'Xem lại cách ghép ở trên nhé.'}
              </>
            )}
          </p>
        )}

        {checked ? (
          <Button
            size="lg"
            fullWidth
            variant={isCorrect ? 'success' : 'danger'}
            onClick={goNext}
          >
            {isLast ? 'Xem kết quả' : 'Tiếp tục'}
          </Button>
        ) : (
          <Button size="lg" fullWidth disabled={!hasAnswer} onClick={check}>
            Kiểm tra
          </Button>
        )}
      </div>
    </>
  )
}
