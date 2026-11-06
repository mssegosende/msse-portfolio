# Projects section — final copy (replaces the projects in design/HANDOFF.md)

Six projects, in this order. Arcturus and Apsis are out.

Section: pill `SELECTED WORK`, title `PROJECTS`.
Intro: "Things I've designed and built myself, and the problems each one made me solve."
Link labels: `Code`, `Live`. If a project has no URL for a link, hide that link.

---

## Ø3.1 · BLAZE
- Subtitle: AI — Co-authoring Markdown Editor
- Tags: React, TypeScript, Vite, Tiptap, LLM
- Code: none yet · Live: none yet

A Markdown editor where the AI works as a co-author, not a ghostwriter. You select a passage and ask for a change: shorter, more formal, warmer. The suggestion appears as a diff inside the text. You keep or drop each edit, or refine the same suggestion. The costly mistake would be corrupting the document, so the model never touches it. It only returns a rewrite, the browser computes the diff, and nothing changes until you accept, in one step you can undo.

## Ø3.2 · ALPHECCA
- Subtitle: AI — LLM Selection & Cost Calculator
- Tags: Python, Streamlit, pandas, Altair
- Code: none yet · Live: none yet

A Python app that helps choose an LLM for a specific workload. You enter the volume and token sizes. It checks which Google, OpenAI and Anthropic models fit the context, output and rate limits. It tells you whether the workload stays inside a free tier and estimates the real monthly cost. The math is plain Python, not an LLM, because models are bad at arithmetic. Prices and limits come from each provider's official docs, with the date they were checked. Next step: semantic search over those docs, to answer questions like "which models break if I send temperature?"

## Ø3.3 · POLARIS
- Subtitle: AI — RAG Assistant for BCRA Banking Regulations
- Status: In progress
- Tags: Python, RAG, Claude, ChromaDB, sentence-transformers, pypdf, Hexagonal Architecture
- Code: none yet · Live: none yet

Compliance teams at banks and fintechs often need to confirm a rule before they approve something. Today that means searching long PDFs from the BCRA, Argentina's central bank, with Ctrl+F. Polaris answers their questions in plain language and cites the exact source: the section number (e.g. "3.5"), its version and the communication it comes from. That way the answer can go straight into a file or an email. If the answer isn't in the loaded regulations, Polaris says so instead of guessing, because a wrong citation is worse than no answer.

It covers three BCRA ordered texts on the life cycle of a financial institution: authorities, authorization and expansion. They were chosen because they overlap, so retrieval has to pick the right source instead of getting it right by elimination. The regulations are chunked by their own numbered sections instead of by fixed size, so every chunk is a unit you can cite. Embeddings run locally, Claude only writes the final answer, and a hexagonal design keeps both the vector store and the model swappable.

## Ø3.4 · LYNX
- Subtitle: AI — Fraud & Elder-Exploitation Detection
- Tags: Python, pandas, Pydantic, LangGraph, Gemini, FastAPI
- Code: none yet · Live: none yet

A pipeline that flags fraud, scams and financial exploitation in older adults' bank accounts. Rules detect the cases. An LLM reads the account holder's profile to tell a real case from a lookalike. Then the code decides: alert, human review or no alert.

<!-- Second paragraph held back until the rebuild is done. Do not publish yet:
It started as a take-home challenge. After the technical review, I rebuilt it as my own project, on synthetic data I generated. Ambiguous names are now flagged instead of merged. The LLM is measured against rules alone and against itself across five runs. And secret scanning runs on every commit.
-->

## Ø3.5 · ETHOS
- Subtitle: Full Stack — Clinic Booking App
- Tags: React, Vite, Tailwind CSS, Node.js, FastAPI, PostgreSQL
- Code: pending (repo URL) · Live: pending (Vercel URL) — hide both until filled in

A booking app for a fictional functional-medicine clinic, built as a study project. Patients log in, check their dashboard and book, reschedule or cancel visits with their clinician. You can try it with the demo account.

I started from the business rules for appointments: which professional a patient sees, when a slot is really free, and what happens on a cancellation or reschedule. On the frontend, every screen talks to a single data layer with two interchangeable adapters. The demo adapter applies those rules in the browser, and the live demo runs on it. The HTTP adapter targets a Node gateway in front of a FastAPI service with PostgreSQL, and the backend is being connected to that same contract.

Next up: memberships with Stripe, and patient metrics (biomarkers, sleep, recovery) with an LLM layer to help clinicians interpret them.

## Ø3.6 · MARVEL CHARACTERS
- Subtitle: Frontend — Character Browser
- Tags: Next.js, React, TypeScript, Zod, Tailwind CSS, Vitest
- Code: https://github.com/mssegosende/17.1-marvel-characters · Live: none yet

My first React and TypeScript app. You can browse and filter 304 Marvel characters. The source dataset is old and messy, so Zod validates every record, caps out-of-range stats at 100 and skips anything that doesn't parse. 35 real Marvel characters were missing because their publisher field held an alias, and I brought them back with an allowlist. Search and filters live in the URL and ignore accents. Each picture comes from the best source available: a local file, the Marvel Database wiki, Comic Vine, then the dataset. It works on phones, opens with an original intro animation and has tests in Vitest.
