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
