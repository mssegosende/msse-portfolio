"""LinkedIn: optional, but a real profile URL when given."""

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
