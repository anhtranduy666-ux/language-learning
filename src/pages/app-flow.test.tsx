import { cleanup, screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { WORDS, wordsOfLesson } from '../data/hsk1'
import {
  buildExercises,
  createRng,
  isChoiceExercise,
  seedFromText,
} from '../lib/exercises'
import { XP_REWARDS } from '../lib/gamification'
import { ONBOARDED, renderApp } from '../test/renderApp'

/**
 * Bỏ qua 60 file mp3 có sẵn trong repo, để test được đúng cảnh máy không phát
 * âm được — cảnh mà giao diện phải nói rõ cho người học thay vì im lặng.
 */
vi.mock('../lib/audioFiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/audioFiles')>()
  return { ...actual, hasRecordedAudio: () => false, audioUrlForWord: () => null }
})


const LESSON_ID = 'u1l1'
const LESSON_WORDS = wordsOfLesson(LESSON_ID)

/** Bộ câu hỏi mà màn hình bài tập sẽ sinh ra — dựng lại y hệt để biết đáp án đúng. */
const EXERCISES = buildExercises(LESSON_WORDS, WORDS, createRng(seedFromText(LESSON_ID)))

/** Vị trí câu nghe đầu tiên — phần audio của Version 2 được kiểm ở đây. */
const LISTENING_INDEX = EXERCISES.findIndex((exercise) => exercise.kind === 'listening')

/** Đọc con số trên một thẻ chỉ số của màn hình Tiến độ. */
function metric(label: string): string {
  const card = screen.getByRole('group', { name: label })
  return within(card).getByText(/^[\d/]+$/).textContent ?? ''
}

/** Lật và đánh giá hết số thẻ của bài học. */
async function reviewAllFlashcards(user: UserEvent, known = true) {
  for (let i = 0; i < LESSON_WORDS.length; i += 1) {
    await user.click(screen.getByRole('button', { name: 'Lật thẻ' }))
    await user.click(screen.getByRole('button', { name: known ? 'Đã nhớ' : 'Chưa nhớ' }))
  }
}

/** Làm hết bài tập, luôn chọn đáp án đúng. */
async function answerAllExercises(user: UserEvent) {
  await answerExercises(user, EXERCISES)
}

/** Làm một dãy bài tập cho trước, luôn chọn đáp án đúng. */
async function answerExercises(user: UserEvent, list: typeof EXERCISES) {
  for (const exercise of list) {
    if (isChoiceExercise(exercise)) {
      const correct = exercise.choices.find((c) => c.id === exercise.correctChoiceId)!
      await user.click(screen.getByRole('button', { name: correct.label }))
    } else {
      for (const [leftId, rightId] of Object.entries(exercise.answerKey)) {
        const left = exercise.left.find((c) => c.id === leftId)!
        const right = exercise.right.find((c) => c.id === rightId)!
        await user.click(screen.getByRole('button', { name: left.label }))
        await user.click(screen.getByRole('button', { name: right.label }))
      }
    }

    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(screen.getByRole('button', { name: /Tiếp tục|Xem kết quả/ }))
  }
}

describe('Màn hình chào', () => {
  it('người chưa khai tên bị đưa về màn hình chào', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /Học tiếng Trung từ con số 0/ })).toBeInTheDocument()
  })

  it('chưa nhập tên thì chưa cho bắt đầu', () => {
    renderApp('/')
    expect(screen.getByRole('button', { name: 'Bắt đầu học' })).toBeDisabled()
  })

  it('nhập tên xong thì vào thẳng trang chủ', async () => {
    const { user } = renderApp('/')

    await user.type(screen.getByLabelText('Gọi bạn là gì nhỉ?'), 'Duy')
    await user.click(screen.getByRole('button', { name: 'Bắt đầu học' }))

    expect(screen.getByRole('heading', { name: 'Duy' })).toBeInTheDocument()
  })

  it('người đã khai tên không phải xem lại màn hình chào', () => {
    renderApp('/', ONBOARDED)
    expect(screen.getByRole('heading', { name: 'Duy' })).toBeInTheDocument()
  })
})

describe('Trang chủ', () => {
  it('gợi ý bài học đầu tiên cho người mới', () => {
    renderApp('/', ONBOARDED)
    expect(screen.getByText('Lời chào cơ bản')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Học tiếp' })).toBeInTheDocument()
  })

  it('cho biết còn bao nhiêu XP nữa là đạt mục tiêu', () => {
    renderApp('/', { ...ONBOARDED, xpToday: 20, dailyGoal: 50 })
    expect(screen.getByText(/Còn 30 XP nữa/)).toBeInTheDocument()
  })

  it('đổi sang lời chúc mừng khi đã đạt mục tiêu', () => {
    renderApp('/', { ...ONBOARDED, xpToday: 60, dailyGoal: 50, streak: 3, lastGoalDate: '' })
    expect(screen.getByText(/Xong mục tiêu hôm nay rồi/)).toBeInTheDocument()
  })

  it('bỏ qua bài đã xong và gợi ý bài kế tiếp', () => {
    renderApp('/', { ...ONBOARDED, completedLessonIds: ['u1l1'] })
    expect(screen.getByText('Nói chuyện lịch sự')).toBeInTheDocument()
  })
})

describe('Màn hình khoá học', () => {
  it('liệt kê đủ 5 unit', () => {
    renderApp('/learn', ONBOARDED)
    expect(screen.getByText('Unit 1 · Chào hỏi')).toBeInTheDocument()
    expect(screen.getByText('Unit 5 · Thời gian')).toBeInTheDocument()
  })

  it('đánh dấu bài tiếp theo cần học', () => {
    renderApp('/learn', ONBOARDED)
    expect(screen.getByText('Tiếp theo')).toBeInTheDocument()
  })

  it('hiển thị tiến độ khoá học', () => {
    renderApp('/learn', { ...ONBOARDED, completedLessonIds: ['u1l1', 'u1l2'] })
    expect(screen.getByText('2/10 bài')).toBeInTheDocument()
  })
})

describe('Màn hình từ vựng', () => {
  it('hiện đủ số từ của bài học', () => {
    renderApp(`/lesson/${LESSON_ID}`, ONBOARDED)
    expect(screen.getByText(/6 từ\./)).toBeInTheDocument()
    for (const word of LESSON_WORDS) {
      expect(screen.getByText(word.meaning)).toBeInTheDocument()
    }
  })

  it('bài học không tồn tại thì quay về danh sách khoá học', () => {
    renderApp('/lesson/không-có-bài-này', ONBOARDED)
    expect(screen.getByText('Tiến độ khoá học')).toBeInTheDocument()
  })
})

describe('Flashcard', () => {
  it('chỉ hiện nút đánh giá sau khi đã lật thẻ', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/flashcards`, ONBOARDED)

    expect(screen.queryByRole('button', { name: 'Đã nhớ' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lật thẻ' }))
    expect(screen.getByRole('button', { name: 'Đã nhớ' })).toBeInTheDocument()
  })

  it('đánh giá xong thì sang thẻ kế tiếp', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/flashcards`, ONBOARDED)

    expect(screen.getByText('Flashcard · 1/6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lật thẻ' }))
    await user.click(screen.getByRole('button', { name: 'Đã nhớ' }))

    expect(screen.getByText('Flashcard · 2/6')).toBeInTheDocument()
  })

  it('thẻ mới luôn bắt đầu ở mặt trước', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/flashcards`, ONBOARDED)

    await user.click(screen.getByRole('button', { name: 'Lật thẻ' }))
    await user.click(screen.getByRole('button', { name: 'Chưa nhớ' }))

    expect(screen.getByTestId('flashcard')).toHaveAttribute('data-flipped', 'false')
  })

  it('đánh giá thẻ cuối thì chuyển sang phần bài tập', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/flashcards`, ONBOARDED)
    await reviewAllFlashcards(user)

    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeInTheDocument()
  })
})

describe('Bài tập', () => {
  it('chưa chọn đáp án thì chưa cho kiểm tra', () => {
    renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled()
  })

  it('báo đúng và cộng XP khi chọn đáp án đúng', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)
    const first = EXERCISES[0]
    if (!isChoiceExercise(first)) throw new Error('Câu đầu tiên phải là dạng chọn đáp án')

    const correct = first.choices.find((c) => c.id === first.correctChoiceId)!
    await user.click(screen.getByRole('button', { name: correct.label }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      `Chính xác! +${XP_REWARDS.correctAnswer} XP`,
    )
  })

  it('báo sai và chỉ ra đáp án đúng khi chọn nhầm', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)
    const first = EXERCISES[0]
    if (!isChoiceExercise(first)) throw new Error('Câu đầu tiên phải là dạng chọn đáp án')

    const wrong = first.choices.find((c) => c.id !== first.correctChoiceId)!
    const correct = first.choices.find((c) => c.id === first.correctChoiceId)!
    await user.click(screen.getByRole('button', { name: wrong.label }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Chưa đúng')
    expect(status).toHaveTextContent(correct.label)
  })

  it('đi tiếp sang câu kế tiếp', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)
    const first = EXERCISES[0]
    if (!isChoiceExercise(first)) throw new Error('Câu đầu tiên phải là dạng chọn đáp án')

    expect(screen.getByText(new RegExp(`1/${EXERCISES.length}`))).toBeInTheDocument()

    const correct = first.choices.find((c) => c.id === first.correctChoiceId)!
    await user.click(screen.getByRole('button', { name: correct.label }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))

    expect(screen.getByText(new RegExp(`2/${EXERCISES.length}`))).toBeInTheDocument()
  })

  it('bộ bài tập có ít nhất một câu nghe', () => {
    expect(LISTENING_INDEX).toBeGreaterThanOrEqual(0)
  })

  it('bài nghe có nút phát âm', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)

    await answerExercises(user, EXERCISES.slice(0, LISTENING_INDEX))

    expect(
      screen.getByRole('button', { name: 'Nghe phát âm từ trong câu hỏi' }),
    ).toBeInTheDocument()
  })

  it('máy không phát được âm thì bài nghe hiện pinyin thay thế', async () => {
    // jsdom không có Web Speech API, đúng bằng tình huống máy thiếu giọng tiếng Trung.
    const { user } = renderApp(`/lesson/${LESSON_ID}/exercise`, ONBOARDED)

    await answerExercises(user, EXERCISES.slice(0, LISTENING_INDEX))

    const listening = EXERCISES[LISTENING_INDEX]
    if (!isChoiceExercise(listening)) throw new Error('Câu này phải là dạng nghe')
    expect(screen.getByText(WORDS.find((w) => w.id === listening.wordId)!.pinyin)).toBeInTheDocument()
  })
})

describe('Kết quả', () => {
  it('vào thẳng trang kết quả mà chưa làm bài thì quay về khoá học', () => {
    renderApp(`/lesson/${LESSON_ID}/result`, ONBOARDED)
    expect(screen.getByText('Tiến độ khoá học')).toBeInTheDocument()
  })
})

describe('Trọn vẹn một buổi học — tiêu chí nghiệm thu của Version 2', () => {
  it('học từ mới, luyện thẻ, làm bài tập, nhận XP, lên streak và thấy tiến độ', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}`, ONBOARDED)

    // Xem từ mới rồi chuyển sang flashcard.
    await user.click(screen.getByRole('button', { name: 'Luyện flashcard' }))
    await reviewAllFlashcards(user)

    // Làm đúng toàn bộ bài tập.
    await answerAllExercises(user)

    // Màn hình kết quả.
    expect(screen.getByRole('heading', { name: 'Hoàn hảo!' })).toBeInTheDocument()
    expect(screen.getByText(`${EXERCISES.length}/${EXERCISES.length} câu đúng`)).toBeInTheDocument()
    expect(screen.getByText(/đã đạt mục tiêu/)).toBeInTheDocument()

    // Thành tích đầu tiên được mở khoá, và chỉ được liệt kê đúng một lần.
    const achievements = screen.getByRole('heading', { name: 'Thành tích mới' }).parentElement!
    expect(within(achievements).getByText('First Lesson')).toBeInTheDocument()
    expect(within(achievements).getAllByRole('listitem')).toHaveLength(
      new Set(
        within(achievements)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).size,
    )

    // Người học được mời đi tiếp sang bài kế tiếp.
    expect(screen.getByRole('button', { name: 'Học bài tiếp theo' })).toBeInTheDocument()

    // Tiến độ đã được ghi nhận.
    await user.click(screen.getByRole('button', { name: 'Về trang chủ' }))
    await user.click(screen.getByRole('link', { name: /Tiến độ/ }))
    expect(metric('từ đã nhớ')).toBe('6')
    expect(metric('bài đã xong')).toBe('1/10')
    expect(metric('ngày streak')).toBe('1')
  })

  it('tiến độ còn nguyên sau khi tải lại ứng dụng', async () => {
    const { user, unmount } = renderApp(`/lesson/${LESSON_ID}/flashcards`, ONBOARDED)
    await reviewAllFlashcards(user)
    unmount()

    renderApp('/progress')
    expect(metric('tổng XP')).toBe('30') // 6 thẻ × 5 XP
    expect(metric('từ đã nhớ')).toBe('6')
  })
})

describe('Cá nhân', () => {
  it('đổi được mục tiêu hằng ngày', async () => {
    const { user } = renderApp('/profile', ONBOARDED)

    await user.click(screen.getByRole('button', { name: /Nghiêm túc/ }))
    expect(screen.getByRole('button', { name: /Nghiêm túc/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('hỏi lại trước khi xoá sạch tiến độ', async () => {
    const { user } = renderApp('/profile', { ...ONBOARDED, xp: 420 })

    await user.click(screen.getByRole('button', { name: 'Xoá tiến độ học' }))
    expect(screen.getByText(/Xoá toàn bộ XP, streak và lịch sử học\?/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Giữ lại' }))
    expect(screen.getByText(/Level 3/)).toBeInTheDocument()
  })

  it('xoá xong thì quay về màn hình chào', async () => {
    const { user } = renderApp('/profile', { ...ONBOARDED, xp: 420 })

    await user.click(screen.getByRole('button', { name: 'Xoá tiến độ học' }))
    await user.click(screen.getByRole('button', { name: 'Xoá hết' }))

    expect(screen.getByRole('heading', { name: /Học tiếng Trung từ con số 0/ })).toBeInTheDocument()
  })
})

describe('Chế độ sáng/tối', () => {
  const theme = () => document.documentElement.getAttribute('data-theme')

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  it('đổi giao diện ngay khi chọn ở màn hình Cá nhân', async () => {
    const { user } = renderApp('/profile', ONBOARDED)

    await user.click(screen.getByRole('button', { name: /Tối/ }))

    expect(theme()).toBe('dark')
    expect(screen.getByRole('button', { name: /Tối/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('giữ nguyên chế độ đã chọn ở lần mở sau', async () => {
    const first = renderApp('/profile', ONBOARDED)
    await first.user.click(screen.getByRole('button', { name: /Tối/ }))

    // Dựng lại từ đầu như một lần mở app mới: gỡ luôn thuộc tính trên thẻ html
    // để phép kiểm dưới đây chỉ đạt khi lựa chọn thật sự được đọc lại từ máy.
    cleanup()
    document.documentElement.removeAttribute('data-theme')

    renderApp('/profile', ONBOARDED)

    expect(theme()).toBe('dark')
    expect(screen.getByRole('button', { name: /Tối/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('xoá tiến độ học không đụng tới chế độ hiển thị', async () => {
    const { user } = renderApp('/profile', { ...ONBOARDED, xp: 420 })

    await user.click(screen.getByRole('button', { name: /Tối/ }))
    await user.click(screen.getByRole('button', { name: 'Xoá tiến độ học' }))
    await user.click(screen.getByRole('button', { name: 'Xoá hết' }))

    expect(screen.getByRole('heading', { name: /Học tiếng Trung từ con số 0/ })).toBeInTheDocument()
    expect(theme()).toBe('dark')
  })
})

describe('Mời cài lên màn hình chính', () => {
  const IPHONE_SAFARI =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

  /** Giả lập máy đang mở app. */
  function usePlatform(userAgent: string, standalone = false) {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints: 5, standalone })
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('chỉ đường cho người dùng iPhone, vì Safari không tự mời cài', () => {
    usePlatform(IPHONE_SAFARI)
    renderApp('/profile', ONBOARDED)

    expect(screen.getByRole('heading', { name: 'Cài vào màn hình chính' })).toBeInTheDocument()
    expect(screen.getByText(/Thêm vào MH chính/)).toBeInTheDocument()
  })

  it('thôi nhắc khi app đã được cài', () => {
    usePlatform(IPHONE_SAFARI, true)
    renderApp('/profile', ONBOARDED)

    expect(screen.queryByRole('heading', { name: 'Cài vào màn hình chính' })).not.toBeInTheDocument()
  })

  it('không làm phiền người dùng máy tính', () => {
    usePlatform(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    )
    renderApp('/profile', ONBOARDED)

    expect(screen.queryByRole('heading', { name: 'Cài vào màn hình chính' })).not.toBeInTheDocument()
  })
})
