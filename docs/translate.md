# Dịch Việt → Trung

> Trạng thái: **đã làm** (2026-09-25).
> Mã: [`src/lib/translate.ts`](../src/lib/translate.ts), [`src/pages/Translate.tsx`](../src/pages/Translate.tsx).

Mục **Dịch** ở giữa thanh điều hướng. Người học gõ một từ, một cụm hay một câu
tiếng Việt, app trả chữ Hán kèm pinyin, rồi đọc to lên một lần. Nút loa để nghe
lại.

## 1. Hai nguồn, thử lần lượt

| Thứ tự | Nguồn | Khi nào | Được gì |
| --- | --- | --- | --- |
| 1 | Khoá học: nghĩa tiếng Việt của 60 từ và 180 câu mẫu | Chữ gõ vào trùng đúng một nghĩa của từ, hoặc nguyên một câu mẫu | Tra ngay trên máy, chạy cả khi mất mạng. Pinyin do người soạn, audio thu sẵn bằng Piper |
| 2 | Google Dịch | Mọi chữ còn lại | Chữ Hán giản thể và pinyin, trong một lần gọi |

**Cách so khớp với khoá học** (`matchKey`) bỏ qua hoa thường, dấu câu, dấu
ngoặc, và **chỗ đặt dấu thanh**. Khoá học viết "khoẻ", nhiều người gõ "khỏe":
tách dấu thanh của từng tiếng ra rồi gắn về cuối tiếng thì hai lối thành một.
"bạn" và "bán" thì vẫn khác nhau.

**Một nghĩa, nhiều từ.** Gõ "năm" thì ra 五, kèm 年 ở dòng "Cũng mang nghĩa này
trong bài học". Tiếng Việt nhập nhằng thì cho người học thấy hết, không chọn
thầm một từ.

**Audio.** Dùng lại chuỗi bốn nguồn của `speech.ts`: file thu sẵn trước, cuối
cùng là giọng đọc của máy. Google dịch ra đúng chữ khoá học đã thu âm, như
"xin chào" ra 你好, thì vẫn phát file Piper. Câu ngoài khoá học thì đọc bằng
giọng tiếng Trung của máy. Máy không có giọng nào thì nút loa hiện cách cài,
như mọi nút loa khác trong app.

## 2. Vì sao là endpoint này của Google

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

## 3. Quyền riêng tư

Chữ có trong khoá học không rời khỏi máy. Chữ khác được gửi tới Google Dịch để
dịch. Màn Dịch ghi rõ điều này ngay dưới ô nhập. Không lưu lịch sử tra lên đâu
cả; bản dịch chỉ được nhớ trong bộ nhớ trang (tối đa 100 câu), để gõ lại câu cũ
thì khỏi gọi mạng.

## 4. Khi không dịch được

| Lý do (`TranslateFailure`) | Khi nào | Zibi nói |
| --- | --- | --- |
| `too-long` | Quá 200 ký tự (ô nhập cũng chặn ở mốc này) | Dài quá, mỗi lần tối đa 200 chữ |
| `offline` | Máy báo mất mạng | Chỉ tra được từ và câu có trong bài học |
| `blocked` | Google trả 429 hoặc 403 | Google đang tạm từ chối, đợi vài phút |
| `failed` | Mạng hỏng, quá 8 giây, hay câu trả lời không đọc được | Chưa dịch được, thử lại |

## 5. Làm tiếp nếu cần

- **API dịch có sẵn trong Chrome** (`Translator`): dịch ngay trên máy, riêng tư,
  chạy cả khi mất mạng. Hiện mới có trên Chrome máy tính, lần đầu phải tải gói
  ngôn ngữ. Có thể thêm làm nguồn thứ hai, trước Google, cho máy nào có.
- **Pinyin cho nguồn không trả pinyin**: cần một bộ từ điển chữ Hán → pinyin
  như `pinyin-pro`. Nên nạp riêng cho màn này để khỏi làm nặng gói chính.
- **Lịch sử tra gần đây**, lưu ở máy.
