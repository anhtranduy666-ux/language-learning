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
- **Phát âm**: nút loa ở màn hình từ vựng, flashcard và bài nghe. Xem mục [Âm thanh](#âm-thanh).

## Chưa có

- Authentication và Supabase (Phase 2–3). Hiện chỉ hỏi tên và lưu ở máy.
- File audio thu sẵn — xem mục [Âm thanh](#âm-thanh) bên dưới.
- Spaced repetition cho flashcard. Bản này mới có hai mức "Chưa nhớ" / "Đã nhớ".
- Toàn bộ phần AI ở Phase 8.

## Âm thanh

Nút phát âm thử hai nguồn, theo thứ tự:

1. **File thu sẵn** trong `src/assets/audio/`. Đặt tên file bằng `id` của từ
   (`nihao.mp3` cho `你好`) là chạy, không cần khai báo thêm ở đâu.
2. **Giọng tiếng Trung của hệ điều hành** qua Web Speech API.

Máy nào không có cả hai thì nút chuyển sang màu xám, bấm vào sẽ hướng dẫn cách
cài giọng tiếng Trung thay vì im lặng. Riêng bài tập nghe sẽ hiện pinyin thay
thế để người học vẫn đi hết được bài.

Hướng đi tiếp theo đã chốt: sinh audio bằng dịch vụ TTS qua Supabase Edge
Function và cache vào Supabase Storage — xem
[docs/audio-tts.md](docs/audio-tts.md).

Lưu ý: Windows **không** cài sẵn giọng tiếng Trung. Muốn nghe được bằng giọng hệ
điều hành thì vào Cài đặt → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói →
Chinese (Simplified). Cách chắc ăn hơn cho người dùng cuối là thu sẵn file audio,
vì khi đó âm thanh không phụ thuộc vào máy của họ.

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
│   ├── speech.ts         Phát âm: file thu sẵn hoặc giọng hệ điều hành
│   ├── audioFiles.ts     Quét file audio trong src/assets/audio
│   └── storage.ts        Đọc/ghi localStorage
├── data/hsk1.ts     Nội dung khoá học
└── types/           Kiểu dữ liệu dùng chung
```

Quy tắc: mọi luật chơi nằm trong `src/lib` dưới dạng hàm thuần, React chỉ hiển thị. Nhờ vậy phần logic được kiểm thử trực tiếp, không cần dựng DOM.

## Kiểm thử

208 test, chia làm ba tầng:

- **Logic** (`src/lib/*.test.ts`) — XP, level, streak, thành tích, sinh và chấm bài tập, đọc/ghi dữ liệu hỏng.
- **Dữ liệu** (`src/data/hsk1.test.ts`) — mọi từ đều có đủ trường, không trùng id, không từ nào lạc khỏi bài học.
- **Giao diện** (`src/components/*.test.tsx`, `src/pages/app-flow.test.tsx`) — dựng app thật trong bộ nhớ và đi trọn một buổi học, đúng tiêu chí nghiệm thu của Version 2.

Test chạy trong `StrictMode` giống hệt bản thật, nên những lỗi do hàm cập nhật state không thuần tuý sẽ lộ ra ngay trong suite.
