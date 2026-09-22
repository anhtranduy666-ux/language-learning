# Audio thu sẵn

Thả file `.mp3` vào thư mục này, đặt tên đúng bằng `id` của từ trong
[`src/data/hsk1.ts`](../../data/hsk1.ts) — ví dụ `nihao.mp3` cho từ `你好`.

Ứng dụng tự nhận file mới, không cần khai báo ở đâu khác:
`src/lib/audioFiles.ts` quét thư mục này lúc build bằng `import.meta.glob`.

Thứ tự ưu tiên khi bấm nút phát âm:

1. File trong thư mục này (nếu có) — chuẩn nhất, không phụ thuộc máy người dùng.
2. Giọng đọc tiếng Trung của hệ điều hành qua Web Speech API.
3. Không có cả hai → nút báo cho người học biết cách cài giọng tiếng Trung.
