import os

# Set before `server` is imported: the CORS origins are read at import time, and
# load_dotenv() never overrides variables that are already set, so a local .env
# can't leak into the tests.
os.environ["RESEND_API_KEY"] = "re_test_secret_key"
os.environ["CONTACT_TO_EMAIL"] = "inbox@example.com"
os.environ["CORS_ORIGINS"] = "https://msse-portfolio.vercel.app, http://localhost:3000/"
# Off unless a test turns it on (an empty value also keeps a local .env's out).
os.environ["TURNSTILE_SECRET_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402


@pytest.fixture(autouse=True)
def reset_rate_limit():
    server._submission_log.clear()
    yield
    server._submission_log.clear()


@pytest.fixture
def sent(monkeypatch):
    """Replaces Resend: records every send instead of emailing anyone."""
    calls: list[dict] = []

    def fake_send(params):
        calls.append(params)
        return {"id": "test-email-id"}

    monkeypatch.setattr(server.resend.Emails, "send", fake_send)
    return calls


@pytest.fixture
def client():
    return TestClient(server.app)
