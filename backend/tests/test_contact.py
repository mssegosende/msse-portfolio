import pytest
from resend.exceptions import InvalidApiKeyError, ResendError

import server

VALID = {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "company": "Analytical Engines",
    "linkedin": "linkedin.com/in/ada",
    "message": "I'd like to talk about a project.",
    "website": "",
}


def post(client, body, **headers):
    return client.post("/api/contact", json=body, headers=headers)


def test_health(client):
    res = client.get("/api/health")

    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_the_old_root_greeting_is_gone(client):
    assert client.get("/api/").status_code == 404


def test_valid_message_is_emailed(client, sent):
    res = post(client, VALID)

    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    assert len(sent) == 1
    email = sent[0]
    assert email["from"] == "Portfolio <onboarding@resend.dev>"
    assert email["to"] == ["inbox@example.com"]
    assert email["reply_to"] == "ada@example.com"
    assert "Ada Lovelace" in email["subject"]
    for value in ("Ada Lovelace", "ada@example.com", "Analytical Engines", "linkedin.com/in/ada"):
        assert value in email["text"]
    assert VALID["message"] in email["text"]


@pytest.mark.parametrize("optional", [{}, {"company": "", "linkedin": ""}])
def test_optional_fields_can_be_missing_or_empty(client, sent, optional):
    body = {k: v for k, v in VALID.items() if k not in ("company", "linkedin")} | optional

    assert post(client, body).status_code == 200
    assert "Company: -" in sent[0]["text"]
    assert "LinkedIn: -" in sent[0]["text"]


def test_name_line_breaks_stay_out_of_the_subject(client, sent):
    post(client, VALID | {"name": "Ada\r\nBcc: someone@example.com"})

    assert "\n" not in sent[0]["subject"] and "\r" not in sent[0]["subject"]


@pytest.mark.parametrize(
    "change",
    [
        {"name": ""},
        {"name": "     "},  # blank is empty once stripped
        {"email": ""},
        {"message": ""},
        {"message": "             "},
        {"name": "A"},
        {"name": "   A   "},  # whitespace is stripped, as the form does
        {"email": "ada@example"},
        {"name": "x" * 101},
        {"email": "not-an-email"},
        {"message": "too short"},
        {"message": "x" * 2001},
        {"company": "x" * 101},
        {"linkedin": "x" * 201},
    ],
)
def test_invalid_input_is_422_and_sends_nothing(client, sent, change):
    assert post(client, VALID | change).status_code == 422
    assert sent == []


@pytest.mark.parametrize("missing", ["name", "email", "message"])
def test_missing_required_field_is_422(client, sent, missing):
    body = {k: v for k, v in VALID.items() if k != missing}

    assert post(client, body).status_code == 422
    assert sent == []


def test_honeypot_pretends_success_and_sends_nothing(client, sent):
    res = post(client, VALID | {"website": "http://spam.example"})

    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    assert sent == []


@pytest.mark.parametrize(
    "error",
    [
        ResendError(code=500, error_type="application_error", message="boom", suggested_action=""),
        InvalidApiKeyError(message="bad key re_test_secret_key", error_type="invalid_api_key", code=403),
        ConnectionError("network down"),
    ],
)
def test_resend_failure_is_503_generic_without_leaking_the_key(client, monkeypatch, caplog, error):
    def failing_send(params):
        raise error

    monkeypatch.setattr(server.resend.Emails, "send", failing_send)

    res = post(client, VALID)

    assert res.status_code == 503
    assert res.json() == {"detail": "Could not deliver the message. Try again later."}
    for leak in ("boom", "bad key", "network down", "application_error"):
        assert leak not in res.text
    assert "re_test_secret_key" not in res.text
    assert "re_test_secret_key" not in caplog.text


@pytest.mark.parametrize("missing", ["RESEND_API_KEY", "CONTACT_TO_EMAIL"])
def test_missing_configuration_is_500_and_sends_nothing(client, sent, monkeypatch, missing):
    monkeypatch.delenv(missing)

    res = post(client, VALID)

    assert res.status_code == 500
    assert "re_test_secret_key" not in res.text
    assert sent == []


def test_rate_limit_per_ip(client, sent):
    for _ in range(server.RATE_LIMIT):
        assert post(client, VALID, **{"x-real-ip": "203.0.113.7"}).status_code == 200

    assert post(client, VALID, **{"x-real-ip": "203.0.113.7"}).status_code == 429
    # Another visitor is unaffected.
    assert post(client, VALID, **{"x-real-ip": "198.51.100.1"}).status_code == 200
    assert len(sent) == server.RATE_LIMIT + 1


def test_rate_limit_uses_first_forwarded_for_address(client, sent):
    for _ in range(server.RATE_LIMIT):
        post(client, VALID, **{"x-forwarded-for": "203.0.113.9, 10.0.0.1"})

    assert post(client, VALID, **{"x-forwarded-for": "203.0.113.9, 10.0.0.2"}).status_code == 429


def test_cors_origins_are_trimmed():
    assert server._cors_origins() == ["https://msse-portfolio.vercel.app", "http://localhost:3000"]


@pytest.mark.parametrize("origin", ["https://msse-portfolio.vercel.app", "http://localhost:3000"])
def test_cors_preflight_allows_the_site(client, origin):
    res = client.options(
        "/api/contact",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == origin


def test_cors_rejects_other_origins(client):
    res = client.options(
        "/api/contact",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )

    assert "access-control-allow-origin" not in res.headers


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_api_docs_are_off_by_default(client, path):
    assert client.get(path).status_code == 404


def test_api_docs_turn_on_only_with_api_docs_1(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    for value, expected in [("1", 200), ("0", 404), ("true", 404)]:
        monkeypatch.setenv("API_DOCS", value)
        app = FastAPI(**server._docs_settings())
        assert TestClient(app).get("/openapi.json").status_code == expected, value


def test_422_is_generic_and_echoes_nothing(client, sent):
    secret_typed = "<script>tell-me-your-stack</script>"
    res = post(client, VALID | {"name": secret_typed * 10, "email": "not-an-email"})

    assert res.status_code == 422
    assert res.json() == {"detail": "Invalid input.", "fields": ["name", "email"]}
    for leak in (secret_typed, "not-an-email", "String should", "value_error", "pydantic", "ctx"):
        assert leak not in res.text
    assert sent == []


def test_malformed_json_is_a_generic_422(client):
    res = client.post("/api/contact", content=b"{not json", headers={"Content-Type": "application/json"})

    assert res.status_code == 422
    assert res.json() == {"detail": "Invalid input.", "fields": []}
    assert "decode" not in res.text.lower()


def test_unknown_fields_are_422_and_not_echoed(client, sent):
    res = post(client, VALID | {"is_admin": True})

    assert res.status_code == 422
    assert res.json() == {"detail": "Invalid input.", "fields": []}
    assert "is_admin" not in res.text
    assert sent == []


def test_cors_default_is_the_production_domain_only(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS")

    assert server._cors_origins() == ["https://msse-portfolio.vercel.app"]


def test_form_max_lengths_match_the_model():
    """The form's MAX_LEN (frontend) and the model's max_length (here) agree."""
    import re
    from pathlib import Path

    tsx = (Path(__file__).parents[2] / "frontend/src/lib/contactLimits.ts").read_text("utf8")
    block = re.search(r"export const MAX_LEN = \{(.*?)\}", tsx, re.S).group(1)
    form = {k: int(v) for k, v in re.findall(r"(\w+): (\d+)", block)}
    model = {
        name: next(m.max_length for m in f.metadata if hasattr(m, "max_length"))
        for name, f in server.ContactMessage.model_fields.items()
        if any(hasattr(m, "max_length") for m in f.metadata)
    }

    assert model and all(form[name] == limit for name, limit in model.items()), (form, model)
    from email_validator.rfc_constants import EMAIL_MAX_LENGTH

    assert form["email"] == EMAIL_MAX_LENGTH  # EmailStr's own limit
