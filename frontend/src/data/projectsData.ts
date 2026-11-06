// Scene 3 projects. Copy: design/projects-copy.md (used exactly as written).
// `media`: the looping clip in the GIF player. Blaze, Polaris, Lynx, Ethos and
// Marvel Characters use real recordings (Ethos and Marvel ~22 s, Marvel its
// search and filters stretch; Polaris 18.5 s, the whole recording; Lynx
// 17.6 s, without the full-width conclusions the 16:10 crop would cut; Blaze
// 24.7 s, the whole recording as María Sol asked: the landing scaled to its
// full width so the edge-to-edge BLAZE wordmark keeps every letter, the
// editor cropped from the left so its sidebar stays whole), as 16:10 H.264
// seamless loops (0.6 s crossfade, no audio) + a poster frame at `startAt`;
// Alphecca is still an abstract placeholder (the same H.264 / poster format):
// swap it for a screen recording cut the same way.

export interface ShowcaseProject {
  id: string;
  /** Plain number, rendered with the slashed zero (Ø3.1). */
  num: string;
  name: string;
  /** Shown in the boxed label above the name. */
  subtitle: string;
  /** Only where the copy gives one. */
  status?: string;
  /** Rendered as chips. */
  tags: string[];
  paragraphs: string[];
  /** Kept for the record; not rendered (cards show only Live). */
  codeUrl: string;
  liveUrl: string;
  media: string;
  /** First frame of the clip, shown while it loads. */
  poster?: string;
  /**
   * Seconds into the clip where it starts (the poster is that frame), so
   * clips playing side by side are never in sync: every project its own
   * offset (Marvel Characters 0, Lynx 5, Polaris 7, Ethos 10, Blaze 14, the
   * Alphecca placeholder 30; a new one takes a free value). Wrapped into the
   * clip's length; keep the poster at the same frame.
   */
  startAt?: number;
  /** Fallback length when the clip doesn't report a duration (MediaRecorder webm). */
  seconds: number;
  /** Static art behind the clip (poster while it loads, and the folder back panel). */
  art: string;
}

const art = (from: number, hi: string, lo: string) =>
  `radial-gradient(ellipse 55% 45% at ${hi}, rgba(214,220,226,0.6), rgba(214,220,226,0) 62%), ` +
  `radial-gradient(ellipse 70% 60% at ${lo}, rgba(110,120,132,0.55), rgba(0,0,0,0) 66%), ` +
  `conic-gradient(from ${from}deg at 58% 46%, #0C0E11, #3A424C 18%, #0C0E11 38%, #6B7580 58%, #15191E 78%, #0C0E11)`;

export const PROJECTS_INTRO =
  "Things I've designed and built myself, and the problems each one made me solve.";

export const showcaseProjects: ShowcaseProject[] = [
  {
    id: "blaze",
    num: "3.1",
    name: "BLAZE",
    subtitle: "AI — Co-authoring Markdown Editor",
    tags: ["React", "TypeScript", "Vite", "Tiptap", "LLM"],
    paragraphs: [
      "A Markdown editor where the AI works as a co-author, not a ghostwriter. You select a passage and ask for a change: shorter, more formal, warmer. The suggestion appears as a diff inside the text. You keep or drop each edit, or refine the same suggestion. The costly mistake would be corrupting the document, so the model never touches it. It only returns a rewrite, the browser computes the diff, and nothing changes until you accept, in one step you can undo.",
    ],
    codeUrl: "",
    liveUrl: "",
    media: "/projects/blaze.mp4",
    poster: "/projects/blaze.jpg",
    startAt: 14,
    seconds: 24.7,
    art: art(210, "24% 30%", "80% 76%"),
  },
  {
    id: "alphecca",
    num: "3.2",
    name: "ALPHECCA",
    subtitle: "AI — LLM Selection & Cost Calculator",
    tags: ["Python", "Streamlit", "pandas", "Altair"],
    paragraphs: [
      'A Python app that helps choose an LLM for a specific workload. You enter the volume and token sizes. It checks which Google, OpenAI and Anthropic models fit the context, output and rate limits. It tells you whether the workload stays inside a free tier and estimates the real monthly cost. The math is plain Python, not an LLM, because models are bad at arithmetic. Prices and limits come from each provider\'s official docs, with the date they were checked. Next step: semantic search over those docs, to answer questions like "which models break if I send temperature?"',
    ],
    codeUrl: "",
    liveUrl: "",
    media: "/projects/alphecca.mp4",
    poster: "/projects/alphecca.jpg",
    startAt: 30,
    seconds: 8,
    art: art(120, "70% 28%", "22% 80%"),
  },
  {
    id: "polaris",
    num: "3.3",
    name: "POLARIS",
    subtitle: "AI — RAG Assistant for BCRA Banking Regulations",
    status: "In progress",
    tags: [
      "Python",
      "RAG",
      "Claude",
      "ChromaDB",
      "sentence-transformers",
      "pypdf",
      "Hexagonal Architecture",
    ],
    paragraphs: [
      "Compliance teams at banks and fintechs often need to confirm a rule before they approve something. Today that means searching long PDFs from the BCRA, Argentina's central bank, with Ctrl+F. Polaris answers their questions in plain language and cites the exact source: the section number (e.g. \"3.5\"), its version and the communication it comes from. That way the answer can go straight into a file or an email. If the answer isn't in the loaded regulations, Polaris says so instead of guessing, because a wrong citation is worse than no answer.",
      "It covers three BCRA ordered texts on the life cycle of a financial institution: authorities, authorization and expansion. They were chosen because they overlap, so retrieval has to pick the right source instead of getting it right by elimination. The regulations are chunked by their own numbered sections instead of by fixed size, so every chunk is a unit you can cite. Embeddings run locally, Claude only writes the final answer, and a hexagonal design keeps both the vector store and the model swappable.",
    ],
    codeUrl: "",
    liveUrl: "",
    media: "/projects/polaris.mp4",
    poster: "/projects/polaris.jpg",
    startAt: 7,
    seconds: 18.5,
    art: art(300, "40% 70%", "78% 24%"),
  },
  {
    id: "lynx",
    num: "3.4",
    name: "LYNX",
    subtitle: "AI — Fraud & Elder-Exploitation Detection",
    status: "In progress",
    tags: ["Python", "pandas", "Pydantic", "LangGraph", "Gemini", "gitleaks"],
    paragraphs: [
      "A pipeline that flags fraud, scams and financial exploitation in older adults' bank accounts. Rules detect the cases. An LLM reads the account holder's profile to tell a real case from a lookalike. Then the code decides: alert, human review or no alert.",
      "It started as a take-home challenge. After the technical review, I rebuilt it as my own research project, on synthetic data I designed: every fraud pattern has a real case and a decoy that fires the same rule. Ambiguous names are now kept with their candidates instead of merged, and an ambiguous case is never dismissed automatically. Secret scanning runs on every commit.",
      "In progress: an ablation that measures what the profile adds over rules alone, and five runs per model to check that the answers are stable. The live page walks through the method, the false positives and the open questions, and the results land there next.",
    ],
    // Code: the repo is private; don't link it.
    codeUrl: "",
    liveUrl: "https://lynx-site.vercel.app",
    media: "/projects/lynx.mp4",
    poster: "/projects/lynx.jpg",
    startAt: 5,
    seconds: 17.6,
    art: art(30, "82% 62%", "20% 30%"),
  },
  {
    id: "ethos",
    num: "3.5",
    name: "ETHOS",
    subtitle: "Full Stack — Clinic Booking App",
    tags: ["React", "Vite", "Tailwind CSS", "Node.js", "Express", "FastAPI", "PostgreSQL"],
    paragraphs: [
      "A booking platform for a fictional functional-medicine clinic, built as a study project. You can try it with a one-click demo account: book, reschedule and cancel visits, and see your care plan and past sessions.",
      "The core is the appointments service. I defined the business rules before writing code: which professional a patient sees, when a slot is really free, and what happens on a cancellation or reschedule. Those rules live in a FastAPI service that only accepts traffic from a Node gateway. The gateway handles identity and JWT auth, and gives every demo visitor an isolated, temporary session, so the frontend talks to a single API. Both services run on Railway with PostgreSQL, and the React frontend is on Vercel.",
      "Next up: memberships with Stripe, and patient metrics (biomarkers, sleep, recovery) with an LLM layer to help clinicians interpret them.",
    ],
    // Code: the repo (github.com/mssegosende/ethos-health) is private for now
    // (404 without login); fill this in once it is public.
    codeUrl: "",
    liveUrl: "https://ethos-health-bice.vercel.app",
    media: "/projects/ethos.mp4",
    poster: "/projects/ethos.jpg",
    startAt: 10,
    seconds: 21.8,
    art: art(160, "30% 64%", "74% 30%"),
  },
  {
    id: "marvel-characters",
    num: "3.6",
    name: "MARVEL CHARACTERS",
    subtitle: "Full Stack — Character Browser",
    tags: ["Next.js", "React", "TypeScript", "Zod", "Tailwind CSS", "Vitest"],
    paragraphs: [
      "My first React and TypeScript app. You can browse and filter 304 Marvel characters. The source dataset is old and messy, so Zod validates every record, caps out-of-range stats at 100 and skips anything that doesn't parse. 35 real Marvel characters were missing because their publisher field held an alias, and I brought them back with an allowlist. All data is fetched and cached on the server, from three sources, so no key ever reaches the browser. Search and filters live in the URL and ignore accents. Each picture comes from the best source available: a local file, the Marvel Database wiki, Comic Vine, then the dataset. It works on phones, opens with an original intro animation and has tests in Vitest.",
      "Next up: an AI-assisted review to flag the minor and filler characters the current filters can't catch, cross-checked against a second data source.",
    ],
    codeUrl: "https://github.com/mssegosende/17.1-marvel-characters",
    liveUrl: "https://marvel-characters-coral.vercel.app",
    media: "/projects/marvel-characters.mp4",
    poster: "/projects/marvel-characters.jpg",
    startAt: 0,
    seconds: 22,
    art: art(250, "62% 70%", "26% 22%"),
  },
];

/**
 * The links a card shows: only Live, when there is a URL (María Sol's review:
 * no Code links; codeUrl stays in the data, unrendered).
 */
export const projectLinks = (p: ShowcaseProject) =>
  [{ label: "Live", href: p.liveUrl }].filter((l) => l.href);
