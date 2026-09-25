import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MIC_PROBLEMS, PRIVACY_NOTE, REJECTIONS } from '../data/pronunciationTips'
import { wordsOfLesson } from '../data/hsk1'
import { XP_REWARDS } from '../lib/gamification'
import { MicError } from '../lib/recorder'
import { loadProgress } from '../lib/storage'
import { ONBOARDED, renderApp } from '../test/renderApp'
import { RATE, silence, spokenWord } from '../test/synthVoice'

/**
 * jsdom không có micro. Thay `startRecording` bằng một máy thu giả trả về
 * "giọng" dựng sẵn — mọi phần còn lại, kể cả bộ chấm, là mã thật.
 */
const mic = vi.hoisted(() => ({ next: null as unknown }))

vi.mock('../lib/recorder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/recorder')>()
  return {
    ...actual,
    micSupport: () => 'ok',
    startRecording: vi.fn(async () => {
      if (mic.next instanceof Error) throw mic.next
      const recording = mic.next as { samples: Float32Array; rate: number }
      return { stop: async () => recording, cancel: () => {} }
    }),
  }
})

// Bản mẫu mp3 không giải mã được trong jsdom; độ dài của nó thì biết trước.
vi.mock('../lib/referenceAudio', () => ({ referenceSeconds: async () => 0.7 }))

const LESSON_ID = 'u1l1'
const WORDS = wordsOfLesson(LESSON_ID)

beforeEach(() => {
  mic.next = { samples: spokenWord([2, 3], 180), rate: RATE }
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:ban-thu'), revokeObjectURL: vi.fn() }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Bấm micro, rồi bấm lần nữa để dừng, chờ tới khi chấm xong. */
async function readAloud(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Bấm để đọc' }))
  await user.click(await screen.findByRole('button', { name: 'Dừng ghi âm' }))
  await screen.findByRole('button', { name: 'Bấm để đọc' })
}

describe('Màn luyện nói', () => {
  it('hiện từ đầu tiên của bài, nút micro, và nói rõ tiếng không rời khỏi máy', () => {
    renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)

    expect(screen.getByText(`Luyện nói · 1/${WORDS.length}`)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Từ cần đọc' })).toHaveTextContent(WORDS[0].hanzi)
    expect(screen.getByRole('button', { name: 'Bấm để đọc' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(PRIVACY_NOTE.slice(0, 30)))).toBeInTheDocument()
  })

  it('đọc đúng thì hiện điểm từng âm tiết', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)
    await readAloud(user)

    const result = screen.getByRole('region', { name: 'Kết quả' })
    expect(within(result).getByText(/\/100 điểm/)).toBeInTheDocument()
    const syllables = within(result).getByRole('list', { name: 'Điểm từng âm tiết' })
    expect(within(syllables).getByText('nǐ')).toBeInTheDocument()
    expect(within(syllables).getByText('hǎo')).toBeInTheDocument()
  })

  it('cộng XP cho việc có luyện — một lần mỗi từ, đọc lại không cộng thêm', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)

    await readAloud(user)
    await waitFor(() => expect(loadProgress().xp).toBe(XP_REWARDS.speaking))

    await readAloud(user)
    expect(loadProgress().xp).toBe(XP_REWARDS.speaking)
  })

  it('không nghe rõ thì Zibi mời đọc lại, không chấm và không cộng XP', async () => {
    mic.next = { samples: silence(1.5, 0.001), rate: RATE }
    const { user } = renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)
    await readAloud(user)

    expect(screen.getByRole('status')).toHaveTextContent(REJECTIONS['too-quiet'])
    expect(screen.queryByRole('region', { name: 'Kết quả' })).not.toBeInTheDocument()
    expect(loadProgress().xp).toBe(0)
  })

  it('bị chặn micro thì chỉ cách mở, bấm Thử lại thì nút micro quay lại', async () => {
    mic.next = new MicError('denied')
    const { user } = renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)

    await user.click(screen.getByRole('button', { name: 'Bấm để đọc' }))
    expect(await screen.findByText(MIC_PROBLEMS.denied)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(screen.getByRole('button', { name: 'Bấm để đọc' })).toBeInTheDocument()
  })

  it('đi hết các từ của bài rồi quay về màn từ mới', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}/speaking`, ONBOARDED)

    for (let i = 1; i < WORDS.length; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Bỏ qua từ này' }))
      expect(screen.getByRole('region', { name: 'Từ cần đọc' })).toHaveTextContent(WORDS[i].hanzi)
    }
    await user.click(screen.getByRole('button', { name: 'Xong' }))
    expect(screen.getByRole('heading', { name: 'Từ mới' })).toBeInTheDocument()
  })

  it('màn từ mới có lối vào luyện nói', async () => {
    const { user } = renderApp(`/lesson/${LESSON_ID}`, ONBOARDED)
    await user.click(screen.getByRole('button', { name: /Luyện nói/ }))
    expect(screen.getByText(`Luyện nói · 1/${WORDS.length}`)).toBeInTheDocument()
  })

  it('bài học không tồn tại thì quay về danh sách khoá học', () => {
    renderApp('/lesson/khong-co-bai-nay/speaking', ONBOARDED)
    expect(screen.getByText('Tiến độ khoá học')).toBeInTheDocument()
  })
})
