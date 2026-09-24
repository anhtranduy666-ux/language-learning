import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { FocusHeader } from '../components/FocusHeader'
import { MascotSays } from '../components/Mascot'
import { DictationInput } from '../components/exercise/DictationInput'
import { SentenceBuilder } from '../components/exercise/SentenceBuilder'
import { ToneChoice } from '../components/exercise/ToneChoice'
import { Button } from '../components/ui/Button'
import { ALL_LESSONS, WORDS, WORD_BY_ID, wordsOfLesson } from '../data/hsk1'
import { useProgress } from '../context/ProgressContext'
import { useAudioStatus } from '../hooks/useAudioStatus'
import { cn } from '../lib/cn'
import {
  KIND_LABEL,
  buildExercises,
  createRng,
  gradeChoice,
  gradeDictation,
  gradeMatching,
  gradeSentence,
  gradeTone,
  isChoiceExercise,
  seedFromText,
} from '../lib/exercises'
import { XP_REWARDS } from '../lib/gamification'
import { TONE_NAMES, applyTone } from '../lib/tones'
import type { Exercise } from '../types'

/**
 * Màu của một ô theo trạng thái của nó.
 *
 * Mỗi trạng thái tự khai đủ nền cho cả hai chế độ. Để một nền chung ở lớp gốc
 * rồi trông chờ `dark:` của trạng thái ghi đè là không ăn: Tailwind xếp CSS
 * theo tên tiện ích chứ không theo thứ tự mình viết, nên `dark:bg-slate-900`
 * của lớp gốc đè mất `dark:bg-emerald-500/15` của trạng thái.
 */
const CHOICE_STYLES = {
  idle: 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
  selected: 'border-brand-500 bg-brand-50 dark:bg-brand-500/15',
  right: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
  wrong: 'border-amber-500 bg-amber-50 dark:bg-amber-500/15',
  dimmed: 'border-slate-200 bg-white opacity-60 dark:border-slate-700 dark:bg-slate-900',
}

const MATCH_STYLES = {
  idle: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
  active: 'border-brand-500 bg-brand-50 dark:bg-brand-500/15',
  paired: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15',
  wrong: 'border-amber-500 bg-amber-50 dark:bg-amber-500/15',
}

/** Trạng thái của một lựa chọn trong bài trắc nghiệm / nghe / pinyin. */
function choiceState(
  checked: boolean,
  selected: boolean,
  isRight: boolean,
): keyof typeof CHOICE_STYLES {
  if (!checked) return selected ? 'selected' : 'idle'
  if (isRight) return 'right'
  return selected ? 'wrong' : 'dimmed'
}

/** Bước 3: làm bài tập. Cả sáu dạng đều xuất hiện ở đây. */
export function ExercisePage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { answerCorrect, finishLesson } = useProgress()
  const audioStatus = useAudioStatus()

  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)
  const exercises = useMemo(
    () => buildExercises(wordsOfLesson(lessonId), WORDS, createRng(seedFromText(lessonId))),
    [lessonId],
  )

  const [index, setIndex] = useState(0)
  const [choiceId, setChoiceId] = useState('')
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [activeLeft, setActiveLeft] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const [pickedTone, setPickedTone] = useState(0)
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  if (!lesson || exercises.length === 0) return <Navigate to="/learn" replace />

  const exercise = exercises[index]
  const isLast = index === exercises.length - 1
  const isChoice = isChoiceExercise(exercise)

  let hasAnswer: boolean
  let isCorrect: boolean
  switch (exercise.kind) {
    case 'matching':
      hasAnswer = Object.keys(matches).length === Object.keys(exercise.answerKey).length
      isCorrect = gradeMatching(exercise, matches)
      break
    case 'sentence':
      hasAnswer = picked.length > 0
      isCorrect = gradeSentence(exercise, picked)
      break
    case 'dictation':
      hasAnswer = typed.trim() !== ''
      isCorrect = gradeDictation(exercise, typed)
      break
    case 'tone':
      hasAnswer = pickedTone !== 0
      isCorrect = gradeTone(exercise, pickedTone)
      break
    default:
      hasAnswer = choiceId !== ''
      isCorrect = gradeChoice(exercise, choiceId)
  }

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
    setPicked([])
    setTyped('')
    setPickedTone(0)
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{exercise.prompt}</h1>

        {isChoice ? (
          <>
            {exercise.kind === 'listening' || exercise.kind === 'tone-pair' ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <AudioButton
                  text={WORD_BY_ID[exercise.wordId]?.hanzi ?? ''}
                  wordId={exercise.wordId}
                  label="từ trong câu hỏi"
                  size="lg"
                />
                {/* Không có âm thì bài nghe không làm được, nên phải đưa ra một
                    gợi ý thay thế — nhưng mỗi dạng bài cần một thứ khác nhau.
                    Bài nghe chọn chữ thì hiện pinyin; bài phân biệt thanh thì
                    không được, vì pinyin chính là đáp án. Chữ Hán là thứ duy
                    nhất còn lại mà vẫn để bài làm được. */}
                {audioStatus !== 'ready' ? (
                  exercise.kind === 'listening' ? (
                    <p className="max-w-xs text-center text-sm text-slate-500 dark:text-slate-400">
                      Máy chưa phát âm được nên bài nghe hiện pinyin thay thế:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {WORD_BY_ID[exercise.wordId]?.pinyin}
                      </span>
                    </p>
                  ) : (
                    <p className="max-w-xs text-center text-sm text-slate-500 dark:text-slate-400">
                      Máy chưa phát âm được, nên bạn chọn cách đọc của chữ này nhé:{' '}
                      <span className="font-hanzi text-xl font-semibold text-slate-700 dark:text-slate-200">
                        {WORD_BY_ID[exercise.wordId]?.hanzi}
                      </span>
                    </p>
                  )
                ) : null}
              </div>
            ) : (
              <p className="font-hanzi mt-6 text-center text-6xl font-semibold text-slate-900 dark:text-slate-100">
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
                        'w-full rounded-2xl border-2 p-4 text-left text-lg font-medium transition',
                        exercise.kind === 'listening' && 'font-hanzi text-2xl',
                        // Bốn phương án chỉ lệch nhau đúng một dấu thanh, nên
                        // phải đủ to để nhìn ra dấu mà không cần căng mắt.
                        exercise.kind === 'tone-pair' && 'text-center text-2xl tracking-wide',
                        CHOICE_STYLES[choiceState(checked, selected, isRight)],
                      )}
                    >
                      {choice.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : exercise.kind === 'sentence' ? (
          <SentenceBuilder
            exercise={exercise}
            picked={picked}
            checked={checked}
            isCorrect={isCorrect}
            onPick={(tileId) => setPicked((current) => [...current, tileId])}
            onUnpick={(tileId) => setPicked((current) => current.filter((id) => id !== tileId))}
          />
        ) : exercise.kind === 'dictation' ? (
          <DictationInput
            exercise={exercise}
            value={typed}
            checked={checked}
            isCorrect={isCorrect}
            onChange={setTyped}
            onSubmit={check}
          />
        ) : exercise.kind === 'tone' ? (
          <ToneChoice
            exercise={exercise}
            picked={pickedTone}
            checked={checked}
            onPick={setPickedTone}
          />
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
                        'font-hanzi w-full rounded-2xl border-2 p-4 text-2xl font-semibold transition',
                        // Chấm xong mà ghép sai thì phải ra màu sai, kể cả khi
                        // ô đó đang có cặp — nên nhánh này đứng trước.
                        checked && matches[item.id] !== exercise.answerKey[item.id]
                          ? MATCH_STYLES.wrong
                          : pairedTo
                            ? MATCH_STYLES.paired
                            : activeLeft === item.id
                              ? MATCH_STYLES.active
                              : MATCH_STYLES.idle,
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
                        'w-full rounded-2xl border-2 p-4 text-base font-medium transition',
                        used ? `${MATCH_STYLES.paired} opacity-70` : MATCH_STYLES.idle,
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
          !checked && 'bg-slate-50/95 backdrop-blur dark:bg-slate-950/95',
          checked && isCorrect && 'bg-emerald-50 dark:bg-emerald-500/15',
          checked && !isCorrect && 'bg-amber-50 dark:bg-amber-500/15',
        )}
      >
        {checked && (
          <div role="status" className="mb-3">
            <MascotSays mood={isCorrect ? 'mung' : 'tiec'} tone={isCorrect ? 'right' : 'wrong'}>
              {isCorrect ? (
                `Chính xác! +${XP_REWARDS.correctAnswer} XP`
              ) : (
                <>
                  Chưa đúng. <WrongAnswerHint exercise={exercise} />
                </>
              )}
            </MascotSays>
          </div>
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

/** Lời chữa bài của Zibi khi trả lời sai — mỗi dạng bài cần chỉ ra một thứ khác. */
function WrongAnswerHint({ exercise }: { exercise: Exercise }) {
  switch (exercise.kind) {
    case 'matching':
      return <>Xem lại cách ghép ở trên nhé.</>
    case 'sentence':
      return (
        <>
          Câu đúng là <span className="font-hanzi font-semibold">{exercise.pieces.join(' ')}</span>.
        </>
      )
    case 'dictation':
      return (
        <>
          Đáp án là <span className="font-semibold">{exercise.answer}</span>{' '}
          <span className="font-hanzi">({exercise.hanzi})</span>.
        </>
      )
    case 'tone': {
      // Chữa bài thanh điệu phải nói rõ *thanh mấy*, không chỉ đưa lại chữ có
      // dấu: người mới nhìn `hǎo` chưa chắc đọc ra đó là thanh 3.
      const name = TONE_NAMES.find((item) => item.tone === exercise.tone)
      return (
        <>
          <span className="font-hanzi">{exercise.hanzi}</span> đọc là{' '}
          <span className="font-semibold">{applyTone(exercise.syllable, exercise.tone)}</span> —{' '}
          {name?.label.toLowerCase()}, {name?.hint}.
        </>
      )
    }
    default:
      return (
        <>
          Đáp án là "{exercise.choices.find((choice) => choice.id === exercise.correctChoiceId)?.label}".
        </>
      )
  }
}
