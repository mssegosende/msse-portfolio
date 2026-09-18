// ============================================================
// PORTFOLIO DATA — edit this single file to update the site.
// ============================================================
//
// CONTENT STATUS: every string below is real. Nothing is invented.
// `projectBacklog` at the bottom holds the real project NAMES that do not
// have descriptions yet — it is deliberately NOT rendered, so the live site
// never shows a placeholder. Move an entry up into `projects` once its
// description is written.
// ============================================================

export const SPLINE_SCENE_URL =
  "https://prod.spline.design/f1rJJWMxGAz7LFXO/scene.splinecode";

export const SPLINE_SCENE_2_URL =
  "https://prod.spline.design/PU4OS9xwmiHIeZOj/scene.splinecode";

export const profile = {
  name: "María Sol Gosende",
  shortMark: "MSG://",
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

export const projects = [
  {
    id: "alphardre",
    title: "ALPHARDRE",
    subtitle: "Fintech SaaS — Freelance Income",
    description:
      "Argentine freelancers invoice in a currency that loses value while they wait to be paid, and a missed monotributo threshold means a forced recategorization. AlphardRE tracks what they actually earned: real income adjusted by the INDEC inflation index, USD conversion across multiple exchange rates, and category tracking that flags SAFE, WARNING or CRITICAL before a threshold is crossed.",
    tags: ["Python", "FastAPI", "PostgreSQL"],
    // TODO(confirm) — public repo / live URL, if there is one.
    github: null,
    demo: null,
    span: "md:col-span-7",
    featured: true,
  },
  {
    id: "apsis",
    title: "APSIS",
    subtitle: "AI Productivity Assistant",
    description:
      "An assistant I'm building for my own workflow, one module at a time. Modular React + TypeScript frontend on a Vite build, FastAPI backend, with an LLM agent planned behind each module — the first reads incoming job proposals and drafts the replies.",
    tags: ["React", "TypeScript", "Vite", "FastAPI", "LLM Agents"],
    // TODO(confirm) — public repo / live URL, if there is one.
    github: null,
    demo: null,
    span: "md:col-span-5",
  },
];

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
// description before it can move into `projects` above. Nothing here is
// guessed: `note` records only what was actually said about it.
// ============================================================
export const projectBacklog = [
  {
    id: "ethos",
    title: "ETHOS",
    category: "backend",
    note: "The functional-medicine one. Need: what it does, the stack, and whether this is personal work or the Los Angeles booking platform from the 2021–22 role.",
  },
  {
    id: "polaris",
    title: "POLARIS",
    category: "ai",
    note: "Need: what problem it solves, what was built, the stack.",
  },
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
