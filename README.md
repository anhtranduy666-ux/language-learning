# Chinese Learning App

Ứng dụng học tiếng Trung cho người mới bắt đầu, xây theo [product_design.md](product_design.md).

Bản hiện tại là **Phase 1 — UI**: toàn bộ vòng học cốt lõi của Version 2 đã chạy được với dữ liệu HSK 1 lưu ngay trong mã nguồn.

```
Đăng ký → Home → Lesson → Từ vựng → Flashcard → Bài tập → Kết quả → XP/Streak → Tiến độ
```

## Chạy dự án

```bash
npm install
npm run dev
```

| Lệnh | Việc nó làm |
| --- | --- |
| `npm run dev` | Chạy dev server tại http://localhost:5173 |
| `npm test` | Chạy toàn bộ test một lượt |
| `npm run test:watch` | Chạy test ở chế độ theo dõi |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run build` | Build bản production vào `dist/` |

Yêu cầu Node.js 20 trở lên.

## Đã có trong bản này

- **Nội dung**: khoá HSK 1 với 5 unit, 10 bài học, 60 từ. Mỗi từ có Hanzi, pinyin, nghĩa và câu ví dụ.
- **Màn hình**: Landing, Home, Course, Lesson, Flashcard, Exercise, Result, Progress, Profile.
- **Bài tập**: đủ 4 dạng của Version 2 — trắc nghiệm, ghép nối, nghe, chọn pinyin.
- **Gamification**: XP, level, daily goal, streak và 9 thành tích.
- **Lưu trữ**: tiến độ nằm trong `localStorage`, tự khôi phục khi mở lại.

## Chưa có

- Authentication và Supabase (Phase 2–3). Hiện chỉ hỏi tên và lưu ở máy.
- File audio thu sẵn. Phát âm đang dùng Web Speech API của trình duyệt; khi có audio thật chỉ cần sửa `src/lib/speech.ts`.
- Spaced repetition cho flashcard. Bản này mới có hai mức "Chưa nhớ" / "Đã nhớ".
- Toàn bộ phần AI ở Phase 8.

## Cấu trúc mã nguồn

```
src/
├── components/      Component dùng lại: Flashcard, BottomNav, AudioButton, ui/
├── pages/           Mỗi màn hình một file
├── context/         ProgressContext — tiến độ người học
├── lib/             Logic thuần, không phụ thuộc React
│   ├── gamification.ts   XP, level, streak, thành tích
│   ├── progress.ts       Các phép biến đổi tiến độ
│   ├── exercises.ts      Sinh và chấm bài tập
│   ├── course.ts         Điều hướng trong khoá học
│   └── storage.ts        Đọc/ghi localStorage
├── data/hsk1.ts     Nội dung khoá học
└── types/           Kiểu dữ liệu dùng chung
```

Quy tắc: mọi luật chơi nằm trong `src/lib` dưới dạng hàm thuần, React chỉ hiển thị. Nhờ vậy phần logic được kiểm thử trực tiếp, không cần dựng DOM.

## Kiểm thử

174 test, chia làm ba tầng:

- **Logic** (`src/lib/*.test.ts`) — XP, level, streak, thành tích, sinh và chấm bài tập, đọc/ghi dữ liệu hỏng.
- **Dữ liệu** (`src/data/hsk1.test.ts`) — mọi từ đều có đủ trường, không trùng id, không từ nào lạc khỏi bài học.
- **Giao diện** (`src/components/*.test.tsx`, `src/pages/app-flow.test.tsx`) — dựng app thật trong bộ nhớ và đi trọn một buổi học, đúng tiêu chí nghiệm thu của Version 2.

Test chạy trong `StrictMode` giống hệt bản thật, nên những lỗi do hàm cập nhật state không thuần tuý sẽ lộ ra ngay trong suite.
