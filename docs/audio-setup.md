# Bật audio thật — việc cần làm

Hướng dẫn thao tác cho phương án ở [audio-tts.md](audio-tts.md). Tài liệu kia
nói *vì sao*; tài liệu này nói *bấm vào đâu*.

Chia rõ hai cột: phần **bạn** làm là những chỗ cần tài khoản, phần **Claude**
làm là những chỗ chạy bằng lệnh.

> **Không dán khoá vào khung chat.** Mọi khoá đều nằm trong file `.env.local`
> và `supabase/.env.functions` — cả hai đã được `.gitignore` loại trừ, không
> bao giờ lên GitHub. Claude chạy lệnh đọc các file đó chứ không đọc giá trị.

---

## 1. Azure Speech — bạn làm

1. Vào [portal.azure.com](https://portal.azure.com) → **Create a resource** →
   tìm **Speech service** → Create.
2. Pricing tier chọn **F0 (Free)**. Hạn mức 500.000 ký tự neural mỗi tháng.
   Cả khoá HSK 1 — 60 từ và 179 câu mẫu — chỉ 1.265 ký tự, sinh đúng một lần.
3. Tạo xong, vào **Keys and Endpoint**, chép lại:
   - **KEY 1** → `AZURE_SPEECH_KEY`
   - **Location/Region** (dạng `southeastasia`, `eastus`…) → `AZURE_SPEECH_REGION`

## 2. Supabase — bạn làm

1. Vào [supabase.com](https://supabase.com) → **New project**. Đặt mật khẩu
   database và giữ lại.
2. **Project Settings → API**, chép lại:
   - **Project URL** → `SUPABASE_URL` và `VITE_SUPABASE_URL` (cùng một giá trị)
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
3. **Account → Access Tokens** → *Generate new token* → `SUPABASE_ACCESS_TOKEN`.
   Token này để Claude deploy Edge Function bằng CLI.

> `anon public` là khoá **được thiết kế để lộ** — nó nằm sẵn trong bundle
> trình duyệt, và chặn truy cập bằng Row Level Security. Còn `service_role`
> thì **không bao giờ** được lọt vào mã client hay biến có tiền tố `VITE_`.

## 3. Tạo bảng — bạn làm

Mở **SQL Editor** trong Supabase, dán toàn bộ nội dung
[`supabase/migrations/20260923000000_tts_audio.sql`](../supabase/migrations/20260923000000_tts_audio.sql)
rồi Run.

Cách này khỏi cần mật khẩu database. Muốn dùng CLI thì chạy `npx supabase db push`.

Xong thì kiểm lại: **Storage** phải có bucket `tts`, **Table Editor** phải có
`speakable_texts` và `audio_clips`.

## 4. Hai file khoá — bạn tạo

`.env.local` ở thư mục gốc:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public>

SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role>
SUPABASE_ACCESS_TOKEN=<access token ở bước 2.3>

AZURE_SPEECH_KEY=<KEY 1>
AZURE_SPEECH_REGION=<region>
```

`supabase/.env.functions` — chỉ những gì Edge Function cần:

```
AZURE_SPEECH_KEY=<KEY 1>
AZURE_SPEECH_REGION=<region>
```

Tách riêng file thứ hai để lệnh `supabase secrets set --env-file` không đẩy
nhầm khoá khác lên server.

## 5. GitHub — bạn làm

1. **Settings → Pages** → Build and deployment → **Source: GitHub Actions**.
   Chưa bật thì workflow dừng ở bước cuối và site không lên được.
2. **Settings → Secrets and variables → Actions** → *New repository secret*,
   thêm hai cái:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Thiếu hai secret này thì bản deploy vẫn chạy, chỉ là không có audio từ xa.

## 6. Deploy và sinh audio — Claude làm

```bash
npx supabase link --project-ref <ref>
npx supabase secrets set --env-file supabase/.env.functions
npx supabase functions deploy speak
npm run prewarm-audio
```

Rồi đẩy một commit để GitHub Actions build lại với hai secret ở bước 5.

## 7. Nghiệm thu

- Mở site thật trên máy Windows **không** cài giọng tiếng Trung, bấm nút loa ở
  cả ba chỗ (Từ mới, Flashcard, bài Nghe) — phải ra tiếng.
- Tab Network: lần bấm đầu tải file từ `/storage/v1/object/public/tts/v1/…`,
  **không** gọi `/functions/v1/speak`. Gọi function nghĩa là hash hai bên lệch
  nhau, xem mục 11 của [audio-tts.md](audio-tts.md).
- Tắt mạng rồi bấm lại: nút không được kẹt ở trạng thái đang tải.
- Gọi `/functions/v1/speak` với một chuỗi lạ (`"text": "xin chào"`) phải trả
  403 `not_allowed` — whitelist đang chặn đúng.

## Chi phí

| Khoản | Mức dùng | Hạn miễn phí |
| --- | --- | --- |
| Azure Speech F0 | 1.265 ký tự, sinh một lần | 500.000 ký tự/tháng |
| Supabase Storage | ~1 MB mp3 | 1 GB |
| Supabase Edge Function | gần như không gọi | 500.000 lượt/tháng |
| GitHub Pages | site tĩnh | 100 GB băng thông/tháng |

Điều cần canh là *số lần sinh*, không phải *số lượt nghe*: file đã cache thì
phục vụ thẳng từ CDN. Whitelist ở bước 3 là thứ giữ con số đó cố định.
