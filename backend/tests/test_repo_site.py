"""The site's static identity: the logo's icons, the tab title and the share
tags. They live in frontend/ but are checked here, as files."""

import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).parents[2]
PUBLIC = ROOT / "frontend/public"
MARK = (ROOT / "frontend/src/components/logoMark.ts").read_text("utf8")
S_PATH = re.search(r'export const S_PATH =\s*"([^"]+)"', MARK).group(1)


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", path
    return struct.unpack(">II", data[16:24])


def test_favicon_svg_follows_the_browser_white_or_navy_on_no_ground():
    svg = (PUBLIC / "favicon.svg").read_text("utf8")

    assert S_PATH in svg  # the S as a path, not text in a font
    assert "<text" not in svg
    assert "<rect" not in svg  # transparent: no ground
    assert "M6 60H24" not in svg  # no crosshair at favicon size
    light, dark = svg.split("@media (prefers-color-scheme:dark)")
    assert "#0E2C4C" in light and "#FFFFFF" not in light
    assert "#FFFFFF" in dark and "#0E2C4C" not in dark
    assert "stroke-width:7" in svg  # heavier brackets for 16px


def test_the_two_fixed_favicons_the_page_swaps_between():
    # White for a dark tab, navy for a light one; one colour each, no ground.
    for name, colour, other in (
        ("favicon-dark.svg", "#FFFFFF", "#0E2C4C"),
        ("favicon-light.svg", "#0E2C4C", "#FFFFFF"),
    ):
        svg = (PUBLIC / name).read_text("utf8")
        assert S_PATH in svg
        assert colour in svg and other not in svg
        assert "<rect" not in svg and "prefers-color-scheme" not in svg
        assert 'stroke-width="7"' in svg


def test_png_fallbacks_are_the_white_mark_on_a_dark_tile():
    """Read the PNGs' corner and centre pixels: dark tile, white mark."""
    import zlib

    def pixels(path: Path):
        data = path.read_bytes()
        w, h = struct.unpack(">II", data[16:24])
        # Colour type 6 is RGBA, 2 is RGB (an opaque image may be saved without alpha).
        bpp = 4 if data[25] == 6 else 3
        idat, i = b"", 8
        while i < len(data):
            n = struct.unpack(">I", data[i : i + 4])[0]
            if data[i + 4 : i + 8] == b"IDAT":
                idat += data[i + 8 : i + 8 + n]
            i += 12 + n
        raw = zlib.decompress(idat)
        stride = w * bpp
        rows, prev = [], bytearray(stride)
        for y in range(h):
            f, line = raw[y * (stride + 1)], bytearray(raw[y * (stride + 1) + 1 : (y + 1) * (stride + 1)])
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b, c = prev[x], prev[x - bpp] if x >= bpp else 0
                if f == 1:
                    line[x] = (line[x] + a) & 255
                elif f == 2:
                    line[x] = (line[x] + b) & 255
                elif f == 3:
                    line[x] = (line[x] + (a + b) // 2) & 255
                elif f == 4:
                    p = a + b - c
                    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                    line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
            rows.append(bytes(line))
            prev = line
        return w, h, lambda x, y: tuple(rows[y][x * bpp : x * bpp + bpp]) + ((255,) if bpp == 3 else ())

    # Points in the mark's own units (the 120 square): (49, 33) lies between
    # the top bracket arms, nothing drawn there; (30, 30) is the top-left
    # bracket's corner. Each file maps its viewBox onto its pixels.
    for name, (origin, span) in (("favicon-32.png", (24, 72)), ("apple-touch-icon.png", (0, 120))):
        w, h, px = pixels(PUBLIC / name)
        at = lambda ux, uy: px(round((ux - origin) / span * (w - 1)), round((uy - origin) / span * (h - 1)))
        r, g, b, a = at(49, 33)
        assert a > 200 and max(r, g, b) < 40, (name, "dark ground", (r, g, b, a))
        assert min(at(30, 30)[:3]) > 230, (name, "white mark", at(30, 30))


def test_png_icons_have_their_sizes():
    assert png_size(PUBLIC / "favicon-32.png") == (32, 32)
    assert png_size(PUBLIC / "apple-touch-icon.png") == (180, 180)


def test_index_html_and_the_manifest_link_every_icon():
    html = (ROOT / "frontend/index.html").read_text("utf8")
    manifest = json.loads((PUBLIC / "manifest.json").read_text("utf8"))

    assert '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />' in html
    assert 'href="/favicon-32.png"' in html
    assert '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />' in html
    assert {i["src"] for i in manifest["icons"]} == {
        "favicon.svg",
        "favicon-32.png",
        "apple-touch-icon.png",
    }


def test_the_tab_title_is_msse_and_nothing_changes_it():
    html = (ROOT / "frontend/index.html").read_text("utf8")

    assert re.findall(r"<title>(.*?)</title>", html) == ["MSSE://"]
    # No code writes the title (it used to scroll like a departure board).
    for f in (ROOT / "frontend/src").rglob("*.ts*"):
        if ".test." not in f.name:
            assert "document.title" not in f.read_text("utf8"), f


def test_share_titles_and_description():
    html = (ROOT / "frontend/index.html").read_text("utf8")
    for tag in ('property="og:title"', 'name="twitter:title"'):
        content = re.search(rf'<meta {tag} content="([^"]+)"', html).group(1)
        assert content == "María Sol Gosende · Software & AI engineer", tag
    assert re.search(r'<meta\s+name="description"\s+content="[^"]{50,}"', html)


def test_the_share_image_is_1200x630_and_wired_for_og_and_twitter():
    html = (ROOT / "frontend/index.html").read_text("utf8")
    url = "https://msse-portfolio.vercel.app/og-image.png"

    assert png_size(PUBLIC / "og-image.png") == (1200, 630)
    assert f'<meta property="og:image" content="{url}" />' in html
    assert f'<meta name="twitter:image" content="{url}" />' in html
    assert '<meta name="twitter:card" content="summary_large_image" />' in html
    assert '<meta property="og:image:width" content="1200" />' in html
    assert '<meta property="og:image:height" content="630" />' in html


def test_the_loading_screen_is_inline_in_the_sites_tokens_and_accessible():
    """index.html's #boot: no bundle or web font needed for its first paint."""
    html = (ROOT / "frontend/index.html").read_text("utf8")
    css = (ROOT / "frontend/src/index.css").read_text("utf8")
    boot_css = html[html.index("#boot {") : html.index("</style>", html.index("#boot {"))]

    def token(block_start: str, name: str) -> str:
        block = css[css.index(block_start) :]
        return re.search(rf"--crt-{name}:\s*(#[0-9a-fA-F]{{6}})", block).group(1).lower()

    # Its colours are the site's tokens: dark by default, light without data-theme.
    dark = re.search(r"#boot \{\s*--boot-bg: (#\w+);\s*--boot-ph: (#\w+);\s*--boot-tx: (#\w+);", boot_css)
    light = re.search(
        r'html:not\(\[data-theme="dark"\]\) #boot \{\s*--boot-bg: (#\w+);\s*--boot-ph: (#\w+);\s*--boot-tx: (#\w+);',
        boot_css,
    )
    for theme, start in ((dark, "/* Dark: phosphor blue"), (light, "/* Light: blue ink")):
        expected = tuple(token(start, n) for n in ("bg", "phosphor", "text"))
        assert theme.groups() == expected, start

    # The logo's own S and brackets, inline; the progress bar is accessible.
    assert S_PATH in html
    assert 'role="progressbar"' in html and 'aria-valuenow="0"' in html
    assert 'setAttribute("aria-busy", "true")' in html
    assert "prefers-reduced-motion: reduce" in boot_css
    assert "[ ENTER WITH SOUND ]" in html and "[ ENTER SILENT ]" in html
