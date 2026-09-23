/**
 * In danh sách từ vựng ra JSON, để script Python đọc được.
 *
 * Nội dung khoá học chỉ có một nguồn duy nhất là `src/data/hsk1.ts`. Thà chạy
 * thêm một tiến trình Node còn hơn để Python tự bóc file TypeScript bằng regex
 * rồi lệch với bản thật lúc nào không biết.
 */

import { WORDS } from '../src/data/hsk1.ts'

process.stdout.write(JSON.stringify(WORDS.map((word) => ({ id: word.id, hanzi: word.hanzi }))))
