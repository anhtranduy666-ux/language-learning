# Chấm phát âm — bản thi công, miễn phí hoàn toàn

> Trạng thái: **đã chốt, chưa triển khai.** Đây là bản để làm theo.
> Ngày: 2026-09-24
> So sánh các hướng và lý do loại từng hướng: [pronunciation-scoring.md](pronunciation-scoring.md).
> Tài liệu này chỉ mô tả **một** hướng — hướng khả thi nhất và không tốn đồng nào.

**Dành cho agent đọc trước khi code.** Đọc hết mục 2 và mục 4 trước khi mở file
nguồn. Ba cái bẫy ở mục 4 đều là loại lỗi làm bộ chấm trừ điểm người đọc đúng.

## 1. Tính năng

Người học mở một từ, bấm micro, đọc. Máy trả về:

- một điểm trên thang 100,
- điểm riêng cho từng âm tiết, hiện thành ô màu trên dòng pinyin,
- một câu gợi ý sửa, do Zibi nói.

Không tài khoản, không khoá API, không tải model, không cần mạng, không byte
tiếng nói nào rời khỏi máy.

## 2. Phạm vi của bản này

| Làm | Không làm |
| --- | --- |
| Chấm **từ đơn** — 60 từ của khoá HSK 1, dài 1–3 âm tiết | Chấm câu mẫu. Câu cần dóng hàng chắc tay hơn, để sang sau |
| Thanh điệu, nhịp, độ gần với bản mẫu | Điểm phụ âm đầu / vần thật (cần model, xem mục 6 của [pronunciation-scoring.md](pronunciation-scoring.md)) |
| Chạy trong trình duyệt, ngoại tuyến | Bất kỳ dịch vụ đám mây nào |

Giới hạn "chỉ từ đơn" là cố ý. Từ đơn có số âm tiết biết trước và ít, nên cắt
âm tiết đáng tin; câu nối liền hơi thì không. Ship phần chắc tay trước.

**Vì sao hướng này miễn phí thật, không phải miễn phí có điều kiện:** không có
tài khoản nào để hết hạn, không có hạn mức nào để vượt, và chi phí vẫn bằng
không khi số người học tăng — vì máy tính toán là máy của họ. Đúng lý lẽ đã dùng
khi chọn Piper thay cho TTS đám mây.

## 3. Đường đi của một lần chấm

```
Bấm micro
   ↓ getUserMedia + AudioWorklet
PCM thô của thiết bị
   ↓ resample 16 kHz, cắt lặng hai đầu
Float32Array
   ↓ pitch.ts
Đường F0, khung 10 ms
   ↓ segment.ts  (số âm tiết đã biết trước từ pinyin)
Ranh giới từng âm tiết
   ↓ toneScore.ts  ×  expectedTones() đã có sẵn
Điểm thanh từng âm tiết
   ↓ + nhịp + khoảng cách DTW tới file mẫu
Điểm 100 + âm tiết yếu nhất
   ↓ pronunciationTips.ts
Một câu gợi ý
```

## 4. Ba cái bẫy — đọc trước khi code

### 4.1. Biến điệu: đừng tự tính lại thanh mong đợi

`expectedTones()` trong [`src/lib/speechTokens.ts`](../src/lib/speechTokens.ts)
**đã** trả về chuỗi thanh *nghe thấy*, không phải thanh viết ra:

- `nǐ hǎo` → `[2, 3]`, vì thanh 3 đứng trước thanh 3 đọc lên thành thanh 2.
- Thanh nhẹ → `0`.
- Dấu câu → `0`.
- Chuỗi từ ba thanh 3 trở lên: các âm tiết trước âm cuối → `0`.

`0` nghĩa là **không chấm âm tiết này**, không phải "chấm 0 điểm". Bỏ qua nó
trong phép lấy trung bình.

Tự viết lại luật này là cách nhanh nhất để bộ chấm trừ điểm người đọc đúng.
Hàm đã có test, cứ gọi.

### 4.2. Mặt bằng cao độ: từ đơn không tự cho biết mặt bằng của người nói

`tone_check.py` phân biệt thanh 1 (cao và phẳng) với thanh 3 (thấp) bằng cách so
cao độ trung bình của âm tiết với **mặt bằng giọng của người nói**. Với một clip
nhiều âm tiết thì lấy trung bình cả clip là ra.

Với một từ **một âm tiết** thì mặt bằng chính là âm tiết đó, tỷ số luôn bằng 1,
và phép so vô nghĩa.

Cách xử lý:

- Giữ một **mặt bằng riêng của người học**: trung vị F0 hữu thanh của các bản
  thu gần nhất, lưu trong `localStorage`, cập nhật sau mỗi lần chấm hợp lệ.
- Chưa đủ dữ liệu (dưới 5 bản thu) thì **chỉ chấm thanh 1 và thanh 3 theo hình
  dáng** — phẳng, hay có trũng — bỏ phần so mặt bằng đi. Thanh 2 và thanh 4 vốn
  chấm theo độ dốc nên không ảnh hưởng.
- Giọng trẻ em vượt trần 500 Hz của `tone_check.py`. Nới trần lên 600 Hz và để
  mặt bằng tự thích nghi, đừng gắn hằng số.

### 4.3. Ngưỡng hiện có được chỉnh cho giọng máy, không phải giọng người

`FALL_T4 = -0.10`, `RISE_T2 = 0.06`, `FLAT_T1 = 0.08` trong `tone_check.py` được
chỉnh trên audio Piper — đều đặn hơn giọng người nhiều. Lấy làm điểm khởi đầu,
rồi **chỉnh lại trên bản thu thật của vài người trên vài máy** trước khi chốt.
Ghi số đo vào tài liệu này khi chỉnh xong.

## 5. Module cần viết

Giữ quy ước của repo: `src/lib` là hàm thuần, nhận `Float32Array`, trả số. Test
được thẳng, không cần micro, không cần DOM.

```ts
// src/lib/pitch.ts — port từ scripts/tone_check.py
/** Cao độ theo khung 10 ms bằng tương quan chéo chuẩn hoá. 0 = vô thanh. */
export function f0Track(samples: Float32Array, rate: number): Float32Array

// src/lib/segment.ts
/** Cắt vùng hữu thanh thành đúng `count` âm tiết, theo cực tiểu năng lượng. */
export function splitSyllables(
  samples: Float32Array, rate: number, count: number,
): Array<{ start: number; end: number }> | null   // null = không cắt nổi

// src/lib/toneScore.ts
/** Điểm 0–100 cho một âm tiết. null khi không đủ khung hữu thanh để chấm. */
export function scoreTone(
  f0: Float32Array, expectedTone: number, baselineHz: number | null,
): { score: number; margin: number; startHz: number; endHz: number } | null

// src/lib/mfcc.ts
/** Khoảng cách DTW trên MFCC đã chuẩn hoá theo người nói. Càng nhỏ càng giống. */
export function dtwDistance(a: Float32Array, b: Float32Array, rate: number): number

// src/lib/pronunciation.ts — gộp tất cả
export interface Attempt {
  total: number                      // 0–100
  syllables: Array<{ token: string; expectedTone: number; score: number | null }>
  weakest: number | null             // chỉ số âm tiết yếu nhất, để lấy gợi ý
  tip: string | null
  rejected: 'too-quiet' | 'too-noisy' | 'too-short' | 'not-close' | null
}
export function scoreAttempt(input: {
  samples: Float32Array; rate: number
  pinyin: string                     // pinyin của từ, dạng đã có trong hsk1.ts
  reference: Float32Array | null     // file mẫu trong src/assets/audio
  baselineHz: number | null
}): Attempt

// src/lib/recorder.ts — phần duy nhất chạm trình duyệt
export async function startRecording(): Promise<Recorder>
```

Giao diện:

```
src/data/pronunciationTips.ts   Bảng lỗi → lời khuyên tiếng Việt
src/components/MicButton.tsx    Nút ghi: xin quyền, mức âm lượng, đang chấm
src/pages/Speaking.tsx          Màn luyện nói
```

## 6. Cách tính điểm

Mỗi âm tiết có `expectedTones()[i] !== 0` thì chấm; còn lại bỏ qua.

```
Thanh = trung bình scoreTone của các âm tiết được chấm
Nhịp  = 100 - 200 × |độ dài của người học / độ dài bản mẫu - 1|,  kẹp trong [0, 100]
Gần   = 100 - 25 × dtwDistance,  kẹp trong [0, 100]

Tổng  = 0.60 × Thanh + 0.20 × Nhịp + 0.20 × Gần
```

Trọng số thanh điệu là 60 vì đó là thứ duy nhất bản này đo được chắc chắn. Đừng
dồn trọng số vào thứ mình đo yếu.

Từ biên độ an toàn ra điểm, lấy làm điểm khởi đầu rồi hiệu chuẩn:

```ts
score = clamp(50 + 250 * margin, 0, 100)
```

**Sàn 40 điểm** cho mọi bản thu đã qua cổng chặn ở mục 7. Người mới đọc lần đầu
nhận 11/100 thì bỏ tính năng, trong khi lỗi thật có khi nằm ở cái micro.

## 7. Khi nào từ chối chấm

Một điểm số sai thấp tệ hơn không có điểm. Trả `rejected` và để Zibi mời đọc
lại, khi:

| Điều kiện | `rejected` |
| --- | --- |
| RMS dưới ngưỡng, hoặc dưới 5 khung hữu thanh | `too-quiet` |
| SNR ước lượng dưới ngưỡng | `too-noisy` |
| Sau khi cắt lặng còn dưới 200 ms, hoặc `splitSyllables` trả `null` | `too-short` |
| `dtwDistance` vượt ngưỡng xa — nhiều khả năng đọc sang từ khác, hoặc micro bắt phải tiếng TV | `not-close` |

## 8. Thu âm

`navigator.mediaDevices.getUserMedia({ audio: {...} })` rồi lấy PCM thô qua
**AudioWorklet**, không qua `MediaRecorder` — ta xử lý ngay tại chỗ, không cần
file nén, và né được chuyện Safari iOS không hỗ trợ `audio/webm`.

```ts
audio: {
  echoCancellation: false,   // ba thứ này thiết kế cho gọi thoại
  noiseSuppression: false,   // và bóp méo đúng cái ta cần đo:
  autoGainControl: false,    // AGC làm phẳng động lực, khử ồn ăn mất phụ âm xát
}
```

- iOS đòi `AudioContext.resume()` nằm trong một cử chỉ của người dùng — khởi tạo
  ngay trong handler của nút micro.
- Hạ mẫu về 16 kHz trước khi phân tích, giống `tone_check.py`.
- Cắt lặng hai đầu theo ngưỡng năng lượng; người học hay bấm ghi rồi mới nghĩ.
- Không lưu bản ghi. Muốn cho nghe lại thì giữ trong bộ nhớ của trang, mất khi
  rời màn hình. Nói rõ điều này ở màn xin quyền micro — vừa đúng, vừa là lý do
  tốt để người ta bấm đồng ý.

## 9. Gợi ý cải thiện

Tra bảng, không sinh tự do. Mỗi lượt chấm đưa **đúng một** gợi ý — của âm tiết
điểm thấp nhất. Đổ ba bốn lời khuyên một lúc thì người học không sửa cái nào.

`src/data/pronunciationTips.ts`, hạt giống ban đầu:

| Đo được | Gợi ý |
| --- | --- |
| Thanh 4 không đổ xuống đủ | "Thanh 4 đổ dốc từ cao xuống thấp, dứt khoát như khi bạn nói *Dạ!*" |
| Thanh 2 lên chưa đủ dốc | "Thanh 2 đi lên như đang hỏi lại: *Hả?*" |
| Thanh 3 không trũng | "Thanh 3 xuống thấp rồi mới lên. Đừng đọc bằng như thanh ngang." |
| Thanh 1 không phẳng | "Thanh 1 giữ một mực, cao và đều, như đang ngân một nốt." |
| Đọc nhanh hơn bản mẫu nhiều | "Chậm lại, giữ đều từng âm tiết." |
| Đọc chậm hơn bản mẫu nhiều | "Đọc liền hơi, đừng tách rời từng chữ." |
| `Gần` thấp nhưng thanh đúng | "Thanh đúng rồi. Nghe lại bản mẫu và để ý phần phụ âm đầu." |

Bảng này là **nội dung**, test được như mọi dữ liệu khác trong repo.

## 10. Cách hiện kết quả

- **Dải chữ trước, con số sau.** "Khá rồi!" to, `78` nhỏ bên cạnh. Bộ chấm này
  nhiễu vài điểm; hiện con số to giữa màn hình là mời người ta soi đúng chỗ ta
  yếu nhất.
- **Ô màu trên từng âm tiết** của dòng pinyin. Đây mới là thứ hành động được.
- **XP thưởng theo việc có luyện, không theo điểm.** Gamification hiện tại
  thưởng nỗ lực — giữ nguyên, đừng biến bộ chấm nhiễu thành trọng tài phát XP.

## 11. Thứ tự làm

### M1 — Thu âm và nghe lại

`recorder.ts`, `MicButton`, xin quyền, hiện dạng sóng, nghe lại. Chưa chấm gì.

**Nghiệm thu:** iPhone Safari và Android Chrome đều ghi và phát lại được. Từ
chối quyền thì có lời giải thích, không phải màn hình vỡ.

### M2 — Điểm thanh điệu *(phần lõi)*

`pitch.ts` kèm test tín hiệu giả, `segment.ts`, `toneScore.ts` nối với
`expectedTones()`. Hiện điểm từng âm tiết.

**Nghiệm thu:** đọc `你好` đúng thanh được trên 80; cố tình đọc `nì hǎo` bị đánh
dấu sai **đúng ở âm tiết đầu**; thu trong phòng ồn thì từ chối chấm thay vì cho
điểm thấp.

### M3 — Thang 100 đầy đủ

`mfcc.ts`, điểm nhịp, gộp điểm, cổng chặn, bảng gợi ý, màn `Speaking`.

**Nghiệm thu:** đọc đúng mà bị chấm dưới 60 là lỗi phải sửa, không phải chuyện
bình thường.

### M4 — Hiệu chuẩn

Thu thật trên ít nhất ba máy và ba người, chỉnh lại các ngưỡng ở mục 4.3, ghi số
đo vào tài liệu này.

**Nghiệm thu:** không có người đọc đúng nào bị trừ điểm oan trong bộ mẫu thu.

### Bước dọn đường cho câu mẫu *(làm khi cần, không thuộc MVP)*

`scripts/generate-audio.py` đã tính sẵn ranh giới từng âm tiết **và** chỗ hết
phụ âm đầu — biến `spans` trong `synthesize()`, dạng
`(token, bắt đầu, hết phụ âm đầu, kết thúc)` tính theo mẫu. Hiện nó bị bỏ đi sau
khi kiểm thanh. **Ghi thêm vào `src/assets/audio/manifest.json`** thì phía trình
duyệt dóng hàng bản thu của người học với bản mẫu bằng DTW rồi suy ra ranh giới
âm tiết — cắt được cả câu nối liền hơi, không phải đoán theo năng lượng. Rẻ, và
mở khoá phần chấm câu.

## 12. Kiểm thử

Repo đang có 616 test và CI chặn deploy khi đỏ. Phần này phải vào đúng khuôn:
**không phụ thuộc micro, không phụ thuộc tai người.**

| Phạm vi | Cách kiểm |
| --- | --- |
| `f0Track` | Tín hiệu giả biết trước cao độ: sin thuần, chuỗi hài, đường lên / xuống / phẳng, đoạn vô thanh, tín hiệu dễ gây nhầm gấp đôi chu kỳ. Đúng cách `tone_check.py` đã kiểm. |
| `scoreTone` | Đường cao độ dựng bằng tay cho từng hình thanh → điểm cao; đường ngược hình → điểm thấp; quá ít khung → `null`. |
| Biến điệu | `nǐ hǎo` đọc thành `ní hǎo` phải được **cộng** điểm. Thanh nhẹ và dấu câu bị bỏ qua, không kéo trung bình xuống. |
| Mặt bằng | Chưa đủ 5 bản thu thì thanh 1 và 3 chấm theo hình dáng; giọng cao 450 Hz và giọng trầm 90 Hz cùng đọc đúng đều phải được điểm cao. |
| `splitSyllables` | Từ hai âm tiết có khoảng nghỉ rõ; hai âm tiết dính nhau; một âm tiết; tiếng ồn không có âm tiết nào → `null`. |
| Cổng chặn | Nhiễu trắng, khoảng lặng, clip 100 ms, clip đọc sang từ khác → đúng bốn giá trị `rejected`. |
| Gợi ý | Mỗi kiểu lỗi ra đúng một lời khuyên; chọn đúng âm tiết thấp điểm nhất. |
| Giao diện | Bốn trạng thái: chưa có quyền, đang ghi, đang chấm, có kết quả. |

**Mẹo riêng của repo này.** Piper đọc thẳng từ pinyin đánh số, nên sinh được bản
đọc **cố tình sai** làm dữ liệu kiểm: đưa `xie4 xie5` và `xie1 xie5` vào cùng bộ
chấm, bản sai phải bị trừ điểm **đúng ở âm tiết đúng**. Fixture thật, sinh lại
được, không cần thu giọng người. Dùng `scripts/generate-audio.py` để sinh, cất
vào thư mục fixture riêng, đừng lẫn với `src/assets/audio/`.

## 13. Những gì bản này cố ý không làm

- Chấm phụ âm đầu và vần thật. Cần model âm vị — hướng đó, ngân sách và spike
  nằm ở mục 6 của [pronunciation-scoring.md](pronunciation-scoring.md).
- Chấm câu mẫu. Xem bước dọn đường ở mục 11.
- Chấm hội thoại tự do. Bộ chấm này cần biết trước đáp án mới dóng hàng được.
- Dùng Whisper hay `SpeechRecognition` của trình duyệt. Lý do ở
  [pronunciation-scoring.md](pronunciation-scoring.md) mục 6 và mục 9 — tóm gọn:
  một cái cho điểm cao giả, một cái gửi tiếng nói lên máy chủ của hãng.
