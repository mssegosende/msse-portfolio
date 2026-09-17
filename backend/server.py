from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
from collections import defaultdict


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class ContactMessage(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=100)
    message: str = Field(min_length=10, max_length=2000)
    website: Optional[str] = Field(default=None, max_length=200)  # honeypot


# basic spam protection: per-IP sliding window
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 600
_submission_log: dict[str, list[float]] = defaultdict(list)


@api_router.get("/")
async def root():
    return {"message": "MSG portfolio API online"}


@api_router.post("/contact")
async def submit_contact(payload: ContactMessage, request: Request):
    # honeypot triggered -> silently pretend success, store nothing
    if payload.website:
        return {"status": "ok", "id": None}

    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _submission_log[ip] = [t for t in _submission_log[ip] if now - t < RATE_WINDOW_SECONDS]
    if len(_submission_log[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _submission_log[ip].append(now)

    doc = payload.model_dump(exclude={"website"})
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.contact_messages.insert_one(doc)
    return {"status": "ok", "id": str(result.inserted_id)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
