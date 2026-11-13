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
