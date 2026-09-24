# Phương án kỹ thuật — Cài được lên màn hình chính điện thoại

> Trạng thái: **đã triển khai** (2026-09-23)
> Ngày: 2026-09-23
> Liên quan: [product_design.md](../product_design.md) Phase 7, [audio-tts.md](audio-tts.md) mục 7

## 1. Vấn đề

Bản thiết kế xếp bản điện thoại vào Phase 7, làm bằng React Native + Expo. Con
đường đó tắc ở chỗ không ngờ tới: **đưa app lên App Store cần tài khoản Apple
Developer 99 USD/năm và một thẻ tín dụng**, mà chủ dự án không có thẻ.

Viết lại toàn bộ giao diện bằng React Native rồi không phát hành được thì công
sức đổ sông. Nhưng mục tiêu thật sự của Phase 7 không phải là "có mặt trên App
Store" — mà là **người học mở app từ màn hình chính điện thoại, không phải gõ
địa chỉ web mỗi lần**.

Mục tiêu đó đạt được mà không cần Apple, không cần viết lại gì.

## 2. Giải pháp chọn

Biến site hiện tại thành **PWA**: thêm manifest, icon và service worker. Người
dùng iPhone bấm Chia sẻ → *Thêm vào MH chính*, từ đó app có icon riêng, mở ra
chạy toàn màn hình không thấy thanh Safari, và **dùng được khi mất mạng**.

Vì sao hợp với dự án này:

- Toàn bộ nội dung đã là file tĩnh. 239 file audio (60 từ, 179 câu mẫu), khoá học nằm trong mã nguồn,
  tiến độ trong `localStorage` — **không có gì cần gọi server lúc học**. Đây là
  trường hợp lý tưởng cho offline, không phải thứ phải gượng ép.
- Mỗi lần đẩy code là người dùng có bản mới, không chờ duyệt store.
- Một mã nguồn cho cả web lẫn điện thoại.

### Các phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| React Native + Expo, phát hành App Store | Cần thẻ tín dụng và 99 USD/năm. Tắc ngay từ đầu. |
| React Native chạy qua Expo Go | Người học phải cài Expo Go rồi quét mã QR. Không ai làm vậy để học từ vựng. |
| Bọc WebView thành app native | Vẫn phải lên store, tức vẫn cần thẻ. Mà nội dung thì y hệt PWA. |
| Để nguyên site như hiện tại | Không có icon, không chạy offline, mỗi lần học phải gõ địa chỉ. |

**Không bỏ React Native vĩnh viễn.** Khi nào có thẻ và thật sự cần App Store —
hoặc cần thông báo đẩy, cần truy cập micro để chấm phát âm ở Phase 8 — thì làm.
PWA không cản đường đó.

## 3. Điều PWA trên iOS làm được và không làm được

Nói trước để khỏi kỳ vọng sai.

| | iOS |
| --- | --- |
| Icon riêng trên màn hình chính | Được |
| Chạy toàn màn hình, không thanh Safari | Được |
| Dùng offline | Được |
| Có mặt trên App Store | **Không** |
| Người dùng tự tìm thấy cách cài | **Không** — phải chỉ họ bấm Chia sẻ → Thêm vào MH chính |

Điều cuối là nhược điểm thật của PWA trên iOS: Safari không hiện lời mời cài
như Chrome trên Android. Vì vậy app cần **tự hướng dẫn** — xem mục 7.

## 4. Icon

Nguồn là `ava.jpg` ở thư mục gốc. Sinh bằng script chứ không cắt tay, để đổi
ảnh thì chạy lại một lệnh: `npm run generate-icons`.

**Hạn chế đang có:** ảnh nguồn chỉ 224×224, mà manifest cần bản 512. Phóng hơn
hai lần nên bản 512 hơi mềm nét — thấy rõ nhất ở màn hình chờ khi mở app trên
Android. Có file gốc lớn hơn thì thay vào `ava.jpg` rồi chạy lại là hết. Script
tự cảnh báo khi ảnh nguồn nhỏ hơn 512.

Màu nền để chèn lề cho bản maskable lấy theo **màu phổ biến nhất ở viền ảnh**,
không lấy trung bình bốn góc: nhân vật thường chạm mép dưới, nên trung bình
giữa nền trắng và thân nhân vật ra một màu xám không giống chỗ nào trong ảnh,
thành ra viền lộ rõ.

| File | Cỡ | Dùng cho |
| --- | --- | --- |
| `icon-192.png` | 192 | Android, danh sách app |
| `icon-512.png` | 512 | Màn hình chờ, cửa hàng |
| `icon-maskable-512.png` | 512 | Android cắt theo hình nền hệ thống |
| `apple-touch-icon.png` | 180 | **iOS — bắt buộc riêng** |

iOS **không đọc icon trong manifest**. Thiếu `apple-touch-icon.png` thì màn hình
chính hiện một ảnh chụp trang web bị thu nhỏ, nhìn rất tệ. Đây là lỗi hay gặp
nhất khi làm PWA cho iPhone.

Bản `maskable` chừa lề: nội dung nằm gọn trong 80% ở giữa, vì Android cắt icon
theo hình dạng do người dùng chọn.

## 5. Chiến lược cache

**Precache tất cả**, gồm cả 239 file audio — 60 từ và 179 câu mẫu.

```
JS      ~390 KB (~120 KB gzip)
CSS      ~63 KB
audio   ~2,2 MB
tổng    ~2,9 MB, 253 mục
```

Audio câu mẫu chiếm phần lớn, và vẫn đáng precache: service worker tải một lần,
chạy ngầm sau lần mở đầu tiên, còn nghe cả câu là một trong những thứ chính
người học mở app ra để làm — kể cả lúc không có mạng.

550 KB nhỏ hơn một tấm ảnh chụp. Đổi lại được tính chất đáng giá: **cài xong là
dùng được trọn vẹn khi không có mạng**, kể cả phần nghe phát âm — vốn là thứ
người học cần nhất và cũng là thứ duy nhất phải tải từ mạng.

Cách kia — cache audio theo nhu cầu — tiết kiệm lần tải đầu nhưng đổi lấy cảnh
"mở bài học khi đang đi tàu điện thì nút loa câm". Với một app dạy phát âm thì
đó là hỏng chức năng chính.

Cập nhật bản mới: `autoUpdate`. Service worker tải bản mới ngầm, áp dụng ở lần
mở tiếp theo. Không hỏi han gì người học — họ vào để học, không phải để bấm
"Có bản mới, cập nhật?".

## 6. Thẻ meta cho iOS

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Học tiếng Trung" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8fafc" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#020617" />
```

`theme-color` khai hai lần theo chế độ sáng/tối, để thanh trạng thái khớp với
giao diện thay vì luôn trắng — nối tiếp [theme.md](theme.md).

Dấu gạch chéo đầu trong `/apple-touch-icon.png` là bắt buộc: để đường dẫn
tương đối thì khi người dùng bấm Thêm vào MH chính từ một trang con như
`/lesson/u1l1`, iOS đi tìm `/lesson/apple-touch-icon.png` và không thấy. Vite
tự chèn `base` vào lúc build.

`black-translucent` cho nội dung tràn lên vùng tai thỏ. Giao diện đã dùng
`env(safe-area-inset-*)` ở thanh điều hướng dưới và các thanh dính đáy từ trước,
nên không phải sửa thêm.

## 7. Lời mời cài đặt

Safari không tự mời cài. Nên app tự nhắc, **một lần duy nhất**, ở màn hình Cá
nhân — không phải popup chắn ngang lúc đang học.

Chỉ hiện khi: đang mở bằng Safari trên iOS **và** chưa chạy ở chế độ đã cài
(`navigator.standalone`). Đã cài rồi mà vẫn nhắc là phiền.

Logic nhận diện nằm ở `src/lib/install.ts` dưới dạng hàm thuần, nhận `userAgent`
làm tham số để test trực tiếp — đúng quy ước của repo.

## 8. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Nhận diện thiết bị | `src/lib/install.test.ts` | iPhone Safari chưa cài thì mời; đã cài thì thôi; Android và máy tính thì không mời. |
| Icon | `src/test/pwa-assets.test.ts` | Đủ bốn file, đúng kích thước, đúng định dạng PNG. Thiếu `apple-touch-icon` là lỗi im lặng, chỉ lộ ra khi cầm iPhone thật. |
| Giao diện | `src/pages/app-flow.test.tsx` *(cập nhật)* | Mục hướng dẫn cài xuất hiện ở màn hình Cá nhân khi giả lập iPhone. |

Service worker thì **không test bằng vitest** — nó cần môi trường trình duyệt
thật. Nghiệm thu bằng tay ở mục 9.

## 9. Nghiệm thu

- Mở site bằng Safari trên iPhone → Chia sẻ → Thêm vào MH chính → icon đỏ chữ
  中 xuất hiện, không phải ảnh thu nhỏ của trang web.
- Mở từ màn hình chính: toàn màn hình, không thấy thanh địa chỉ Safari.
- Bật chế độ máy bay rồi mở lại: vào được, đi hết một bài học, **nút loa vẫn ra
  tiếng**.
- Đẩy một commit mới, mở lại app: thấy bản mới mà không phải xoá app cài lại.

## 10. Rủi ro

| Rủi ro | Xử lý |
| --- | --- |
| iOS xoá cache khi thiếu dung lượng | Tiến độ nằm ở `localStorage`, không mất theo cache. Mở lại có mạng là tự nạp lại. |
| Service worker giữ bản cũ dai dẳng | `autoUpdate` kèm `skipWaiting`. Bí quá thì xoá app rồi cài lại. |
| Đường dẫn con `/language-learning/` | `scope` và `start_url` lấy theo `base` của Vite, đổi tên miền thì tự đổi theo. |
| Precache 550 KB trên mạng chậm | Chỉ tốn một lần. Lần sau mở không chạm mạng. |

## 11. Không nằm trong phạm vi

- Thông báo đẩy.
- Có mặt trên App Store hay Google Play.
- Truy cập micro để chấm phát âm (Phase 8).
- Đồng bộ tiến độ giữa các máy — cần đăng nhập, làm ở Phase 3.
