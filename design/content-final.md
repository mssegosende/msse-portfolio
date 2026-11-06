# Final site copy — About, scene 2 cards, meta (María Sol, 6 Nov 2026)

The layout in design/screens is fixed. This file only replaces TEXT inside the
existing structure. Labels, pills, subtitles, tabs, chips and numbering stay as
they are in the design unless a line below says otherwise.

---

## Scene 4 · About (WHO)

Title: keep the design's "THE HUMAN BEHIND THE MACHINE".

### Ø4.1 — main text (two paragraphs)

I am María Sol, a full stack developer and AI engineer based in Buenos Aires. Since 2022 I have built products end to end, from the interface users interact with to the services behind it, and more recently the AI layer on top. I am most motivated by systems with dense business rules and no tolerance for silent errors, such as bookings, payments and data that must remain consistent wherever it lives. Each one presents a challenge with something new to learn.

I work primarily in Python and TypeScript and take ownership of features from the data layer to the interface. I am currently directing my career toward systems where integrity is non-negotiable: where every operation must reconcile exactly, and where security is designed in from the first line.

### Ø4.2 — next to "Shipping code since 2022" (two paragraphs)

The people who knew me saw it before I did. They recognized that the way I questioned how things worked, and refused to let a problem go unsolved, was already the mindset of an engineer. Teaching myself, in my own way, showed me how far I could go once I set my mind to something. That is when I stopped being just a user of technology and started building it for the people on the other side of the screen.

Studying has been my engine ever since, and I pick things up quickly. Learning the piano taught me that every system runs on patterns, and once you see them, one logic leads you into the next, whether it is written in notes, in code or in another language. At the end of the day, that is what I bring to a team: the habit of turning what I don't know yet into what I can build next.

Stat: keep the design's big "2022" with "Shipping code since".

### Ø4.3 — principles (same structure, Ø1–Ø3)

1. **CURIOSITY AS METHOD** — Before I trust a system, I need to understand why it works. That discipline surfaces flawed assumptions early, when correcting them costs the least.
2. **OWNERSHIP TO RESOLUTION** — I stay with a problem until its root cause is understood and resolved, not merely suppressed. A complete fix also ensures the same failure cannot recur unnoticed.
3. **CREATIVITY WITHIN CONSTRAINTS** — Every engineering problem arrives with constraints. Working within them is where I learn the most, and where the strongest solutions tend to emerge.

---

## Scene 2 · Capability cards (body text only)

Keep each card's title, subtitle (THE MIND / THE NERVOUS SYSTEM / THE BODY),
tab, number, chips and order (AI → Backend → Frontend). Replace only the body
text. These texts are longer than the design's: never shrink fonts or resize
the card; the text scrolls inside the card with the same soft bottom fade used
on the project cards.

### Ø1 · AI ENGINEERING
I build LLM systems where the model advises and the code decides. Rules find the candidates, the model weighs them against context, and confidence thresholds turn its answer into an action, with dismissing held to a higher bar than flagging. Anything uncertain, and any failed call, goes to a human instead of disappearing. LLMs are probabilistic, so the risk is mine to own: every pipeline is evaluated against labeled data (precision, recall, F1) and every model is compared on cost and latency before it ships.

### Ø2 · BACKEND
Python and FastAPI are my main backend, with Node.js and NestJS when the service calls for it. I start from the business rules: a domain layer that knows nothing about the framework or the database, organized with clean and hexagonal architecture, and I move from one well-built service to microservices only when the problem asks for it. I like the problems that look simple until you write them down, like a slot that must never be booked twice. PostgreSQL underneath, Pydantic at the edges, pytest around the rules, Docker around it all.

### Ø3 · FRONTEND
On the frontend I focus on the data layer: what the interface needs from the server, and what happens when the answer doesn't arrive as expected. I build with React and TypeScript on Next.js, loading data in Server Components whenever the page allows it, so less code and no secrets reach the browser. Types disappear at runtime, so I validate server responses with Zod before they reach a component, and a broken contract shows up as a clear error instead of a blank screen.

---

## Old structure not in the new design

- "System Features" title / "based on the msg·01 core" subtitle: not used (scene 2 keeps CAPABILITIES / WHAT THE CORE RUNS ON).
- Story panel (name, role, paragraphs): its paragraphs now live in Ø4.2. If any story panel still renders that is not in design/screens, report it (don't remove without asking).

---

## Browser tab and link previews

- Browser tab (base title; the existing tab ticker may keep animating it): `msse:// Software & AI Engineer`
- Link preview title (og:title / twitter:title): `María Sol Gosende — Software & AI Engineer`
- Search description (meta description / og:description): `María Sol Gosende, full stack developer and AI engineer from Argentina. Projects, open reference repos and the story behind them.`
