"""Sinh bản thu mẫu cho test của phần chấm phát âm.

Mẹo riêng của repo này: Piper đọc thẳng từ pinyin đánh số, nên sinh được cả
bản đọc **đúng** lẫn bản đọc **cố tình sai thanh**. Đưa hai bản đó vào bộ chấm
thì bản sai phải bị trừ điểm đúng ở âm tiết sai — một bài kiểm thật, sinh lại
được, không cần thu giọng người.

"Người học" ở đây là giọng `xiao_ya` đọc lại từ đầu, rồi **hạ hoặc nâng cao độ**
(kéo giãn hay nén tín hiệu, cao độ và âm sắc đổi theo): một giọng trầm hơn bản
mẫu 20%, một giọng cao hơn 20%. Đã thử giọng Piper thứ hai (`chaowen`) nhưng nó
đọc sai thanh quá thường — 你 trong 你好 chỉ lên giọng 1/8 lần — nên không làm
được bản "đọc đúng".

Mỗi bản chỉ được giữ khi `tone_check.py` xác nhận nó thật sự mang đúng thanh
định đọc — bản "đúng" phải đúng, bản "sai" phải sai rõ ràng. Không thế thì test
sẽ kiểm nhầm vào chỗ máy đọc lệch.

    PYTHONPATH=<nơi có onnx, unicode-rbnf> python scripts/generate-speech-fixtures.py

File ra: `src/test/fixtures/speech/`, WAV 16 kHz 16 bit mono, kèm `index.json`
ghi độ dài phần có tiếng của bản mẫu (để test phần nhịp). Tách riêng khỏi
`src/assets/audio/` — đây là dữ liệu test, không lên bản deploy.
"""

from __future__ import annotations

import importlib.util
import json
import sys
import wave
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "test" / "fixtures" / "speech"

spec = importlib.util.spec_from_file_location("gen", ROOT / "scripts" / "generate-audio.py")
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

from piper import PiperVoice  # noqa: E402

RATE = 16_000

# Khoảng lặng hai đầu và tiếng nền của micro do test tự thêm vào, khỏi phải
# chứa hàng trăm KB khoảng lặng trong repo.
ATTEMPTS = 40

# Hệ số cao độ của "người học": < 1 là giọng trầm hơn bản mẫu, > 1 là cao hơn.
LOW, HIGH = 0.8, 1.2

# (id, pinyin như trong hsk1.ts, token đọc đúng, thanh nghe thấy mong đợi,
#  [(tên bản sai, token sai, thanh của bản sai, chỉ số âm tiết sai)])
WORDS = [
    ("nihao", "nǐ hǎo", ["ni3", "hao3"], [2, 3], [("ni4", ["ni4", "hao3"], [4, 3], 0)]),
    ("xiexie", "xiè xie", ["xie4", "xie5"], [4, 0], [("xie1", ["xie1", "xie5"], [1, 0], 0)]),
    ("shi", "shì", ["shi4"], [4], [("shi1", ["shi1"], [1], 0)]),
    ("ta-nam", "tā", ["ta1"], [1], [("ta4", ["ta4"], [4], 0)]),
    ("ren", "rén", ["ren2"], [2], [("ren4", ["ren4"], [4], 0)]),
    ("hao", "hǎo", ["hao3"], [3], [("hao2", ["hao2"], [2], 0)]),
    ("laoshi", "lǎo shī", ["lao3", "shi1"], [3, 1], [("shi4", ["lao3", "shi4"], [3, 4], 1)]),
    ("mama", "mā ma", ["ma1", "ma5"], [1, 0], []),
    ("shangwu", "shàng wǔ", ["shang4", "wu3"], [4, 3], []),
    ("bukeqi", "bú kè qi", ["bu2", "ke4", "qi5"], [2, 4, 0], []),
]


def to_16k(audio: np.ndarray, rate: int) -> np.ndarray:
    taps = 101
    cutoff = 0.45 * RATE / rate
    k = np.arange(taps) - (taps - 1) / 2
    kernel = 2 * cutoff * np.sinc(2 * cutoff * k) * np.hamming(taps)
    kernel /= kernel.sum()
    filtered = np.convolve(audio.astype(np.float64), kernel, mode="same")
    t = np.arange(0, len(filtered) / rate, 1 / RATE)
    return np.interp(t, np.arange(len(filtered)) / rate, filtered).astype(np.float32)


def shift_pitch(audio: np.ndarray, factor: float) -> np.ndarray:
    """Đổi cao độ bằng cách kéo giãn tín hiệu — giọng đổi cả cao độ lẫn âm sắc."""
    positions = np.arange(0, len(audio) - 1, factor)
    return np.interp(positions, np.arange(len(audio)), audio).astype(np.float32)


def speech_seconds(samples: np.ndarray) -> float:
    """Như `speechSeconds()` ở `src/lib/pronunciation.ts`: khung 25 ms, bước 10 ms, ngưỡng dưới đỉnh 30 dB."""
    window, hop = int(0.025 * RATE), int(0.01 * RATE)
    frames = [
        10 * np.log10(np.mean(samples[i : i + window] ** 2) + 1e-12)
        for i in range(0, len(samples) - window + 1, hop)
    ]
    peak = max(frames)
    loud = [i for i, value in enumerate(frames) if value >= peak - 30]
    return (loud[-1] + 1 - loud[0]) * 0.01


def best_render(voice: PiperVoice, tokens: list[str], expect: list[int]) -> np.ndarray:
    """Bản đọc mà mọi âm tiết được chấm đều đạt đúng thanh `expect`."""
    clip = {"kind": "word", "tokens": tokens, "expect": expect, "hanzi": " ".join(tokens)}
    for _ in range(ATTEMPTS):
        audio, _key, results = gen.render(voice, clip)
        if all(r.ok for r in results):
            return audio
    raise SystemExit(f"Không sinh được bản đọc rõ ràng cho {tokens} sau {ATTEMPTS} lần")


def write(path: Path, samples: np.ndarray) -> None:
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(pcm.tobytes())


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.wav"):
        old.unlink()

    voice = PiperVoice.load(str(gen.ensure_voice()), include_alignments=True)
    rate = voice.config.sample_rate

    index = []
    for seed, (word_id, pinyin, tokens, expect, wrongs) in enumerate(WORDS):
        reference = to_16k(best_render(voice, tokens, expect), rate)
        factor = LOW if seed % 2 == 0 else HIGH
        voice_name = "low" if factor == LOW else "high"

        correct = f"{word_id}.correct-{voice_name}.wav"
        write(OUT / correct, to_16k(shift_pitch(best_render(voice, tokens, expect), factor), rate))

        entry = {
            "id": word_id,
            "pinyin": pinyin,
            "referenceSeconds": round(speech_seconds(reference), 2),
            "correct": correct,
            "wrong": [],
        }
        for name, wrong_tokens, wrong_expect, syllable in wrongs:
            file = f"{word_id}.wrong-{name}-{voice_name}.wav"
            audio = shift_pitch(best_render(voice, wrong_tokens, wrong_expect), factor)
            write(OUT / file, to_16k(audio, rate))
            entry["wrong"].append({"file": file, "read": " ".join(wrong_tokens), "syllable": syllable})
        index.append(entry)
        print(f"  + {word_id:<10} {pinyin:<12} giọng {voice_name:<4} {len(wrongs)} bản sai")

    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    files = list(OUT.glob("*.wav"))
    print(f"\n{len(index)} từ, {len(files)} file, {sum(f.stat().st_size for f in files) / 1024:.0f} KB.")


if __name__ == "__main__":
    main()
