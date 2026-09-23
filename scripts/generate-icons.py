"""Sinh icon cho PWA từ ảnh đại diện — mục 4 của docs/pwa.md.

    pip install Pillow
    npm run generate-icons

Nguồn là `ava.jpg` ở thư mục gốc. Thay ảnh đó rồi chạy lại là đổi được icon,
không phải mở phần mềm đồ hoạ.

Bốn file ra khác nhau ở chỗ nào:

- `icon-192`, `icon-512`, `apple-touch-icon`: ảnh phủ kín khung, để vuông.
  iOS và Android tự bo góc; bo sẵn là thành viền thừa ở bốn góc.
- `icon-maskable-512`: ảnh thu nhỏ vào giữa, chừa lề. Android cắt icon theo
  hình dạng người dùng chọn (tròn, vuông bo, giọt nước), nên phần nằm ngoài
  vòng tròn 80% ở giữa có thể bị xén mất.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "ava.jpg"
OUT_DIR = ROOT / "public"

# Vùng an toàn của maskable là hình tròn 80% ở giữa. Để 78% cho chắc.
MASKABLE_COVERAGE = 0.78

# (tên file, cỡ, có chừa lề cho Android cắt không)
ICONS = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable-512.png", 512, True),
    # iOS không đọc icon trong manifest, phải có file riêng đúng tên này.
    ("apple-touch-icon.png", 180, False),
]


def load_square() -> Image.Image:
    """Ảnh nguồn, cắt thành vuông từ giữa. Icon nào cũng vuông."""
    if not SOURCE.exists():
        raise SystemExit(f"Không tìm thấy ảnh nguồn: {SOURCE}")

    image = Image.open(SOURCE).convert("RGB")
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def background_of(image: Image.Image) -> tuple[int, int, int]:
    """
    Màu nền để chèn lề cho bản maskable.

    Lấy màu **phổ biến nhất** ở viền, không lấy trung bình: nhân vật thường
    chạm mép dưới, nên trung bình giữa nền trắng và thân nhân vật ra một màu
    xám không giống chỗ nào trong ảnh, thành ra viền lộ rõ.
    """
    side = image.size[0]
    edge = [(x, 0) for x in range(side)] + [(x, side - 1) for x in range(side)]
    edge += [(0, y) for y in range(side)] + [(side - 1, y) for y in range(side)]

    counts: dict[tuple[int, int, int], int] = {}
    for point in edge:
        # Gom về bậc 16 để những sắc trắng lệch nhau chút ít vẫn tính là một.
        pixel = tuple(channel // 16 * 16 for channel in image.getpixel(point))
        counts[pixel] = counts.get(pixel, 0) + 1  # type: ignore[index]

    return max(counts, key=lambda colour: counts[colour])


def render(source: Image.Image, size: int, padded: bool) -> Image.Image:
    if not padded:
        return source.resize((size, size), Image.LANCZOS)

    canvas = Image.new("RGB", (size, size), background_of(source))
    inner = int(size * MASKABLE_COVERAGE)
    offset = (size - inner) // 2
    canvas.paste(source.resize((inner, inner), Image.LANCZOS), (offset, offset))
    return canvas


def main() -> None:
    source = load_square()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Nguồn: {SOURCE.name}  {source.size[0]}x{source.size[1]}")
    largest = max(size for _, size, _ in ICONS)
    if source.size[0] < largest:
        print(
            f"  Lưu ý: ảnh nguồn nhỏ hơn {largest}px nên bản {largest} bị phóng to "
            f"và sẽ hơi mềm nét. Có file gốc lớn hơn thì thay vào rồi chạy lại."
        )

    for name, size, padded in ICONS:
        target = OUT_DIR / name
        render(source, size, padded).save(target, "PNG")
        print(f"  {name:<26} {size:>3}x{size:<3} {target.stat().st_size:>6} byte")

    print("\nXong. File nằm ở public/ và được chép thẳng ra gốc bản build.")


if __name__ == "__main__":
    main()
