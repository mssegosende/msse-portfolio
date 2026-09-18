# MSGCENGINEER

Portfolio site — React (CRA + craco) frontend, FastAPI + MongoDB backend.

## Run it

Frontend (all you need for design work):

```
cd frontend
npm install
npm start
```

Opens at http://localhost:3000

Backend (only needed for the contact form; requires a running MongoDB):

```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

## Editing content

All site content — name, bio, story paragraphs, projects, stats, socials, and the
Spline scene URLs — lives in `frontend/src/data/portfolioData.js`.

The hero wordmark is `WORDMARK` in `frontend/src/components/ScrollScene.jsx`.

## Environment

`frontend/.env` — `REACT_APP_BACKEND_URL`
`backend/.env`  — `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
