# Phương án kỹ thuật — Bong bóng chọn

> Trạng thái: **đã triển khai** (2026-09-24)
> Liên quan: [docs/scene.md](scene.md), [product_design.md](../product_design.md) mục 4 (Điều hướng) và mục 11 (UI/UX)

## 1. Vấn đề

Thanh điều hướng cũ là một dải đặc chạy hết bề ngang đáy màn hình, icon emoji
kèm chữ bên dưới. Nó có hai chỗ không ổn:

- **Che mất phần cảnh đẹp nhất.** Nền động đặt cây hoa đào và dải cỏ sát đáy
  màn hình — đúng chỗ thanh điều hướng đè lên kín bề ngang.
- **Mục đang chọn chỉ đổi màu chữ.** Người học phải nhìn kỹ mới biết mình đang
  ở đâu.

Các bộ chọn ở màn Cá nhân (mục tiêu mỗi ngày, giao diện, nền động) thì mỗi cái
một kiểu: hàng nút có viền, lưới ba ô có viền.

## 2. Giải pháp chọn

Một kiểu **bong bóng chọn** duy nhất, theo đúng thanh tab của các app điện
thoại người học dùng hằng ngày:

| Nơi dùng | Hình dạng |
| --- | --- |
| Thanh điều hướng | Viên thuốc kính mờ **nổi**, tách khỏi mép màn hình; chỉ có icon; mục đang chọn nằm trong bong bóng, icon chuyển từ nét viền sang tô đặc. |
| Mục tiêu mỗi ngày, Giao diện, Nền động | Rãnh lõm, bong bóng trắng nổi lên ở mức đang chọn — như một công tắc gạt. |

Cả hai dùng chung một cơ chế: **bong bóng là một phần tử duy nhất, trượt** từ mục
này sang mục kia. Không phải mỗi mục một nền riêng bật tắt — trượt thì mắt theo
được nó đi đâu.

### Các phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| Mỗi mục một nền riêng, bật tắt theo trạng thái | Đơn giản hơn, nhưng mục cũ tắt và mục mới bật cùng lúc — không có chuyển động nào nối hai chỗ. Mất đúng cái cảm giác người dùng nhận ra từ thanh tab iOS. |
| Đo vị trí mục bằng JavaScript rồi dời bong bóng tới | Phải đo lại mỗi khi xoay máy, đổi cỡ chữ, tải xong font — và có một khung hình bong bóng đứng sai chỗ trước khi đo xong. |
| Giữ chữ dưới icon | Viên thuốc cao thêm gần một nửa, và không còn giống thứ người học đã quen tay. Chữ vẫn còn cho trình đọc màn hình và khi di chuột — xem mục 4. |

## 3. Cơ chế trượt, chỉ bằng CSS

`src/styles/bubble.css`. React chỉ đặt hai biến trên khung chứa:

```html
<nav class="bubble-track bubble-bar" style="--count: 4; --index: 2">
  <span class="bubble-thumb" aria-hidden="true"></span>
  …bốn mục…
</nav>
```

Bong bóng rộng đúng một ô, `(khung − hai lề) / --count`, và dịch `--index` lần
chính bề rộng của nó. Không đo gì cả, nên không bao giờ có khung hình đứng sai.

Chuyển động dùng `cubic-bezier(0.34, 1.4, 0.64, 1)` trong 520ms — **vượt đích một
chút rồi nảy về**. Đo thực tế khi đổi từ mục 1 sang mục 3: bong bóng đi 22 → 125
→ 179 → **196** → 193 → dừng ở 188. Đi thẳng tuột thì trông như một ô màu bị dời
chỗ; chính cú nảy làm nó ra chất "lỏng".

Hệ điều hành xin giảm chuyển động thì bong bóng nhảy thẳng tới chỗ mới.

### Mục đang chọn ở vị trí nào

`NavLink` của react-router chỉ cho mỗi link tự biết mình có đang được chọn hay
không, không cho ai biết *vị trí*. `activeNavIndex()` trong `src/lib/nav.ts` tự
tính, theo đúng luật khớp của `NavLink`: mục "Trang chủ" phải khớp nguyên văn
(nếu không, mọi đường dẫn đều bắt đầu bằng "/" và trang chủ sáng ở khắp nơi),
các mục khác khớp cả trang con. Không mục nào khớp thì bong bóng ẩn đi thay vì
đứng nhầm chỗ.

## 4. Chỉ có icon — nhưng chữ vẫn còn

Thanh điều hướng không còn chữ dưới icon, nhưng tên mỗi mục vẫn nằm ở:

- `aria-label` — trình đọc màn hình đọc đúng "Trang chủ", "Học", "Tiến độ",
  "Cá nhân", và `aria-current="page"` cho mục đang đứng.
- `title` — di chuột trên máy tính thì hiện tên.

Mục đang chọn khác mục khác ở **ba** chỗ cùng lúc — bong bóng, màu, và icon tô
đặc — nên không cần đọc chữ cũng biết mình đang đứng đâu, kể cả với người khó
phân biệt màu.

Các bộ chọn ở màn Cá nhân vẫn là nút thật có `aria-pressed`; bong bóng chỉ là
hình, `aria-hidden`. Bàn phím và trình đọc màn hình dùng y như trước.

## 5. Mục tiêu mỗi ngày

Ba mức vừa đủ chỗ cho tên, không đủ cho phần giải thích "50 XP · khoảng 5 phút
mỗi ngày". Nên bộ chọn chỉ có tên, và **chỉ giải thích mức đang chọn**, ngay bên
dưới. Mục tiêu cũ nằm ngoài ba mức (dữ liệu lưu từ trước) thì không có dòng
giải thích nào, và bong bóng ẩn đi — thay vì đoán bừa một mức.

## 6. Kích thước

| Chỗ | Số đo |
| --- | --- |
| Thanh điều hướng | Cao 64px, cách đáy 12px cộng vùng an toàn iPhone, cách hai mép 16px, rộng tối đa 400px và nằm giữa trên màn hình rộng. |
| Mỗi ô của thanh điều hướng | Khoảng 83px × 52px trên điện thoại 375px — thừa xa mức 44px tối thiểu cho ngón tay. |
| Lề dưới của nội dung | 7rem cộng vùng an toàn, để thẻ cuối không nằm dưới viên thuốc. |
| Bộ chọn trên màn 320px | Mỗi ô còn 79px, không đủ cho "🌓 Theo máy" — dưới 360px thì bỏ emoji trang trí, giữ chữ. |

## 7. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Logic | `src/lib/nav.test.ts` | Vị trí từng mục; trang chủ không sáng theo mọi trang; trang con sáng mục cha; gạch chéo thừa; `/profiles` không bị nhầm là trang con của `/profile`; không khớp thì `-1`. |
| Thanh điều hướng | `src/components/BottomNav.test.tsx` | Đủ bốn mục có tên; `aria-current`; bong bóng đứng đúng chỗ và trượt theo khi bấm; icon tô đặc đúng mục; có `title`; không có thanh điều hướng trong lúc học. |
| Bộ chọn | `src/components/ui/BubbleSwitch.test.tsx` | Nhóm có tên; tên nút không lẫn emoji; `aria-pressed`; bong bóng dời theo; giá trị ngoài danh sách thì ẩn bong bóng. |
| Luồng | `src/pages/app-flow.test.tsx` *(không đổi)* | Đổi giao diện, nền động, mục tiêu ở màn Cá nhân vẫn chạy như cũ qua bộ chọn mới. |
