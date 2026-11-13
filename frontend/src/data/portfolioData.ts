// Portfolio content: edit this file to update the site. The projects live in
// projectsData.ts. `projectBacklog` keeps real project names that have no
// copy yet; it is never rendered.

export interface Profile {
  name: string;
  shortMark: string;
  markSuffix: string;
  role: string;
  taglineLines: string[];
  tagline: string;
  status: string;
  location: string;
  /** A null linkedin hides its footer icon. */
  socials: { github: string; linkedin: string | null };
  /** Scene 4: Ø4.1 `bio` and Ø4.2 `story`, a list of paragraphs each. */
  bio: string[];
  story: string[];
  stats: { value: string; label: string }[];
}

export interface ManifestoEntry {
  num: string;
  title: string;
  text: string;
}

/** One scene 2 card: the "Dossier" (design/crt/.../Main.dc.html). */
export interface CapabilityCard {
  /** Plain number, shown as 01. */
  num: string;
  /** The subsystem: rail label, SIG · / LINK · tags (MIND, INTERFACE, ENGINE). */
  part: string;
  /** The small line above the title (THE MIND…). */
  small: string;
  title: string;
  text: string;
  chips: string[];
  /** FUNCTION row (approved by María Sol, 12 Nov). */
  function: string;
  /** SHIPPED IN row: projects that use it (approved by María Sol, 12 Nov). */
  shippedIn: string;
  /** The ASCII object for this step: sphere, torus or rounded cube. */
  shape: "SPHERE" | "TORUS" | "CUBE";
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
  location: "ARGENTINA — GLOBAL",
  socials: {
    github: "https://github.com/mssegosende",
    linkedin: "https://www.linkedin.com/in/mssegosende",
  },
  // About's bio (María Sol, 13 Nov), four paragraphs typed in order: bio, then story.
  bio: [
    "Full stack developer and AI engineer based in Argentina. Since 2022 I have built projects end to end: the interface people use, the services behind it and, more recently, the AI layer on top. I work mainly in Python and TypeScript, with Node.js on the back end and React and Next.js on the front end.",
    "Drawn to systems that cannot afford silent errors, such as bookings, payments and data that has to stay consistent wherever it lives, I keep steering my career toward systems where every operation reconciles exactly and security is part of the design from the first line.",
  ],
  story: [
    "The people around me saw an engineer in me before I did. You rarely see coming what will end up surprising you, which is the opposite of how I build software: there, every possible outcome has to be anticipated and handled. Engineering was that surprise, and since then I have been building technology for the people who need it.",
    "I see patterns across very different fields, and they let me connect one logic to another. When something is new to me, I do not stop at not knowing: I work out how it functions and build my own way of understanding it. A system is not only an engineering idea; it is anything that runs on rules that must hold for it to work, in music, in a language or in code. That is what I bring to a team: the habit of turning what I do not know yet into what I can build next.",
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

// About's principles. CRT redesign (SPEC §6): three title rows, each with its
// text under it (María Sol, 13 Nov: the descriptions back).
export const manifesto: ManifestoEntry[] = [
  {
    num: "01",
    title: "Contracts before code",
    text: "Before I trust a system, I need to understand why it works. That discipline surfaces flawed assumptions early, when correcting them costs the least.",
  },
  {
    num: "02",
    title: "Interfaces are the product",
    text: "I stay with a problem until its root cause is understood and resolved, not merely suppressed. A complete fix also ensures the same failure cannot recur unnoticed.",
  },
  {
    num: "03",
    title: "Humans where they matter",
    text: "Every engineering problem arrives with constraints. Working within them is where I learn the most, and where the strongest solutions tend to emerge.",
  },
];

// Scene 2: one card at a time, mind -> nerves -> body.
export const capabilityCards: CapabilityCard[] = [
  // The design's order (CRT redesign): MIND, INTERFACE, ENGINE. The robot is
  // gone from scene 2, so the parts are no longer body parts (SPEC §3).
  {
    num: "1",
    part: "MIND",
    small: "THE MIND",
    title: "AI ENGINEERING",
    text: "I build LLM systems where the model advises and the code decides. Rules find the candidates, the model weighs them against context, and confidence thresholds turn its answer into an action, with dismissing held to a higher bar than flagging. Anything uncertain, and any failed call, goes to a human instead of disappearing. LLMs are probabilistic, so the risk is mine to own: every pipeline is evaluated against labeled data (precision, recall, F1) and every model is compared on cost and latency before it ships.",
    chips: ["LangGraph", "LangChain", "RAG", "Evals"],
    function: "AGENTS · RAG · EVALS",
    shippedIn: "BLAZE · POLARIS · LYNX",
    shape: "SPHERE",
  },
  {
    num: "2",
    part: "INTERFACE",
    small: "THE INTERFACE",
    title: "FRONTEND",
    text: "On the frontend I focus on the data layer: what the interface needs from the server, and what happens when the answer does not arrive as expected. I build with React and TypeScript on Next.js, loading data in Server Components whenever the page allows it, so less code and no secrets reach the browser. Types disappear at runtime, so I validate server responses with Zod before they reach a component, and a broken contract shows up as a clear error instead of a blank screen.",
    chips: ["React", "TypeScript", "Next.js", "Zod", "GSAP"],
    function: "MOTION · 3D · EDITORS",
    shippedIn: "BLAZE · MARVEL · ETHOS",
    shape: "TORUS",
  },
  {
    num: "3",
    part: "ENGINE",
    small: "THE ENGINE",
    title: "BACKEND",
    text: "Python and FastAPI are my main backend, with Node.js and NestJS when the service calls for it. I start from the business rules: a domain layer that knows nothing about the framework or the database, organized with clean and hexagonal architecture, and I move from one well-built service to microservices only when the problem asks for it. I like the problems that look simple until you write them down, like a slot that must never be booked twice. PostgreSQL underneath, Pydantic at the edges, pytest around the rules, Docker around it all.",
    chips: ["Python", "FastAPI", "PostgreSQL", "Node"],
    function: "APIS · CONTRACTS · DATA",
    shippedIn: "ETHOS · POLARIS · THIS SITE",
    shape: "CUBE",
  },
];

// ============================================================
// PROJECT BACKLOG (not rendered). Real names awaiting a description before
// they move into projectsData.ts. `note` records only what was actually said.
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
