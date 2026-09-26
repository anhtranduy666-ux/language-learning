# Dịch Việt ⇄ Trung

> Trạng thái: **đã làm** — chiều Việt → Trung ngày 2026-09-25; thêm chiều Trung →
> Việt và nói thay cho gõ ngày 2026-09-26.
> Mã: [`src/lib/translate.ts`](../src/lib/translate.ts),
> [`src/lib/dictation.ts`](../src/lib/dictation.ts),
> [`src/pages/Translate.tsx`](../src/pages/Translate.tsx).

Mục **Dịch** ở giữa thanh điều hướng. Người học chọn chiều bằng nút đổi chiều
giữa "Tiếng Việt" và "Tiếng Trung", rồi **gõ hoặc bấm micro để nói** một từ, một
cụm hay một câu. App trả bản dịch, luôn kèm chữ Hán và pinyin của phía tiếng
Trung, rồi đọc bản dịch lên một lần.

## 1. Hai nguồn, thử lần lượt

| Thứ tự | Nguồn | Khi nào | Được gì |
| --- | --- | --- | --- |
| 1 | Khoá học: 60 từ và 180 câu mẫu | Việt → Trung: chữ gõ vào trùng đúng một nghĩa của từ, hoặc nguyên một câu mẫu. Trung → Việt: trùng đúng chữ Hán của từ hay câu mẫu | Tra ngay trên máy, chạy cả khi mất mạng. Pinyin do người soạn, audio thu sẵn bằng Piper |
| 2 | Google Dịch | Mọi chữ còn lại | Bản dịch và pinyin của phía tiếng Trung, trong một lần gọi |

Pinyin từ Google nằm ở hai chỗ khác nhau tuỳ chiều: dịch sang tiếng Trung thì là
phiên âm của **bản dịch** (ô thứ ba của đoạn phiên âm), dịch từ tiếng Trung thì là
phiên âm của **câu gốc** (ô thứ tư). Thử ngày 2026-09-26: 我想去银行 → "Tôi muốn
đến ngân hàng", kèm "Wǒ xiǎng qù yínháng".

**Cách so khớp với khoá học** (`matchKey`) bỏ qua hoa thường, dấu câu, dấu
ngoặc, và **chỗ đặt dấu thanh**. Khoá học viết "khoẻ", nhiều người gõ "khỏe":
tách dấu thanh của từng tiếng ra rồi gắn về cuối tiếng thì hai lối thành một.
"bạn" và "bán" thì vẫn khác nhau. Chiều Trung → Việt so chữ Hán, bỏ dấu câu và
khoảng trắng: gõ "你叫什么名字" vẫn ra câu mẫu "你叫什么名字？".

**Một nghĩa, nhiều từ.** Gõ "năm" thì ra 五, kèm 年 ở dòng "Cũng mang nghĩa này
trong bài học". Tiếng Việt nhập nhằng thì cho người học thấy hết, không chọn
thầm một từ.

**Gõ nhầm chiều.** Chiều Trung → Việt mà không có chữ Hán nào thì không gửi đi:
Google đọc pinyin như chữ Latin, "ni hao" ra "ni hào". Chiều Việt → Trung mà gõ
chữ Hán thì Zibi nhắc, kèm nút **Đổi chiều và dịch**.

**Đổi chiều ngay sau khi dịch** thì lật luôn cặp câu vừa có — chữ Hán lên ô nhập,
nghĩa tiếng Việt thành bản dịch — không gọi mạng lần nữa.

## 2. Âm thanh

| Chiều | Tự đọc sau khi dịch | Nút nghe thêm |
| --- | --- | --- |
| Việt → Trung | Tiếng Trung, qua chuỗi bốn nguồn của `speech.ts`: file thu sẵn trước, cuối cùng là giọng của máy | Loa cạnh chữ Hán |
| Trung → Việt | Tiếng Việt, bằng giọng tiếng Việt của máy (`speakVietnamese`) | Loa cạnh câu tiếng Việt, và loa cạnh chữ Hán |

Chiều Trung → Việt không tự đọc lại câu tiếng Trung: thường người ta vừa nói
xong câu đó. Đọc tiếng Việt thì hợp lối nói chuyện qua máy: người Trung nói, máy
đọc nghĩa cho mình; mình đổi chiều, nói tiếng Việt, máy đọc tiếng Trung cho họ.

Google dịch ra đúng chữ khoá học đã thu âm, như "xin chào" ra 你好, thì vẫn
phát file Piper. Tiếng Việt không có file thu sẵn nào, chỉ có giọng của máy:
iPhone có sẵn, Android thường có, máy tính Windows hay thiếu — lúc đó nút loa
nói rõ máy chưa có giọng tiếng Việt.

## 3. Nói thay cho gõ

Nút micro trong ô nhập dùng **nhận dạng giọng nói có sẵn của trình duyệt**
(Web Speech API, `SpeechRecognition`). Chiều Việt → Trung nghe tiếng Việt
(`vi-VN`), chiều Trung → Việt nghe tiếng Trung (`zh-CN`). Chữ hiện dần trong ô
khi đang nói; nói xong trình duyệt tự dừng và app dịch luôn. Bấm micro lần nữa
là dừng sớm, vẫn giữ những gì đã nghe được.

**Tiếng nói rời khỏi máy.** Trình duyệt tự gửi tiếng nói lên máy chủ nhận dạng
của hãng — Google trên Chrome, Apple trên Safari. Màn Dịch ghi rõ điều này.
Không có cách miễn phí nào khác để nghe được cả tiếng Việt lẫn tiếng Trung trong
trình duyệt: mô hình chạy trên máy như Whisper nặng hàng chục MB mà nghe tiếng
Việt kém.

Chuyện này **không** mâu thuẫn với phần chấm phát âm, nơi tiếng nói không rời
khỏi máy và `SpeechRecognition` đã bị loại — xem
[pronunciation-scoring.md](pronunciation-scoring.md). Ở đó cần biết người học
nói **đúng hay sai**; ở đây chỉ cần biết họ nói **chữ gì**.

| Lý do (`DictationFailure`) | Khi nào | Zibi nói |
| --- | --- | --- |
| `unsupported` | Trình duyệt không có nhận dạng giọng nói (Firefox, vài trình duyệt nhúng) | Mở bằng Chrome hoặc Safari, hoặc gõ |
| `denied` | Micro bị chặn, hoặc dịch vụ nhận dạng không cho dùng | Cho phép Micro; trên iPhone, app mở từ màn hình chính mà không nghe được thì thử mở bằng Safari |
| `no-speech` | Không nghe thấy gì | Nói to, rõ hơn |
| `no-mic` | Máy không có micro | — |
| `network` | Nhận dạng cần mạng | Có mạng lại thì thử |
| `error` | Lỗi khác | Thử lại |

## 4. Vì sao là endpoint này của Google

App chạy trên GitHub Pages: không có máy chủ đứng giữa, không giữ được khoá
bí mật, và không có thẻ tín dụng để mở API trả tiền. Nên chỉ dùng được dịch vụ
miễn phí, không cần khoá, và cho gọi thẳng từ trình duyệt (CORS mở).

Đã thử ngày 2026-09-25:

| Dịch vụ | Kết quả |
| --- | --- |
| `clients5.google.com/translate_a/single`, `client=dict-chrome-ex` — endpoint tiện ích từ điển của Chrome dùng | **Chọn.** CORS `*`. Đúng cả 6 câu thử, trả pinyin cùng lúc: "con mèo" → 猫 Māo, "tôi yêu bạn" → 我爱你, "điện thoại" → 电话 |
| `translate.googleapis.com/translate_a/single`, `client=gtx` | 429 "Sorry…" — bị chặn chống bot ngay từ lần gọi đầu |
| MyMemory (API miễn phí chính thức) | CORS mở, nhưng ưu tiên bộ nhớ dịch do người dùng góp. "xin chào" trả nguyên văn, "tôi yêu bạn" → 我想妳 ("anh nhớ em"), "con mèo" → 条猫, "điện thoại" → 電話 phồn thể. **Loại**: dịch sai mà hiện ra tự tin còn tệ hơn báo không dịch được |
| Các bản Lingva công khai | 403 hoặc 500 — đều đang sập |
| Azure, DeepL, Google Cloud Translation | Cần thẻ tín dụng |

**Rủi ro phải biết:** endpoint của Google **không phải API chính thức**. Không
khoá, không tốn tiền, nhưng Google có thể đổi hay chặn bất cứ lúc nào. Khi đó
màn Dịch báo "chưa dịch được", còn từ và câu trong khoá học vẫn tra được. Mọi
chỗ chạm tới Google nằm trong một hàm, `translateWithGoogle`, nên đổi nguồn chỉ
phải sửa hàm đó.

## 5. Quyền riêng tư

- Chữ có trong khoá học không rời khỏi máy.
- Chữ khác được gửi tới Google Dịch để dịch.
- Bấm micro thì tiếng nói được trình duyệt gửi tới dịch vụ nhận dạng của hãng.

Màn Dịch ghi rõ cả ba điều ngay dưới ô nhập. Không lưu lịch sử tra lên đâu cả;
bản dịch chỉ được nhớ trong bộ nhớ trang (tối đa 100 câu, tách theo chiều), để
dịch lại câu cũ thì khỏi gọi mạng.

## 6. Khi không dịch được

| Lý do (`TranslateFailure`) | Khi nào | Zibi nói |
| --- | --- | --- |
| `too-long` | Quá 200 ký tự (ô nhập cũng chặn ở mốc này) | Dài quá, mỗi lần tối đa 200 chữ |
| `not-chinese` | Chiều Trung → Việt mà không có chữ Hán | Gõ chữ Hán, hoặc bấm micro nói tiếng Trung |
| `looks-chinese` | Chiều Việt → Trung mà gõ chữ Hán | Đây là chữ Hán — kèm nút đổi chiều và dịch |
| `offline` | Máy báo mất mạng | Chỉ tra được từ và câu có trong bài học |
| `blocked` | Google trả 429 hoặc 403 | Google đang tạm từ chối, đợi vài phút |
| `failed` | Mạng hỏng, quá 8 giây, hay câu trả lời không đọc được | Chưa dịch được, thử lại |

## 7. Làm tiếp nếu cần

- **API dịch có sẵn trong Chrome** (`Translator`): dịch ngay trên máy, riêng tư,
  chạy cả khi mất mạng. Hiện mới có trên Chrome máy tính, lần đầu phải tải gói
  ngôn ngữ. Có thể thêm làm nguồn thứ hai, trước Google, cho máy nào có.
- **Chế độ hội thoại**: nói xong tự đổi chiều cho người bên kia nói tiếp.
- **Lịch sử tra gần đây**, lưu ở máy.
