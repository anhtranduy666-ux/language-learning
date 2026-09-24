# Audio thu sẵn

Mọi file ở đây do `npm run generate-audio` sinh ra — xem
[`docs/audio-voice.md`](../../../docs/audio-voice.md). Đừng thả file vào bằng
tay: test sẽ báo đỏ, vì một file lạ dễ làm lẫn hai giọng đọc trong một khoá học.

- `<id của từ>.mp3` — ví dụ `nihao.mp3` cho từ `你好`, id lấy ở
  [`src/data/hsk1.ts`](../../data/hsk1.ts).
- `manifest.json` — giọng đọc và pinyin đánh số đã dùng cho từng file. Script
  dựa vào đây để chỉ sinh lại những clip vừa đổi pinyin; test dựa vào đây để bắt
  file cũ đọc theo pinyin cũ.

Ứng dụng tự nhận file mới, không cần khai báo ở đâu khác:
`src/lib/audioFiles.ts` quét thư mục này lúc build bằng `import.meta.glob`.

Thứ tự ưu tiên khi bấm nút phát âm:

1. File trong thư mục này — chuẩn nhất, không phụ thuộc máy người dùng.
2. Giọng đọc tiếng Trung của hệ điều hành qua Web Speech API.
3. Không có cả hai → nút báo cho người học biết cách cài giọng tiếng Trung.
