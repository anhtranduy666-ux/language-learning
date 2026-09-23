"""Sinh file phát âm cho toàn bộ từ vựng, chạy ngay trên máy.

Dùng Piper — bộ TTS mã nguồn mở chạy ngoại tuyến. Không tài khoản, không khoá
API, không hạn mức: thêm từ mới vào `src/data/hsk1.ts` rồi chạy lại là xong.

    pip install piper-tts lameenc
    npm run generate-audio

File ra nằm ở `src/assets/audio/<id từ>.mp3` — đúng quy ước mà
`src/lib/audioFiles.ts` đang quét, nên không phải khai báo thêm ở đâu. Nhớ
commit chỗ đó, vì bản deploy lấy audio từ repo.

Vì sao chọn cách này thay vì Supabase + Azure như `docs/audio-tts.md` mô tả:
mọi dịch vụ TTS neural đều đòi thẻ tín dụng, kể cả ở bậc miễn phí. Chạy tại
máy thì không có gì để hết hạn hay đổi giá. Phần Supabase vẫn còn nguyên trong
repo cho lúc nội dung lớn tới mức không nên nhét mp3 vào git nữa.
"""

from __future__ import annotations

import io
import json
import subprocess
import sys
import wave
from pathlib import Path

import lameenc
from piper import PiperVoice
from piper.download_voices import download_voice

# Chữ Hán không in được ra console mặc định của Windows (cp1252).
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "src" / "assets" / "audio"
VOICE_DIR = ROOT / ".piper-voices"

# Giọng nữ phổ thông đại lục, bản `medium`. Đổi giọng thì xoá hết mp3 cũ rồi
# chạy lại, nếu không sẽ lẫn hai giọng trong cùng một khoá học.
VOICE = "zh_CN-huayan-medium"

# 64 kbps mono là thừa sức cho giọng đọc một từ; mỗi file khoảng 6 KB.
MP3_BITRATE = 64
MP3_QUALITY = 2

FORCE = "--force" in sys.argv


def load_words() -> list[dict[str, str]]:
    """Đọc từ vựng qua Node, để chỉ có đúng một nguồn nội dung."""
    result = subprocess.run(
        ["node", str(ROOT / "scripts" / "dump-words.ts")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
    )
    if result.returncode != 0:
        raise SystemExit(f"Không đọc được danh sách từ:\n{result.stderr}")
    return json.loads(result.stdout)


def ensure_voice() -> Path:
    """Tải model nếu chưa có. Thư mục này đã nằm trong .gitignore."""
    model = VOICE_DIR / f"{VOICE}.onnx"
    if model.exists():
        return model

    print(f"Tải model {VOICE} (khoảng 60 MB, chỉ một lần)…")
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    download_voice(VOICE, VOICE_DIR)
    return model


def to_mp3(pcm: bytes, sample_rate: int, channels: int) -> bytes:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(MP3_BITRATE)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(channels)
    encoder.set_quality(MP3_QUALITY)
    return bytes(encoder.encode(pcm) + encoder.flush())


def synthesize(voice: PiperVoice, text: str) -> bytes:
    """Đọc một chuỗi thành mp3, không ghi file tạm ra đĩa."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        voice.synthesize_wav(text, wav)

    buffer.seek(0)
    with wave.open(buffer, "rb") as wav:
        return to_mp3(wav.readframes(wav.getnframes()), wav.getframerate(), wav.getnchannels())


def main() -> None:
    words = load_words()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    model = ensure_voice()
    print(f"Giọng: {VOICE}")
    voice = PiperVoice.load(str(model))

    created = 0
    skipped = 0
    total_bytes = 0

    for word in words:
        target = AUDIO_DIR / f"{word['id']}.mp3"

        if target.exists() and not FORCE:
            skipped += 1
            total_bytes += target.stat().st_size
            continue

        mp3 = synthesize(voice, word["hanzi"])
        target.write_bytes(mp3)
        created += 1
        total_bytes += len(mp3)
        print(f"  + {word['id']:<12} {word['hanzi']:<6} {len(mp3):>6} byte")

    print(f"\nSinh mới {created}, đã có sẵn {skipped}. Tổng {total_bytes / 1024:.0f} KB.")
    if created:
        print("Nhớ commit src/assets/audio/ để bản deploy cũng có tiếng.")


if __name__ == "__main__":
    main()
