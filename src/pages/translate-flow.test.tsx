import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WORD_BY_ID } from '../data/hsk1'
import { clearTranslationCache } from '../lib/translate'
import { ONBOARDED, renderApp } from '../test/renderApp'

/** Ghi lại mọi lần phát âm thay vì phát thật — jsdom không có loa. */
const speech = vi.hoisted(() => ({ played: [] as Array<{ text: string; wordId?: string; clipUrl?: string | null }> }))

vi.mock('../lib/speech', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/speech')>()
  return {
    ...actual,
    playWord: vi.fn(async (input: { text: string; wordId?: string; clipUrl?: string | null }) => {
      speech.played.push(input)
      return 'played' as const
    }),
  }
})

const fetchMock = vi.fn()

function googleSays(hanzi: string, pinyin: string) {
  fetchMock.mockImplementation(
    async () => new Response(JSON.stringify([[[hanzi, 'câu gốc'], [null, null, pinyin]]]), { status: 200 }),
  )
}

beforeEach(() => {
  speech.played = []
  fetchMock.mockReset()
  clearTranslationCache()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

const input = () => screen.getByLabelText('Tiếng Việt')
const translateButton = () => screen.getByRole('button', { name: /Dịch sang tiếng Trung|Đang dịch/ })

describe('Màn Dịch', () => {
  it('thanh điều hướng có mục Dịch, bấm vào là tới màn Dịch', async () => {
    const { user } = renderApp('/', ONBOARDED)
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })

    await user.click(within(nav).getByRole('link', { name: 'Dịch' }))

    expect(screen.getByRole('heading', { name: 'Dịch' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Dịch' })).toHaveAttribute('aria-current', 'page')
  })

  it('ô trống thì chưa cho bấm dịch', () => {
    renderApp('/translate', ONBOARDED)
    expect(translateButton()).toBeDisabled()
  })

  it('từ có trong bài học thì ra ngay, không gọi mạng, và tự đọc bằng file thu sẵn', async () => {
    const { user } = renderApp('/translate', ONBOARDED)
    await user.type(input(), 'Xin chào')
    await user.click(translateButton())

    const card = await screen.findByRole('region', { name: 'Bản dịch' })
    expect(card).toHaveTextContent('你好')
    expect(card).toHaveTextContent('nǐ hǎo')
    expect(card).toHaveTextContent('Có trong bài học')
    expect(fetchMock).not.toHaveBeenCalled()

    expect(speech.played).toHaveLength(1)
    expect(speech.played[0].text).toBe('你好')
    expect(WORD_BY_ID[speech.played[0].wordId!].hanzi).toBe('你好')
  })

  it('câu ngoài bài học thì hỏi Google Dịch: ra chữ Hán, pinyin, tự đọc, và có nút nghe lại', async () => {
    googleSays('我想去银行', 'Wǒ xiǎng qù yínháng')
    const { user } = renderApp('/translate', ONBOARDED)
    // Enter là dịch, không cần với tới nút.
    await user.type(input(), 'tôi muốn đi ngân hàng{Enter}')

    const card = await screen.findByRole('region', { name: 'Bản dịch' })
    expect(card).toHaveTextContent('我想去银行')
    expect(card).toHaveTextContent('Wǒ xiǎng qù yínháng')
    expect(card).toHaveTextContent('Dịch bởi Google Dịch')
    expect(speech.played.map((entry) => entry.text)).toEqual(['我想去银行'])

    await user.click(within(card).getByRole('button', { name: 'Nghe phát âm 我想去银行' }))
    expect(speech.played).toHaveLength(2)
  })

  it('bấm một gợi ý là dịch luôn', async () => {
    const { user } = renderApp('/translate', ONBOARDED)
    await user.click(screen.getByRole('button', { name: 'cảm ơn' }))

    expect(await screen.findByRole('region', { name: 'Bản dịch' })).toHaveTextContent('谢谢')
    expect(input()).toHaveValue('cảm ơn')
  })

  it('một nghĩa ứng với nhiều từ trong bài học thì hiện cả, từ nào cũng nghe được', async () => {
    const { user } = renderApp('/translate', ONBOARDED)
    await user.type(input(), 'năm{Enter}')

    const card = await screen.findByRole('region', { name: 'Bản dịch' })
    expect(card).toHaveTextContent('五')
    expect(card).toHaveTextContent('Cũng mang nghĩa này trong bài học')
    expect(within(card).getByRole('button', { name: 'Nghe phát âm 年' })).toBeInTheDocument()
  })

  it('Google từ chối thì Zibi nói rõ vì sao, không để màn hình trống trơn', async () => {
    fetchMock.mockImplementation(async () => new Response('Sorry', { status: 429 }))
    const { user } = renderApp('/translate', ONBOARDED)
    await user.type(input(), 'con mèo{Enter}')

    expect(await screen.findByRole('status')).toHaveTextContent('Google Dịch đang tạm từ chối')
    expect(screen.queryByRole('region', { name: 'Bản dịch' })).not.toBeInTheDocument()
    expect(speech.played).toHaveLength(0)
  })

  it('nói rõ chữ nào được gửi đi đâu', () => {
    renderApp('/translate', ONBOARDED)
    expect(screen.getByText(/được tra ngay trên máy/)).toHaveTextContent('Google Dịch')
  })
})
