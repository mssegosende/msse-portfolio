"""LinkedIn (optional, but a real profile when given), the content filters
(flag, never reject) and the subject's [VERIFIED] / [REVIEW] tag."""

import pytest

import server
from test_contact import VALID, post

# The same cases as the form's own (frontend/src/lib/contactLimits.test.ts).
GOOD_LINKEDIN = [
    "linkedin.com/in/ada",
    "https://www.linkedin.com/in/ada-lovelace/",
    "http://linkedin.com/in/ada_l",
    "https://ar.linkedin.com/in/ada-lovelace-1815",
    "WWW.LINKEDIN.COM/IN/ADA",
]
BAD_LINKEDIN = [
    "ada",
    "https://linkedin.com/company/acme",
    "https://www.linkedin.com/in/",
    "https://evil.example/linkedin.com/in/ada",
    "https://linkedin.com.evil.example/in/ada",
    "linkedin.com/in/ada?x=<script>",
    "javascript:alert(1)//linkedin.com/in/ada",
]


@pytest.fixture
def turnstile_passes(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "ts_test_secret")
    monkeypatch.setattr(server, "_siteverify", lambda *a: {"success": True})


@pytest.mark.parametrize("linkedin", GOOD_LINKEDIN)
def test_a_linkedin_profile_url_is_accepted(client, sent, linkedin):
    assert post(client, VALID | {"linkedin": linkedin}).status_code == 200


@pytest.mark.parametrize("linkedin", BAD_LINKEDIN)
def test_anything_else_in_linkedin_is_a_422_on_that_field(client, sent, linkedin):
    res = post(client, VALID | {"linkedin": linkedin})

    assert res.status_code == 422
    assert res.json() == {"detail": "Invalid input.", "fields": ["linkedin"]}
    assert sent == []


@pytest.mark.parametrize("linkedin", [None, "", "   "])
def test_linkedin_stays_optional(client, sent, linkedin):
    body = {k: v for k, v in VALID.items() if k != "linkedin"}
    if linkedin is not None:
        body["linkedin"] = linkedin

    assert post(client, body).status_code == 200
    assert "LinkedIn: -" in sent[0]["text"]


@pytest.mark.parametrize(
    ("change", "flag"),
    [
        ({"message": "See https://a.example https://b.example and www.c.example now"}, "too many links"),
        ({"message": "We can get you to the first page of Google with SEO."}, "spam words"),
        ({"company": "Crypto Growth Partners"}, "spam words"),
        ({"message": "PLEASE CALL ME BACK ABOUT THIS PROJECT TODAY"}, "all caps"),
        ({"name": "Ada www.cheap.example"}, "link in name or company"),
    ],
)
def test_filters_flag_but_never_reject(client, sent, turnstile_passes, change, flag):
    res = post(client, VALID | {"turnstile_token": "t"} | change)

    assert res.status_code == 200
    assert sent[0]["subject"].startswith("[REVIEW] ")
    assert flag in sent[0]["text"]


def test_a_clean_message_has_no_flags(client, sent):
    post(client, VALID)

    assert "Flags: none" in sent[0]["text"]


def test_verified_needs_turnstile_a_linkedin_and_no_flags(client, sent, turnstile_passes):
    post(client, VALID | {"turnstile_token": "t"})

    assert sent[0]["subject"].startswith("[VERIFIED] ")
    assert "Turnstile: passed" in sent[0]["text"]


@pytest.mark.parametrize(
    "case",
    ["turnstile off", "no linkedin", "flagged"],
)
def test_anything_less_is_review_and_still_sent(client, sent, monkeypatch, case):
    body = VALID | {"turnstile_token": "t"}
    if case != "turnstile off":
        monkeypatch.setenv("TURNSTILE_SECRET_KEY", "ts_test_secret")
        monkeypatch.setattr(server, "_siteverify", lambda *a: {"success": True})
    if case == "no linkedin":
        body = body | {"linkedin": ""}
    if case == "flagged":
        body = body | {"message": "Best crypto investment opportunity for you."}

    assert post(client, body).status_code == 200
    assert sent[0]["subject"].startswith("[REVIEW] ")
