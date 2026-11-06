"""The portfolio's contact service: one endpoint that emails each message to me.

Deployed on Vercel as its own project (Root Directory `backend`): Vercel finds the
FastAPI instance `app` in `server.py` with no extra config. Locally:
`uvicorn server:app --reload --port 8000`.

Environment (see .env.example):
- RESEND_API_KEY    the Resend API key. Never logged, never returned.
- CONTACT_TO_EMAIL  where the messages go.
- CORS_ORIGINS      comma-separated origins allowed to call the API.
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
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Local development only: on Vercel the variables come from the project settings
# and there is no .env file, so this is a no-op there.
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("contact")

# onboarding@resend.dev works without a verified domain, but Resend then only
# delivers to the address the Resend account was created with.
FROM_ADDRESS = "Portfolio <onboarding@resend.dev>"
DEFAULT_CORS_ORIGINS = "https://msse-portfolio.vercel.app,http://localhost:3000"


def _cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS") or DEFAULT_CORS_ORIGINS
    # Browsers send the Origin without a trailing slash; tolerate one in the setting.
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


app = FastAPI(title="MSSE portfolio contact service")
api_router = APIRouter(prefix="/api")


class ContactMessage(BaseModel):
    """The body the form in frontend/src/components/Contact.tsx sends."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=100)
    linkedin: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=10, max_length=2000)
    website: Optional[str] = Field(default=None, max_length=200)  # honeypot


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
    except Exception as exc:  # noqa: BLE001 - any failure to deliver is a 502
        # Log the error type and Resend's code only: never the key, never the message body.
        code = getattr(exc, "code", None)
        logger.error("Resend send failed: %s (code=%s)", type(exc).__name__, code)
        raise HTTPException(status_code=502, detail="Could not deliver the message. Try again later.")

    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,  # the form sends no cookies
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
