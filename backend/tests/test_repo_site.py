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


def test_favicon_svg_is_the_mark_with_michromas_s_and_follows_the_colour_scheme():
    svg = (PUBLIC / "favicon.svg").read_text("utf8")

    assert S_PATH in svg  # the S as a path, not text in a font
    assert "<text" not in svg
    assert "prefers-color-scheme:dark" in svg
    assert "M6 60H24" not in svg  # no crosshair at favicon size


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
