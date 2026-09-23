# Phương án kỹ thuật — Bản đồ 60 từ

> Trạng thái: **đã triển khai** (2026-09-23)
> Ngày: 2026-09-23
> Liên quan: [docs/scene.md](scene.md), [product_design.md](../product_design.md) mục 9 (Gamification) và mục 10 (Progress)

## 1. Vấn đề

Màn hình Tiến độ đang là sáu con số xếp thành hàng: level, XP, streak, số từ đã
nhớ, số bài đã xong, phần trăm khoá học. Đúng nhưng không nhớ được.

- **"24 từ đã nhớ" không cho biết đã nhớ *những từ nào*.** Người học không có
  cách nào thấy mình đang mạnh ở chủ đề nào, hổng ở chủ đề nào.
- **Một con số tăng thì không ai khoe.** 60 từ là một cái đích nhỏ và rõ; nó
  xứng đáng có một hình ảnh chứ không phải một dòng chữ.
- **Nền động vừa lập ra một ngôn ngữ hình ảnh** — vườn và bầu trời sao — mà màn
  hình Tiến độ chưa dùng tới.

Mục tiêu: **nhìn một lần là thấy toàn bộ khoá học và mình đang ở đâu trong đó.**

## 2. Giải pháp chọn

Một bản đồ 60 chỗ, mỗi từ một chỗ, chia thành năm cụm theo năm unit:

| Chế độ | Bản đồ | Từ đã nhớ | Từ chưa nhớ |
| --- | --- | --- | --- |
| Tối | Chòm sao, nối bằng đường mờ | Ngôi sao trắng có quầng | Chấm xỉn |
| Sáng | Luống hoa trên nền cỏ | Bông hoa màu của luống | Nụ xám |

Học xong một unit là cả một chòm sáng hẳn, kèm dấu ✓ ở chú thích. Chữ Hán của
từ đầu tiên đã nhớ trong mỗi cụm được dán lên bản đồ, nên bầu trời dần dần có
tên chứ không chỉ có chấm.

Hai chế độ **dùng chung một bộ toạ độ và một bộ dữ liệu**. Người chọn giao diện
sáng không vì thế mà mất tính năng — đây là lý do bản đồ không làm riêng cho
chế độ tối dù chòm sao là hình ảnh mạnh hơn.

### Các phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
| --- | --- |
| Lưới 60 ô vuông | Đọc số nhanh hơn thật, nhưng nó là một bảng tính chứ không phải bầu trời, và không gợi được gì. |
| Sinh toạ độ ngẫu nhiên | Chòm nào cũng giống chòm nào, không ra hình gì, và mỗi lần mở lại đổi chỗ. Toạ độ đặt tay, cố định trong mã nguồn. |
| Chỉ làm cho chế độ tối | Bỏ rơi nửa số người dùng. Xem trên. |
| Hiện tất cả Hanzi lên bản đồ | 60 nhãn chồng lên nhau thành một đám mực. Mỗi cụm một nhãn là đủ để biết cụm đó về cái gì. |
| Cho bấm vào từng ngôi sao để xem từ | Đáng làm, nhưng là một màn hình khác. Bản đồ này để *nhìn*, không phải để tra cứu. |

## 3. Toạ độ

`LAYOUT` trong `src/lib/wordMap.ts`: năm mảng, mỗi mảng 12 cặp toạ độ trong
khung 340×400. Thứ tự trong mảng cũng là thứ tự nối đường của `<polyline>`, nên
đổi thứ tự là đổi luôn hình chòm sao.

Đặt tay vì hai lý do: mỗi cụm cần một dáng riêng để phân biệt được, và đường nối
phải liền mạch chứ không cắt chéo qua nhau.

Ba bất biến được test chốt lại trong `wordMap.test.ts`, để sau này thêm từ mà
quên đặt toạ độ thì test kêu chứ không âm thầm giấu từ đó đi:

1. Cả 60 từ đều có chỗ trên bản đồ.
2. Không toạ độ nào lọt ra ngoài khung 340×400.
3. Không hai từ nào trùng chỗ.

## 4. Quy tắc "đã nhớ"

Chỉ có **một** định nghĩa, nằm ở `isWordLearned()` trong
`src/lib/gamification.ts`: người học đã bấm "Đã nhớ" với từ đó ít nhất một lần.
`learnedWordCount()` cũng đi qua đúng hàm này, nên con số ở thẻ "từ đã nhớ" và
số sao trên bản đồ không bao giờ lệch nhau.

Bấm "Chưa nhớ" nhiều lần không làm tắt một ngôi sao đã sáng. Đây là lựa chọn có
ý thức: bản đồ này ghi lại *đã đi tới đâu*, không phải *đang thuộc bao nhiêu*.
Phần đo độ thuộc là việc của spaced repetition, chưa có trong bản này.

## 5. Kiến trúc

```
src/lib/wordMap.ts           Logic thuần: toạ độ, dựng cụm, hình bao luống hoa, neo nhãn
src/components/WordMap.tsx   Vẽ SVG, chọn chòm sao hay luống hoa theo chế độ
src/styles/wordMap.css       Màu, quầng sáng, nhịp thở
src/pages/ProgressPage.tsx   Đặt bản đồ lên đầu màn hình
```

```ts
buildWordMap(progress): WordCluster[]        // một cụm mỗi unit
wordMapTotals(clusters): { lit, total }
clusterBounds(marks): ClusterBounds | null   // luống hoa ôm quanh cụm
labelAnchor(x): 'start' | 'middle' | 'end'   // nhãn sát rìa thì neo vào trong
shortUnitTitle(title): string                // "Unit 3 · Gia đình" -> "Gia đình"
```

Vài quyết định nhỏ trong lúc vẽ:

- **Quầng sáng đặt trên cả nhóm sao đã nhớ**, không phải từng ngôi: một bộ lọc
  `drop-shadow` cho mười hai ngôi rẻ hơn mười hai bộ lọc.
- **`text-anchor` đặt bằng thuộc tính trên từng thẻ `<text>`**, không đặt trong
  CSS, vì nhãn sát rìa phải neo khác nhãn ở giữa mà CSS thì đè mất thuộc tính.
- **Bảng màu hoa không có màu trắng.** Bản đầu có một luống hoa trắng; trên nền
  cỏ sáng nó gần như mất hút, và chấm trắng ở chú thích thì vô hình hẳn.
- **Nhịp thở của chòm sao nghe theo lựa chọn nền động**: đã chọn Tắt thì không
  có lý do gì một góc màn hình vẫn nhấp nháy.

## 6. Tiếp cận được

Bản đồ là `role="img"` với một `aria-label` đọc ra đủ tổng số và tiến độ từng
cụm — 60 chấm rời rạc mà đọc từng cái thì vô nghĩa. Dòng chú thích bên dưới lặp
lại cùng thông tin đó bằng chữ thật, nên người không nhìn được bản đồ vẫn nắm
được y hệt.

## 7. Kiểm thử

| Phạm vi | File | Nội dung |
| --- | --- | --- |
| Logic thuần | `src/lib/wordMap.test.ts` | Ba bất biến ở mục 3; chỉ thắp đúng từ đã nhớ; "chưa nhớ" không tính; xong một unit thì chòm khác không ăn theo; thứ tự nối đường; hình bao luống hoa; neo nhãn. |
| Giao diện | `src/components/WordMap.test.tsx` | Tối ra bầu trời, sáng ra khu vườn; đếm đúng trên nhãn lẫn trong tên đọc được; chú thích từng cụm; dấu ✓ khi xong một unit; trình đọc màn hình nắm được tiến độ từng chòm. |

## 8. Nghiệm thu

- Mở Tiến độ khi chưa học gì: bản đồ trống, có lời mời học từ đầu tiên.
- Nhớ một từ ở màn flashcard rồi quay lại: đúng một ngôi sao sáng lên.
- Nhớ hết một unit: cả chòm sáng, chú thích có ✓, chòm khác không đổi.
- Đổi sang chế độ sáng: đúng những từ đó thành hoa nở, số đếm không đổi.
- Số trên thẻ "từ đã nhớ" luôn bằng số sao trên bản đồ.

## 9. Không nằm trong phạm vi

- Bấm vào một ngôi sao để xem lại từ đó.
- Sao sáng theo mức độ thuộc thay vì hai trạng thái — chờ spaced repetition.
- Bản đồ cho khoá khác ngoài HSK 1: `LAYOUT` hiện gắn theo `unitId`, thêm khoá
  là phải thêm sơ đồ, và test ở mục 3 sẽ nhắc.
