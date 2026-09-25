# Phương án kỹ thuật — Chấm phát âm cho người học

> Trạng thái: **đã chọn hướng, đã triển khai phần chấm thanh điệu và nhịp cho
> từ đơn** (2026-09-25) theo [pronunciation-mvp.md](pronunciation-mvp.md) — số đo
> và chỗ khác thiết kế ở mục 14 của file đó. Tài liệu này giữ lại để biết vì sao
> các hướng khác bị loại.
> Ngày: 2026-09-24
> Liên quan: [product_design.md](../product_design.md) Phase 8, `scripts/tone_check.py`,
> `src/lib/speechTokens.ts`

Người học bấm nút micro, đọc một từ hoặc một câu, máy chấm trên thang 100 và
nói cho họ biết phải sửa chỗ nào.

## 1. Ràng buộc quyết định mọi thứ

Ba ràng buộc của dự án loại bỏ gần hết các lựa chọn thông thường, nên nêu trước:

| Ràng buộc | Hệ quả |
| --- | --- |
| **Không có thẻ tín dụng.** Đã là lý do bỏ TTS đám mây ở [audio-tts.md](audio-tts.md). | Loại toàn bộ API chấm phát âm thương mại. |
| **Deploy trên GitHub Pages** — hosting tĩnh, không có server, không giữ được khoá bí mật. | Không có chỗ đặt model phía máy chủ. Mọi thứ phải chạy trong trình duyệt người học. |
| **PWA chạy ngoại tuyến** là tính năng đã hứa ([pwa.md](pwa.md)). | Tính năng phụ thuộc mạng sẽ làm thủng lời hứa đó. |

Thêm một ràng buộc mềm: mobile-first. Cái gì chạy được trên điện thoại tầm
trung mới tính là chạy được.

Kết luận: **chấm ngay trên máy người học, không gửi tiếng nói đi đâu cả.** May
mắn là hướng này cũng là hướng tốt nhất cho quyền riêng tư — xem mục 9.

## 2. Vì sao không dùng Azure Pronunciation Assessment

Đây là câu trả lời đúng về mặt kỹ thuật nếu không vướng ràng buộc: Azure AI
Speech có sẵn API chấm phát âm cho `zh-CN`, trả điểm 0–100 cho từng tiêu chí
(accuracy, fluency, completeness, prosody) và điểm cho **từng âm vị**, đúng
nguyên cái tính năng đang bàn.

Chặn ở chỗ: cần tài khoản Azure, mà mọi bậc miễn phí đều đòi thẻ tín dụng. Y hệt
lý do đã bỏ Azure TTS.

Phương án dưới đây vì vậy được thiết kế để **thay thế được**: toàn bộ phần chấm
nằm sau một interface, muốn đổi sang Azure về sau chỉ phải viết một adapter mới.
Đừng kỳ vọng ngang bằng — Azure huấn luyện trên hàng nghìn giờ tiếng người học,
ta thì không có dữ liệu đó.

## 3. Điểm gồm những gì

Chia ba thành phần, chấm **riêng cho từng âm tiết** rồi mới gộp. Chấm theo âm
tiết là bắt buộc: một điểm tổng 62/100 không nói cho người học biết phải làm gì,
còn "âm tiết `xie4` của bạn lên giọng thay vì đổ xuống" thì có.

| Thành phần | Đo cái gì | Đo bằng cách nào |
| --- | --- | --- |
| **Thanh điệu** | Đường cao độ của vần có đúng hình thanh mong đợi không | Bám F0, so hình dáng — mục 5 |
| **Âm** | Phụ âm đầu và vần có đúng không | Tầng 1: khoảng cách tới bản mẫu. Tầng 2: GOP — mục 6 |
| **Nhịp** | Độ dài âm tiết, chỗ ngắt, tốc độ | Đường bao năng lượng so với bản mẫu |

Công thức đề xuất:

```
Tổng = 0.40 × Thanh + 0.40 × Âm + 0.20 × Nhịp        (tầng 2)
Tổng = 0.55 × Thanh + 0.25 × Âm + 0.20 × Nhịp        (tầng 1)
```

Tầng 1 dồn trọng số sang thanh điệu vì đó là thứ duy nhất tầng 1 đo được **chắc
chắn**. Đừng cho điểm nặng vào thứ mình đo yếu — điểm sẽ nhiễu và người học mất
tin.

Trọng số thanh điệu cao cũng đúng về mặt dạy học: người Việt đã quen ngôn ngữ có
thanh, nhưng hệ thanh Việt và hệ thanh Hán khác nhau, và sai thanh là kiểu sai
làm người nghe hiểu sai nghĩa hẳn — nặng hơn sai phụ âm.

## 4. Kiến trúc: hai tầng

Cùng một cách làm đã dùng cho audio: ship cái chạy được ngay trước, để cửa cho
cái tốt hơn.

```
Tầng 1 — không cần model, không tải gì thêm, chạy offline
         Thanh điệu bằng F0 + nhịp + độ gần với bản mẫu
                  ↓ khi có thời gian và model đã kiểm chứng
Tầng 2 — wav2vec2 CTC chạy trong trình duyệt, thêm điểm âm thật
                  ↓ chỉ khi nào có thẻ tín dụng
Tầng 3 — adapter Azure Pronunciation Assessment
```

Tầng 1 tự nó đã là một tính năng dùng được, không phải bản nháp. Nó chấm được
đúng thứ quan trọng nhất với người Việt học tiếng Trung, và chạy trong vài
mili-giây trên mọi điện thoại.

## 5. Tầng 1 — phần lớn công việc đã nằm sẵn trong repo

Đây là lý do tôi đề xuất bắt đầu từ đây thay vì từ model.

**Phần tham chiếu đã xong.** `expectedTones()` trong
[`src/lib/speechTokens.ts`](../src/lib/speechTokens.ts) đã trả về đúng chuỗi
thanh **nghe thấy** cho một chuỗi pinyin, đã xử lý biến điệu thanh 3
(`nǐ hǎo` → nghe ra `ní hǎo`), và đã trả `0` cho những chỗ **không nên chấm**:
thanh nhẹ, dấu câu, và chuỗi ba thanh 3 trở lên vốn không có một đáp án duy
nhất. Hàm này đã có test.

Đây không phải chi tiết nhỏ. Một bộ chấm không biết biến điệu sẽ trừ điểm người
đọc **đúng** — kiểu lỗi làm người học bỏ tính năng ngay lần thứ hai.

**Phần đo cũng đã xong, nhưng đang ở Python.**
[`scripts/tone_check.py`](../scripts/tone_check.py) có sẵn một bộ bám F0 bằng
tương quan chéo chuẩn hoá (khung 10 ms, 75–500 Hz, có chống nhầm gấp đôi chu kỳ,
có nội suy đỉnh) và một bộ so hình thanh trả về **biên độ an toàn** thay vì chỉ
đúng/sai. Bộ này đã được kiểm trên tín hiệu giả biết trước cao độ và trên giọng
Microsoft Huihui — xem [audio-voice.md](audio-voice.md).

Việc cần làm: **port sang TypeScript** vào `src/lib/pitch.ts`. Khoảng 120 dòng
numpy, không có phụ thuộc lạ, và hợp quy ước "logic thuần trong `src/lib`" của
repo. Quan trọng hơn: **port được cả bộ test** — tín hiệu giả có cao độ biết
trước là cách kiểm không cần tai người.

Biên độ an toàn đổi thành điểm, lấy điểm khởi đầu rồi hiệu chuẩn sau:

```ts
tone = clamp(50 + 250 * margin, 0, 100)   // margin như trong tone_check.py
```

**Điểm âm ở tầng 1** lấy bằng khoảng cách MFCC + DTW giữa bản đọc của người học
và file mẫu Piper tương ứng — repo đã có sẵn 60 file từ và 179 file câu. Cần
chuẩn hoá theo người nói (CMVN) vì giọng Piper và giọng người học khác nhau hoàn
toàn. Nói thẳng giới hạn: cách này **không** phân biệt nổi `sh` với `s`. Nó chỉ
trả lời được "có gần giống không", nên chỉ đáng 25% và chủ yếu dùng làm cổng
chặn ở mục 8.

## 6. Tầng 2 — GOP trong trình duyệt

Cách chuẩn trong ngành: một model wav2vec2 tinh chỉnh cho đầu ra âm vị, dóng
hàng bằng CTC segmentation, rồi tính **GOP (Goodness of Pronunciation)** — xác
suất hậu nghiệm của âm vị đúng tại đoạn đã dóng. GOP thấp nghĩa là máy nghe ra
âm đó không giống âm lẽ ra phải có. Đây cũng là cách Azure làm ở bên trong.

Chạy trong trình duyệt bằng ONNX Runtime Web hoặc transformers.js, WebGPU nếu
máy có, WASM nếu không. Model tải một lần ở lần đầu dùng tính năng rồi để service
worker giữ lại.

**Đây là chỗ rủi ro nhất của cả phương án**, cần một spike trước khi hứa hẹn gì:

- Có tìm được checkpoint tiếng Phổ thông **đầu ra mức pinyin hoặc âm vị** (không
  phải đầu ra chữ Hán) với giấy phép dùng được không? Model đầu ra chữ Hán vô
  dụng ở đây — thanh điệu biến mất, và mô hình ngôn ngữ bên trong sẽ "chữa" luôn
  lỗi phát âm.
- Xuất ONNX và lượng tử hoá int8 xong còn bao nhiêu MB? wav2vec2-base cỡ 95M
  tham số, lượng tử hoá vào khoảng 100MB — chấp nhận được trên Wi-Fi, nặng với
  3G.
- Chạy một clip 2 giây trên điện thoại tầm trung mất bao lâu? Ngân sách: có phản
  hồi trong 2 giây, quá thì phải hiện tiến trình.

Nếu spike không ra kết quả, tầng 1 vẫn đứng được một mình.

**Không dùng Whisper để chấm.** Whisper được huấn luyện để đoán ra ý người nói,
rất khoẻ trước giọng lạ, và có mô hình ngôn ngữ mạnh ở đầu ra. Người học đọc
`谢谢` sai bét thanh điệu thì Whisper vẫn phiên ra `谢谢`. Dùng nó chấm phát âm
sẽ cho điểm cao giả. Nó chỉ hợp làm cổng chặn "có đọc đúng từ được yêu cầu
không", mà việc đó DTW ở tầng 1 đã làm được, lại không phải tải 40MB.

## 7. Thu âm

`navigator.mediaDevices.getUserMedia({ audio: true })` rồi lấy **PCM thô qua
AudioWorklet**, không qua `MediaRecorder`.

Lý do: ta tự xử lý tín hiệu ngay tại chỗ, không cần file nén. Đi thẳng PCM thì
né được toàn bộ chuyện codec — Safari trên iOS không hỗ trợ `audio/webm`, và
giải nén ngược lại chỉ để lấy mẫu là việc thừa.

Vài chỗ dễ vấp:

- iOS đòi `AudioContext` được `resume()` bên trong một cử chỉ của người dùng.
  Khởi tạo ngay trong handler của nút micro.
- Tắt `echoCancellation`, `noiseSuppression`, `autoGainControl`. Ba thứ này được
  thiết kế cho gọi thoại và **bóp méo đúng cái ta cần đo** — AGC làm phẳng động
  lực, khử ồn ăn mất phụ âm xát.
- Hạ mẫu về 16 kHz trước khi phân tích, giống `tone_check.py`.
- Cắt khoảng lặng đầu và cuối theo ngưỡng năng lượng; người học hay bấm ghi rồi
  mới nghĩ.

## 8. Khi nào **không** chấm

Quan trọng ngang phần chấm. Một điểm số sai thấp còn tệ hơn không có điểm.

Từ chối chấm và mời đọc lại, khi:

- Số khung hữu thanh quá ít để dựng đường cao độ — `tone_check.py` đã trả `None`
  cho trường hợp này, giữ nguyên tinh thần đó.
- Nhiễu nền quá lớn (ước lượng SNR dưới ngưỡng).
- Khoảng cách DTW tới bản mẫu vượt ngưỡng xa — khả năng cao là người học đọc
  sang từ khác, hoặc micro bắt phải tiếng TV. Lúc đó nói "chưa nghe rõ, đọc lại
  giúp mình nhé", không phải "12/100".

Zibi nói câu từ chối này, giống như đang chữa bài ở các dạng bài tập khác.

## 9. Quyền riêng tư

Tiếng nói là dữ liệu sinh trắc. Vì tầng 1 và tầng 2 đều chạy trong máy người
học nên xử lý được gọn:

- **Không có gì rời khỏi thiết bị.** Nói rõ câu này ngay ở màn xin quyền micro —
  nó vừa đúng, vừa là lý do tốt để người dùng bấm đồng ý.
- **Không lưu bản ghi.** Chấm xong thì buffer bị bỏ. Muốn cho người học nghe lại
  bản thu của mình thì giữ trong bộ nhớ của trang, mất khi rời màn hình.
- Cũng vì vậy mà **không dùng Web Speech API `SpeechRecognition`**: trên Chrome
  nó gửi âm thanh lên máy chủ của hãng. Miễn phí và không cần khoá, nhưng đánh
  đổi bằng đúng thứ vừa hứa ở trên, mà chất lượng chấm thì không hơn.

## 10. Gợi ý cải thiện

Điểm số không dạy được ai. Phần có giá trị là câu nói sau điểm số.

Sinh gợi ý bằng **luật**, tra từ (âm tiết mong đợi, kiểu lỗi đo được) ra lời
khuyên tiếng Việt. Bảng này là **nội dung**, đặt ở `src/data/pronunciationTips.ts`,
và test được như mọi dữ liệu khác trong repo.

Hạt giống ban đầu, lấy theo những lỗi người Việt hay mắc khi học tiếng Trung:

| Chỗ sai đo được | Gợi ý |
| --- | --- |
| Thanh 4 không đổ xuống đủ | "Thanh 4 là đổ dốc từ cao xuống thấp, dứt khoát như khi bạn nói *Dạ!*" |
| Thanh 2 lên chưa đủ dốc | "Thanh 2 đi lên như đang hỏi lại: *Hả?*" |
| Thanh 3 không trũng | "Thanh 3 xuống thấp rồi mới lên. Đừng đọc bằng như thanh ngang." |
| `zh ch sh r` bị đọc phẳng | "Cong đầu lưỡi chạm vòm miệng. Người Việt hay đọc thành *tr, ch, s* — nghe sẽ ra âm khác." |
| `j q x` lẫn với `zh ch sh` | "Hạ đầu lưỡi sau răng dưới, nâng mặt lưỡi lên." |
| Vần `ü` | "Đọc *i* rồi tròn môi lại, giữ nguyên lưỡi." |
| Lẫn `-n` và `-ng` | "*-n* lưỡi chạm lợi trên, *-ng* gốc lưỡi nâng, miệng mở hơn." |
| Âm tiết dài quá so với bản mẫu | "Đọc liền hơi, đừng tách từng chữ." |

Mỗi lượt chấm chỉ đưa **một** gợi ý — gợi ý của âm tiết điểm thấp nhất. Đổ ba
bốn lời khuyên một lúc thì người học không sửa cái nào.

## 11. Hiệu chuẩn và cách hiện điểm

Máy chấm ở tầng 1 và 2 đều nhiễu hơn Azure. Thiết kế giao diện phải tính tới
chuyện đó:

- **Dải chữ trước, con số sau.** "Khá rồi!" to, `78` nhỏ bên cạnh. Con số nhiễu
  ±8 điểm mà hiện to giữa màn hình thì người học sẽ soi đúng chỗ ta yếu nhất.
- **Chấm từng âm tiết, hiện thành từng ô màu** trên dòng pinyin. Đây mới là thứ
  hành động được.
- **Không cho điểm liệt.** Sàn ở mức 40 với bản thu hợp lệ. Người mới đọc lần
  đầu mà nhận 11/100 thì bỏ tính năng, trong khi lỗi thật có khi chỉ ở micro.
- **XP thưởng theo việc có luyện, không theo điểm.** Gamification hiện tại
  thưởng nỗ lực; giữ nguyên nguyên tắc đó, đừng biến bộ chấm nhiễu thành trọng
  tài phát XP.

## 12. File trong repo

```
src/lib/pitch.ts              Bám F0 — port từ scripts/tone_check.py
src/lib/toneScore.ts          Đường cao độ + thanh mong đợi → điểm từng âm tiết
src/lib/mfcc.ts               MFCC + DTW so với bản mẫu
src/lib/pronunciation.ts      Gộp ba thành phần, cổng chặn, chọn gợi ý
src/lib/recorder.ts           getUserMedia + AudioWorklet → PCM 16 kHz
src/data/pronunciationTips.ts Bảng lỗi → lời khuyên
src/components/MicButton.tsx  Nút ghi, trạng thái xin quyền, mức âm lượng
src/pages/Speaking.tsx        Màn luyện nói
```

Giữ đúng quy ước sẵn có: mọi thứ trong `src/lib` là hàm thuần nhận mảng
`Float32Array` và trả số — test được thẳng, không cần micro, không cần DOM.

## 13. Kế hoạch triển khai

### M1 — Thu âm và nhìn thấy tiếng nói của mình

- `recorder.ts`, `MicButton`, xin quyền micro, hiện dạng sóng và cho nghe lại.
- Chưa chấm gì cả.
- **Nghiệm thu:** trên iPhone Safari và Android Chrome, bấm ghi, đọc, nghe lại
  được. Từ chối quyền thì có lời giải thích, không phải màn hình vỡ.

### M2 — Điểm thanh điệu *(phần lõi)*

- Port F0 sang `pitch.ts` kèm test tín hiệu giả.
- `toneScore.ts` nối với `expectedTones()` đã có.
- Hiện điểm từng âm tiết, kèm gợi ý thanh điệu.
- **Nghiệm thu:** đọc `你好` với thanh đúng được trên 80; cố tình đọc `nì hǎo`
  bị đánh dấu sai đúng ở âm tiết đầu; thu trong phòng ồn thì từ chối chấm thay
  vì cho điểm thấp.

### M3 — Điểm âm và nhịp

- MFCC + DTW với file mẫu, điểm nhịp, gộp thành thang 100.
- Bảng gợi ý đầy đủ.
- **Nghiệm thu:** thang điểm chạy trọn vẹn; đọc đúng mà bị chấm dưới 60 thì coi
  là lỗi phải sửa.

### M4 — Spike tầng 2

- Thử model wav2vec2 âm vị trong trình duyệt, đo kích thước và tốc độ thật trên
  điện thoại.
- **Nghiệm thu:** một báo cáo có số đo, kết luận nên làm hay không. Không đạt
  ngân sách ở mục 6 thì dừng, tầng 1 vẫn là sản phẩm.

## 14. Kiểm thử

Repo đang có 616 test và CI chặn deploy khi đỏ. Phần này phải vào được khuôn đó,
nghĩa là **không được phụ thuộc vào micro hay tai người**.

| Phạm vi | Cách kiểm |
| --- | --- |
| Bám F0 | Tín hiệu giả biết trước cao độ: sin thuần, chuỗi hài, đường lên/xuống/phẳng, đoạn vô thanh. Đúng cách `tone_check.py` đã kiểm. |
| Điểm thanh | Đường cao độ dựng bằng tay cho từng hình thanh → điểm cao; đường ngược hình → điểm thấp. |
| Biến điệu | `nǐ hǎo` đọc thành `ní hǎo` phải được **cộng** điểm, không bị trừ. Thanh nhẹ và dấu câu bị bỏ qua. |
| Cổng chặn | Nhiễu trắng, khoảng lặng, clip quá ngắn → từ chối chấm. |
| Gợi ý | Mỗi kiểu lỗi ra đúng một lời khuyên; âm tiết thấp điểm nhất được chọn. |
| Giao diện | Từ chối quyền micro, đang ghi, đang chấm, có kết quả — bốn trạng thái. |

Một mẹo repo này dùng được mà nơi khác không có: **Piper đọc thẳng từ pinyin
đánh số**, nên sinh được bản đọc **cố tình sai** làm dữ liệu kiểm. Đưa
`xie4 xie4` và `xie1 xie1` vào cùng một bộ chấm thì bản sai phải bị trừ điểm
đúng ở âm tiết đúng. Đó là fixture thật, sinh lại được, không cần thu giọng
người.

## 15. Rủi ro

| Rủi ro | Xử lý |
| --- | --- |
| Không có model âm vị tiếng Phổ thông dùng được | Tầng 1 không cần model. Tầng 2 là phần thêm, có spike riêng ở M4. |
| Điểm nhiễu làm người học nản | Sàn điểm, dải chữ trước số, cổng chặn ở mục 8, XP không gắn với điểm. |
| Bộ chấm trừ điểm người đọc đúng vì biến điệu | `expectedTones()` đã xử lý và đã có test; thêm test riêng ở mục 14. |
| Micro điện thoại và xử lý âm của hệ điều hành làm méo tín hiệu | Tắt AGC/khử ồn; hiệu chuẩn ngưỡng trên bản thu thật của vài máy trước khi chốt. |
| Model tầng 2 làm hỏng lời hứa ngoại tuyến | Tải theo yêu cầu, service worker giữ lại; chưa tải thì tự lùi về tầng 1. |
| Người học là trẻ em, giọng cao ngoài tầm 75–500 Hz | Nới trần F0 và chuẩn hoá theo mặt bằng giọng của chính người đó, không theo hằng số. |

## 16. Ngoài phạm vi

- Chấm hội thoại tự do. Chỉ chấm nội dung đã biết trước — tức là từ và câu mẫu
  trong khoá học. Biết trước đáp án là điều kiện để dóng hàng được.
- Nhận diện người nói, lưu hồ sơ giọng.
- Sửa phát âm bằng AI hội thoại (Phase 8).
- Chấm chữ viết tay.
