/** Kiểu dữ liệu dùng chung cho toàn bộ ứng dụng. */

/** Một từ vựng. Mỗi từ luôn có đủ Hanzi / Pinyin / nghĩa để hiển thị trên flashcard. */
export interface Word {
  id: string
  hanzi: string
  pinyin: string
  meaning: string
  /** Câu ví dụ bằng tiếng Trung. */
  example: string
  /** Nghĩa tiếng Việt của câu ví dụ. */
  exampleMeaning: string
}

/** Một bài học: gồm một nhóm từ vựng và phần luyện tập đi kèm. */
export interface Lesson {
  id: string
  title: string
  description: string
  wordIds: string[]
}

/** Một chủ đề, gom nhiều bài học. */
export interface Unit {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

/** Một khoá học, ví dụ HSK 1. */
export interface Course {
  id: string
  title: string
  description: string
  units: Unit[]
}

/** Bốn dạng bài tập của Version 2. */
export type ExerciseKind = 'multiple-choice' | 'matching' | 'listening' | 'pinyin'

/** Một lựa chọn trong bài tập trắc nghiệm. */
export interface Choice {
  id: string
  label: string
}

/** Bài tập chọn một đáp án đúng: trắc nghiệm nghĩa, nghe, hoặc chọn pinyin. */
export interface ChoiceExercise {
  id: string
  kind: Extract<ExerciseKind, 'multiple-choice' | 'listening' | 'pinyin'>
  /** Từ vựng được hỏi. */
  wordId: string
  prompt: string
  choices: Choice[]
  correctChoiceId: string
}

/** Bài tập ghép Hanzi với nghĩa. */
export interface MatchingExercise {
  id: string
  kind: Extract<ExerciseKind, 'matching'>
  prompt: string
  left: Choice[]
  right: Choice[]
  /** leftId -> rightId */
  answerKey: Record<string, string>
}

export type Exercise = ChoiceExercise | MatchingExercise

/** Trạng thái ghi nhớ của một từ, dùng cho flashcard. */
export interface WordProgress {
  wordId: string
  /** Số lần người học bấm "Đã nhớ". */
  known: number
  /** Số lần người học bấm "Chưa nhớ". */
  unknown: number
  /** Ngày ôn gần nhất, dạng YYYY-MM-DD. */
  lastReviewed: string
}

/** Thành tích đã mở khoá. */
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
}

/** Toàn bộ tiến độ của người học. Đây là dữ liệu được lưu lại giữa các phiên. */
export interface UserProgress {
  name: string
  xp: number
  /** XP kiếm được trong ngày `lastActiveDate`. */
  xpToday: number
  dailyGoal: number
  streak: number
  /** Ngày học gần nhất, dạng YYYY-MM-DD. Rỗng nghĩa là chưa học buổi nào. */
  lastActiveDate: string
  /** Ngày gần nhất hoàn thành daily goal, dạng YYYY-MM-DD. Rỗng nghĩa là chưa đạt buổi nào. */
  lastGoalDate: string
  completedLessonIds: string[]
  words: Record<string, WordProgress>
  unlockedAchievementIds: string[]
}
