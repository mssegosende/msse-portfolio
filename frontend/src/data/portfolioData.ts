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

/** A point as fractions of an element (0..1) or percentages of the stage. */
export interface Point {
  x: number;
  y: number;
}

export interface SystemFeature {
  num: string;
  part: string;
  title: string;
  text: string;
  side: "left" | "right";
  /** CSS top of the card, e.g. "44%". */
  top: string;
  lineFrom: Point;
  to: Point;
}

export interface Capability {
  id: string;
  num: string;
  title: string;
  description: string;
  tags: string[];
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

// The scene 4 WHO copy. ScrollScene animates exactly two paragraphs.
export const story: string[] = [
  "I'm María Sol — a full stack developer and AI engineer in Buenos Aires. I came to code through a cousin who was sure I could do it, and a computer I wanted to understand down to the parts: I built my own PC in 2020, and I've been writing software professionally since 2022.",
  "Piano taught me the thing I use most: different logics share patterns. Once I see the pattern, a new language or framework stops being foreign — that's how I learn, and how I walk into a system I've never seen.",
];

// Title above the story block in the pinned hero.
export const storyTitle = {
  name: "María Sol Gosende Centurión",
  role: "Full Stack Developer & AI Engineer",
};

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

export const marqueeItems: string[] = [
  "FULL STACK DEVELOPMENT",
  "DISTRIBUTED MICROSERVICES",
  "API DESIGN",
  "LLM AGENTS",
  "DATA PIPELINES",
  "FINTECH SYSTEMS",
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

// Exactly three entries: the pinned hero animates 01/02/03 at fixed positions.
// `lineFrom`: where the card's connector starts, as a fraction of the card.
// `to`: the dot's first position; the timeline moves it onto the body part.
export const systemFeatures: SystemFeature[] = [
  {
    num: "01",
    part: "HEAD",
    title: "AI ENGINEERING",
    text: "LLM agents and AI-assisted features wired into services that already carry production load. I build the layer an agent actually calls: strict schemas, validation at the edge, and failure modes that degrade instead of guessing. LangChain and LangGraph orchestrate it — the contract is what decides whether the output can be trusted.",
    side: "left",
    top: "9%",
    lineFrom: { x: 0.7, y: 0.5 },
    to: { x: 50, y: 38 },
  },
  {
    num: "02",
    part: "HANDS",
    title: "FRONTEND",
    text: "React and TypeScript interfaces — motion, real-time 3D, and feedback that keeps up with the user. Typed end to end against the same contracts the backend publishes, so the UI breaks at compile time instead of in front of someone. Tailwind and Framer Motion for the everyday, Spline and Three.js when the scene has to feel alive.",
    side: "right",
    top: "44%",
    lineFrom: { x: 0.3, y: 0.22 },
    to: { x: 67, y: 86 },
  },
  {
    num: "03",
    part: "TORSO",
    title: "BACKEND",
    text: "FastAPI, NestJS and .NET microservices with strict contracts and real data behind them. This is where a legacy monolith gets broken apart without stopping the business: versioned APIs, validation layers, and reconciliations that surface a disagreement before it reaches someone's balance. PostgreSQL and SQL Server underneath, Docker around it.",
    side: "left",
    top: "52%",
    lineFrom: { x: 0.7, y: 0.52 },
    to: { x: 50, y: 77 },
  },
];

export const capabilities: Capability[] = [
  {
    id: "frontend",
    num: "01",
    title: "Frontend",
    description:
      "Interfaces built on the same stacks I ship backends with — typed, motion-first, accessible.",
    tags: ["React", "Next.js", "Remix", "TypeScript", "Tailwind CSS", "Three.js"],
  },
  {
    id: "backend",
    num: "02",
    title: "Backend",
    description:
      "APIs and microservices with strict contracts, validation layers and real load behind them.",
    tags: ["FastAPI", "Flask", "NestJS", "Express", "Node.js", "C# / .NET", "REST APIs"],
  },
  {
    id: "ai",
    num: "03",
    title: "AI Engineering",
    description: "Agent layers and AI-assisted features built into production services, not demos.",
    tags: [
      "LangChain",
      "LangGraph",
      "LLM Agents",
      "Agent-consumed APIs",
      "Python",
      "Emergent (AI app builder)",
    ],
  },
  {
    id: "data",
    num: "04",
    title: "Data & Infrastructure",
    description:
      "Relational data, ETL pipelines, and the migration path from monolith to services.",
    tags: ["PostgreSQL", "SQL Server", "SQLAlchemy", "ETL Pipelines", "Docker", "Git"],
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
