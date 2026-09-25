# Chấm phát âm — bản thi công, miễn phí hoàn toàn

> Trạng thái: **M1–M3 đã triển khai (2026-09-25). M4 — hiệu chuẩn trên giọng
> người thật — chưa làm.** Chỗ nào bản làm ra khác bản thiết kế, và số đo khi
> làm, ghi ở [mục 14](#14-đã-làm--khác-bản-thiết-kế-ở-đâu-và-số-đo).
> Ngày: 2026-09-24, cập nhật 2026-09-25
> So sánh các hướng và lý do loại từng hướng: [pronunciation-scoring.md](pronunciation-scoring.md).
> Tài liệu này chỉ mô tả **một** hướng — hướng khả thi nhất và không tốn đồng nào.

**Dành cho agent đọc trước khi code.** Đọc hết mục 2, mục 4 và mục 14 trước khi
mở file nguồn. Ba cái bẫy ở mục 4 đều là loại lỗi làm bộ chấm trừ điểm người đọc
đúng. Mục 14 nói phần nào của thiết kế đã bị bỏ sau khi đo — đừng thêm lại.

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
| Thanh điệu, nhịp. *(Độ gần với bản mẫu có trong thiết kế nhưng đã bỏ sau khi đo — mục 14.)* | Điểm phụ âm đầu / vần thật (cần model, xem mục 6 của [pronunciation-scoring.md](pronunciation-scoring.md)) |
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
   ↓ + nhịp: độ dài so với phần có tiếng của file mẫu
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

## 5. Module

Giữ quy ước của repo: `src/lib` là hàm thuần, nhận `Float32Array`, trả số. Test
được thẳng, không cần micro, không cần DOM. Đây là chữ ký **đã làm**; thiết kế
ban đầu còn `mfcc.ts`, đã bỏ — mục 14.

```ts
// src/lib/dsp.ts — nền chung
resample(samples, fromRate, toRate): Float32Array      // lọc sinc rồi nội suy
frameEnergyDb(samples, rate): Float32Array             // cửa sổ 25 ms, bước 10 ms
speechRegion(energyDb, dropDb?, padFrames?, silenceDb?): FrameSpan | null
semitones(hz, referenceHz): number
encodeWav / decodeWav                                  // nghe lại và fixture

// src/lib/pitch.ts — port từ scripts/tone_check.py
/** Cao độ theo khung 10 ms bằng tương quan chéo chuẩn hoá, 70–600 Hz. 0 = vô thanh. */
export function f0Track(samples: Float32Array, rate: number): Float32Array

// src/lib/segment.ts
/** Cắt vùng có tiếng thành đúng `count` âm tiết. null = không cắt nổi. */
export function splitSyllables(
  f0: Float32Array, energyDb: Float32Array, count: number, region?: FrameSpan,
): FrameSpan[] | null

// src/lib/toneScore.ts
/** Điểm 0–100 cho một âm tiết. null khi thanh nhẹ hoặc dưới 5 khung hữu thanh. */
export function scoreTone(
  contourHz: readonly number[], expectedTone: number, baselineHz: number | null,
): { score; problem; startHz; endHz; slopeSt; contourSt } | null

// src/lib/pronunciation.ts — gộp tất cả
export function scoreAttempt(input: {
  samples: Float32Array; rate: number
  pinyin: string                     // pinyin của từ, đúng như trong hsk1.ts
  referenceSeconds: number | null    // độ dài phần có tiếng của file mẫu
  baselineHz: number | null          // mặt bằng giọng của người học
}): Attempt  // { rejected, total, tone, rhythm, syllables, weakest, problem, medianHz }

// src/lib/voiceBaseline.ts — mặt bằng giọng, localStorage, mục 4.2
// src/lib/referenceAudio.ts — đo độ dài phần có tiếng của file mẫu, nhớ theo URL
// src/lib/recorder.ts — phần duy nhất chạm micro: startRecording, Endpointer
```

`Attempt` trả **mã lỗi** (`problem`), không trả câu chữ: giao diện tra bảng ra
lời khuyên, nên đổi lời không phải đụng bộ chấm.

Giao diện:

```
src/data/pronunciationTips.ts               Bảng lỗi → lời khuyên tiếng Việt
src/components/speaking/MicButton.tsx       Nút ghi: đang mở micro, vòng mức âm lượng, đang chấm
src/components/speaking/PitchSketch.tsx     Đường giọng người học đè lên hình thanh mẫu
src/components/speaking/SpeakingResult.tsx  Dải chữ, điểm từng âm tiết, một lời khuyên, nghe lại
src/pages/Speaking.tsx                      Màn luyện nói: /lesson/:lessonId/speaking
```

## 6. Cách tính điểm

Mỗi âm tiết có `expectedTones()[i] !== 0` thì chấm; còn lại bỏ qua.

```
Thanh = trung bình scoreTone của các âm tiết được chấm
Nhịp  = theo r = độ dài phần có tiếng của người học / của bản mẫu:
        r trong [1/1.35, 1.35] → 100,  r = 1.8 hoặc 1/1.8 → 60,  r = 3 hoặc 1/3 → 0
        (nội suy tuyến tính theo |ln r| giữa các mốc)

Tổng  = 0.75 × Thanh + 0.25 × Nhịp        (thiết kế cũ: 0.60 / 0.20 / 0.20 Gần)
```

Không có bản mẫu thì bỏ phần Nhịp và chia lại trọng số cho phần còn lại. Trọng
số thanh điệu nặng vì đó là thứ duy nhất bản này đo được chắc chắn. Đừng dồn
trọng số vào thứ mình đo yếu — đúng lý do đã bỏ phần Gần.

**Điểm từng thanh** không dùng công thức `clamp(50 + 250 × margin)` của thiết kế:
với thanh 1, biên an toàn không bao giờ vượt 0.08, nên thanh 1 đọc hoàn hảo cũng
chỉ được 70. Thay vào đó, mỗi thanh có một thang riêng đo bằng **nửa cung** (giọng
trầm 100 Hz và giọng trẻ em 450 Hz đọc cùng một thanh ra cùng một con số), đi qua
ba mốc *rõ đúng → 100, vừa qua → 60, rõ sai → 0*:

| Thanh | Đo gì (trên phần lõi âm tiết) | 100 | 60 | 0 |
| --- | --- | --- | --- | --- |
| 4 | Độ đổi đầu → cuối | đổ 4.5 nửa cung | đổ 1.8 | lên 0.5 |
| 2 | Độ đổi đầu → cuối | lên 3.5 | lên 1 | đổ 1 |
| 1 | Độ lệch khỏi phẳng; có mặt bằng thì thêm độ cao so với giọng thường | lệch ≤ 1.5 | lệch 3 | lệch 5.5 |
| 3 | Độ sâu chỗ trũng, **hoặc** đứng thấp hẳn so với giọng thường | trũng 2 / thấp 2.5 | trũng 0.7 / thấp 0.8 | — |

Mốc 60 của thanh 4 và thanh 2 lấy từ `tone_check.py` (đổ 10%, lên 6%) quy ra nửa
cung. Chi tiết và các ngoại lệ nằm ngay trong `src/lib/toneScore.ts`.

**Sàn 40 điểm** cho mọi bản thu đã qua cổng chặn ở mục 7. Người mới đọc lần đầu
nhận 11/100 thì bỏ tính năng, trong khi lỗi thật có khi nằm ở cái micro.

## 7. Khi nào từ chối chấm

Một điểm số sai thấp tệ hơn không có điểm. Trả `rejected` và để Zibi mời đọc
lại, khi:

| Điều kiện (ngưỡng đang dùng) | `rejected` |
| --- | --- |
| Khung to nhất dưới −42 dBFS, hoặc dưới 5 khung hữu thanh | `too-quiet` |
| Năng lượng phân vị 95 trừ phân vị 10 dưới 12 dB — tiếng nói không nổi lên khỏi nền | `too-noisy` |
| Phần có tiếng dưới 0.2 s, `splitSyllables` trả `null`, hoặc một âm tiết cần chấm có dưới 5 khung hữu thanh | `too-short` |
| Phần có tiếng dài hơn 4 s — đã đọc sang thứ khác, hoặc micro bắt phải tiếng TV | `too-long` |

Thiết kế có `not-close` (DTW xa bản mẫu). Đã thay bằng `too-long`, vì DTW không
phân biệt nổi từ này với từ khác — mục 14.

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

Đã làm thêm, ngoài thiết kế:

- **Tự dừng** (`Endpointer` trong `recorder.ts`): đã nghe thấy giọng ít nhất
  0.15 s rồi im 0.9 s thì dừng; dài nhất 5 s. Ngưỡng "có tiếng" tính theo nền ồn
  của chính lần thu (phân vị 10 các đoạn), không theo hằng số — tắt tự chỉnh âm
  lượng thì mỗi máy một độ nhạy. Người học vẫn bấm dừng tay được.
- Trình duyệt không có AudioWorklet thì lùi về `ScriptProcessorNode`.
- Thay cho dạng sóng là **vòng mức âm lượng** quanh nút micro — đủ để biết máy có
  nghe thấy không, mà nhẹ hơn nhiều.

## 9. Gợi ý cải thiện

Tra bảng, không sinh tự do. Mỗi lượt chấm đưa **đúng một** gợi ý — của âm tiết
điểm thấp nhất. Đổ ba bốn lời khuyên một lúc thì người học không sửa cái nào.

`src/data/pronunciationTips.ts` (`TIPS`), theo mã lỗi `problem` của `Attempt`:

| `problem` | Đo được | Gợi ý |
| --- | --- | --- |
| `no-fall` | Thanh 4 không đổ xuống đủ | "Thanh 4 đổ dốc từ cao xuống thấp, dứt khoát như khi bạn nói *Dạ!*" |
| `no-rise` | Thanh 2 lên chưa đủ dốc | "Thanh 2 đi lên như đang hỏi lại: *Hả?*" |
| `no-dip` | Thanh 3 không trũng, cũng không thấp | "Thanh 3 xuống thấp rồi mới lên. Đừng đọc bằng như thanh ngang." |
| `not-level` | Thanh 1 không phẳng | "Thanh 1 giữ một mực, cao và đều, như đang ngân một nốt nhạc." |
| `too-low` | Thanh 1 phẳng nhưng thấp hơn giọng thường | "Thanh 1 phải cao — cao hơn giọng nói thường của bạn một chút, rồi giữ nguyên." |
| `too-fast` | Ngắn hơn bản mẫu nhiều | "Chậm lại một chút, đọc rõ từng âm tiết." |
| `too-slow` | Dài hơn bản mẫu nhiều | "Đọc liền hơi, đừng tách rời từng chữ." |

Âm tiết yếu nhất được nhắc khi dưới 75 điểm, dù đã qua ngưỡng đạt 60. Không có
âm tiết nào dưới 75 thì mới xét tới nhịp. Lời về thanh ghi rõ âm nào: *Âm “rén”: …*.

**Âm bị biến điệu nói lý do trước.** `nǐ hǎo` chấm `nǐ` theo thanh 2, nên lời
khuyên sẽ là "Thanh 2 đi lên…" cho một chữ mang dấu thanh 3. Người mới đọc thế
sẽ tưởng máy chấm nhầm. Vì vậy lời khuyên thêm phần đầu: *Âm “nǐ” đứng trước một
thanh 3 nên đọc thành thanh 2.* (`sandhiNote`).

Bảng này là **nội dung**, test được như mọi dữ liệu khác trong repo.

## 10. Cách hiện kết quả

- **Dải chữ trước, con số sau.** "Khá rồi!" to, `78` nhỏ bên cạnh. Bộ chấm này
  nhiễu vài điểm; hiện con số to giữa màn hình là mời người ta soi đúng chỗ ta
  yếu nhất.
- **Ô màu trên từng âm tiết** của dòng pinyin. Đây mới là thứ hành động được.
- **XP thưởng theo việc có luyện, không theo điểm.** Gamification hiện tại
  thưởng nỗ lực — giữ nguyên, đừng biến bộ chấm nhiễu thành trọng tài phát XP.
  Đã làm: `XP_REWARDS.speaking = 5` cho mỗi từ có một lượt được chấm, một lần mỗi
  từ mỗi lượt vào màn. Lượt bị từ chối chấm không được XP.
- Đã làm thêm: hình **đường giọng đè lên hình thanh mẫu** trên mỗi âm tiết
  (`PitchSketch`, hình thanh theo thang 5 mức của Chao), và nút **nghe lại giọng
  mình** ngay dưới lời khuyên.

## 11. Thứ tự làm

### M1 — Thu âm và nghe lại

`recorder.ts`, `MicButton`, xin quyền, hiện dạng sóng, nghe lại. Chưa chấm gì.

**Nghiệm thu:** iPhone Safari và Android Chrome đều ghi và phát lại được. Từ
chối quyền thì có lời giải thích, không phải màn hình vỡ.

> **Đã làm.** Kiểm trên Chromium máy tính với micro giả (phát fixture qua
> `MediaStreamDestination`): thu, tự dừng, vòng mức âm lượng, nghe lại đều chạy;
> ràng buộc `getUserMedia` đúng như mục 8. Từ chối quyền có test.
> **Chưa kiểm trên iPhone Safari và Android Chrome thật** — làm cùng M4.

### M2 — Điểm thanh điệu *(phần lõi)*

`pitch.ts` kèm test tín hiệu giả, `segment.ts`, `toneScore.ts` nối với
`expectedTones()`. Hiện điểm từng âm tiết.

**Nghiệm thu:** đọc `你好` đúng thanh được trên 80; cố tình đọc `nì hǎo` bị đánh
dấu sai **đúng ở âm tiết đầu**; thu trong phòng ồn thì từ chối chấm thay vì cho
điểm thấp.

> **Đã làm, đạt trên giọng máy.** `你好` đọc đúng: 100. Đọc `nì hǎo`: `nǐ` 13
> điểm, `hǎo` 100 — trong trình duyệt thật ra 18 và 100. Khoảng lặng, tiếng ồn
> không có giọng, và giọng chìm trong ồn đều bị từ chối chấm (có test). Bảng đủ
> ở mục 14.

### M3 — Thang 100 đầy đủ

`mfcc.ts`, điểm nhịp, gộp điểm, cổng chặn, bảng gợi ý, màn `Speaking`.

**Nghiệm thu:** đọc đúng mà bị chấm dưới 60 là lỗi phải sửa, không phải chuyện
bình thường.

> **Đã làm, trừ `mfcc.ts`** — viết xong, đo, rồi bỏ (mục 14). Mười từ đọc đúng
> bằng hai giọng được 85–100; không âm tiết đọc đúng nào dưới 60.

### M4 — Hiệu chuẩn

Thu thật trên ít nhất ba máy và ba người, chỉnh lại các ngưỡng ở mục 4.3, ghi số
đo vào tài liệu này.

**Nghiệm thu:** không có người đọc đúng nào bị trừ điểm oan trong bộ mẫu thu.

> **Chưa làm.** Cần người thật đọc vào micro thật, nên agent không tự làm được.
> Cách làm gợi ý: thu mỗi người cả 60 từ, đọc đúng và cố tình đọc sai vài từ,
> lưu WAV 16 kHz vào một thư mục như `src/test/fixtures/speech`, thêm vào
> `index.json` rồi để `pronunciation.fixtures.test.ts` chạy trên đó. Chỗ đáng
> soi trước tiên ghi ở cuối mục 14.

### Bước dọn đường cho câu mẫu *(làm khi cần, không thuộc MVP)*

`scripts/generate-audio.py` đã tính sẵn ranh giới từng âm tiết **và** chỗ hết
phụ âm đầu — biến `spans` trong `synthesize()`, dạng
`(token, bắt đầu, hết phụ âm đầu, kết thúc)` tính theo mẫu. Hiện nó bị bỏ đi sau
khi kiểm thanh. **Ghi thêm vào `src/assets/audio/manifest.json`** thì phía trình
duyệt dóng hàng bản thu của người học với bản mẫu bằng DTW rồi suy ra ranh giới
âm tiết — cắt được cả câu nối liền hơi, không phải đoán theo năng lượng. Rẻ, và
mở khoá phần chấm câu.

## 12. Kiểm thử

Repo đang có 775 test (lúc viết thiết kế là 616) và CI chặn deploy khi đỏ. Phần này phải vào đúng khuôn:
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

> **Đã làm:** `scripts/generate-speech-fixtures.py` sinh 10 từ vào
> `src/test/fixtures/speech/` (WAV 16 kHz, kèm `index.json`). "Người học" là
> giọng `xiao_ya` đọc lại rồi hạ hoặc nâng cao độ 20%, để bộ chấm luôn so một
> giọng khác bản mẫu. Không dùng giọng Piper thứ hai (`chaowen`): nó đọc sai
> thanh quá thường — 你 trong 你好 chỉ lên giọng 1/8 lần — nên không làm được bản
> "đọc đúng". File để không đệm lặng; test tự thêm lặng và tiếng nền hai đầu.

## 13. Những gì bản này cố ý không làm

- Chấm phụ âm đầu và vần thật. Cần model âm vị — hướng đó, ngân sách và spike
  nằm ở mục 6 của [pronunciation-scoring.md](pronunciation-scoring.md).
- Chấm câu mẫu. Xem bước dọn đường ở mục 11.
- Chấm hội thoại tự do. Bộ chấm này cần biết trước đáp án mới dóng hàng được.
- Dùng Whisper hay `SpeechRecognition` của trình duyệt. Lý do ở
  [pronunciation-scoring.md](pronunciation-scoring.md) mục 6 và mục 9 — tóm gọn:
  một cái cho điểm cao giả, một cái gửi tiếng nói lên máy chủ của hãng.

## 14. Đã làm — khác bản thiết kế ở đâu, và số đo

Ngày 2026-09-25. Mọi số dưới đây đo trên **giọng máy**; chưa có giọng người — M4.

### 14.1. Bỏ phần "Gần" (MFCC + DTW)

Đã viết `mfcc.ts` (12 hệ số, chuẩn hoá theo người nói) cùng DTW, rồi đo xem nó
có phân biệt nổi các từ với nhau không: lấy 60 từ của khoá do một giọng Piper
khác (`zh_CN-chaowen`) đọc, so với cả 60 file mẫu trong `src/assets/audio`, xem
file mẫu gần nhất có đúng là từ đó không. Đoán bừa thì trúng 1/60.

| Cách chuẩn hoá | Gần nhất là đúng từ | Đúng từ nằm trong 5 gần nhất | Khoảng cách tới đúng từ ÷ trung vị tới từ khác |
| --- | --- | --- | --- |
| MFCC, CMVN | 7/60 | 20/60 | 0.92 |
| MFCC, CMN | 9/60 | 30/60 | 0.83 |
| MFCC + delta, CMVN | 5/60 | 20/60 | 0.94 |
| MFCC, CMVN rồi delta | 6/60 | 20/60 | 0.93 |

Đọc đúng từ mà khoảng cách chỉ nhỏ hơn đọc sang từ khác 6–17%: ngưỡng đặt ở đâu
cũng hoặc trừ oan người đọc đúng, hoặc cho qua người đọc sai. Một phần điểm như
thế chỉ cộng nhiễu vào tổng. Nên đã bỏ cả module, dồn trọng số về thanh và nhịp
(0.75 / 0.25), và thay cổng `not-close` bằng `too-long`.

**Đừng thêm lại** chừng nào chưa có cách đo khác. Chấm phụ âm và vần thật cần
model âm vị — mục 6 của [pronunciation-scoring.md](pronunciation-scoring.md).

### 14.2. Chấm thanh khác thiết kế ở đâu

- **Thang riêng từng thanh, đo bằng nửa cung**, thay cho `50 + 250 × margin` —
  bảng ở mục 6.
- **Bỏ 20% đầu và 10% cuối âm tiết** trước khi đo hình dáng. Qua phụ âm m, n, l,
  r, sh cao độ vọt lên trước khi tới thanh thật, nên thanh 1 đọc đúng bị đo
  thành đi lên — `mā` đọc đúng từng chỉ được 54. `tone_check.py` không gặp chuyện
  này vì biết ranh giới phụ âm từ mô hình; giọng người thì không có.
- **Lọc khung nhảy quãng tám.** Giọng rè ở đáy thanh 3 làm bộ bám tụt một quãng
  tám (169 → 74 Hz). Khung lệch trung vị của âm tiết quá 9 nửa cung bị bỏ.
- **Thanh 3 có mặt bằng:** thấp mà không trũng, lại đi lên dốc từ 2.5 nửa cung,
  thì là thanh 2 đọc nhầm — tối đa 30 điểm.
- **Thanh 3 chưa có mặt bằng** (từ một âm tiết, dưới 5 lượt đã chấm): chỉ loại
  hai kiểu chắc chắn sai — đổ dốc như thanh 4 (từ 4.5 nửa cung) hoặc vút lên như
  thanh 2 (từ 3 nửa cung) → 30 điểm; còn lại 70. Cố ý dễ dãi: không biết "thấp"
  là thấp so với gì thì đừng trừ điểm.
- **Cắt âm tiết:** bỏ mẩu tiếng lẻ ở mép ngắn hơn 80 ms, gộp các khoảng hở nhỏ
  nhất, rồi tách ở đáy năng lượng; không tìm được đáy thì chia đều.
- **Mặt bằng của từ nhiều âm tiết** là trung vị cao độ của chính lượt đọc đó; từ
  một âm tiết mới dùng mặt bằng dành dụm (trung vị 20 lượt gần nhất, cần ít nhất
  5 lượt).

### 14.3. Số đo trên fixture

`pronunciation.fixtures.test.ts`, fixture ở mục 12. Giọng trầm có mặt bằng
khoảng 212 Hz, giọng cao khoảng 352 Hz.

| Từ | Giọng | Đọc đúng | Đọc sai thanh | Âm tiết sai được chấm |
| --- | --- | --- | --- | --- |
| nǐ hǎo | trầm | 100 | `ni4 hao3` → 67 | nǐ 13, hǎo vẫn 100 |
| xiè xie | cao | 91 | `xie1 xie5` → 40 | xiè 0 |
| shì | trầm | 100 | `shi1` → 40 | shì 13 |
| tā | cao | 99 | `ta4` → 40 | tā 7 |
| rén | trầm | 100 | `ren4` → 40 | rén 0 |
| hǎo | cao | 100 · chưa có mặt bằng: 78 | `hao2` → 51 | hǎo 35 |
| lǎo shī | trầm | 100 | `lao3 shi4` → 77 | shī 38, lǎo vẫn 100 |
| mā ma | cao | 85 | | |
| shàng wǔ | trầm | 100 | | |
| bú kè qi | cao | 86 | | |

Trong trình duyệt thật (Chromium, micro giả phát fixture qua đường thu thật:
AudioWorklet, hạ mẫu, tự dừng): `nǐ hǎo` đọc đúng 100; đọc `nì hǎo` 69, `nǐ` 18
điểm, Zibi nhắc đúng âm đầu kèm câu giải thích biến điệu.

### 14.4. Lỗi tìm ra ở audio mẫu

Phần nhịp so độ dài với file mẫu, nên file mẫu được đo kỹ hơn trước — và lộ ra
55/60 file từ đơn dính một mẩu 20–70 ms của chữ đệm đứng sau. Đã sửa ở
`scripts/generate-audio.py` (cắt ở chỗ lặng thật) và sinh lại cả 60 file, ghi ở
[audio-voice.md](audio-voice.md).

### 14.5. Chỗ yếu đã biết — soi trước tiên khi làm M4

- **Mọi ngưỡng mới chỉnh trên giọng máy.** Giọng người lệch nhiều hơn: thanh 1
  không phẳng bằng, thanh 3 hay chỉ đọc nửa (xuống mà không lên), tốc độ đọc xa
  bản mẫu hơn.
- **Thanh 1 và thanh 2 sau phụ âm** thấp điểm nhất trong các bản đọc đúng: `mā`
  80, `bú` (trong `bú kè qi`) 73. Dưới 75 nên Zibi vẫn nhắc `bú` dù đọc đúng.
- **Thanh 3 chưa có mặt bằng dễ dãi:** đọc đúng chỉ được 70, và theo luật hiện
  tại đọc thành thanh ngang cũng được 70.
- **Lượt đầu của người mới** là lúc bộ chấm yếu nhất: từ một âm tiết chưa có mặt
  bằng cho tới lượt thứ năm được chấm.
- **Cổng chặn** (−42 dBFS, 12 dB) chưa thử trên micro điện thoại thật.
- **Trần 600 Hz** của bộ bám cao độ: giọng trẻ em cao hơn thế thì hỏng, chưa có
  mẫu để thử.
