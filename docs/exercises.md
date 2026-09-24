# Phương án kỹ thuật — Ghép câu, nghe–viết và Mầm

> Trạng thái: **đã triển khai** (2026-09-24)
> Liên quan: [product_design.md](../product_design.md) mục 7 (Bài tập), [docs/scene.md](scene.md)

## 1. Vấn đề

Bốn dạng bài của Version 2 — trắc nghiệm nghĩa, chọn pinyin, nghe rồi chọn, ghép
cặp — đều là **nhận ra**: đáp án đúng luôn nằm sẵn trên màn hình, người học chỉ
việc chỉ vào nó. Không dạng nào bắt người học **tự dựng lại** được thứ gì.

Hai thứ quan trọng nhất với người mới học tiếng Trung vì thế chưa được luyện:

- **Trật tự từ trong câu.** Biết 我, 是, 中国, 人 nghĩa là gì chưa có nghĩa là
  nói được 我是中国人.
- **Nghe ra âm.** Bài nghe hiện tại cho bốn chữ Hán để chọn, nên người học có
  thể loại trừ bằng mắt thay vì bằng tai.

## 2. Hai dạng bài mới

| Dạng | Đề bài | Người học làm gì | Chấm thế nào |
| --- | --- | --- | --- |
| **Ghép câu** | Mầm đọc nghĩa tiếng Việt của câu ví dụ | Bấm các mảnh chữ Hán theo đúng thứ tự | So chuỗi chữ ghép lại với câu đúng |
| **Nghe và viết** | Mầm đọc một từ | Gõ lại bằng pinyin | So sau khi bỏ dấu thanh, khoảng trắng, hoa/thường |

Bài học giờ xoay vòng qua năm dạng theo từng từ — trắc nghiệm, pinyin, nghe,
ghép câu, nghe–viết — rồi khép lại bằng hai bài luyện thanh và một bài ghép cặp.

> **Cập nhật sau:** hai bài luyện thanh ở cuối mỗi lesson được thêm về sau, vì
> không dạng nào trong sáu dạng dưới đây kiểm được thanh điệu — kể cả bài
> nghe–viết, thứ **cố tình** bỏ qua dấu thanh khi chấm. Xem
> [docs/tones.md](tones.md).

## 3. Ghép câu

### Tách từ

Tiếng Trung viết liền, nên phải tự cắt câu thành mảnh. Cắt từng chữ một là hỏng
bài học: 学生 là "học sinh", tách thành 学 và 生 là hai mảnh vô nghĩa.

`tokenizeChinese()` trong `src/lib/chinese.ts` khớp tham lam **từ dài nhất
trước**, dựa trên chính 60 từ của khoá cộng một danh sách phụ ngắn
(`EXTRA_LEXICON`) gồm những từ nhiều chữ có trong câu ví dụ mà không thuộc HSK 1
— 学习, 高兴, 知道, 今年… Chữ không thuộc từ nào thì đứng riêng. Tên riêng chữ
Latin như "Tom" giữ nguyên một mảnh.

Bất biến được test chốt cho cả 60 câu: **ghép các mảnh lại phải ra đúng câu
gốc** — không mất chữ, không nhân đôi chữ.

### Chọn câu và mảnh nhiễu

- Câu dưới 3 mảnh (谢谢你, 请喝茶) không đủ để nghĩ; trên 7 mảnh thì quá sức người
  mới. Từ nào có câu như thế thì được hỏi bằng trắc nghiệm thay vào, không để
  trống.
- Thêm **2 mảnh nhiễu** lấy từ các từ khác trong khoá, **không trùng chữ nào**
  với câu đúng. Một mảnh nhiễu trùng chữ sẽ làm câu có hai cách ghép đều đúng.
- Id mảnh theo vị trí chứ không theo chữ, vì một câu có thể có hai chữ 我.
  Chấm thì so **theo chữ**, nên bấm chữ 我 nào trước cũng đúng.

### Giao diện

Mảnh chữ làm kiểu phím bấm — viền dưới dày, bấm xuống thì lún. Mảnh đã dùng để
lại một ô trống đúng kích thước trong kho chứ không biến mất: nếu các mảnh còn
lại dồn lên lấp chỗ, ngón tay đang nhắm mảnh kế tiếp sẽ bấm trúng mảnh khác.
Bấm mảnh trên dòng trả lời là trả nó về kho.

## 4. Nghe và viết

### Không bắt gõ dấu thanh

Bàn phím thường không có ǎ hay ǜ, và bắt học cách gõ chúng là dạy một thứ chẳng
liên quan gì tới tiếng Trung. `normalizePinyin()` trong `src/lib/pinyin.ts`:

1. `normalize('NFD')` tách chữ cái khỏi dấu, rồi bỏ dấu — ǎ thành a, ǜ thành u.
2. `v` được coi như `u`, vì người học quen gõ "nv" cho 女.
3. Bỏ khoảng trắng, dấu nháy, và không phân biệt hoa/thường.

"nǐ hǎo", "ni hao", "NiHao" đều được tính đúng. Ô gõ nói rõ điều này ngay bên
dưới, để không ai mất công tìm cách gõ dấu.

Lúc chữa bài thì Mầm đưa ra **pinyin có đủ dấu** kèm chữ Hán, để người học vẫn
thấy thanh điệu đúng.

### Máy không phát được âm

Bài nghe chọn đáp án cũ hiện pinyin thay thế khi máy không có âm. Làm y như thế
ở đây là **lộ luôn đáp án**. Nên Mầm đưa **chữ Hán** ra thay: bài thành "viết
pinyin của chữ này" — vẫn đáng làm, và người học vẫn đi hết được bài.

Bấm Enter trong ô gõ là chấm bài luôn.

## 5. Mầm

Nhân vật dẫn đường, xuất hiện ở màn chào, màn từ mới, lúc chấm từng câu và màn
kết quả. Trong hai dạng bài mới, Mầm là người **ra đề**: đọc nghĩa câu cần ghép,
và đọc từ cần viết — đúng vai của nhân vật trong Duolingo.

**Nhân vật tự vẽ, không lấy từ bộ sticker có sẵn.** Yêu cầu ban đầu kèm một bộ
sticker thương mại để chép theo; dùng lại nhân vật đó trong app là vi phạm bản
quyền. Mầm là một mầm cây tròn — chiếc lá trên đầu nối nhân vật với khu vườn ở
nền động, và với chính việc học: mới nhú, rồi lớn dần.

- Vẽ bằng SVG như phần nền, nên không thêm file nào vào bản offline.
- Năm tâm trạng — chào, vui, nghĩ, mừng, tiếc — đổi mắt, miệng và tay, còn thân
  giữ nguyên, để người học nhận ra vẫn là một nhân vật.
- Nhân vật là hình trang trí, luôn `aria-hidden`. **Lời thoại là chữ thật** trong
  DOM, nên trình đọc màn hình đọc đúng câu Mầm nói.
- Nhịp thở và cái lá đung đưa nghe theo lựa chọn nền động và
  `prefers-reduced-motion`.

## 6. Kiến trúc

```
src/lib/chinese.ts                         Tách câu thành mảnh, từ điển phụ
src/lib/pinyin.ts                          Chuẩn hoá và so khớp pinyin
src/lib/tones.ts                           Đọc, bỏ và gắn lại dấu thanh
src/lib/exercises.ts                       Sinh và chấm cả tám dạng bài
src/components/exercise/SentenceBuilder.tsx
src/components/exercise/DictationInput.tsx
src/components/exercise/ToneChoice.tsx
src/components/Mascot.tsx                  Mầm và bong bóng thoại
src/styles/mascot.css, src/styles/exercise.css
```

## 7. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Tách từ | `src/lib/chinese.test.ts` | Từ dài nhất trước; từ ba chữ; tên riêng Latin; không có từ điển vẫn chạy; **cả 60 câu ví dụ ghép lại ra đúng câu gốc**. |
| Pinyin | `src/lib/pinyin.test.ts` | Bỏ bốn thanh; ü và v; khoảng trắng, dấu nháy, hoa thường; bỏ trống không bao giờ tính đúng; cả 60 từ gõ không dấu đều khớp. |
| Sinh và chấm | `src/lib/exercises.test.ts` | Đủ sáu dạng; câu quá ngắn thì thay bằng trắc nghiệm; **mọi bài học đều sinh đủ bài**; mảnh nhiễu không trùng chữ; mảnh trùng chữ có id riêng và bấm cái nào trước cũng đúng. |
| Giao diện | `src/pages/app-flow.test.tsx` | Mầm đọc đề; bấm mảnh lên dòng và trả về kho; ghép sai thì chỉ ra câu đúng; gõ không dấu được tính đúng; Enter là chấm; máy không có âm thì hiện chữ Hán mà không lộ pinyin. |
| Mầm | `src/components/Mascot.test.tsx` | Là hình trang trí; mỗi tâm trạng một bộ mặt; lời thoại là chữ thật. |

## 8. Không nằm trong phạm vi

- **Nói vào micro** như Duolingo: cần nhận dạng giọng nói tiếng Trung, mà Web
  Speech API không có trên Firefox và không chạy khi mất mạng.
- **Gõ chữ Hán** bằng bộ gõ: người mới chưa cài và chưa biết dùng bộ gõ pinyin.
- Ghép câu có nhiều đáp án đúng (đảo trạng ngữ thời gian, v.v.) — câu ví dụ
  hiện tại chỉ có một trật tự tự nhiên.
