# Phương án kỹ thuật — Chế độ sáng/tối

> Trạng thái: **đề xuất**
> Ngày: 2026-09-23
> Liên quan: [product_design.md](../product_design.md) mục 2 (Settings) và mục 11 (UI/UX)

## 1. Vấn đề

Bản thiết kế sản phẩm có "Settings" trong nhóm Supporting và đặt ra nguyên tắc
mobile-first, nhưng chưa nói gì về chế độ hiển thị. Hiện app chỉ có một giao
diện sáng, cố định.

Điều này lệch với thói quen dùng điện thoại:

- **Học buổi tối là chính.** Mục tiêu sản phẩm là "mỗi ngày một chút" và giữ
  streak — phần lớn rơi vào buổi tối. Nền trắng `slate-50` kín màn hình trong
  phòng tối là chói.
- **Hệ điều hành đã có công tắc sẵn.** iOS, Android, Windows và macOS đều tự
  chuyển tối theo giờ. Một app không nghe theo sẽ loé trắng mỗi lần mở.
- **Người dùng vẫn cần quyền quyết định.** Có người để máy chế độ tối nhưng
  muốn đọc chữ Hán trên nền sáng cho rõ nét, và ngược lại.

Mục tiêu: **người học chọn được Sáng / Tối / Theo hệ thống, lựa chọn đó được
nhớ, và không có cú nháy trắng nào khi mở app.**

## 2. Giải pháp chọn

Ba lựa chọn, mặc định là **Theo hệ thống**:

| Lựa chọn | Hành vi |
| --- | --- |
| Sáng | Luôn sáng, kể cả khi máy đang để chế độ tối. |
| Tối | Luôn tối. |
| Theo hệ thống *(mặc định)* | Bám theo `prefers-color-scheme`, đổi ngay khi hệ điều hành đổi. |

Không chọn công tắc hai trạng thái: công tắc hai trạng thái buộc phải chọn một
giá trị khởi đầu, và giá trị đó sẽ ngược với máy của một nửa số người dùng ngay
lần mở đầu tiên. Ba lựa chọn cho phép "chưa chọn gì" là một trạng thái đúng.

### Các phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| Chỉ nghe `prefers-color-scheme`, không cho chọn | Không đáp ứng được người muốn ngược với hệ điều hành. Vẫn giữ làm *mặc định*, không làm *toàn bộ*. |
| Công tắc hai trạng thái sáng/tối | Mất trạng thái "theo hệ thống" — xem trên. |
| Lưu lựa chọn trong `UserProgress` | Chế độ hiển thị là thuộc tính của *thiết bị*, không phải của *người học*. Xem mục 4. |
| Đổi màu bằng biến CSS ngữ nghĩa (`--color-surface`…) | Gọn hơn khi viết, nhưng che mất màu thật ở chỗ dùng và lệch với phần còn lại của repo vốn dùng thẳng bảng màu Tailwind. |

## 3. Cách áp dụng vào DOM

Một thuộc tính duy nhất trên thẻ `html`:

```html
<html lang="vi" data-theme="dark" style="color-scheme: dark">
```

- `data-theme` nhận đúng hai giá trị `light` hoặc `dark` — đây là **chế độ đã
  giải ra**, không phải lựa chọn của người dùng. Lựa chọn `system` không bao
  giờ xuất hiện trong DOM.
- `color-scheme` đi kèm để trình duyệt tự đổi màu thanh cuộn, ô nhập liệu và
  nền mặc định. Thiếu dòng này thì ô nhập tên vẫn trắng trên nền tối.

Tailwind v4 khai báo biến thể `dark:` trỏ vào chính thuộc tính đó, trong
`src/index.css`:

```css
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

Nhờ vậy toàn bộ giao diện viết theo đúng lối sẵn có của repo —
`bg-white dark:bg-slate-900` — không phải đổi sang hệ màu khác.

## 4. Lưu lựa chọn

```
localStorage['chinese-learning-app:theme:v1'] = 'light' | 'dark' | 'system'
```

Khoá **tách rời** khoá tiến độ (`…:progress:v1`), vì hai lý do:

1. Nút "Xoá tiến độ học" ở màn hình Cá nhân xoá lịch sử học. Nó không có lý do
   gì bắt người dùng chỉnh lại độ sáng màn hình.
2. Phase 3 sẽ đẩy `UserProgress` lên Supabase và đồng bộ giữa các thiết bị.
   Chế độ hiển thị thì không nên đồng bộ: điện thoại và laptop của cùng một
   người thường cần hai chế độ khác nhau.

Giá trị lạ, `localStorage` bị chặn (chế độ riêng tư), hoặc chưa lưu gì đều rơi
về `system`. Đọc và ghi đều bọc `try/catch`, giống `storage.ts` hiện có.

## 5. Chống nháy trắng

CSS được tải trước khi JavaScript chạy, nên nếu đợi React gắn xong mới đặt
`data-theme` thì người dùng nhìn thấy một khung hình trắng rồi mới tối. Trên
điện thoại chậm, khoảng nháy này thấy rõ.

Xử lý: một đoạn script nội tuyến ngay trong `head` của `index.html`, chạy đồng
bộ trước lần vẽ đầu tiên.

```html
<script>
  // Đặt chế độ hiển thị trước khi trang vẽ lần đầu, để không nháy trắng.
  // Bản đầy đủ và test nằm ở src/lib/theme.ts — sửa thì sửa cả hai.
  try {
    var choice = localStorage.getItem('chinese-learning-app:theme:v1') || 'system'
    var dark =
      choice === 'dark' ||
      (choice !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch (e) {}
</script>
```

Đoạn này **cố ý lặp lại** logic của `src/lib/theme.ts`. Đây là đánh đổi có ý
thức: gói nó thành module thì nó không còn chạy trước lần vẽ đầu nữa. Giữ cho
nó ngắn, và để `theme.test.ts` chốt đúng khoá lưu cùng tên thuộc tính mà nó
dùng, để hai bên không trôi ra khỏi nhau.

## 6. Kiến trúc phía client

```
src/lib/theme.ts             Logic thuần: đọc/ghi lựa chọn, giải ra chế độ, gắn vào <html>
src/context/ThemeContext.tsx Trạng thái React + nghe hệ điều hành đổi chế độ
src/pages/Profile.tsx        Ba nút chọn trong mục "Giao diện"
```

Đúng quy ước sẵn có của repo: luật nằm trong `src/lib` dưới dạng hàm thuần,
React chỉ hiển thị.

```ts
export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme
loadThemeChoice(storage?): ThemeChoice        // giá trị lạ -> 'system'
saveThemeChoice(choice, storage?): void
applyTheme(theme: ResolvedTheme, root?): void // đặt data-theme + color-scheme
prefersDark(): boolean                        // matchMedia, an toàn khi không có
subscribeSystemTheme(cb): () => void          // nghe hệ điều hành đổi chế độ
```

Khi lựa chọn là `system`, context lắng nghe
`matchMedia('(prefers-color-scheme: dark)')` và đổi theo ngay lập tức, không
cần tải lại trang. Chọn `light` hoặc `dark` thì bỏ nghe.

## 7. Bảng màu chế độ tối

Không đảo ngược màu. Nền tối cần độ tương phản thấp hơn nền sáng, nếu không chữ
trắng trên nền đen sẽ loè.

| Vai trò | Sáng | Tối |
| --- | --- | --- |
| Nền trang | `slate-50` | `slate-950` |
| Mặt thẻ | `white` | `slate-900` |
| Viền thẻ | `ring-slate-100` | `ring-slate-800` |
| Chữ chính | `slate-900` | `slate-100` |
| Chữ phụ | `slate-500` | `slate-400` |
| Chữ mờ | `slate-400` | `slate-500` |
| Viền ô nhập | `slate-200` | `slate-700` |
| Nền nhấn thương hiệu | `brand-50` | `brand-500/15` |
| Chữ nhấn thương hiệu | `brand-600` | `brand-300` |
| Nút chính | `brand-500` | `brand-600` |

Nguyên tắc cho màu nhấn (thương hiệu, emerald, amber, gold): ở chế độ tối dùng
**nền trong suốt `/15` kèm chữ sáng hơn hai bậc**, thay vì nền `-50` đặc. Nền
`-50` là màu gần trắng, đặt lên `slate-900` sẽ thành một mảng chói.

Chữ Hán cỡ lớn giữ nguyên `font-hanzi` và giữ nguyên độ đậm; chỉ đổi màu chữ.
Giảm độ đậm trên nền tối sẽ làm nét chữ Hán vỡ ở cỡ nhỏ.

## 8. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Logic thuần | `src/lib/theme.test.ts` | `resolveTheme` cho đủ sáu tổ hợp; giá trị lưu hỏng rơi về `system`; `localStorage` ném lỗi vẫn không vỡ; `applyTheme` đặt đúng `data-theme` và `color-scheme`; khoá lưu đúng bằng khoá trong script nội tuyến ở mục 5. |
| Context | `src/context/ThemeContext.test.tsx` | Chọn `dark` thì thẻ `html` đổi ngay và lựa chọn được lưu; đang ở `system` mà hệ điều hành đổi thì giao diện đổi theo; chọn `light` rồi thì hệ điều hành đổi cũng không ảnh hưởng. |
| Giao diện | `src/pages/app-flow.test.tsx` *(cập nhật)* | Vào Cá nhân, bấm "Tối", thuộc tính `data-theme` thành `dark`; dựng lại app thì vẫn tối. |

## 9. Rủi ro

| Rủi ro | Xử lý |
| --- | --- |
| Script nội tuyến và `theme.ts` trôi khỏi nhau | Test chốt khoá lưu và tên thuộc tính; chú thích ở cả hai chỗ. |
| Sót một màn hình chưa có lớp `dark:` | Nền trang tối mà thẻ vẫn trắng thì lộ ra ngay; duyệt đủ chín màn hình của mục 4 bản thiết kế khi nghiệm thu. |
| `matchMedia` không có (jsdom cũ, WebView cũ) | `prefersDark()` trả `false` khi thiếu — mặc định sáng, không ném lỗi. |
| Ảnh nền trắng lọt vào giao diện tối | App chỉ dùng emoji hệ thống, chưa có ảnh PNG nào. Kiểm lại khi thêm ảnh. |

## 10. Nghiệm thu

- Máy để chế độ tối, mở app lần đầu: app tối ngay từ khung hình đầu tiên, không
  nháy trắng.
- Vào Cá nhân → Giao diện → chọn Sáng: app sáng; tắt trình duyệt mở lại vẫn sáng.
- Chọn Theo hệ thống rồi đổi chế độ của hệ điều hành: app đổi theo mà không cần
  tải lại trang.
- Đi hết một buổi học (Home → Lesson → Flashcard → Bài tập → Kết quả) ở chế độ
  tối: không màn hình nào còn mảng trắng, chữ nào cũng đọc được.

## 11. Không nằm trong phạm vi

- Chế độ tương phản cao và cỡ chữ lớn cho người khiếm thị.
- Hẹn giờ tự đổi theo giờ trong ngày (hệ điều hành đã làm việc này).
- Đổi màu thương hiệu theo chủ đề.
