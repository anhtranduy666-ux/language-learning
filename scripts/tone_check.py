"""Chấm thanh điệu của audio vừa sinh, không cần tai người.

Máy đọc là mô hình có yếu tố ngẫu nhiên: cùng một câu, lần này thanh 4 đổ
xuống rõ, lần sau lại gần như phẳng. `generate-audio.py` vì vậy sinh vài bản
cho mỗi clip rồi dùng file này chọn bản đúng thanh nhất.

Cách chấm: đo đường cao độ (F0) trong phần vần của từng âm tiết — ranh giới
âm tiết lấy từ chính mô hình (`include_alignments`) — rồi so với hình dáng
của thanh mong đợi:

- thanh 1 cao và phẳng,
- thanh 2 đi lên,
- thanh 3 thấp, hoặc có chỗ trũng,
- thanh 4 đổ xuống.

Bộ đo cao độ đã được kiểm trên tín hiệu giả biết trước đường cao độ, và trên
giọng Microsoft Huihui của Windows — giọng thương mại đọc đúng thanh. Chi tiết
và số đo ở `docs/audio-voice.md`.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

# Khung phân tích 10 ms, cửa sổ 30 ms, tầm cao độ giọng người 75–500 Hz.
HOP_SECONDS = 0.01
TARGET_RATE = 16_000
F0_MIN, F0_MAX = 75, 500

# Ngưỡng cho từng thanh, tính theo độ dốc tương đối (cuối so với đầu).
FALL_T4 = -0.10
RISE_T2 = 0.06
FLAT_T1 = 0.08


def _lowpass_resample(x: np.ndarray, rate: int) -> np.ndarray:
    """Lọc thông thấp rồi hạ về 16 kHz — cao tần làm bộ dò chu kỳ bắt nhầm."""
    if rate == TARGET_RATE:
        return x.astype(np.float64)
    cutoff = 0.45 * TARGET_RATE / rate
    taps = 101
    k = np.arange(taps) - (taps - 1) / 2
    kernel = 2 * cutoff * np.sinc(2 * cutoff * k) * np.hamming(taps)
    kernel /= kernel.sum()
    y = np.convolve(x.astype(np.float64), kernel, mode="same")
    t_new = np.arange(0, len(y) / rate, 1 / TARGET_RATE)
    return np.interp(t_new, np.arange(len(y)) / rate, y)


def f0_track(x: np.ndarray, rate: int, voicing: float = 0.55) -> np.ndarray:
    """Cao độ theo khung 10 ms bằng tương quan chéo chuẩn hoá. 0 = vô thanh."""
    y = _lowpass_resample(x, rate)
    n = int(0.03 * TARGET_RATE)
    hop = int(HOP_SECONDS * TARGET_RATE)
    lo, hi = int(TARGET_RATE / F0_MAX), int(TARGET_RATE / F0_MIN)
    rms = np.sqrt(np.mean(y**2)) + 1e-12

    out = []
    for start in range(0, max(0, len(y) - n - hi), hop):
        a = y[start : start + n]
        energy = float(np.dot(a, a))
        if np.sqrt(energy / n) < 0.15 * rms:
            out.append(0.0)
            continue

        lags = np.arange(lo, hi + 1)
        segments = np.lib.stride_tricks.sliding_window_view(y[start + lo : start + hi + n + 1], n)
        segments = segments[: len(lags)]
        dots = segments @ a
        norms = np.sqrt(energy * np.einsum("ij,ij->i", segments, segments) + 1e-12)
        values = dots / norms

        best = int(np.argmax(values))
        # Lấy chu kỳ ngắn nhất có đỉnh gần bằng đỉnh cao nhất, để không nhận
        # nhầm gấp đôi chu kỳ (tức hụt một quãng tám).
        for j in range(len(values)):
            left = values[j - 1] if j > 0 else -np.inf
            right = values[j + 1] if j + 1 < len(values) else -np.inf
            if values[j] > 0.9 * values[best] and values[j] >= left and values[j] >= right:
                best = j
                break

        if values[best] < voicing:
            out.append(0.0)
            continue

        shift = 0.0
        if 0 < best < len(values) - 1:
            a1, b1, c1 = values[best - 1], values[best], values[best + 1]
            shift = (a1 - c1) / (2 * (a1 - 2 * b1 + c1) + 1e-12)
        out.append(TARGET_RATE / (lags[best] + shift))

    f0 = np.array(out)
    smoothed = f0.copy()
    for i in range(1, len(f0) - 1):
        window = f0[i - 1 : i + 2]
        if (window > 0).all():
            smoothed[i] = np.median(window)
    return smoothed


@dataclass
class SyllableCheck:
    token: str
    tone: int
    start_hz: float
    end_hz: float
    ok: bool | None  # None: không đủ khung hữu thanh để chấm
    margin: float


def _voiced(f0: np.ndarray, rate: int, start: int, end: int) -> np.ndarray:
    a, b = int(start / rate / HOP_SECONDS), int(end / rate / HOP_SECONDS)
    segment = f0[a:b]
    return segment[segment > 0]


def check_syllable(segment: np.ndarray, tone: int, reference: float) -> tuple[bool | None, float, float, float]:
    """(đạt?, biên độ an toàn, Hz đầu, Hz cuối). Biên dương là đạt, càng lớn càng chắc."""
    if len(segment) < 3:
        return None, 0.0, 0.0, 0.0

    k = max(1, len(segment) // 4)
    head, tail = float(np.median(segment[:k])), float(np.median(segment[-k:]))
    slope = (tail - head) / head
    level = float(segment.mean()) / reference

    if tone == 4:
        margin = FALL_T4 - slope
    elif tone == 2:
        margin = slope - RISE_T2
    elif tone == 1:
        margin = min(FLAT_T1 - abs(slope), level - 0.95)
    else:  # thanh 3: thấp hơn mặt bằng, hoặc có chỗ trũng
        dip = (min(head, tail) * 0.93 - float(segment.min())) / reference
        margin = max(1.0 - level, dip)

    return margin > 0, margin, head, tail


def check_clip(
    audio: np.ndarray,
    rate: int,
    spans: list[tuple[str, int, int, int]],
    expected: list[int],
) -> list[SyllableCheck]:
    """Chấm từng âm tiết. `spans`: (token, bắt đầu, hết phụ âm đầu, kết thúc) theo mẫu."""
    f0 = f0_track(audio, rate)
    voiced = f0[f0 > 0]
    reference = float(voiced.mean()) if len(voiced) else 1.0

    results = []
    for (token, _start, vowel_start, end), tone in zip(spans, expected):
        if tone == 0:
            continue
        ok, margin, head, tail = check_syllable(_voiced(f0, rate, vowel_start, end), tone, reference)
        results.append(SyllableCheck(token, tone, head, tail, ok, margin))
    return results


def score(results: list[SyllableCheck]) -> tuple[int, float]:
    """Khoá để xếp hạng các bản sinh: nhiều âm tiết đạt trước, rồi tới biên an toàn."""
    passed = sum(1 for r in results if r.ok)
    margin = sum(float(np.clip(r.margin, -0.3, 0.3)) for r in results if r.ok is not None)
    return passed, margin
