# Phương án kỹ thuật — Nền động

> Trạng thái: **đã triển khai** (2026-09-23)
> Ngày: 2026-09-23
> Liên quan: [product_design.md](../product_design.md) mục 9 (Gamification) và mục 11 (UI/UX), [docs/theme.md](theme.md)

## 1. Vấn đề

App đang có hai nền phẳng: `slate-50` ban ngày và `slate-950` ban đêm. Nó sạch
sẽ nhưng không nói gì cả, trong khi sản phẩm này sống bằng việc người học quay
lại mỗi ngày.

- **Tiến độ đang bị giấu trong con số.** XP hôm nay, streak, số từ đã nhớ đều
  nằm trong `UserProgress` nhưng chỉ hiện ra dưới dạng "30/50 XP". Người học
  phải *đọc* mới biết mình đang ở đâu.
- **Phần thưởng hiện tại chỉ có huy hiệu.** Thêm huy hiệu nữa là thêm thứ để
  đọc, không phải thêm thứ để cảm.
- **Học buổi tối là chính.** Chế độ tối đã đỡ chói, nhưng một màn hình đen
  phẳng thì không có gì để quay lại xem.

Mục tiêu: **nhìn nền là biết hôm nay đã học tới đâu, mà không tốn thêm một dòng
chữ nào và không làm phiền lúc đang học.**

## 2. Giải pháp chọn

Một khung cảnh sống phía sau toàn bộ ứng dụng, dùng chung một cấu trúc cho cả
hai chế độ hiển thị:

| Chế độ | Khung cảnh |
| --- | --- |
| Sáng | Khu vườn: đồi cỏ, cây hoa đào, ong bướm bay qua bay lại, cánh hoa rơi. |
| Tối | Bầu trời sao: dải ngân hà, dãy núi soi bóng mặt hồ, mưa sao băng. |

Và **cảnh nở theo tiến độ trong ngày**, đọc thẳng từ `UserProgress`:

| Mốc | Sáng | Tối |
| --- | --- | --- |
| `dawn` — chưa có XP nào hôm nay | Sương sớm, đồi xám, hoa chưa nở — nhưng vẫn có chim, một bướm và một ong | Trời vừa tối, sao thưa, ngân hà mờ, một vệt thiên thạch |
| `rising` — đang học dở | Nắng lên, hoa nở lác đác, thêm một bướm nữa | Sao dày thêm, ngân hà rõ dần, ba vệt thiên thạch |
| `bloom` — đạt mục tiêu ngày | Cả vườn nở, ba bướm hai ong, cánh hoa rơi | Ngân hà sáng hẳn, mưa sao băng sáu vệt |
| Streak ≥ 7 ngày | Thêm một cây hoa đào | Thêm một thiên thạch lớn ánh cam |

Không thêm một huy hiệu, một con số hay một câu chúc mừng nào. Cảnh chính là
phần thưởng, và nó luôn ở đó chứ không hiện ra một lần rồi thôi.

**Cảnh không bao giờ vắng tanh.** Bản đầu tắt sạch ong bướm và sao băng ở mốc
`dawn`; kết quả là người mới mở app — đúng lúc cần gây ấn tượng nhất — không
thấy gì chuyển động cả, và tưởng tính năng bị hỏng. Mốc `dawn` giờ chỉ làm cảnh
*nhạt đi*, không tắt thứ gì. `src/test/scene-css.test.ts` chốt lại điều đó.

### Các phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| Ảnh nền JPG/PNG | App là PWA chạy offline: ba tấm ảnh nền đẹp là service worker phải precache thêm vài MB, trong khi cả bộ 60 file phát âm hiện chỉ có 1 MB. Gradient + SVG tốn vài KB. |
| Canvas + `requestAnimationFrame` | Điều khiển được nhiều hơn, nhưng phải tự quản vòng lặp, tự dừng khi tab ẩn, tự xử lý DPI. CSS animation được trình duyệt chạy thẳng trên compositor và tự dừng khi trang bị ẩn. |
| Nền động chỉ là trang trí, không gắn tiến độ | Mất đúng phần đáng giá. Một khung cảnh đẹp mà đứng yên thì xem hai hôm là chán. |
| Công tắc bật/tắt hai trạng thái | Máy yếu không cần *mất* khung cảnh, chỉ cần nó đứng yên. Xem mục 5. |
| Đổi cảnh theo giờ trong ngày | Chồng lấn với chế độ sáng/tối vốn đã bám `prefers-color-scheme`. Hai hệ thống cùng quyết định một thứ là nguồn gốc của bug. |

## 3. Bốn lớp

Xếp từ xa tới gần, cùng cấu trúc cho cả hai chế độ — chỉ đổi nội dung từng lớp:

| Lớp | Là gì | Chi phí |
| --- | --- | --- |
| 1 · Trời | Gradient phủ kín, cộng mặt trời và mây, hoặc dải ngân hà bốn lớp | 6–10 phần tử |
| 2 · Cảnh | SVG: sáu lớp đồi, bụi cây, cây xa, cây hoa đào — hoặc ba lớp núi và mặt hồ | ~8 KB vector |
| 3 · Hạt sống | Chim, ong bướm, cánh hoa, thiên thạch | tối đa 17 phần tử |
| 4 · Màn đọc | Lớp phủ mỏng ở nửa trên, cộng lớp phủ tối của màn hình học | 2 phần tử |

Sao nền là **`radial-gradient` lặp lại** trên bốn lớp có kích thước ô khác nhau:
hàng trăm ngôi sao mà không thêm một phần tử DOM nào, và mắt không bắt được
quy luật lặp. Sáu ngôi sáng nhất là phần tử riêng, có tia nhiễu xạ hình chữ
thập như ảnh phơi sáng lâu.

**Dải ngân hà dựng theo ảnh chụp thật**, chồng bốn lớp trong một khung xoay
chéo: quầng rộng mờ, lõi sáng ngả vàng, một lớp sao li ti được `mask` bóp lại
đúng trong thân dải, và vệt bụi tối cắt dọc. Thiếu lớp bụi tối thì nó chỉ là
một vệt khói tím — chính chỗ tối mới làm ra hình dải ngân hà.

**Bụi cây, cây xa và chim trải hết bề ngang màn hình**, trong khi cây hoa đào
và ong bướm bó trong cột nội dung. Lý do: trên màn hình rộng, nếu mọi thứ đều
bó vào giữa thì hai bên trống trơn; còn một con bướm bay ở tận mép phải thì chỉ
làm người đọc liếc theo. Chúng là SVG rời chứ không vẽ vào lớp đồi, vì lớp đồi
bị kéo giãn theo bề ngang — cây vẽ trong đó sẽ bẹt ra.

Mọi animation chỉ đụng tới `transform` và `opacity`, nên trình duyệt xử lý
thẳng trên compositor, không tính lại layout và không vẽ lại.

## 4. Chữ không bao giờ nằm thẳng trên cảnh

Đây là ràng buộc cứng, không phải lựa chọn thẩm mỹ: một khung cảnh có màu thay
đổi theo tiến độ thì không thể bảo đảm tương phản cho chữ đặt trực tiếp lên nó.

Mọi khối nội dung dùng chung lớp `.surface` trong `src/index.css`:

```css
.surface { @apply rounded-3xl bg-white shadow-sm ring-1 ring-slate-100; … }
[data-scene='on'] .surface { @apply bg-white/70 ring-white/70 backdrop-blur-xl; … }
```

Nền động bật thì thẻ thành kính mờ — nền 70% cộng `backdrop-blur` — đủ trong
để thấy cảnh, đủ đục để chữ giữ tỉ lệ tương phản. Nền động tắt thì thẻ trở lại
đúng màu đặc của giao diện cũ, không sót màn hình nào.

Thuộc tính `data-scene` nằm trên thẻ `html`, đặt bởi `applyScene()` — một
thuộc tính rẻ hơn truyền context xuống từng thẻ một.

## 5. Ba mức, không phải công tắc

```
localStorage['chinese-learning-app:scene:v1'] = 'full' | 'still' | 'off'
```

| Lựa chọn | Hành vi |
| --- | --- |
| Đầy đủ *(mặc định)* | Cảnh chạy. |
| Tĩnh | Cảnh vẫn hiện, nhưng đứng yên như một bức tranh. |
| Tắt | Không dựng gì cả; giao diện về đúng như trước. |

Máy yếu không cần *mất* khung cảnh, nó chỉ cần khung cảnh đừng chuyển động —
nên "Tĩnh" là một trạng thái riêng chứ không phải nửa đường giữa bật và tắt.

Khoá lưu **tách rời** khoá tiến độ và khoá giao diện, cùng lý do đã nêu ở
[docs/theme.md](theme.md) mục 4: đây là thuộc tính của *thiết bị*. Cùng một
người, điện thoại cũ để Tĩnh còn laptop để Đầy đủ.

## 6. Luật giữ cho nền không làm phiền

| Tình huống | Xử lý |
| --- | --- |
| Đang trong bài học (`FocusShell`) | Cảnh mờ 2.6px, phủ tối 62%, tắt hết ong bướm và sao băng. Một màn hình — một mục tiêu. |
| Hệ điều hành xin `prefers-reduced-motion` | Về mức Tĩnh, **không** đụng tới lựa chọn đang lưu. |
| Người học chuyển sang app khác | `animation-play-state: paused` qua `visibilitychange`. |
| Người học chọn Tắt | Tắt hẳn, kể cả khi hệ điều hành không yêu cầu gì. |

Chế độ Tĩnh giữ lại **một** vệt sao băng đứng yên giữa trời. Một ngôi sao băng
bất động là hình vẽ quen thuộc, còn thiếu hẳn thì bầu trời trông như bị tắt mất
thứ gì đó — mà người bật "giảm chuyển động" cũng rơi vào chế độ này.

Lựa chọn "Tắt" thắng tuyệt đối, còn `prefers-reduced-motion` chỉ hạ xuống
Tĩnh: bỏ hẳn cảnh đi là lấy mất thông tin tiến độ, còn để nó nhúc nhích là làm
đúng cái người ta vừa xin đừng làm.

## 7. Kiến trúc phía client

```
src/lib/scene.ts                          Logic thuần: lựa chọn, mức chuyển động, mốc nở của cảnh
src/context/SceneContext.tsx              Trạng thái React + nghe hệ điều hành đổi tuỳ chọn
src/components/scene/SceneBackground.tsx  Khung, đặt các thuộc tính `data-*`
src/components/scene/GardenScene.tsx      Hình khu vườn
src/components/scene/NightSkyScene.tsx    Hình bầu trời sao
src/styles/scene.css                      Toàn bộ phần vẽ và chuyển động
src/pages/Profile.tsx                     Ba nút chọn trong mục "Giao diện"
```

Đúng quy ước sẵn có của repo: luật nằm trong `src/lib` dưới dạng hàm thuần,
React chỉ hiển thị.

```ts
export type SceneChoice = 'full' | 'still' | 'off'
export type SceneMotion = 'animate' | 'still' | 'none'
export type SceneStage = 'dawn' | 'rising' | 'bloom'

resolveSceneMotion(choice, reducedMotion): SceneMotion
sceneStage(xpToday, dailyGoal): SceneStage
hasStreakBonus(streak): boolean
loadSceneChoice(storage?) / saveSceneChoice(choice, storage?)
applyScene(motion, root?)                     // đặt data-scene trên <html>
prefersReducedMotion() / subscribeReducedMotion(cb)
isDocumentVisible() / subscribeVisibility(cb)
```

Component chỉ dịch kết quả của các hàm đó thành thuộc tính trên một phần tử:

```html
<div class="scene" aria-hidden="true"
     data-sky="night" data-stage="rising" data-motion="animate"
     data-variant="app" data-streak="on" data-paused="false">
```

Toàn bộ luật hiện/ẩn và chuyển động nằm trong CSS, chọn theo đúng các thuộc
tính này. Không có phép tính nào chạy mỗi khung hình trong JavaScript.

## 8. Ba cái bẫy đã vấp khi dựng

Ghi lại vì cả ba đều im lặng — không lỗi, chỉ là nhìn sai.

1. **`steps(1)` cộng `alternate` không lật được hướng.** Ý định ban đầu là cho
   con ong quay đầu ở điểm sweep đổi chiều. Nhưng lượt về của `alternate` chạy
   ngược qua đúng hàm thời gian của lượt đi, nên giá trị nào ở lượt đi thì lượt
   về cũng ra y như thế — con ong bay giật lùi cả nửa chặng. Cách đúng: chu kỳ
   lật dài gấp đôi chu kỳ sweep, `direction: normal`, nửa đầu một hướng nửa sau
   hướng kia.
2. **`scaleX(-1)` trên một khung rộng bằng màn hình sẽ quăng con vật sang mép
   kia.** `.scene-fly` cố ý rộng bằng cả dải để `translateX(%)` tính theo dải;
   nhưng lớp lật bên trong phải `width: max-content` để lấy chính con vật làm
   tâm gương.
3. **Giảm chuyển động làm cả đàn dồn về `translateX(0)`.** Tắt animation thì
   phần tử rơi về transform gốc, tức là chồng lên nhau ở mép trái. Mỗi con giữ
   một `--scene-rest-x` riêng, dùng cho cả chế độ Tĩnh lẫn media query.

## 9. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Luật CSS | `src/test/scene-css.test.ts` | Cảnh không bao giờ vắng tanh: mốc `dawn` chỉ làm nhạt chứ không tắt thứ gì; chỉ màn hình học và chế độ Tắt mới được giấu hạt sống; chế độ Tĩnh vẫn giữ một vệt sao băng. |
| Logic thuần | `src/lib/scene.test.ts` | Bốn tổ hợp của `resolveSceneMotion`; `sceneStage` cho cả `NaN`, số âm và mục tiêu bằng 0; mốc streak; giá trị lưu hỏng rơi về `full`; `localStorage` ném lỗi vẫn không vỡ; `applyScene` đặt đúng thuộc tính; `matchMedia` và `visibilitychange`. |
| Context | `src/context/SceneContext.test.tsx` | Mặc định đầy đủ; hệ điều hành xin giảm chuyển động thì về Tĩnh mà vẫn hiện; chọn Tắt rồi thì hệ điều hành nói gì cũng vẫn tắt; nhớ lựa chọn cho lần mở sau. |
| Giao diện | `src/components/scene/SceneBackground.test.tsx` | Sáng ra vườn, tối ra bầu trời; ba mốc nở theo XP; streak đứt thì thôi thưởng; vào màn hình học thì `data-variant="focus"`; chọn Tắt thì không dựng gì. |
| Luồng | `src/pages/app-flow.test.tsx` *(cập nhật)* | Tắt được từ màn hình Cá nhân; lựa chọn còn nguyên ở lần mở sau; xoá tiến độ học không đụng tới lựa chọn nền. |

## 10. Nghiệm thu

- Mở app lần đầu trong ngày: cảnh ở mốc sương sớm. Học xong một bài: hoa nở
  thêm, sao dày thêm — không cần tải lại trang.
- Đạt mục tiêu ngày: vườn nở hết / ngân hà sáng hẳn.
- Giữ streak 7 ngày: có cây hoa đào thứ hai và thiên thạch lớn.
- Vào flashcard hoặc bài tập: nền mờ hẳn, không còn gì chuyển động.
- Bật "giảm chuyển động" ở hệ điều hành: cảnh đứng yên, ong bướm vẫn ở đúng
  chỗ chứ không dồn vào một góc.
- Cá nhân → Giao diện → Nền động → Tắt: giao diện trở lại đúng như trước, thẻ
  đặc màu, không còn phần tử nào của cảnh trong DOM.
- Đi hết một buổi học ở cả hai chế độ: không màn hình nào có chữ khó đọc.

## 11. Không nằm trong phạm vi

- ~~Màn hình Tiến độ dạng chòm sao~~ — đã làm, xem [docs/word-map.md](word-map.md).
- Màn hình chào (`Landing`) vẫn giữ nền gradient thương hiệu riêng.
- Cảnh theo mùa hoặc theo khoá học khác ngoài HSK 1.
- Tự hạ mức khi pin yếu: `navigator.getBattery()` không có trên Safari, mà
  Safari là trình duyệt của phần lớn người dùng iPhone.
