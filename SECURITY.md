# Security

msse-portfolio is a personal portfolio site (a React single-page app and one
FastAPI endpoint for the contact form, both on Vercel); it stores no user data.

## What the project protects today

**Secrets**
- The Resend API key, the inbox address and the Turnstile secret live only in
  the server's environment variables on Vercel. None of them reaches the
  browser: the frontend bundle holds no secret and no email address (a unit
  test checks the site's data for addresses).
- `.env` files are ignored by git. The full git history was searched for API
  keys and connection strings on 2026-11-13: none.
- Production builds publish no source maps.

**Input validation** (`backend/server.py`, `ContactMessage`)
- Every field is trimmed before it is checked; a blank value is an empty one.
- Maximum lengths on every field (name 100, company 100, LinkedIn 200,
  message 2000) and a valid email address. The form caps each input at the
  same limits (`frontend/src/lib/contactLimits.ts`); a test checks both sides
  agree.
- Unknown fields are refused (`extra="forbid"`).
- LinkedIn is optional; when given it must be a profile URL
  (`linkedin.com/in/...`). The same rule and the same test cases on both sides.

**Errors**
- Invalid input is a 422 with a generic body: `{"detail": "Invalid input.",
  "fields": [...]}`, field names only. No validation text from the libraries,
  no echo of what was sent.
- A failure to deliver through Resend is a 503 with a generic message; a
  missing configuration is a 500. No stack traces or provider error text reach
  the client.
- Logs record the error type only: never the API key, never a message body.
- FastAPI's `/docs`, `/redoc` and `/openapi.json` exist only when `API_DOCS=1`
  (local development); in production they are off.
- Unknown routes and wrong methods answer plain 404 and 405.

**Rate limiting**
- An in-memory limit of 5 messages per IP every 10 minutes. On Vercel each
  function instance keeps its own count, so it only slows a burst that hits one
  instance. The edge limit is listed under "What is missing".

**Security headers** (`vercel.json`, on both services)
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a
  `Permissions-Policy` that switches off the camera, microphone, geolocation,
  payment and other features the site doesn't use.
- A `Content-Security-Policy`, enforced (since 2026-11-13, after a review in
  report-only mode): only the origins the site loads (Google Fonts, Spline,
  Draco decoders on www.gstatic.com, Cloudflare Turnstile),
  `'wasm-unsafe-eval'` for Spline's WebAssembly, `blob:` workers, the inline
  scripts by their hashes, `frame-ancestors 'none'`.
  - No `'unsafe-eval'`. The Spline runtime's bundled msgpackr (the scene
    decoder) tries to compile a faster reader with `Function()` once per
    load; the policy blocks it, msgpackr catches the error and decodes the
    plain way. Browsers record that blocked attempt as a policy violation
    event; nothing breaks and nothing shows in the console.
  - `data:` is allowed for media only (`media-src`): the robot's eyes are a
    video stored inside the scene file, played from a `data:video/mp4` URL.
    Media can't run script; nothing else accepts `data:` code.
- HSTS comes from Vercel.
- CORS allows the production origin only; local development adds its own
  origin through a local `.env`.

**Contact form filters**
- A honeypot field: a bot that fills it gets a success answer and nothing is
  sent.
- Cloudflare Turnstile, built in but off until its keys are set. Off, every
  message arrives tagged `[REVIEW]`. On, a missing or failed token is refused
  (403), and an unreachable Cloudflare refuses too (503).
- Content filters flag a message, they never reject it: more than two links,
  typical spam words, all caps, or a link in the name or company.
- The email subject says `[VERIFIED]` only when Turnstile passed, a valid
  LinkedIn came with the message and no filter flagged it; anything else is
  `[REVIEW]`.
- The email is plain text. The visitor's input never reaches an email header:
  the subject collapses line breaks, and the reply-to is a validated address.

**Repository**
- The CI token is read-only by default; the only job that needs more (the AWS
  deploy, currently off) asks for an OIDC token itself, with no long-lived
  cloud keys.
- Dependabot watches the GitHub Actions, the npm packages and the pip
  requirements.

## What is missing, and when it will be needed

- **An edge rate limit.** A Vercel Firewall rule on `POST /api/contact` is the
  real limit (the in-memory one is a second layer). It is set in the Vercel
  dashboard, not in this repository, and is pending.
- **Turnstile keys.** The check is in place but inactive until the keys are set
  in Vercel; until then every message is `[REVIEW]`.
- **Email confirmation.** Confirming the sender's address with a signed link
  (HMAC) needs a verified sending domain in Resend: without one, Resend only
  delivers to the account owner's inbox. It will be added once the site has its
  own domain.

## Dependency audit (2026-11-13)

| Tool | Result | Reaches production? |
| --- | --- | --- |
| `pnpm audit` (frontend) | 1 moderate: `minimatch` [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), a denial of service through pattern amplification, reached only through ESLint | No: a development tool, not part of the built site |
| `pip-audit -r requirements.txt` (backend, runtime) | No known vulnerabilities | — |
| `pip-audit -r requirements-dev.txt` (backend, tests) | No known vulnerabilities | — |

## Personal data

The contact form collects a name, an email address, an optional company and
LinkedIn URL, and a message. They are sent through Resend to the site owner's
inbox and are not stored by the site: there is no database. The site sets no
analytics or tracking cookies.

## Found a security issue?

Please report it privately through GitHub's
[private vulnerability reporting](https://github.com/mssegosende/msse-portfolio/security/advisories/new),
not in a public issue. The same contact is published at
`/.well-known/security.txt`.
