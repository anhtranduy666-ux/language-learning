# Phương án kỹ thuật — Hội thoại với Zibi

> Trạng thái: **đề xuất, chưa triển khai.**
> Ngày: 2026-09-25
> Liên quan: [pronunciation-mvp.md](pronunciation-mvp.md), [example-sentences.md](example-sentences.md),
> [product_design.md](../product_design.md) Phase 8

Người học nói chuyện với Zibi: Zibi nói một câu bằng tiếng Trung, người học chọn
câu đáp rồi **đọc to câu đó**, máy chấm phát âm, Zibi đáp lại và cuộc hội thoại
đi tiếp.

## 1. Vì sao là kịch bản, không phải LLM

Hội thoại tự do bằng LLM vướng cả ba ràng buộc của dự án cùng lúc: cần thẻ tín
dụng (API đám mây) hoặc tải 400MB–1GB kèm WebGPU (model chạy trong trình duyệt),
và phá lời hứa chạy ngoại tuyến. Nặng hơn: **model nhỏ nói tiếng Trung sai hoặc
vượt xa 60 từ đã học** — với người mới thì đó là gây hại, không phải trung tính.

Còn một chỗ va chạm trực tiếp với thứ vừa xây xong. `scoreAttempt()` nhận vào
`pinyin` của câu **biết trước** rồi gọi `expectedTones()` để biết phải nghe thấy
thanh gì. Người học muốn nói gì cũng được thì không còn gì để dóng hàng, và bộ
chấm phát âm tắt điện. Nói cách khác: *luyện phát âm bằng cách nói chuyện tự do*
tự mâu thuẫn.

Kịch bản thì ngược lại — mọi câu Zibi nói đều render sẵn bằng Piper như hiện
nay, mọi câu người học nói đều có pinyin biết trước nên bộ chấm dùng được nguyên
vẹn, không sửa một dòng. Bảng đối chiếu đầy đủ ở phần bàn trước khi viết tài
liệu này; tóm lại: kịch bản đạt cả bảy ràng buộc, hai hướng LLM thì không.

Đây cũng là thứ **không phải AI**, nên không vướng nguyên tắc 6 của
`product_design.md` — *"chưa đưa AI phức tạp vào khi hệ thống học cơ bản chưa ổn
định"*.

## 2. Một chỗ phải nói thẳng: chấm câu chưa chắc tay

[pronunciation-mvp.md](pronunciation-mvp.md) mục 2 đã khoanh phạm vi bộ chấm ở
**từ đơn, 1–3 âm tiết**, và cố ý để câu ra ngoài: cắt âm tiết dựa vào đáy năng
lượng, mà câu nối liền hơi thì không có đáy rõ.

Tính năng hội thoại **không xoá được giới hạn đó**. Cách đi vòng cho bản đầu:

- **Câu đáp giữ ngắn — tối đa 4 âm tiết.** `你好`, `我叫小明`, `谢谢你`, `再见`.
  Ở trình HSK 1 thì đó cũng đúng là thứ người học nói được.
- Câu đáp dài hơn 4 âm tiết thì **thu và cho nghe lại, không chấm điểm**. Thà
  không chấm còn hơn chấm sai — cùng nguyên tắc với cổng chặn ở
  [pronunciation-mvp.md](pronunciation-mvp.md) mục 7.
- Cờ `scoreable` không khai bằng tay mà **suy ra từ số âm tiết**, để không ai
  quên.

Đường mở khoá đã biết, chép lại từ mục 11 của tài liệu kia:
`scripts/generate-audio.py` đã tính sẵn ranh giới từng âm tiết của bản mẫu (biến
`spans` trong `synthesize()`) rồi vứt đi sau khi kiểm thanh. Ghi vào
`manifest.json` thì trình duyệt dóng hàng bản thu của người học với bản mẫu và
suy ra ranh giới âm tiết, cắt được cả câu liền hơi. Làm xong việc đó thì bỏ giới
hạn 4 âm tiết ở đây.

## 3. Mô hình dữ liệu

`src/data/dialogues.ts`, là **nội dung**, test như `hsk1.ts`.

```ts
/** Một lượt thoại. Cùng hình dạng với ExampleSentence nên dùng chung đường ống audio. */
export interface DialogueLine {
  hanzi: string     // 你叫什么名字？
  pinyin: string    // Nǐ jiào shén me míng zi?   — mỗi chữ Hán đúng một âm tiết
  meaning: string
}

export interface DialogueReply extends DialogueLine {
  /** Lượt kế tiếp, hoặc null là kết thúc hội thoại. */
  next: string | null
}

export interface DialogueTurn {
  id: string
  /** Zibi nói. */
  bot: DialogueLine
  /** 1–3 câu cho người học chọn. Nhiều hơn 3 là rối trên màn điện thoại. */
  replies: DialogueReply[]
}

export interface Dialogue {
  id: string
  lessonId: string        // gắn vào bài học nào
  title: string           // "Chào hỏi"
  goal: string            // "Chào một người mới gặp và hỏi tên"
  start: string           // id lượt đầu
  turns: DialogueTurn[]
}
```

Cây, không phải đồ thị tự do: `next` được phép trỏ tới một lượt đã đi qua (để
gộp nhánh) nhưng **không được tạo vòng lặp** — test chặn.

## 4. Audio dùng chung đường ống câu mẫu

`DialogueLine` cố ý cùng hình dạng với `ExampleSentence`, nên
`sentenceAudioKey()` dùng được thẳng: tên file là 8 ký tự hex băm từ
`hanzi + "\n" + pinyin`, nằm cùng chỗ trong `src/assets/audio/sentences/`.

Hai cái lợi đi kèm miễn phí:

- Câu thoại trùng y hệt một câu mẫu đã có thì **băm ra cùng tên file, dùng lại
  luôn**, không sinh thêm.
- Sửa pinyin thì tên file đổi theo, test báo thiếu audio, file cũ đọc sai không
  lọt lên bản deploy — đúng cơ chế đã có.

Việc cần làm: `scripts/dump-clips.ts` liệt kê thêm câu thoại. Kể **cả câu đáp
của người học**, vì người học cần nghe mẫu trước khi đọc theo.

```ts
for (const dialogue of DIALOGUES) {
  for (const turn of dialogue.turns) {
    add(turn.bot)
    for (const reply of turn.replies) add(reply)
  }
}
```

Sinh audio vẫn là `npm run generate-audio`, không đổi gì.

## 5. Vòng chơi

Route mới `/lesson/:lessonId/dialogue`, vào từ màn Lesson cạnh nút **Luyện nói**.

```
Zibi: 你好！                      ← phát audio ngay khi vào lượt
      [Zibi nói, bong bóng bên trái]

Bạn chọn:  [ 你好！ ]  [ 老师，你好！ ]
      ↓ chạm một câu
      Hiện chữ Hán + pinyin + nghĩa, có nút nghe mẫu
      ↓ bấm micro, đọc
      scoreAttempt({ pinyin: câu vừa chọn, ... })
      ↓
Zibi: phản ứng theo điểm, rồi sang lượt kế
```

Zibi phản ứng thế nào thì theo đúng lối đã có ở các dạng bài tập: khen khi đạt,
chữa khi sai, và lời chữa lấy từ `TIPS` theo `problem` mà `scoreAttempt` trả về
— **không viết lời khuyên mới ở đây**, một chỗ duy nhất giữ lời là
`src/data/pronunciationTips.ts`.

Điểm của một lượt **không đổi nhánh hội thoại**. Đọc chưa chuẩn thì Zibi nhắc
rồi vẫn đi tiếp; muốn đọc lại thì có nút. Bộ chấm còn nhiễu vài điểm, đừng để nó
chặn đường người học.

## 6. Chế độ không dùng micro

Bắt buộc có, không phải tuỳ chọn. Người học có thể đang ngồi trên xe buýt, hoặc
đã từ chối quyền micro, hoặc dùng máy không có micro.

Chạm câu đáp là đi tiếp được luôn; phần nói là **bước thêm**, không phải cửa ải.
Màn hình có công tắc "Chỉ chạm, không nói" và nhớ lựa chọn đó. Bốn kiểu lỗi micro
trong `MicFailure` đã có sẵn lời giải thích ở `MIC_PROBLEMS` — dùng lại.

## 7. XP

Theo đúng nguyên tắc đang áp dụng ở màn Luyện nói: **thưởng cho việc có luyện,
không thưởng theo điểm.** Xong một hội thoại được XP một lần cho mỗi lượt vào
màn, bất kể chấm được bao nhiêu. Bộ chấm nhiễu thì đừng cho nó làm trọng tài
phát XP.

## 8. Ràng buộc nội dung: chỉ dùng từ đã học

Hội thoại của bài N chỉ được dùng chữ Hán nằm trong vốn từ của các bài **≤ N**.
Đây là ràng buộc quan trọng nhất của phần nội dung, và **test được**:

```ts
// Mọi chữ Hán trong hội thoại phải đã xuất hiện ở một bài học trước đó.
const allowed = new Set(
  lessonsUpTo(dialogue.lessonId).flatMap((l) => wordsOfLesson(l.id)).flatMap((w) => hanziChars(w.hanzi)),
)
```

Dấu câu được miễn. Tên riêng (小明) thì khai vào một danh sách trắng ngắn, có
chú thích lý do — đừng để lỗ hổng đó rộng ra.

Ràng buộc này là lý do chính khiến kịch bản viết tay hơn hẳn LLM ở đây: nó giữ
cho người học **luôn hiểu được mọi chữ Zibi nói**.

## 9. Kiểm thử

Repo đang có 775 test và CI chặn deploy khi đỏ. Phần này vào đúng khuôn đó.

| Phạm vi | Nội dung |
| --- | --- |
| Nội dung | Mọi chữ Hán nằm trong vốn từ của các bài ≤ bài đó; mọi lượt có ít nhất một câu đáp; `next` trỏ tới lượt có thật; mọi lượt tới được từ `start`; không có vòng lặp. |
| Dóng hàng | Số âm tiết pinyin bằng số chữ Hán của từng câu — dùng lại `isAligned()` đã có. |
| Audio | Mọi câu thoại đều có file trong `src/assets/audio/sentences/` — cùng kiểu test đã chặn thiếu audio cho câu mẫu. |
| `scoreable` | Câu ≤ 4 âm tiết thì chấm, dài hơn thì không — suy từ số âm tiết, không khai tay. |
| Luồng | Đi trọn một hội thoại trong app dựng bằng bộ nhớ: chạm chọn, nghe mẫu, chấm, sang lượt, kết thúc, nhận XP. |
| Không micro | Từ chối quyền → vẫn đi hết được hội thoại bằng chạm; công tắc "chỉ chạm" được nhớ. |

## 10. Kế hoạch

### M1 — Một hội thoại, chưa cần micro

Mô hình dữ liệu, một hội thoại cho bài `u1l1`, sinh audio, màn hình, đi hết bằng
chạm. Test nội dung và test luồng.

**Nghiệm thu:** vào `/lesson/u1l1/dialogue`, nghe Zibi nói, chạm chọn, đi tới
cuối, nhận XP. Bật chế độ máy bay vẫn chạy trọn vẹn.

### M2 — Nối micro và bộ chấm

`MicButton` và `scoreAttempt` cho câu ≤ 4 âm tiết; câu dài hơn chỉ nghe lại.
Zibi phản ứng theo `problem`.

**Nghiệm thu:** đọc `你好` đúng thanh thì Zibi khen; đọc `nì hǎo` thì Zibi chữa
đúng chỗ. Từ chối quyền micro thì hội thoại vẫn đi tiếp được.

### M3 — Đủ 10 hội thoại

Mỗi bài học một hội thoại. Rà lại ràng buộc từ vựng cho cả mười.

**Nghiệm thu:** test nội dung xanh cho cả 10; không hội thoại nào dùng chữ chưa
dạy.

## 11. Chi phí kho mã

Hiện `src/assets/audio` nặng 2.7MB, trong đó 179 câu mẫu chiếm 2.4MB — khoảng
**13KB một câu**. Mười hội thoại, mỗi cái cỡ 6 lượt × (1 câu Zibi + 2 câu đáp),
ra khoảng 180 câu mới ≈ **+2.4MB**, đưa tổng lên cỡ 5MB.

Vẫn chấp nhận được với một PWA giữ toàn bộ audio để chạy ngoại tuyến, nhưng đây
là con số cần canh: thêm HSK 2 rồi thì nên xem lại
[audio-tts.md](audio-tts.md) — tài liệu đó vẫn để ngỏ đúng cho lúc nội dung lớn
tới mức không nên nhét mp3 vào git nữa.

Chi phí thật của tính năng này là **công viết nội dung**, không phải công code.

## 12. Ngoài phạm vi

- Hội thoại tự do, sinh câu bằng model. Lý do ở mục 1; nếu làm thì thuộc Phase 8.
- Nhận diện xem người học nói câu nào trong các câu đáp. Mục 14.1 của
  [pronunciation-mvp.md](pronunciation-mvp.md) đã đo MFCC+DTW đúng cho việc này:
  nhận đúng **7–9 lần trên 60**. Cho chạm chọn trước, rồi mới nói.
- Chấm câu dài. Xem mục 2 — cần ranh giới âm tiết của bản mẫu trước đã.
- Đổi nhánh hội thoại theo điểm phát âm.
