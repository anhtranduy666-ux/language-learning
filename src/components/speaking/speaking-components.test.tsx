import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MIC_PROBLEMS, PRAISE, REJECTIONS, TIPS, sandhiNote } from '../../data/pronunciationTips'
import type { Attempt, SyllableResult } from '../../lib/pronunciation'
import { MicButton } from './MicButton'
import { PitchSketch, TONE_LEVELS, sketchPoints } from './PitchSketch'
import { SpeakingResult } from './SpeakingResult'

function syllable(overrides: Partial<SyllableResult>): SyllableResult {
  return { token: 'ni3', display: 'nǐ', expectedTone: 2, score: 90, problem: null, contourSt: [0, 1, 2, 3], ...overrides }
}

function attempt(overrides: Partial<Attempt>): Attempt {
  return {
    rejected: null,
    total: 92,
    tone: 95,
    rhythm: 100,
    syllables: [syllable({}), syllable({ token: 'hao3', display: 'hǎo', expectedTone: 3, score: 88 })],
    weakest: 1,
    problem: null,
    medianHz: 200,
    ...overrides,
  }
}

describe('MicButton', () => {
  it('đổi nhãn theo trạng thái, để trình đọc màn hình biết đang làm gì', () => {
    const { rerender } = render(<MicButton status="idle" level={0} onPress={() => {}} />)
    expect(screen.getByRole('button', { name: 'Bấm để đọc' })).toBeEnabled()

    rerender(<MicButton status="recording" level={0.5} onPress={() => {}} />)
    const recording = screen.getByRole('button', { name: 'Dừng ghi âm' })
    expect(recording).toHaveAttribute('aria-pressed', 'true')
    expect(recording.style.getPropertyValue('--level')).toBe('0.5')

    rerender(<MicButton status="scoring" level={0} onPress={() => {}} />)
    expect(screen.getByRole('button', { name: 'Đang chấm' })).toBeDisabled()
  })

  it('bấm thì gọi onPress', async () => {
    const onPress = vi.fn()
    render(<MicButton status="idle" level={0} onPress={onPress} />)
    await userEvent.setup().click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledOnce()
  })
})

describe('PitchSketch', () => {
  it('vẽ thanh mẫu bằng nét đứt và giọng của người học bằng nét liền', () => {
    const { container } = render(<PitchSketch contourSt={[2, 1, 0, -1, -2]} tone={4} score={90} />)
    expect(container.querySelector('[data-line="target"]')).not.toBeNull()
    const mine = container.querySelector('[data-line="mine"]')!
    expect(mine.getAttribute('class')).toMatch(/emerald/)
  })

  it('màu nét theo điểm: đạt xanh, gần đạt vàng, trượt đỏ', () => {
    const color = (score: number) =>
      render(<PitchSketch contourSt={[0, 1, 2]} tone={2} score={score} />)
        .container.querySelector('[data-line="mine"]')!
        .getAttribute('class')
    expect(color(85)).toMatch(/emerald/)
    expect(color(65)).toMatch(/amber/)
    expect(color(20)).toMatch(/rose/)
  })

  it('so dáng chứ không so giọng cao trầm: dời đường của người học về cùng mặt bằng với thanh mẫu', () => {
    const low = sketchPoints([-10, -10, -10], 1)
    const high = sketchPoints([10, 10, 10], 1)
    expect(low).toEqual(high)
  })

  it('giọng đi xuống thì nét vẽ đi xuống (toạ độ dọc tăng)', () => {
    const points = sketchPoints([3, 0, -3, -6], 4)
    expect(points[points.length - 1][1]).toBeGreaterThan(points[0][1])
  })

  it('thanh nhẹ không có hình mẫu nên không vẽ', () => {
    const { container } = render(<PitchSketch contourSt={[0, 1]} tone={0} score={null} />)
    expect(container.querySelector('svg')).toBeNull()
    expect(TONE_LEVELS[3]).toEqual([2, 1, 4])
  })
})

describe('SpeakingResult', () => {
  it('dải chữ to trước, con số nhỏ sau', () => {
    render(<SpeakingResult attempt={attempt({ total: 92 })} />)
    const result = screen.getByRole('region', { name: 'Kết quả' })
    expect(within(result).getByText('Tuyệt vời!')).toBeInTheDocument()
    expect(within(result).getByText('92/100 điểm')).toBeInTheDocument()
  })

  it('mỗi âm tiết một ô kèm điểm; thanh nhẹ ghi rõ là không chấm', () => {
    render(
      <SpeakingResult
        attempt={attempt({
          syllables: [
            syllable({ token: 'xie4', display: 'xiè', expectedTone: 4, score: 88 }),
            syllable({ token: 'xie5', display: 'xie', expectedTone: 0, score: null, contourSt: [] }),
          ],
          weakest: 0,
        })}
      />,
    )
    const list = screen.getByRole('list', { name: 'Điểm từng âm tiết' })
    expect(within(list).getByText('xiè')).toBeInTheDocument()
    expect(within(list).getByText('88 điểm')).toBeInTheDocument()
    expect(within(list).getByText('thanh nhẹ')).toBeInTheDocument()
  })

  it('không có gì phải sửa thì Zibi khen', () => {
    render(<SpeakingResult attempt={attempt({ problem: null })} />)
    expect(screen.getByRole('status')).toHaveTextContent(PRAISE)
  })

  it('sai thanh thì Zibi nói rõ âm nào và sửa thế nào — đúng một lời', () => {
    render(
      <SpeakingResult
        attempt={attempt({
          total: 55,
          syllables: [syllable({ token: 'ren2', display: 'rén', score: 20, problem: 'no-rise' })],
          weakest: 0,
          problem: 'no-rise',
        })}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(`Âm “rén”: ${TIPS['no-rise']}`)
  })

  it('âm bị biến điệu thì Zibi nói lý do trước, kẻo chữ ghi thanh 3 mà lời nhắc nói thanh 2', () => {
    render(
      <SpeakingResult
        attempt={attempt({
          total: 69,
          syllables: [syllable({ score: 18, problem: 'no-rise' }), syllable({ token: 'hao3', display: 'hǎo', expectedTone: 3, score: 100 })],
          weakest: 0,
          problem: 'no-rise',
        })}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(`${sandhiNote('nǐ')} ${TIPS['no-rise']}`)
  })

  it('âm trong chuỗi ba thanh 3 ghi là không chấm, không gọi nhầm là thanh nhẹ', () => {
    render(
      <SpeakingResult
        attempt={attempt({
          syllables: [
            syllable({ token: 'wo3', display: 'wǒ', expectedTone: 0, score: null, contourSt: [] }),
            syllable({ token: 'hen3', display: 'hěn', expectedTone: 0, score: null, contourSt: [] }),
            syllable({ token: 'hao3', display: 'hǎo', expectedTone: 3, score: 90 }),
          ],
          weakest: 2,
        })}
      />,
    )
    const list = screen.getByRole('list', { name: 'Điểm từng âm tiết' })
    expect(within(list).getAllByText('không chấm')).toHaveLength(2)
    expect(within(list).queryByText('thanh nhẹ')).not.toBeInTheDocument()
  })

  it('lời khuyên về nhịp là cho cả từ, không gắn vào âm nào', () => {
    render(<SpeakingResult attempt={attempt({ problem: 'too-slow', weakest: 0 })} />)
    expect(screen.getByRole('status')).toHaveTextContent(TIPS['too-slow'])
    expect(screen.getByRole('status')).not.toHaveTextContent('Âm “')
  })

  it('bị từ chối chấm thì chỉ có lời mời đọc lại, không có điểm', () => {
    render(<SpeakingResult attempt={attempt({ rejected: 'too-noisy', total: null })} />)
    expect(screen.getByRole('status')).toHaveTextContent(REJECTIONS['too-noisy'])
    expect(screen.queryByRole('region', { name: 'Kết quả' })).not.toBeInTheDocument()
  })

  it('có bản thu thì cho nghe lại giọng mình', async () => {
    const onReplay = vi.fn()
    render(<SpeakingResult attempt={attempt({})} onReplay={onReplay} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Nghe lại giọng mình/ }))
    expect(onReplay).toHaveBeenCalledOnce()
    expect(MIC_PROBLEMS.denied).toBeTruthy()
  })
})
