/**
 * Lời Zibi nói sau mỗi lần chấm phát âm.
 *
 * Tra bảng, không sinh tự do: mỗi chỗ sai đo được ứng với đúng một lời khuyên,
 * viết cho người Việt học tiếng Trung. Mỗi lượt chấm chỉ đưa **một** lời — của
 * chỗ yếu nhất. Đổ ba bốn lời khuyên một lúc thì người học không sửa cái nào.
 *
 * Xem `docs/pronunciation-mvp.md` mục 9.
 */

import type { MicFailure } from '../lib/recorder'

/** Chỗ sai của một lượt đọc — dùng để chọn lời khuyên. */
export type AttemptProblem =
  | 'no-fall'
  | 'no-rise'
  | 'no-dip'
  | 'not-level'
  | 'too-low'
  | 'too-fast'
  | 'too-slow'

/** Lý do không chấm một bản thu. */
export type Rejection = 'too-quiet' | 'too-noisy' | 'too-short' | 'too-long'

export const TIPS: Record<AttemptProblem, string> = {
  'no-fall': 'Thanh 4 đổ dốc từ cao xuống thấp, dứt khoát như khi bạn nói “Dạ!”.',
  'no-rise': 'Thanh 2 đi lên như đang hỏi lại: “Hả?”.',
  'no-dip': 'Thanh 3 xuống thấp rồi mới lên. Đừng đọc bằng như thanh ngang.',
  'not-level': 'Thanh 1 giữ một mực, cao và đều, như đang ngân một nốt nhạc.',
  'too-low': 'Thanh 1 phải cao — cao hơn giọng nói thường của bạn một chút, rồi giữ nguyên.',
  'too-fast': 'Chậm lại một chút, đọc rõ từng âm tiết.',
  'too-slow': 'Đọc liền hơi, đừng tách rời từng chữ.',
}

/**
 * Thanh 3 đứng ngay trước một thanh 3 khác thì đọc thành thanh 2, nhưng chữ vẫn
 * ghi dấu thanh 3: `nǐ hǎo` đọc là `ní hǎo`. Người mới nhìn dấu ˇ mà bị nhắc
 * "thanh 2" sẽ tưởng máy chấm nhầm, nên nói lý do trước lời khuyên.
 */
export function sandhiNote(syllable: string): string {
  return `Âm “${syllable}” đứng trước một thanh 3 nên đọc thành thanh 2.`
}

/** Zibi mời đọc lại — một điểm số sai thấp còn tệ hơn không có điểm. */
export const REJECTIONS: Record<Rejection, string> = {
  'too-quiet': 'Mình chưa nghe rõ. Bạn đọc to hơn một chút, hoặc đưa máy lại gần miệng nhé.',
  'too-noisy': 'Xung quanh hơi ồn nên mình không chấm chắc được. Thử chỗ yên hơn nhé.',
  'too-short': 'Hơi ngắn quá — bạn đọc trọn cả từ, rõ từng âm tiết nhé.',
  'too-long': 'Dài quá so với một từ — bạn chỉ cần đọc đúng từ này thôi nhé.',
}

/** Khi không có gì phải sửa. */
export const PRAISE = 'Chuẩn rồi! Thanh điệu và nhịp đều ổn.'

/**
 * Khi không mở được micro. Nói rõ cách gỡ, chứ không để người học nhìn một nút
 * bấm mãi không ăn.
 */
export const MIC_PROBLEMS: Record<MicFailure, string> = {
  denied:
    'Micro đang bị chặn. Bấm vào biểu tượng ổ khoá cạnh địa chỉ trang, cho phép Micro rồi thử lại. Trên iPhone: Cài đặt → Safari → Micro.',
  insecure: 'Trang phải mở qua https thì trình duyệt mới cho dùng micro.',
  unsupported: 'Trình duyệt này chưa thu âm được. Hãy mở bằng Chrome hoặc Safari bản mới.',
  'no-device': 'Không tìm thấy micro nào trên máy này.',
  busy: 'Micro đang bị ứng dụng khác dùng. Tắt ứng dụng đó rồi thử lại nhé.',
  error: 'Chưa mở được micro. Bạn thử lại nhé.',
}

/** Nói trước khi xin quyền micro — vừa đúng, vừa là lý do tốt để người ta bấm đồng ý. */
export const PRIVACY_NOTE =
  'Mình chấm ngay trên máy của bạn: tiếng của bạn không gửi đi đâu và không được lưu lại.'

/**
 * Dải điểm hiện bằng chữ, to hơn con số. Bộ chấm này nhiễu vài điểm; hiện con số
 * to giữa màn hình là mời người ta soi đúng chỗ ta yếu nhất.
 */
export const BANDS = [
  { min: 90, label: 'Tuyệt vời!' },
  { min: 75, label: 'Khá rồi!' },
  { min: 60, label: 'Gần được rồi' },
  { min: 0, label: 'Luyện thêm chút nữa' },
] as const

/** Dòng chữ cho một điểm tổng. */
export function bandLabel(total: number): string {
  return BANDS.find((band) => total >= band.min)!.label
}
