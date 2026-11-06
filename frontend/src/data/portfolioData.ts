// Portfolio content: edit this file to update the site.
// Entries with `draft: true` hold placeholder copy. They show in development
// with a DRAFT badge and are stripped from production (getProjects).
// `projectBacklog` keeps real project names that have no copy yet; it is
// never rendered.

export interface Profile {
  name: string;
  shortMark: string;
  markSuffix: string;
  role: string;
  taglineLines: string[];
  tagline: string;
  status: string;
  location: string;
  email: string;
  /** A null linkedin hides its footer icon. */
  socials: { github: string; linkedin: string | null };
  bio: string[];
  stats: { value: string; label: string }[];
}

export interface ManifestoEntry {
  num: string;
  title: string;
  text: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  codeUrl: string;
  liveUrl: string;
  /** A literal Tailwind class, e.g. "md:col-span-7". */
  span: string;
  featured?: boolean;
  draft?: boolean;
}

/** One scene 2 card (design/HANDOFF.md, P2). */
export interface CapabilityCard {
  /** Plain number, shown as Ø1. */
  num: string;
  /** The bottom tab: MSSE:// │ part. */
  part: string;
  /** The small line above the title. */
  small: string;
  title: string;
  text: string;
  chips: string[];
}

export interface TerminalLine {
  type: "cmd" | "out";
  text: string;
}

export interface BacklogEntry {
  id: string;
  title: string;
  category: string;
  note: string;
}

export const SPLINE_SCENE_URL = "https://prod.spline.design/f1rJJWMxGAz7LFXO/scene.splinecode";

export const SPLINE_SCENE_2_URL = "https://prod.spline.design/PU4OS9xwmiHIeZOj/scene.splinecode";

export const profile: Profile = {
  name: "María Sol Gosende",
  // markSuffix, when set, follows the mark in the footer.
  shortMark: "MSSE://",
  markSuffix: "",
  role: "Full Stack Developer & AI Engineer",
  taglineLines: ["Full Stack Developer", "& AI Engineer"],
  tagline:
    "I build the backend systems businesses run on — APIs, microservices, and the AI layers on top of them.",
  status: "ONLINE",
  location: "BUENOS AIRES — GLOBAL",
  email: "10021msse@gmail.com",
  socials: {
    github: "https://github.com/mssegosende",
    // TODO: the real URL. null hides the footer icon.
    linkedin: null,
  },
  bio: [
    "I'm María Sol — a full stack developer and AI engineer in Buenos Aires. I came to code through a cousin who was sure I could do it, and a computer I wanted to understand down to the parts: I built my own PC in 2020, and I've been writing software professionally since 2022.",
    "Piano taught me the thing I use most: different logics share patterns. Once I see the pattern, a new language or framework stops being foreign — that's how I learn, and how I walk into a system I've never seen.",
  ],
  // A year, never a count ("since 2022", not "N+ years").
  stats: [{ value: "2022", label: "Shipping code since" }],
};

// Scene 1's SYSTEM CHECK panel (Ø1.2), line by line.
export const systemCheck: string[] = [
  "OPERATOR: M. S. GOSENDE",
  "CORE: PYTHON / TS",
  "AGENTS: LANGGRAPH",
  "LOC: −34.60 −58.38",
  "STATUS: OPEN TO WORK",
];

export const manifesto: ManifestoEntry[] = [
  {
    num: "01",
    title: "Contracts before code",
    text: "Typed schemas and validation at the edge aren't bureaucracy. They're what makes an agent's output something you can trust.",
  },
  {
    num: "02",
    title: "Interfaces are the product",
    text: "Motion, latency and feedback are engineering decisions, not decoration.",
  },
  {
    num: "03",
    title: "Humans where they matter",
    text: "Automate the routine, and design the exact point where a person should step in.",
  },
];

// ------------------------------------------------------------
// PROJECTS. Spans: 7 + 5, then 4 + 4 + 4 on the 12-column grid. Change the
// spans here, not the grid in Projects.jsx.
// ------------------------------------------------------------
export const projects: Project[] = [
  {
    id: "polaris",
    title: "POLARIS",
    subtitle: "AI Engineering — Agent Orchestration",
    // DRAFT: needs the real problem it solves, what was built and the stack.
    description:
      "A multi-step agent runtime that plans a task, calls the services it needs and reports what it could not resolve instead of guessing. Every tool the agent reaches for sits behind a typed contract, so a malformed call fails at the edge rather than halfway through a run. State is persisted per run, which makes a failed step replayable instead of a restart.",
    tags: ["Python", "FastAPI", "LangGraph", "PostgreSQL", "Docker"],
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-7",
    featured: true,
    draft: true,
  },
  {
    id: "ethos",
    title: "ETHOS",
    subtitle: "Backend — Functional Medicine Platform",
    // DRAFT: needs what it does, the stack, and whether it is personal work
    // or the 2021-22 Los Angeles booking platform.
    description:
      "Booking and patient-record infrastructure for a functional-medicine practice, where a dropped appointment and a dropped payment are the same incident. The API keeps scheduling, billing and clinical records reconciled behind one set of contracts, so the three never disagree about the same visit.",
    tags: ["Python", "FastAPI", "PostgreSQL", "Docker"],
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-5",
    draft: true,
  },
  {
    id: "vega",
    title: "VEGA",
    subtitle: "Data — Ingestion Pipeline",
    // DRAFT: placeholder name. Needs the real name, what it ingests and where
    // the output goes.
    description:
      "An ingestion pipeline that pulls from sources that disagree about their own schema and lands them in one normalised model. Each stage validates before it writes, so bad input is quarantined with the reason attached instead of silently reshaping the table downstream.",
    tags: ["Python", "PostgreSQL", "Docker"],
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-4",
    draft: true,
  },
  {
    id: "apsis",
    title: "APSIS",
    subtitle: "AI Productivity Assistant",
    description:
      "An assistant I'm building for my own workflow, one module at a time. Modular React + TypeScript frontend on a Vite build, FastAPI backend, with an LLM agent planned behind each module — the first reads incoming job proposals and drafts the replies.",
    tags: ["React", "TypeScript", "Vite", "FastAPI", "LLM Agents"],
    // TODO: public repo or live URL, if any.
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-4",
  },
  {
    id: "project-05",
    title: "PROJECT 05",
    subtitle: "Full Stack — Internal Tooling",
    // DRAFT: placeholder slot. Needs a real project, or remove it.
    description:
      "A small internal tool that replaced a spreadsheet three people were editing at once. React and TypeScript on the front, a FastAPI service and a relational model behind it, containerised so it runs the same on any machine that needs it.",
    tags: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Docker"],
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-4",
    draft: true,
  },
];

// Static class strings: Tailwind only keeps classes it can find verbatim.
const SPAN_CLASS = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  12: "md:col-span-12",
} as const;

type Span = keyof typeof SPAN_CLASS;

// Lay n cards out on the 12-column grid: a 7 + 5 hero row, then rows of
// three, with a short trailing row widened so it never leaves a gap.
export const layoutSpans = (n: number): Span[] => {
  if (n <= 0) return [];
  if (n === 1) return [12];
  if (n === 2) return [7, 5];
  if (n === 3) return [4, 4, 4];
  if (n === 4) return [7, 5, 6, 6];
  const spans: Span[] = [7, 5];
  let rest = n - 2;
  while (rest >= 3) {
    spans.push(4, 4, 4);
    rest -= 3;
  }
  if (rest === 1) spans.push(12);
  if (rest === 2) spans.push(6, 6);
  return spans;
};

// What the site renders. Production drops drafts and re-lays out the rest so
// no row is left half empty.
export const getProjects = (): Project[] => {
  const isProduction = import.meta.env.PROD;
  const visible = isProduction ? projects.filter((p) => !p.draft) : projects;
  if (visible.length === projects.length) return visible;
  const spans = layoutSpans(visible.length);
  return visible.map((p, i) => {
    const span = spans[i];
    return span ? { ...p, span: SPAN_CLASS[span] } : p;
  });
};

// Scene 2: one card at a time, mind -> nerves -> body.
export const capabilityCards: CapabilityCard[] = [
  {
    num: "1",
    part: "MIND",
    small: "THE MIND",
    title: "AI ENGINEERING",
    text: "The part that thinks. Models that read, reason and decide — LangGraph agents where every step has a typed contract and a defined way to fail, measured with evals.",
    chips: ["LangGraph", "LangChain", "RAG", "Evals"],
  },
  {
    num: "2",
    part: "NERVES",
    small: "THE NERVOUS SYSTEM",
    title: "BACKEND",
    text: "Unseen, it carries every signal. APIs are the nerves, services the organs, the database the memory — Python and FastAPI, the domain never tied to the framework.",
    chips: ["Python", "FastAPI", "PostgreSQL", "Node"],
  },
  {
    num: "3",
    part: "BODY",
    small: "THE BODY",
    title: "FRONTEND",
    text: "What you see and touch. HTML is the skeleton, CSS the skin, JavaScript the muscles that move it — React and TypeScript, with Zod at the boundaries.",
    chips: ["React", "TypeScript", "Next.js", "Zod", "GSAP"],
  },
];

export const terminalBoot: TerminalLine[] = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "mssegosende — full stack developer & ai engineer" },
  { type: "cmd", text: "cat availability.txt" },
  { type: "out", text: "STATUS: OPEN TO OPPORTUNITIES // REMOTE — WORLDWIDE" },
];

// ============================================================
// PROJECT BACKLOG (not rendered). Real names awaiting a description before
// they move into `projects`. `note` records only what was actually said.
// ============================================================
export const projectBacklog: BacklogEntry[] = [
  {
    id: "mira",
    title: "MIRA",
    category: "ai",
    note: "Need: what problem it solves, what was built, the stack.",
  },
  {
    id: "autopia",
    title: "AUTOPIA",
    category: "backend",
    note: "NOT BUILT YET — described as a truck/car project you want to do, related to your work experience. Keep this out of `projects` until it exists; a recruiter asking about it is the exact failure mode we are fixing.",
  },
  {
    id: "jack-and-sally",
    title: "JACK & SALLY",
    category: "frontend",
    note: "The frontend piece you said you would probably include. Need: what it is and the stack — Three.js?",
  },
];
