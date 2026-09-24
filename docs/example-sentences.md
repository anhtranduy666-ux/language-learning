# Câu mẫu — từ đi cùng những từ khác, có audio đọc cả câu

> Trạng thái: **đã triển khai** (2026-09-24)
> Liên quan: [`src/data/hsk1.ts`](../src/data/hsk1.ts),
> [`src/lib/sentences.ts`](../src/lib/sentences.ts),
> [`src/components/ExampleSentences.tsx`](../src/components/ExampleSentences.tsx),
> [audio-voice.md](audio-voice.md), [exercises.md](exercises.md)

## 1. Vấn đề

Trước đây mỗi từ có đúng một câu ví dụ, chỉ là chữ: không pinyin, không audio.
Người học nghe được 你 đứng một mình, nhưng chưa bao giờ nghe 你叫什么名字？ trôi
thành một hơi.

Mà vào câu thì cách đọc đổi hẳn:

- 你好 viết `nǐ hǎo` nhưng đọc `ní hǎo` — hai thanh 3 liền nhau.
- 不 là `bù`, nhưng trước thanh 4 thành `bú`: 不是 `bú shì`.
- 们, 的, 吗, 子 đọc nhẹ, ngắn và thấp — thứ không thể nghe ra từ một từ đơn.

Yêu cầu gốc: *"bạn → bạn tên là gì, bạn → bạn có khoẻ không, nhớ là phải có âm
thanh phát âm của cả câu chứ không chỉ của 1 từ."*

## 2. Nội dung

Mỗi từ có **ba câu mẫu**: 60 × 3 = 180 câu, trong đó 179 câu khác nhau
(你叫什么名字？ là câu mẫu của cả 你 lẫn 叫). Câu dùng 60 từ của khoá là chính,
thêm những từ HSK 1 quen thuộc nhất — 吗, 的, 喜欢, 学校, 苹果 — để câu nghe tự nhiên.

```ts
{
  id: 'ni',
  hanzi: '你',
  pinyin: 'nǐ',
  meaning: 'bạn',
  examples: [
    ex('你叫什么名字？', 'Nǐ jiào shén me míng zi?', 'Bạn tên là gì?'),
    ex('你好吗？', 'Nǐ hǎo ma?', 'Bạn có khoẻ không?'),
    ex('你是学生吗？', 'Nǐ shì xué sheng ma?', 'Bạn là học sinh phải không?'),
  ],
}
```

Câu đầu tiên là **câu chính**: hiện ở mặt sau flashcard và được ưu tiên cho bài
ghép câu.

### Quy ước viết pinyin

Pinyin vừa để hiển thị, vừa là **đúng thứ máy đọc** — xem
[audio-voice.md](audio-voice.md). Nên quy ước chặt:

| Quy ước | Ví dụ | Vì sao |
| --- | --- | --- |
| Theo từng âm tiết, cách nhau bằng dấu cách | `shén me`, không phải `shénme` | Khớp cách app ghi pinyin của từ; chữ Hán thứ n luôn đi với âm tiết thứ n |
| Thanh nhẹ không có dấu | `xiè xie`, `míng zi`, `wǒ men` | Máy đọc hiểu là thanh 5 |
| 一 và 不 ghi thanh đã biến | `bú shì`, `yí ge`, `yì qǐ` | Máy không tự biến hai chữ này — đo được |
| Thanh 3 ghi thanh gốc | `nǐ hǎo`, không phải `ní hǎo` | Máy tự biến, đúng như sách giáo khoa vẫn viết |
| Viết hoa chữ đầu câu và tên riêng | `Wǒ shì Yuè nán rén.` | |
| Dấu câu dính vào âm tiết trước | `Nǐ hǎo, wǒ jiào Xiǎo míng.` | |
| Chỉ chữ Hán và ，。？！ | Không có `Tom` | Chữ Latin không có pinyin để khớp, và máy đọc bừa |

Toàn bộ 180 câu đã được đối chiếu từng âm tiết với một từ điển phát âm độc lập
(lexicon 6,8 MB đi kèm MeloTTS). Chỉ lệch đúng một chỗ, và chỗ đó từ điển sai:
nó tách 他是好学生 thành 好学 (`hào xué`, "hiếu học"), còn câu này là 好 + 学生,
đọc `hǎo`.

## 3. Hiện ở đâu

| Chỗ | Hiện gì |
| --- | --- |
| **Màn Từ mới** | Ba câu dưới mỗi từ. Mỗi câu: nút nghe cả câu, chữ Hán, pinyin, nghĩa |
| **Mặt sau flashcard** | Câu chính, có nút nghe cả câu |
| **Bài ghép câu** | Chấm xong — đúng hay sai — kho mảnh nhường chỗ cho cả câu kèm pinyin và nút nghe |

Từ đang học được **tô ở cả dòng chữ Hán lẫn dòng pinyin**: vì chữ thứ n đi với
âm tiết thứ n, `highlightTarget()` đếm số chữ Hán đứng trước từ là biết phải tô
âm tiết nào. Người học thấy 叫 nằm ở đâu trong câu và đọc là `jiào`.

Mặt đang quay đi của flashcard được đánh dấu `inert`, để nút loa trên đó không
nhận Tab khi mắt không nhìn thấy nó.

## 4. Audio cả câu

- File: `src/assets/audio/sentences/<khoá>.mp3`. Khoá là FNV-1a 32 bit của chữ Hán
  **và** pinyin — sửa pinyin là ra tên file mới, test báo thiếu audio, và file
  cũ đọc sai không thể lọt lên bản deploy dưới cái tên cũ.
- Sinh bằng `npm run generate-audio`, cùng giọng và cùng cách với audio của từ —
  máy đọc đúng pinyin viết tay, và bước chấm thanh chọn bản tốt nhất trong tối đa
  16 bản.
- Câu đọc chậm hơn từ đơn một chút (`length_scale` 1.1), để người mới nghe kịp.
- Câu **không** cần câu đệm như từ đơn: đã thử đặt "我说，" trước câu rồi cắt ra,
  kết quả gần như y hệt (77,7% và 77,8% âm tiết đạt mỗi lần sinh).

| Số đo | Kết quả |
| --- | --- |
| Âm tiết đạt, mỗi lần sinh | 78% |
| Âm tiết đạt, sau khi chọn bản | **92,2%** (747/810) |
| Câu đạt trọn mọi âm tiết | 132/179 |
| Giọng cũ, trên bộ câu thử | 57% |
| Dung lượng | khoảng 2 MB cho 179 câu, 48 kbps mono |

Những chỗ còn chưa qua ngưỡng phần lớn nhẹ: thanh 4 ở giữa câu đổ xuống dưới
10% — vốn là thanh 4 "nửa" rất tự nhiên khi còn chữ phía sau — và thanh 1 hơi
vểnh lên khi đứng ngay sau một thanh 2.

Cả 179 file được precache như audio của từ, nên câu mẫu vẫn nghe được khi mất
mạng. Nút loa của câu thử các nguồn theo đúng thứ tự của từ; file hỏng thì giọng
hệ điều hành đọc **cả câu**, không chỉ một từ.

## 5. Thêm hoặc sửa câu

1. Sửa `src/data/hsk1.ts` theo quy ước ở mục 2.
2. `npm test` — test dữ liệu bắt pinyin lệch số âm tiết, dấu câu lệch, âm tiết
   không có thật; test audio báo câu nào chưa có file.
3. `npm run generate-audio` — chỉ sinh câu mới hoặc câu vừa sửa. File của câu cũ
   bị xoá luôn.
4. Commit cả `src/data` lẫn `src/assets/audio`.

Câu có từ nhiều chữ chưa có trong khoá thì thêm từ đó vào `EXTRA_LEXICON`
(`src/lib/chinese.ts`), để bài ghép không cắt vụn nó.

## 6. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Dữ liệu | `src/data/hsk1.test.ts` | Ba câu mỗi từ, không trùng; câu chứa đúng từ đang học; **mỗi chữ Hán đúng một âm tiết**; dấu câu hai bên khớp nhau; chỉ chữ Hán và bốn dấu câu; viết hoa chữ đầu; **mọi âm tiết là âm tiết tiếng Trung có thật** |
| Câu mẫu | `src/lib/sentences.test.ts` | Tô đúng từ ở cả hai dòng; từ đầu câu, từ trước dấu câu, từ lặp hai lần; câu không chứa từ thì không tô nhầm; tên file đổi khi sửa pinyin, không đổi khi sửa nghĩa; 179 câu ra 179 tên file |
| Audio | `src/lib/audioFiles.test.ts` | **Câu nào cũng có file**; không có file câu bỏ rơi; file được đọc từ đúng pinyin hiện tại |
| Phát âm | `src/lib/speech.test.ts` | Có file câu thì phát file đó; file câu ưu tiên hơn file từ; file hỏng thì giọng máy đọc cả câu |
| Giao diện | `src/components/ExampleSentences.test.tsx`, `Flashcard.test.tsx`, `src/pages/app-flow.test.tsx` | Đủ câu, pinyin, nghĩa; **bấm loa câu nào phát đúng file câu đó**; mặt sau flashcard có câu chính và nút nghe; mặt khuất là `inert`; bài ghép câu hiện cả câu sau khi chấm, kể cả khi sai |

## 7. Không nằm trong phạm vi

- **Tô từng chữ theo tiếng đọc**, kiểu karaoke. Script sinh audio biết chính xác
  từng âm tiết bắt đầu lúc nào, nên làm được — nhưng cần thêm dữ liệu thời gian
  vào app.
- **Bài "nghe cả câu rồi chọn nghĩa"** — bước tiếp theo tự nhiên của phần này.
- Thu âm giọng người thật.
