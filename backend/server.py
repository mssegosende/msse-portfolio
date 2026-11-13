"""The portfolio's contact service: one endpoint that emails each message to me.

Deployed on Vercel as the `backend` service of the site's own project (see the
root vercel.json): `/api/*` is routed here with the path unchanged, so the routes
keep their `/api` prefix. Locally: `uvicorn server:app --reload --port 8000`.

Environment (see .env.example):
- RESEND_API_KEY    the Resend API key. Never logged, never returned.
- CONTACT_TO_EMAIL  where the messages go.
- CORS_ORIGINS      comma-separated origins allowed to call the API. In production
                    the form is same-origin and needs none; this is for local dev
                    and for a frontend hosted elsewhere.
- API_DOCS          "1" turns on /docs, /redoc and /openapi.json (local only).
"""

import logging
import os
import time
from collections import defaultdict
from pathlib import Path
from typing import Optional

import resend
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Local development only: on Vercel the variables come from the project settings
# and there is no .env file, so this is a no-op there.
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("contact")

# onboarding@resend.dev works without a verified domain, but Resend then only
# delivers to the address the Resend account was created with.
FROM_ADDRESS = "Portfolio <onboarding@resend.dev>"
# Production only. Local dev adds http://localhost:3000 through CORS_ORIGINS in
# backend/.env, so a production deploy never trusts a local origin.
DEFAULT_CORS_ORIGINS = "https://msse-portfolio.vercel.app"


def _cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS") or DEFAULT_CORS_ORIGINS
    # Browsers send the Origin without a trailing slash; tolerate one in the setting.
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


def _docs_settings() -> dict:
    """FastAPI's /docs, /redoc and /openapi.json only with API_DOCS=1: off in
    production, so the API's shape is not published."""
    on = os.environ.get("API_DOCS") == "1"
    return {
        "docs_url": "/docs" if on else None,
        "redoc_url": "/redoc" if on else None,
        "openapi_url": "/openapi.json" if on else None,
    }


app = FastAPI(title="MSSE portfolio contact service", **_docs_settings())
api_router = APIRouter(prefix="/api")


class ContactMessage(BaseModel):
    """The body the form in frontend/src/components/Contact.tsx sends."""

    # Stripped before the length checks (a blank name is empty). A field the form
    # never sends is a 422, not silently ignored.
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=100)
    linkedin: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=10, max_length=2000)
    website: Optional[str] = Field(default=None, max_length=200)  # honeypot


@app.exception_handler(RequestValidationError)
def invalid_input(request: Request, exc: RequestValidationError) -> JSONResponse:
    """422 without Pydantic's own text: no echoed input, no library messages, no
    type names. Only which of the form's fields failed, so the client can point
    at them; a key the client made up is never repeated back."""
    known = ContactMessage.model_fields
    fields: list[str] = []
    for error in exc.errors():
        loc = error.get("loc", ())
        name = loc[1] if len(loc) > 1 and loc[0] == "body" else None
        if isinstance(name, str) and name in known and name not in fields:
            fields.append(name)
    return JSONResponse(status_code=422, content={"detail": "Invalid input.", "fields": fields})


# Soft spam limit: per-IP sliding window, in memory. On Vercel each function
# instance has its own memory and instances come and go, so this only slows down
# a burst that hits one warm instance; it is not a guarantee. A hard limit would
# need shared storage (e.g. Redis / Vercel KV).
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 600
_submission_log: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    # Behind Vercel's proxy the socket peer is not the visitor; Vercel sets
    # x-real-ip / x-forwarded-for itself (it overwrites any value the client sends).
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _over_rate_limit(ip: str) -> bool:
    now = time.time()
    recent = [t for t in _submission_log[ip] if now - t < RATE_WINDOW_SECONDS]
    if len(recent) >= RATE_LIMIT:
        _submission_log[ip] = recent
        return True
    recent.append(now)
    _submission_log[ip] = recent
    return False


def _email_text(payload: ContactMessage) -> str:
    return (
        f"Name: {payload.name}\n"
        f"Email: {payload.email}\n"
        f"Company: {payload.company or '-'}\n"
        f"LinkedIn: {payload.linkedin or '-'}\n"
        f"\n{payload.message}\n"
    )


@api_router.get("/")
def root():
    return {"message": "MSG portfolio API online"}


# A plain `def`: the Resend SDK makes a blocking HTTP call, and FastAPI runs sync
# endpoints in a threadpool so they don't block the event loop.
@api_router.post("/contact")
def submit_contact(payload: ContactMessage, request: Request):
    # Honeypot filled -> a bot. Answer like a success so it learns nothing; send nothing.
    if payload.website:
        return {"status": "ok"}

    if _over_rate_limit(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    api_key = os.environ.get("RESEND_API_KEY")
    to_email = os.environ.get("CONTACT_TO_EMAIL")
    if not api_key or not to_email:
        logger.error("Contact service misconfigured: RESEND_API_KEY or CONTACT_TO_EMAIL is not set")
        raise HTTPException(status_code=500, detail="Contact service is not configured.")

    resend.api_key = api_key
    # Collapse whitespace so a name with line breaks can't shape the subject line.
    subject_name = " ".join(payload.name.split())
    params: resend.Emails.SendParams = {
        "from": FROM_ADDRESS,
        "to": [to_email],
        "reply_to": str(payload.email),
        "subject": f"Portfolio contact: {subject_name}",
        "text": _email_text(payload),
    }
    try:
        resend.Emails.send(params)
    except Exception as exc:  # noqa: BLE001 - the provider failed: 503, our own bugs are 500
        # Log the error type and Resend's code only: never the key, never the message body.
        code = getattr(exc, "code", None)
        logger.error("Resend send failed: %s (code=%s)", type(exc).__name__, code)
        raise HTTPException(status_code=503, detail="Could not deliver the message. Try again later.")

    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,  # the form sends no cookies
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
