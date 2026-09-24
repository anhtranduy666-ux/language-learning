# Phương án kỹ thuật — Luyện thanh điệu

> Trạng thái: **đã triển khai** (2026-09-24)
> Liên quan: [docs/exercises.md](exercises.md), [product_design.md](../product_design.md) mục 8 (Exercise System)

## 1. Vấn đề

Tiếng Trung chỉ có khoảng **400 âm tiết gốc**, nhân với thanh điệu mới thành
~1.300. Tiếng Anh có hàng nghìn. Mật độ từ đồng âm vì thế rất dày: `shī / shí /
shǐ / shì` là bốn từ khác hẳn nhau.

Hệ quả: nghe không ra thanh thì mọi thứ phía sau đều hỏng — học từ mới không
vào, nghe người bản xứ không tách được chữ, nói ra người ta không hiểu.

Nhận mặt chữ Hán cũng khổ, nhưng nó **tuyến tính**: cày đủ nhiều là được. Thanh
điệu là kỹ năng **tri giác**, và nó đông cứng lại. Người tự học hay bỏ qua giai
đoạn đầu vì "hiểu là được", rồi hai năm sau phải đi gỡ, và gỡ đắt hơn học mới
rất nhiều.

### Sáu dạng bài cũ không kiểm được thanh

| Dạng | Vì sao tai không phải làm việc |
| --- | --- |
| Trắc nghiệm nghĩa | Không có âm thanh nào cả |
| Chọn pinyin | Ba phương án nhiễu lấy từ **từ khác**: `nǐ` đứng cạnh `shǎo`, `qī`, `wǒ` — loại trừ bằng phụ âm là xong |
| Nghe rồi chọn | Bốn chữ Hán khác hẳn nhau, chọn bằng mắt được |
| Ghép nối | Không có âm thanh |
| Ghép câu | Không có âm thanh |
| Nghe và viết | **Cố tình bỏ qua dấu thanh** khi chấm |

Dạng cuối là chỗ đau nhất: `normalizePinyin()` bỏ dấu thanh trước khi so, nên
"ni hao" được tính đúng. Quyết định đó vẫn đúng — bàn phím thường không có `ǎ`,
và bắt học cách gõ nó là dạy một thứ chẳng liên quan gì tới tiếng Trung. Nhưng
hệ quả là app **dạy người học bỏ qua đúng cái quan trọng nhất**.

## 2. Hai dạng bài mới

Nguyên tắc: **một cú chạm, không gõ gì**. Cái khó phải nằm ở tai, không nằm ở
bàn phím.

| Dạng | Đề bài | Người học làm gì | Dùng cho từ nào |
| --- | --- | --- | --- |
| **Thanh điệu** (`tone`) | Zibi đọc một từ, màn hình hiện âm tiết **đã bỏ dấu** (`hao`) | Bấm một trong bốn nút thanh | Từ **một âm tiết** có thanh rõ |
| **Phân biệt thanh** (`tone-pair`) | Zibi đọc một từ | Chọn một trong bốn cách đọc của **chính từ đó**, chỉ lệch nhau đúng cái thanh | Mọi từ |

Ví dụ bài phân biệt thanh với 再见:

```
zāi jiàn    zái jiàn    zǎi jiàn    zài jiàn
```

Không có phụ âm hay vần nào để mà loại trừ. Chỉ còn cao độ.

### Vì sao hai dạng chứ không một

Dạng `tone` hỏi **thanh mấy** — một khái niệm trừu tượng, và bắt người học gắn
âm nghe được với bảng thanh điệu. Nó chỉ hỏi được từ một âm tiết: "thanh của
你好 là gì" không có câu trả lời duy nhất.

Dạng `tone-pair` hỏi **cách đọc nào**, làm việc được với mọi từ kể cả nhiều âm
tiết, và cho người học quen mặt dấu thanh viết trên pinyin thật.

## 3. Đặt ở đâu trong bài học

Hai bài luyện thanh **không** tham gia vòng xoay theo từng từ. Vòng xoay đã có
năm dạng, mỗi lesson chỉ sáu từ; nhét thêm vào đó thì có lesson được luyện
thanh, có lesson không. Thanh điệu quan trọng tới mức không được phép rơi vào
may rủi.

Nên chúng là phần cố định, xếp cuối:

```
6 bài theo từng từ  →  Thanh điệu  →  Phân biệt thanh  →  Ghép nối
```

Một lesson sáu từ giờ có **9 bài tập** thay vì 7.

Hai bài cố ý rơi vào **hai từ khác nhau**, và bài phân biệt thanh ưu tiên từ
nhiều âm tiết, để không hỏi đúng một thứ hai lần. Lesson nào không có từ một âm
tiết nào thì bỏ bài `tone`, bài `tone-pair` vẫn chạy — nhưng cả 10 lesson của
HSK 1 đều có, và có test chốt điều đó.

## 4. `src/lib/tones.ts`

Làm đúng việc ngược lại với `src/lib/pinyin.ts`: ở đó dấu thanh bị **vứt đi** để
chấm bài gõ; ở đây dấu thanh chính là thứ đang dạy, nên phải đọc và dựng lại
chính xác.

| Hàm | Việc |
| --- | --- |
| `toneOf(syllable)` | Thanh của một âm tiết, 1–4, hoặc 0 cho thanh nhẹ |
| `stripTone(syllable)` | `hǎo` → `hao`, **giữ nguyên ü** |
| `applyTone(syllable, tone)` | `hao` + 3 → `hǎo` |
| `wordToneVariants(pinyin, i)` | Bốn cách đọc, chỉ đổi thanh âm tiết thứ `i` |

### Hai chỗ dễ sai

**Hai chấm của ü không phải dấu thanh.** `normalize('NFD')` tách `ǚ` thành
`u` + hai chấm + dấu ngã. Bỏ hết ký tự tổ hợp là mất luôn ü, và `nǚ` thành `nu`
— sai chữ. Nên bộ lọc chỉ bắt đúng bốn ký tự dấu thanh, chừa U+0308 lại.

**Dấu đặt vào nguyên âm nào** theo quy tắc chuẩn: có `a` thì vào `a`, không thì
`o`, không nữa thì `e`, còn lại thì **nguyên âm cuối**. Vế cuối là thứ làm
`jiu` ra `jiǔ` còn `dui` ra `duì` mà không cần liệt kê từng vần một.

## 5. Máy không phát được âm

Bài nghe chọn chữ sẵn có hiện **pinyin** thay thế. Làm y như thế ở đây là **lộ
luôn đáp án** — pinyin chính là thứ đang hỏi.

Nên cả hai dạng đưa **chữ Hán** ra thay. Bài thành "chữ này đọc thanh mấy": ôn
lại trí nhớ thay vì luyện tai, kém hơn nhưng vẫn đáng làm, và người học vẫn đi
hết được bài. Cùng cách xử lý với bài nghe–viết.

## 6. Chữa bài

Chọn sai thì Zibi nói rõ **thanh mấy**, không chỉ đưa lại chữ có dấu — người mới
nhìn `nǐ` chưa chắc đọc ra đó là thanh 3:

> Chưa đúng. 你 đọc là **nǐ** — thanh 3, xuống rồi lên.

Bốn nút của bài `tone` luôn hiện đủ bốn biến thể có dấu (`nī ní nǐ nì`), nên
người học quen mặt dấu thanh ngay trong lúc chọn, không phải học thuộc riêng.

## 7. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Thanh điệu | `src/lib/tones.test.ts` | Đọc/bỏ/gắn dấu; quy tắc `a > o > e > nguyên âm cuối`; `iu` và `ui`; ü không bị nhầm; **cả 60 từ dựng lại đúng pinyin gốc**, và bỏ dấu rồi gắn lại ra chính nó |
| Sinh bài | `src/lib/exercises.test.ts` | Đề bài không lộ thanh; bốn phương án chỉ lệch đúng cái thanh; đáp án đúng là pinyin thật; **mọi lesson đều có đủ hai bài luyện thanh**; hai bài rơi vào hai từ khác nhau; lesson toàn từ nhiều âm tiết thì chỉ bỏ bài `tone` |
| Giao diện | `src/pages/app-flow.test.tsx` | Đủ bốn nút thanh; chưa chọn thì chưa cho kiểm tra; chọn sai thì Zibi nói rõ thanh mấy; **máy không có âm thì hiện chữ Hán và pinyin đúng chỉ xuất hiện đúng một lần** — tức là không lộ đáp án |

## 8. Không nằm trong phạm vi

- **Cặp tối thiểu bằng hai chữ Hán khác nhau** (买 mǎi / 卖 mài): trong 60 từ HSK
  1 chỉ có đúng một cặp như vậy (是 shì / 十 shí), không đủ để dựng dạng bài.
  Làm được khi khoá học lớn lên, hoặc khi thêm một bộ từ riêng để luyện thanh.
- **Biến điệu** (两 thanh 3 liền nhau đọc thành 2–3, 不 và 一 đổi thanh): luật
  thật của tiếng Trung, nhưng dạy trước khi người học nghe ra bốn thanh cơ bản
  là quá sớm.
- **Chấm thanh khi người học nói vào micro**: cần nhận dạng giọng, mà Web Speech
  API không có trên Firefox và không chạy khi mất mạng.
