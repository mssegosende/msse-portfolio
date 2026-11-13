"""Repository-level security settings: the headers in vercel.json.

They live here, not in the frontend's vitest, because they read files outside
frontend/ (vercel.json, frontend/index.html), and Vite rightly refuses that.
"""

import base64
import hashlib
import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[2]
VERCEL = json.loads((ROOT / "vercel.json").read_text("utf8"))


def headers_of(service: str) -> dict[str, str]:
    """The headers every path of a service gets (its own `headers`, the form
    Vercel documents for Services)."""
    rules = VERCEL["services"][service].get("headers", [])
    rule = next((r for r in rules if r["source"] == "/(.*)"), {"headers": []})
    return {h["key"]: h["value"] for h in rule["headers"]}


def directive(csp: str, name: str) -> str:
    return next((d.strip() for d in csp.split(";") if d.strip().startswith(f"{name} ")), "")


@pytest.mark.parametrize("service", ["frontend", "backend"])
def test_every_service_sends_the_security_headers(service):
    h = headers_of(service)

    assert h["X-Content-Type-Options"] == "nosniff"
    assert h["X-Frame-Options"] == "DENY"
    assert h["Referrer-Policy"] == "strict-origin-when-cross-origin"
    for feature in ("camera", "microphone", "geolocation", "payment", "usb"):
        assert f"{feature}=()" in h["Permissions-Policy"]
    # The videos use both: never switched off.
    assert "fullscreen" not in h["Permissions-Policy"] and "autoplay" not in h["Permissions-Policy"]


@pytest.mark.parametrize("service", ["frontend", "backend"])
def test_the_csp_is_report_only_never_enforced(service):
    h = headers_of(service)

    assert h.get("Content-Security-Policy-Report-Only")
    assert "Content-Security-Policy" not in h


def test_the_csp_allows_what_the_site_loads():
    csp = headers_of("frontend")["Content-Security-Policy-Report-Only"]

    assert "https://fonts.googleapis.com" in directive(csp, "style-src")
    assert "https://fonts.gstatic.com" in directive(csp, "font-src")
    assert "https://*.spline.design" in directive(csp, "connect-src")
    assert "https://www.gstatic.com" in directive(csp, "connect-src")  # Draco decoders
    assert "'wasm-unsafe-eval'" in directive(csp, "script-src")
    assert "blob:" in directive(csp, "worker-src")
    assert "https://challenges.cloudflare.com" in directive(csp, "script-src")
    assert "https://challenges.cloudflare.com" in directive(csp, "frame-src")
    assert directive(csp, "frame-ancestors") == "frame-ancestors 'none'"
    assert "'unsafe-eval'" not in csp


def test_the_csp_allows_index_html_inline_script_by_its_exact_hash():
    """A change to the inline script must update its hash in the CSP."""
    csp = headers_of("frontend")["Content-Security-Policy-Report-Only"]
    html = (ROOT / "frontend/index.html").read_text("utf8")
    inline = re.findall(r"<script>(.*?)</script>", html, re.S)

    assert inline
    for body in inline:
        digest = base64.b64encode(hashlib.sha256(body.encode("utf8")).digest()).decode()
        assert f"'sha256-{digest}'" in directive(csp, "script-src")


def test_security_txt_has_a_private_contact_and_a_future_expiry():
    """RFC 9116: Contact and Expires are required; Expires less than a year out."""
    from datetime import datetime, timedelta, timezone

    text = (ROOT / "frontend/public/.well-known/security.txt").read_text("utf8")
    fields = dict(
        line.split(": ", 1) for line in text.splitlines() if line and not line.startswith("#")
    )

    assert fields["Contact"] == "https://github.com/mssegosende/msse-portfolio/security/advisories/new"
    expires = datetime.fromisoformat(fields["Expires"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    assert now < expires <= now + timedelta(days=366)
    assert fields["Canonical"] == "https://msse-portfolio.vercel.app/.well-known/security.txt"
    assert "@" not in text  # no email address: reports go through GitHub
