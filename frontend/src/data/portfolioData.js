// ============================================================
// PORTFOLIO DATA — edit this single file to update the site.
// ============================================================
//
// CONTENT STATUS: every string below is real EXCEPT entries flagged
// `draft: true`, whose copy is placeholder text waiting on the real thing.
// Draft entries render in `yarn start` with a DRAFT badge and are stripped
// from the production bundle (see `getProjects` below), so the published
// site never shows invented copy. Rewrite the copy, drop the flag.
//
// `projectBacklog` at the bottom holds real project NAMES with no copy at
// all — never rendered, in any environment.
// ============================================================

export const SPLINE_SCENE_URL =
  "https://prod.spline.design/f1rJJWMxGAz7LFXO/scene.splinecode";

export const SPLINE_SCENE_2_URL =
  "https://prod.spline.design/PU4OS9xwmiHIeZOj/scene.splinecode";

export const profile = {
  name: "María Sol Gosende",
  // Two parts: the dock shows the mark alone, the hero and the footer show
  // the mark stands alone — no suffix.
  shortMark: "MSSE: //",
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
    // TODO — give me the real URL and the footer icon appears. Null hides it.
    linkedin: null,
  },
  bio: [
    "I'm María Sol — a full stack developer and AI engineer based in Buenos Aires. I've spent the last five years building the systems other people's businesses run on: backend infrastructure and payment workflows for a functional-medicine booking platform in Los Angeles, a microservice that resolved scheduling conflicts and data discrepancies between systems that disagreed with each other, and REST APIs written from scratch for a core-banking simulation platform.",
    "Right now I'm architecting the migration of a legacy C# monolith into distributed polyglot microservices, and building FastAPI services that power AI-assisted pricing features consumed by an agent layer. I work across Python, TypeScript and C#, and I care most about the unglamorous parts — strict API contracts, validation layers, data that reconciles — because those are what decide whether a system survives in production.",
  ],
  // Years only — Aug 2021 → present, continuous. No job-derived counts.
  stats: [{ value: "5+", label: "Years shipping code" }],
};

// Hero story paragraphs — DRAFT from real history, pending approval.
// NOTE: ScrollScene animates exactly two paragraphs (storyRefs 0 and 1) at
// fixed timeline positions. A third would never fade in — keep this at two.
export const story = [
  "I started where the load is: backend infrastructure. Booking systems that couldn't drop a payment, a microservice that had to reconcile data two systems disagreed about, banking APIs written from scratch. That work taught me reliability isn't a feature you add later — it's decided in the first contract you write.",
  "Now I do it at a larger scale: breaking a legacy monolith into distributed services, and wiring AI agents into pricing systems where a wrong answer costs real money. I build my own products for the same reason — AlphardRE, so Argentine freelancers can see what their income is actually worth, and Apsis, because I wanted an assistant built to my own standards.",
];

// Title above the story block in the pinned hero.
export const storyTitle = {
  name: "María Sol Gosende Centurión",
  role: "Full Stack Developer & AI Engineer",
};

export const manifesto = [
  {
    num: "01",
    title: "Contracts before code",
    text: "Strict API contracts and validation layers aren't bureaucracy. They're what stops two services from quietly disagreeing about the same data until someone's money is wrong.",
  },
  {
    num: "02",
    title: "Interfaces are the product",
    text: "The most resilient backend in the world fails if the interface feels dead. Motion, latency and feedback are engineering decisions, not decoration.",
  },
  {
    num: "03",
    title: "Legacy is a starting point",
    text: "Real systems are rarely greenfield. The craft is migrating what a business already runs on — without ever stopping it.",
  },
];

export const marqueeItems = [
  "FULL STACK DEVELOPMENT",
  "DISTRIBUTED MICROSERVICES",
  "API DESIGN",
  "LLM AGENTS",
  "DATA PIPELINES",
  "FINTECH SYSTEMS",
];

// ------------------------------------------------------------
// PROJECTS — 5 cards. Authored spans are 7 + 5 on the first row and
// 4 + 4 + 4 on the second, matching the 12-column grid in Projects.jsx.
// Do not change the grid in the component; change the spans here.
// ------------------------------------------------------------
export const projects = [
  {
    id: "polaris",
    title: "POLARIS",
    subtitle: "AI Engineering — Agent Orchestration",
    // DRAFT — need: the real problem it solves, what was built, the stack.
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
    // DRAFT — need: what it does, the stack, and whether this is personal
    // work or the Los Angeles booking platform from the 2021–22 role.
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
    // DRAFT — placeholder name for the star-named pipeline. Need: the real
    // name, what it ingests, and where the output goes.
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
    // TODO(confirm) — public repo / live URL, if there is one.
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-4",
  },
  {
    id: "project-05",
    title: "PROJECT 05",
    subtitle: "Full Stack — Internal Tooling",
    // DRAFT — placeholder slot. Needs a real project, or delete the entry.
    description:
      "A small internal tool that replaced a spreadsheet three people were editing at once. React and TypeScript on the front, a FastAPI service and a relational model behind it, containerised so it runs the same on any machine that needs it.",
    tags: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Docker"],
    codeUrl: "",
    liveUrl: "",
    span: "md:col-span-4",
    draft: true,
  },
];

// Static class strings so Tailwind's scanner can see every span it may emit.
// A template literal here would be silently dropped from the stylesheet.
const SPAN_CLASS = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  12: "md:col-span-12",
};

// Lay n cards out on the 12-column grid: a 7 + 5 hero row, then rows of
// three, with a short trailing row widened so it never leaves a gap.
const layoutSpans = (n) => {
  if (n <= 0) return [];
  if (n === 1) return [12];
  if (n === 2) return [7, 5];
  if (n === 3) return [4, 4, 4];
  if (n === 4) return [7, 5, 6, 6];
  const spans = [7, 5];
  let rest = n - 2;
  while (rest >= 3) {
    spans.push(4, 4, 4);
    rest -= 3;
  }
  if (rest === 1) spans.push(12);
  if (rest === 2) spans.push(6, 6);
  return spans;
};

// The list the site actually renders. In development every card shows and
// keeps its authored span; in the production build drafts are stripped and
// the survivors are re-laid out so one card goes full width instead of
// sitting in a 7-column box with 5 columns of nothing beside it.
export const getProjects = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const visible = isProduction ? projects.filter((p) => !p.draft) : projects;
  if (visible.length === projects.length) return visible;
  const spans = layoutSpans(visible.length);
  return visible.map((p, i) => ({ ...p, span: SPAN_CLASS[spans[i]] }));
};

// NOTE: the pinned hero animates exactly three cards (01/02/03) at hardcoded
// positions. Keep this array at three entries.
export const systemFeatures = [
  {
    num: "01",
    part: "HEAD",
    title: "AI ENGINEERING",
    text:
      "LLM agents and AI-assisted features wired into services that already carry production load. I build the layer an agent actually calls: strict schemas, validation at the edge, and failure modes that degrade instead of guessing. LangChain and LangGraph orchestrate it — the contract is what decides whether the output can be trusted.",
    side: "left",
    top: "6%",
    from: { x: 26, y: 27 },
    to: { x: 50, y: 38 },
  },
  {
    num: "02",
    part: "HANDS",
    title: "FRONTEND",
    text:
      "React and TypeScript interfaces — motion, real-time 3D, and feedback that keeps up with the user. Typed end to end against the same contracts the backend publishes, so the UI breaks at compile time instead of in front of someone. Tailwind and Framer Motion for the everyday, Spline and Three.js when the scene has to feel alive.",
    side: "right",
    top: "44%",
    from: { x: 74, y: 53 },
    to: { x: 67, y: 86 },
  },
  {
    num: "03",
    part: "TORSO",
    title: "BACKEND",
    text:
      "FastAPI, NestJS and .NET microservices with strict contracts and real data behind them. This is where a legacy monolith gets broken apart without stopping the business: versioned APIs, validation layers, and reconciliations that surface a disagreement before it reaches someone's balance. PostgreSQL and SQL Server underneath, Docker around it.",
    side: "left",
    top: "52%",
    from: { x: 26, y: 74 },
    to: { x: 50, y: 77 },
  },
];

export const capabilities = [
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
    description:
      "Agent layers and AI-assisted features built into production services, not demos.",
    tags: ["LangChain", "LangGraph", "LLM Agents", "Agent-consumed APIs", "Python"],
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

export const terminalBoot = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "mssegosende — full stack developer & ai engineer" },
  { type: "cmd", text: "cat availability.txt" },
  { type: "out", text: "STATUS: OPEN TO OPPORTUNITIES // REMOTE — WORLDWIDE" },
];

// ============================================================
// PROJECT BACKLOG — NOT RENDERED ON THE SITE.
// Real project names, captured so they aren't lost. Each needs a
// description before it can move into `projects` above — even as a draft.
// Nothing here is guessed: `note` records only what was actually said.
// ETHOS and POLARIS moved up into `projects` as drafts; their open
// questions now live as TODO comments on those entries.
// ============================================================
export const projectBacklog = [
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
