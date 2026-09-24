"""Sinh file phát âm cho toàn bộ từ vựng, chạy ngay trên máy.

Dùng Piper — bộ TTS mã nguồn mở chạy ngoại tuyến. Không tài khoản, không khoá
API, không hạn mức: sửa `src/data/hsk1.ts` rồi chạy lại là xong.

    pip install "piper-tts[alignment]" lameenc unicode-rbnf
    npm run generate-audio             # chỉ sinh clip mới, hoặc clip đổi pinyin
    npm run generate-audio -- --force  # sinh lại tất cả

File ra nằm ở `src/assets/audio/` — đúng chỗ `src/lib/audioFiles.ts` đang quét,
nên không phải khai báo thêm ở đâu. Nhớ commit cả thư mục đó, vì bản deploy
lấy audio từ repo.

Ba điều làm nên chất lượng, chi tiết và số đo ở `docs/audio-voice.md`:

1. **Máy đọc đúng pinyin mình viết.** Giọng `zh_CN-xiao_ya` nhận thẳng pinyin
   đánh số, nên chữ đa âm không bị đoán sai. Giọng cũ `huayan` đi qua espeak,
   và espeak gộp thanh 1 với thanh 4 làm một — 是 và 师 ra cùng một đầu vào.
2. **Từ đơn được đọc trong câu đệm.** Đọc một âm tiết trơ trọi thì thanh 4
   gần như phẳng. Đặt vào "我说，__，你说。" rồi cắt ra thì thanh nào cũng rõ.
3. **Sinh vài bản rồi chọn.** Mô hình có yếu tố ngẫu nhiên; `tone_check.py`
   đo cao độ từng âm tiết và giữ lại bản đúng thanh nhất.

Vì sao chạy tại máy thay vì Supabase + Azure như `docs/audio-tts.md` mô tả:
mọi dịch vụ TTS neural đều đòi thẻ tín dụng, kể cả ở bậc miễn phí. Chạy tại
máy thì không có gì để hết hạn hay đổi giá.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import lameenc
import numpy as np

# Chữ Hán không in được ra console mặc định của Windows (cp1252).
sys.stdout.reconfigure(encoding="utf-8")

try:
    from piper import PiperVoice, SynthesisConfig
    from piper.download_voices import download_voice
    from piper.phonemize_chinese import _split_initial_final_tone
except ImportError as error:  # pragma: no cover - chỉ để báo lỗi dễ hiểu
    raise SystemExit(
        f"Thiếu thư viện ({error.name}). Chạy:\n"
        '    pip install "piper-tts[alignment]" lameenc unicode-rbnf'
    ) from error

from tone_check import check_clip, score

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "src" / "assets" / "audio"
MANIFEST = AUDIO_DIR / "manifest.json"
VOICE_DIR = ROOT / ".piper-voices"

# Giọng nữ phổ thông đại lục, huấn luyện trên kho thu âm Biaobei (BZNSYP).
# Đổi giọng thì chạy lại với --force, nếu không sẽ lẫn hai giọng trong một khoá.
VOICE = "zh_CN-xiao_ya-medium"

# Ít ngẫu nhiên hơn mặc định (0.667 / 0.8): thanh điệu ổn định hơn giữa các lần sinh.
SYNTHESIS = {
    "word": SynthesisConfig(noise_scale=0.333, noise_w_scale=0.333, length_scale=1.0),
    # Câu đọc chậm hơn một chút, để người mới nghe kịp từng âm tiết.
    "sentence": SynthesisConfig(noise_scale=0.333, noise_w_scale=0.333, length_scale=1.1),
}

# Số bản sinh cho mỗi clip. Từ ngắn nên sinh nhiều bản cũng nhanh.
CANDIDATES = {"word": 16, "sentence": 8}

# Câu đệm cho từ đơn: "我说，__，你说。" — xem mục 2 ở đầu file.
CARRIER_BEFORE = ["wo3", "shuo1", "，"]
CARRIER_AFTER = ["，", "ni3", "shuo1", "。"]

# 48 kbps mono là thừa cho giọng đọc; một câu mẫu khoảng 12 KB.
MP3_BITRATE = 48
MP3_QUALITY = 2

# Khoảng lặng giữ lại ở hai đầu clip, và độ dài đoạn vào/ra nhỏ dần.
LEAD_SECONDS = 0.03
TAIL_SECONDS = 0.12
FADE_IN_SECONDS = 0.008
FADE_OUT_SECONDS = 0.03
PEAK = 0.89  # -1 dBFS: chừa chỗ cho mp3, khỏi vỡ tiếng

FORCE = "--force" in sys.argv


def load_clips() -> list[dict]:
    """Đọc danh sách clip qua Node, để chỉ có đúng một nguồn nội dung."""
    result = subprocess.run(
        ["node", str(ROOT / "scripts" / "dump-clips.ts")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
    )
    if result.returncode != 0:
        raise SystemExit(f"Không đọc được danh sách clip:\n{result.stderr}")
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


def phoneme_groups(tokens: list[str]) -> list[list[str]]:
    """Mỗi âm tiết thành [phụ âm đầu, vần, thanh]; dấu câu đứng riêng một nhóm."""
    groups = []
    for token in tokens:
        if token in "，。？！":
            groups.append([token])
            continue
        initial, final, tone = _split_initial_final_tone(token)
        if not final:
            raise SystemExit(f"Máy đọc không hiểu âm tiết {token!r}")
        groups.append([initial or "Ø", final, tone])
    return groups


def synthesize(voice: PiperVoice, tokens: list[str], config: SynthesisConfig):
    """Đọc một chuỗi token. Trả audio và ranh giới từng token (tính theo mẫu).

    Mỗi ranh giới là (token, bắt đầu, hết phụ âm đầu, kết thúc). Mô hình tự
    báo mỗi âm vị dài bao nhiêu mẫu, nên không phải đoán ranh giới từ tiếng.
    """
    groups = phoneme_groups(tokens)
    phonemes = [phoneme for group in groups for phoneme in group]
    ids = voice.phonemes_to_ids(phonemes)

    # BOS, rồi mỗi nhóm kèm một PAD ở cuối, rồi EOS.
    if len(ids) != 2 + sum(len(group) + 1 for group in groups):
        raise SystemExit("Piper đổi cách xếp phoneme id — cần xem lại synthesize()")

    audio, samples = voice.phoneme_ids_to_audio(ids, config, include_alignments=True)
    samples = [int(s) for s in samples]

    spans = []
    position, cursor = 1, samples[0]
    for token, group in zip(tokens, groups):
        width = len(group) + 1
        durations = samples[position : position + width]
        initial = durations[0] if len(group) == 3 and group[0] != "Ø" else 0
        spans.append((token, cursor, cursor + initial, cursor + sum(durations)))
        cursor += sum(durations)
        position += width

    return np.asarray(audio, dtype=np.float32), voice.config.sample_rate, spans


def render(voice: PiperVoice, clip: dict):
    """Một bản sinh của clip: (audio đã cắt, điểm, kết quả chấm)."""
    kind = clip["kind"]
    config = SYNTHESIS[kind]

    if kind == "word":
        tokens = CARRIER_BEFORE + clip["tokens"] + CARRIER_AFTER
        expected = [0] * len(CARRIER_BEFORE) + clip["expect"] + [0] * len(CARRIER_AFTER)
    else:
        tokens, expected = clip["tokens"], clip["expect"]

    audio, rate, spans = synthesize(voice, tokens, config)
    results = check_clip(audio, rate, spans, expected)

    if kind == "word":
        first = len(CARRIER_BEFORE)
        last = first + len(clip["tokens"]) - 1
        pause_after = spans[last + 1]
        start = spans[first][1] - int(LEAD_SECONDS * rate)
        end = spans[last][3] + min(pause_after[3] - pause_after[1], int(TAIL_SECONDS * rate))
        audio = audio[max(0, start) : end]
    else:
        speech = [span for span in spans if span[0] not in "，。？！"]
        start = speech[0][1] - int(LEAD_SECONDS * rate)
        end = speech[-1][3] + int(TAIL_SECONDS * rate)
        audio = audio[max(0, start) : end]

    return finish(audio, rate), score(results), results


def finish(audio: np.ndarray, rate: int) -> np.ndarray:
    """Chuẩn hoá âm lượng và vuốt hai đầu, để nút bấm không nghe tiếng "tách"."""
    audio = audio / max(float(np.max(np.abs(audio))), 1e-8) * PEAK
    fade_in = min(len(audio), int(FADE_IN_SECONDS * rate))
    fade_out = min(len(audio), int(FADE_OUT_SECONDS * rate))
    audio[:fade_in] *= np.linspace(0, 1, fade_in)
    audio[len(audio) - fade_out :] *= np.linspace(1, 0, fade_out)
    return audio


def to_mp3(audio: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(MP3_BITRATE)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(MP3_QUALITY)
    return bytes(encoder.encode(pcm) + encoder.flush())


def describe(results) -> str:
    """Tóm tắt kết quả chấm để in ra: `ni3 ✓ hao3 ✗(262→270)`."""
    parts = []
    for r in results:
        mark = "?" if r.ok is None else ("✓" if r.ok else f"✗({r.start_hz:.0f}→{r.end_hz:.0f})")
        parts.append(f"{r.token}{mark}")
    return " ".join(parts)


def main() -> None:
    clips = load_clips()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    recorded = manifest.get("clips", {}) if manifest.get("voice") == VOICE else {}

    model = ensure_voice()
    print(f"Giọng: {VOICE}")
    voice = PiperVoice.load(str(model), include_alignments=True)

    created, skipped, weak = 0, 0, []
    clips_out: dict[str, str] = {}

    for clip in clips:
        target = AUDIO_DIR / clip["path"]
        spoken = " ".join(clip["tokens"])
        clips_out[clip["path"]] = spoken

        if target.exists() and recorded.get(clip["path"]) == spoken and not FORCE:
            skipped += 1
            continue

        best = None
        for _ in range(CANDIDATES[clip["kind"]]):
            audio, key, results = render(voice, clip)
            if best is None or key > best[1]:
                best = (audio, key, results)
            if all(r.ok for r in results):
                break

        audio, _, results = best
        target.parent.mkdir(parents=True, exist_ok=True)
        mp3 = to_mp3(audio, voice.config.sample_rate)
        target.write_bytes(mp3)
        created += 1

        if any(r.ok is False for r in results):
            weak.append(f"{clip['path']} {clip['hanzi']}: {describe(results)}")
        print(f"  + {clip['path']:<28} {clip['hanzi']:<10} {len(mp3):>6} byte  {describe(results)}")

    MANIFEST.write_text(
        json.dumps({"voice": VOICE, "clips": clips_out}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total = sum((AUDIO_DIR / path).stat().st_size for path in clips_out)
    print(f"\nSinh mới {created}, đã có sẵn {skipped}. Tổng {total / 1024:.0f} KB.")
    if weak:
        print(f"\n{len(weak)} clip vẫn có âm tiết chưa đạt sau {max(CANDIDATES.values())} lần thử:")
        for line in weak:
            print(f"  {line}")
    if created:
        print("\nNhớ commit src/assets/audio/ để bản deploy cũng có tiếng.")


if __name__ == "__main__":
    main()
