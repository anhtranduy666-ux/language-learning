"""Sinh icon cho PWA — mục 4 của docs/pwa.md.

    pip install Pillow
    npm run generate-icons

Vẽ bằng script chứ không cắt tay, để đổi màu thương hiệu hay đổi chữ thì chạy
lại một lệnh là xong, không phải mở phần mềm đồ hoạ.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public"

# Đỏ thương hiệu, đúng --color-brand-500 trong src/index.css.
BRAND = (226, 72, 61)
INK = (255, 255, 255)

# Một chữ chứ không phải 你好: ở cỡ 60px trên màn hình điện thoại, hai chữ
# nhoè thành vệt không đọc được.
GLYPH = "中"

# Font có bộ chữ Trung. Thứ tự ưu tiên: đậm trước, vì nét mảnh vỡ ở cỡ nhỏ.
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]


def find_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit(
        "Không tìm thấy font có chữ Hán. Cài Noto Sans CJK rồi thêm đường dẫn "
        "vào FONT_CANDIDATES."
    )


def draw_icon(size: int, coverage: float, rounded: bool) -> Image.Image:
    """
    :param coverage: chữ chiếm bao nhiêu phần bề rộng. Bản maskable phải nhỏ
        lại vì Android cắt icon theo hình dạng người dùng chọn.
    :param rounded: bo góc. iOS tự bo nên `apple-touch-icon` phải để vuông,
        bo sẵn là thành viền đen ở bốn góc.
    """
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if rounded:
        draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=int(size * 0.22), fill=BRAND)
    else:
        draw.rectangle([(0, 0), (size, size)], fill=BRAND)

    font = find_font(int(size * coverage))
    box = draw.textbbox((0, 0), GLYPH, font=font)
    draw.text(
        ((size - (box[2] - box[0])) / 2 - box[0], (size - (box[3] - box[1])) / 2 - box[1]),
        GLYPH,
        font=font,
        fill=INK,
    )
    return image


# (tên file, cỡ, tỉ lệ chữ, bo góc)
ICONS = [
    ("icon-192.png", 192, 0.62, True),
    ("icon-512.png", 512, 0.62, True),
    # Vùng an toàn của maskable là hình tròn 80% ở giữa — chữ phải nhỏ hơn.
    ("icon-maskable-512.png", 512, 0.46, False),
    # iOS không đọc icon trong manifest, và tự bo góc hộ.
    ("apple-touch-icon.png", 180, 0.62, False),
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, size, coverage, rounded in ICONS:
        target = OUT_DIR / name
        draw_icon(size, coverage, rounded).save(target, "PNG")
        print(f"  {name:<26} {size:>3}x{size:<3} {target.stat().st_size:>6} byte")

    print(f"\nXong. File nằm ở public/ và được chép thẳng ra gốc bản build.")


if __name__ == "__main__":
    main()
