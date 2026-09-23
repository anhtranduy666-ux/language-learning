# Chinese Learning App

Ứng dụng học tiếng Trung cho người mới bắt đầu, xây theo [product_design.md](product_design.md).

Bản hiện tại: toàn bộ vòng học cốt lõi của Version 2 đã chạy được với dữ liệu
HSK 1 lưu ngay trong mã nguồn (**Phase 1 — UI**), kèm chế độ sáng/tối và phần
audio của **Phase 5** — phần audio đã viết xong nhưng cần một project Supabase
mới chạy thật được.

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
| `npm run prewarm-audio -- --local --dry-run` | Liệt kê audio sẽ sinh, không chạm mạng |
| `npm run prewarm-audio -- --local` | Sinh 60 file mp3 vào `src/assets/audio/` |
| `npm run prewarm-audio` | Sinh audio lên Supabase Storage (cần thêm Supabase) |

Yêu cầu Node.js 20 trở lên. Riêng `prewarm-audio` cần Node 22.6 trở lên, vì nó
chạy thẳng file TypeScript.

## Đã có trong bản này

- **Nội dung**: khoá HSK 1 với 5 unit, 10 bài học, 60 từ. Mỗi từ có Hanzi, pinyin, nghĩa và câu ví dụ.
- **Màn hình**: Landing, Home, Course, Lesson, Flashcard, Exercise, Result, Progress, Profile.
- **Bài tập**: đủ 4 dạng của Version 2 — trắc nghiệm, ghép nối, nghe, chọn pinyin.
- **Gamification**: XP, level, daily goal, streak và 9 thành tích.
- **Lưu trữ**: tiến độ nằm trong `localStorage`, tự khôi phục khi mở lại.
- **Giao diện sáng/tối**: chọn Sáng, Tối hoặc Theo máy ở màn hình Cá nhân. Mặc
  định bám theo hệ điều hành. Xem [docs/theme.md](docs/theme.md).
- **Phát âm**: nút loa ở màn hình từ vựng, flashcard và bài nghe. Xem mục [Âm thanh](#âm-thanh).

## Chưa có

- Authentication và Supabase (Phase 2–3). Hiện chỉ hỏi tên và lưu ở máy.
- Audio thật: mã đã xong nhưng cần một project Supabase và một khoá TTS mới
  chạy được — xem mục [Âm thanh](#âm-thanh) bên dưới.
- Spaced repetition cho flashcard. Bản này mới có hai mức "Chưa nhớ" / "Đã nhớ".
- Toàn bộ phần AI ở Phase 8.

## Âm thanh

Nút phát âm thử bốn nguồn, theo thứ tự — chi tiết ở
[docs/audio-tts.md](docs/audio-tts.md):

1. **File thu sẵn** trong `src/assets/audio/`. Đặt tên file bằng `id` của từ
   (`nihao.mp3` cho `你好`) là chạy, không cần khai báo thêm ở đâu.
2. **CDN Supabase.** Đường dẫn file được suy ra từ chính nội dung cần đọc nên
   trình duyệt tự tính được URL, không phải hỏi server trước.
3. **Edge Function `/speak`**, chỉ khi CDN chưa có file.
4. **Giọng tiếng Trung của hệ điều hành** qua Web Speech API.

Hết cả bốn thì nút chuyển xám, bấm vào sẽ hướng dẫn cách cài giọng tiếng Trung
thay vì im lặng. Riêng bài tập nghe hiện pinyin thay thế để người học vẫn đi
hết được bài.

Lưu ý: Windows **không** cài sẵn giọng tiếng Trung, nên nguồn 4 thường không có
trên máy người dùng Việt Nam. Đó chính là lý do có nguồn 2 và 3.

### Cách nhanh nhất: sinh mp3 vào repo

Chỉ cần một tài khoản Azure, **không** cần Supabase:

```bash
cp .env.example .env.local   # điền AZURE_SPEECH_KEY và AZURE_SPEECH_REGION
npm run prewarm-audio -- --local
git add src/assets/audio && git commit -m "Add pronunciation audio"
```

Sinh 60 file, mỗi từ một file, tổng cộng 89 ký tự tiếng Trung — nằm gọn trong
hạn miễn phí của Azure (500.000 ký tự mỗi tháng). File nằm trong repo nên là
nguồn số 1 của chuỗi trên: chạy được ngoại tuyến, không phụ thuộc dịch vụ nào
lúc người học bấm nút.

Đây là chỗ cố tình làm khác [docs/audio-tts.md](docs/audio-tts.md): tài liệu xếp
"commit mp3 vào repo" làm fallback chứ không làm nguồn chính, vì lo repo phình
theo nội dung. Với HSK 1 thì 60 file nhỏ không đáng kể. Khi nội dung lớn hơn
nhiều thì chuyển sang cách dưới đây.

### Cách đầy đủ: audio qua Supabase

Chưa cấu hình thì nguồn 2 và 3 tự tắt, app lùi về giọng hệ điều hành — `npm run
dev` của người mới clone repo vẫn chạy ngay, không cần tài khoản Supabase.

Muốn bật thật:

```bash
cp .env.example .env.local        # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
supabase db push                  # tạo bucket tts và bảng speakable_texts
supabase secrets set AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southeastasia
supabase functions deploy speak
npm run prewarm-audio             # sinh sẵn 120 chuỗi của khoá HSK 1
```

`prewarm-audio` cần thêm `SUPABASE_SERVICE_ROLE_KEY`, `AZURE_SPEECH_KEY` và
`AZURE_SPEECH_REGION` trong `.env.local`. Khoá service role **không** bao giờ
mang tiền tố `VITE_`: mọi thứ có tiền tố đó đều đi thẳng vào bundle trình duyệt.

Bảng `speakable_texts` là danh sách chuỗi được phép sinh audio. Không có nó thì
`/speak` là một proxy TTS miễn phí cho cả internet, chạy bằng hoá đơn của mình.

## Cấu trúc mã nguồn

```
src/
├── components/      Component dùng lại: Flashcard, BottomNav, AudioButton, ui/
├── pages/           Mỗi màn hình một file
├── context/
│   ├── ProgressContext.tsx  Tiến độ người học
│   └── ThemeContext.tsx     Chế độ sáng/tối
├── lib/             Logic thuần, không phụ thuộc React
│   ├── gamification.ts   XP, level, streak, thành tích
│   ├── progress.ts       Các phép biến đổi tiến độ
│   ├── exercises.ts      Sinh và chấm bài tập
│   ├── course.ts         Điều hướng trong khoá học
│   ├── speech.ts         Chuỗi bốn nguồn phát âm
│   ├── audioCacheKey.ts  Khoá cache audio: chuẩn hoá, băm, dựng URL
│   ├── remoteAudio.ts    Gọi CDN rồi mới tới Edge Function, có hạn giờ
│   ├── audioFiles.ts     Quét file audio trong src/assets/audio
│   ├── theme.ts          Đọc/ghi lựa chọn giao diện, gắn vào thẻ html
│   └── storage.ts        Đọc/ghi localStorage
├── services/supabase.ts  Biến môi trường Supabase
├── data/hsk1.ts     Nội dung khoá học
└── types/           Kiểu dữ liệu dùng chung

supabase/
├── migrations/      Bucket tts, bảng speakable_texts và audio_clips
└── functions/speak/
    ├── handler.ts   Luật của Edge Function — chạy được bằng npm test
    └── index.ts     Vỏ Deno: nối dây với Storage, PostgREST và Azure

scripts/prewarm-audio.ts   Sinh sẵn toàn bộ audio HSK 1
docs/                      Phương án kỹ thuật cho audio và chế độ sáng/tối
```

Quy tắc: mọi luật chơi nằm trong `src/lib` dưới dạng hàm thuần, React chỉ hiển thị. Nhờ vậy phần logic được kiểm thử trực tiếp, không cần dựng DOM.

Edge Function cũng theo quy tắc đó: `handler.ts` nhận mọi phụ thuộc từ ngoài
nên chạy được trong `npm test`, không phải cài Deno chỉ để chạy một bộ test.

## Kiểm thử

295 test, chia làm ba tầng:

- **Logic** (`src/lib/*.test.ts`, `supabase/functions/speak/handler.test.ts`) — XP, level, streak, thành tích, sinh và chấm bài tập, chế độ sáng/tối, khoá cache audio, đọc/ghi dữ liệu hỏng.
- **Dữ liệu** (`src/data/hsk1.test.ts`) — mọi từ đều có đủ trường, không trùng id, không từ nào lạc khỏi bài học.
- **Giao diện** (`src/components/*.test.tsx`, `src/pages/app-flow.test.tsx`) — dựng app thật trong bộ nhớ và đi trọn một buổi học, đúng tiêu chí nghiệm thu của Version 2.

Test chạy trong `StrictMode` giống hệt bản thật, nên những lỗi do hàm cập nhật state không thuần tuý sẽ lộ ra ngay trong suite.

Chỗ dễ hỏng nhất của phần audio là client và Edge Function băm ra hai hash khác
nhau: lúc đó mọi request đều trượt cache, hoá đơn TTS tăng mà giao diện không
có dấu hiệu gì. `HASH_VECTOR` trong `src/lib/audioCacheKey.ts` chốt lại chuỗi
chuẩn hoá, và cả hai bộ test đều kiểm theo nó.
