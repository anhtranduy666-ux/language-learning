import type { Word } from '../types'
import { AudioButton } from './AudioButton'

interface FlashcardProps {
  word: Word
  flipped: boolean
  onFlip: () => void
}

/**
 * Thẻ từ vựng hai mặt.
 * Mặt trước chỉ có chữ Hán để người học tự nhớ nghĩa, mặt sau mới lộ pinyin và nghĩa.
 */
export function Flashcard({ word, flipped, onFlip }: FlashcardProps) {
  return (
    <div className="flip-scene w-full">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? 'Lật lại mặt trước' : 'Lật thẻ để xem nghĩa'}
        className="flip-card relative block h-72 w-full cursor-pointer text-left sm:h-80"
        data-flipped={flipped}
        data-testid="flashcard"
      >
        {/* Mặt trước */}
        <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <p className="font-hanzi text-7xl font-semibold text-slate-900 sm:text-8xl">
            {word.hanzi}
          </p>
          <AudioButton text={word.hanzi} wordId={word.id} label={word.hanzi} size="md" />
          <p className="text-sm text-slate-400">Chạm để xem nghĩa</p>
        </div>

        {/* Mặt sau */}
        <div className="flip-face flip-face-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-brand-500 p-6 text-center text-white shadow-lg">
          <p className="font-hanzi text-4xl font-semibold">{word.hanzi}</p>
          <p className="text-xl text-brand-100">{word.pinyin}</p>
          <p className="text-2xl font-semibold">{word.meaning}</p>
          <div className="mt-2 rounded-2xl bg-brand-600/60 px-4 py-3">
            <p className="font-hanzi text-base">{word.example}</p>
            <p className="mt-1 text-sm text-brand-100">{word.exampleMeaning}</p>
          </div>
        </div>
      </button>
    </div>
  )
}
