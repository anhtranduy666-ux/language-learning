-- Audio phát âm — mục 6 của docs/audio-tts.md.
--
-- Chạy bằng `supabase db push`, hoặc dán vào SQL Editor trên dashboard.

-- Bucket công khai: ai cũng đọc được qua CDN, nhưng chỉ service role ghi được.
-- Đường dẫn file là sha256 của nội dung nên không đoán mò ra được, và cũng
-- không có gì bí mật trong đó — toàn bộ là từ vựng của khoá học.
insert into storage.buckets (id, name, public)
values ('tts', 'tts', true)
on conflict (id) do nothing;

-- Danh sách chuỗi được phép sinh audio.
--
-- Không có bảng này thì `/speak` là một proxy TTS miễn phí cho cả internet:
-- ai cũng đọc được chuỗi bất kỳ bằng hoá đơn của chúng ta. Đối chiếu theo hash
-- khiến người lạ không sinh được nội dung mới, kể cả khi biết endpoint.
create table if not exists public.speakable_texts (
  hash       text primary key,          -- sha256(text \n voice \n rate)
  text       text not null,
  voice      text not null,
  rate       numeric not null default 0.85,
  source     text not null check (source in ('word', 'example')),
  word_id    text,                      -- id trong src/data/hsk1.ts
  created_at timestamptz not null default now()
);

alter table public.speakable_texts enable row level security;
-- Cố ý không tạo policy nào: chỉ service role, tức Edge Function, đọc được.

-- Bảng quan sát, để theo dõi chi phí TTS. Không bắt buộc cho đường đi chính.
create table if not exists public.audio_clips (
  hash           text primary key references public.speakable_texts(hash) on delete cascade,
  provider       text not null,
  bytes          integer not null,
  created_at     timestamptz not null default now(),
  last_served_at timestamptz
);

alter table public.audio_clips enable row level security;
