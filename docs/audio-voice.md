# Giọng đọc — vì sao đổi giọng, và cách audio được kiểm thanh điệu

> Trạng thái: **đã triển khai** (2026-09-24)
> Liên quan: [`scripts/generate-audio.py`](../scripts/generate-audio.py),
> [`scripts/tone_check.py`](../scripts/tone_check.py),
> [`src/lib/speechTokens.ts`](../src/lib/speechTokens.ts), [tones.md](tones.md)

## 1. Vấn đề: giọng cũ đọc thanh 4 thành thanh 1

60 file phát âm đầu tiên được sinh bằng giọng Piper `zh_CN-huayan-medium`.
Giọng này không đọc pinyin mà đọc **âm vị của espeak-ng**, và espeak ghi thanh
điệu bằng tên có nhiều chữ số — `55` cho thanh 1, `51` cho thanh 4. Piper chỉ giữ
ký tự đầu, nên cả hai cùng thành `5`:

```
妈 mā  →  mˈɑ5
骂 mà  →  mˈɑ5      ← cùng một đầu vào
师 shī →  s.ˈi.5
是 shì →  s.ˈi.5    ← cùng một đầu vào
```

Mô hình nhận hai đầu vào giống hệt nhau thì không thể đọc ra hai thanh khác nhau.
Đo cao độ thật trên file sinh ra: đọc riêng từng từ, **1/30** lần thanh 4 có đổ
xuống. 是, 大, 四, 去 đều đọc phẳng quanh 290 Hz, y như thanh 1.

Với một app dạy tiếng Trung thì đây là lỗi nặng nhất có thể có. Bài chọn thanh ở
[tones.md](tones.md) đọc 是 rồi hỏi "thanh mấy" — tai người học nghe thanh 1,
đáp án lại là thanh 4.

## 2. Giọng mới: `zh_CN-xiao_ya-medium`

Giọng này nhận thẳng **pinyin có số thanh**: phụ âm đầu, vần, thanh 1–5. Thanh 1
và thanh 4 là hai đầu vào khác nhau. Thêm một cái lợi: app đưa vào chính pinyin
viết tay trong `src/data/hsk1.ts`, nên chữ đa âm như 都 (dōu/dū) hay 觉
(jiào/jué) không có cơ hội bị máy đoán sai.

Bốn giọng được so trên 14 câu, mỗi câu sinh 3 lần, chấm từng âm tiết theo mục 4:

| Giọng | Thanh 1 | Thanh 2 | Thanh 3 | Thanh 4 | Tổng |
| --- | --- | --- | --- | --- | --- |
| `huayan` (giọng cũ) | 25/34 | 11/21 | 21/27 | 26/63 | 57% |
| **`xiao_ya`** | 23/36 | 16/21 | 25/27 | 35/61 | **68%** |
| `chaowen` (tinh chỉnh từ xiao_ya) | 11/36 | 15/21 | 23/27 | 38/63 | 59% |
| MeloTTS (bản ONNX của sherpa-onnx) | 32/36 | 9/21 | 22/23 | 7/58 | 51% |

Giảm độ ngẫu nhiên của `xiao_ya` (`noise_scale` và `noise_w` cùng về 0.333) nâng
con số lên **77%**. `chaowen` hay làm thanh 1 trùng xuống. MeloTTS gần như không
đổ thanh 4 — bản xuất ONNX bỏ mất đặc trưng BERT mà mô hình gốc dựa vào.

77% vẫn chưa đủ cho một app dạy phát âm. Hai mục sau là phần còn lại.

## 3. Từ đơn được đọc trong câu đệm

Mô hình học từ những câu hoàn chỉnh, nên một âm tiết đứng trơ trọi là thứ nó
chưa gặp bao giờ. Đọc riêng một từ thì thanh 4 **0/30** lần đổ xuống, thêm dấu
chấm cũng chỉ **1/30**.

Đặt từ vào giữa một câu đệm, đọc cả câu, rồi cắt riêng từ ra. Ranh giới cắt lấy
từ chính mô hình: nó báo mỗi âm vị dài bao nhiêu mẫu (`include_alignments`), nên
không phải đoán. Kết quả trên 30 từ một âm tiết, mỗi từ sinh 4 lần:

| Câu đệm | Thanh 1 | Thanh 4 | Tổng |
| --- | --- | --- | --- |
| Đọc riêng (mỗi từ 3 lần) | 26/27 | 0/30 | — |
| 我说__了。 | 16/36 | 40/40 | 79% |
| 我说__。 | 31/36 | 35/40 | 93% |
| 我说__，对。 | 33/36 | 39/40 | 97% |
| **我说__，你说。** | 35/36 | 39/40 | **99%** |

Từ đứng cuối câu thì bị giọng trùng xuống ở cuối câu kéo lệch: thanh 1 hạ dần.
Đứng trước dấu phẩy thì đọc trọn thanh mà không bị kéo. Bản dùng thật là
**"我说，__，你说。"**: thêm một chỗ ngắt trước từ để lát cắt rơi vào khoảng lặng,
không cắt vào đuôi chữ 说.

Câu mẫu thì không cần câu đệm, vì bản thân nó đã là một câu hoàn chỉnh.

## 4. Sinh vài bản rồi chọn bản đúng thanh

Mô hình có yếu tố ngẫu nhiên: cùng một từ, lần này thanh 4 đổ rõ, lần sau lại
phẳng hơn. [`tone_check.py`](../scripts/tone_check.py) chấm từng bản:

1. Đo cao độ (F0) theo khung 10 ms bằng tương quan chéo chuẩn hoá, sau khi lọc về
   16 kHz. Bộ đo được kiểm trên tín hiệu giả biết trước đường cao độ, và trên giọng
   Microsoft Huihui của Windows — giọng thương mại đọc đúng thanh: 四 đổ từ 223
   xuống 130 Hz, 谢 từ 287 xuống 174 Hz, 他 và 师 phẳng quanh 190 Hz.
2. Lấy phần vần của từng âm tiết theo ranh giới mô hình báo.
3. So với hình dáng thanh mong đợi:

| Thanh | Đạt khi |
| --- | --- |
| 1 | Độ dốc trong ±8%, và không thấp hơn mặt bằng cả câu quá 5% |
| 2 | Đi lên hơn 6% |
| 3 | Thấp hơn mặt bằng cả câu, hoặc có chỗ trũng |
| 4 | Đổ xuống hơn 10% |

Script sinh tối đa 16 bản cho mỗi từ và 8 bản cho mỗi câu, dừng sớm khi mọi âm
tiết đều đạt, rồi giữ bản có nhiều âm tiết đạt nhất. Với 60 từ hiện có: sinh 6
bản thì 54 từ đạt trọn, 16 bản thì 59, và sinh lại riêng 明天 thì đủ **60/60**.

### Thanh mong đợi khác thanh viết ở đâu

[`expectedTones()`](../src/lib/speechTokens.ts) tính thanh **nghe thấy**, có test:

- Hai thanh 3 liền nhau thì âm đầu nghe thành thanh 2: `nǐ hǎo` → `ní hǎo`.
- Chuỗi từ ba thanh 3 trở lên thì cách đọc tuỳ ngắt nhịp, nên chỉ chấm âm cuối.
- Thanh nhẹ không chấm: nó ngắn và thấp, không có đường cao độ nào để so.

### Biến điệu nào tự máy lo, biến điệu nào phải ghi ra

Đo trên chính giọng này, mỗi trường hợp 5 lần:

| Viết vào máy | Máy đọc | Kết luận |
| --- | --- | --- |
| `ni3 hao3` | 你 đi lên 5/5 lần | Máy tự biến thanh 3 — cứ ghi thanh gốc như sách |
| `bu4 shi4` | 不 đi lên 0/5 lần | Máy **không** tự biến 不 |
| `bu2 shi4` | 不 đi lên 5/5 lần | Phải ghi thanh đã biến |

Vì vậy pinyin trong dữ liệu ghi 一 và 不 theo thanh đã biến (`bú shì`, `yí ge`)
như sách giáo khoa HSK, còn thanh 3 thì để nguyên (`nǐ hǎo`).

## 5. Giới hạn

- Cách chấm chỉ nhìn **hình dáng cao độ**. Phụ âm và vần đúng là nhờ pinyin đầu
  vào, không phải nhờ bước chấm này.
- Ngưỡng là ước lượng. Một bản có thể đạt mọi ngưỡng mà tai người bản xứ vẫn thấy
  hơi gượng. Nghe lại một lượt sau khi sinh vẫn là bước cuối.
- 16 lần thử vẫn có thể không ra bản đạt trọn. Script in danh sách những clip đó
  ở cuối; muốn thử lại thì xoá riêng file mp3 đó rồi chạy lại.

## 6. Thêm hoặc sửa nội dung

```bash
pip install "piper-tts[alignment]" lameenc unicode-rbnf   # chỉ lần đầu
npm run generate-audio
```

- Lần đầu chạy sẽ tải model khoảng 60 MB vào `.piper-voices/` (đã nằm trong
  `.gitignore`).
- `src/assets/audio/manifest.json` ghi giọng và pinyin đã dùng cho từng file.
  Chạy lại thì chỉ sinh clip mới hoặc clip vừa đổi pinyin; đổi giọng thì sinh lại
  tất cả.
- Cả 60 từ mất khoảng 10 giây.

Hai test chặn đúng những chỗ dễ quên:

| Quên gì | Test báo đỏ |
| --- | --- |
| Thêm từ mà chưa sinh audio | `audioFiles.test.ts` — mọi từ đều có file |
| Sửa pinyin mà chưa sinh lại | `audioFiles.test.ts` — pinyin trong manifest khớp dữ liệu |
| Gõ nhầm pinyin (`shie`, `zhogn`) | `speechTokens.test.ts` — mọi âm tiết là âm tiết có thật |

## 7. Giấy phép

`xiao_ya` được huấn luyện trên kho thu âm Biaobei (BZNSYP), giấy phép **chỉ cho
mục đích phi thương mại**. App này miễn phí và phi thương mại nên dùng được.
Giọng cũ `huayan` thì không rõ giấy phép.

Nếu có ngày app thu tiền thì phải sinh lại audio bằng một giọng có giấy phép
thương mại, ví dụ Azure theo [audio-tts.md](audio-tts.md). Phần pinyin đánh số
và bước chấm thanh vẫn dùng lại được nguyên vẹn.
