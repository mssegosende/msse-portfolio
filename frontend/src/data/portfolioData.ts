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
    "I am María Sol, a full stack developer and AI engineer based in Buenos Aires. Since 2022 I have built products end to end, from the interface users interact with to the services behind it, and more recently the AI layer on top. I am most motivated by systems with dense business rules and no tolerance for silent errors, such as bookings, payments and data that must remain consistent wherever it lives. Each one presents a challenge with something new to learn.",
    "I work primarily in Python and TypeScript and take ownership of features from the data layer to the interface. I am currently directing my career toward systems where integrity is non-negotiable: where every operation must reconcile exactly, and where security is designed in from the first line.",
  ],
  story: [
    "The people who knew me saw it before I did. They recognized that the way I questioned how things worked, and refused to let a problem go unsolved, was already the mindset of an engineer. Teaching myself, in my own way, showed me how far I could go once I set my mind to something. That is when I stopped being just a user of technology and started building it for the people on the other side of the screen.",
    "Studying has been my engine ever since, and I pick things up quickly. Learning the piano taught me that every system runs on patterns, and once you see them, one logic leads you into the next, whether it is written in notes, in code or in another language. At the end of the day, that is what I bring to a team: the habit of turning what I don't know yet into what I can build next.",
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
    title: "Curiosity as method",
    text: "Before I trust a system, I need to understand why it works. That discipline surfaces flawed assumptions early, when correcting them costs the least.",
  },
  {
    num: "02",
    title: "Ownership to resolution",
    text: "I stay with a problem until its root cause is understood and resolved, not merely suppressed. A complete fix also ensures the same failure cannot recur unnoticed.",
  },
  {
    num: "03",
    title: "Creativity within constraints",
    text: "Every engineering problem arrives with constraints. Working within them is where I learn the most, and where the strongest solutions tend to emerge.",
  },
];

// Scene 2: one card at a time, mind -> nerves -> body.
export const capabilityCards: CapabilityCard[] = [
  {
    num: "1",
    part: "MIND",
    small: "THE MIND",
    title: "AI ENGINEERING",
    text: "I build LLM systems where the model advises and the code decides. Rules find the candidates, the model weighs them against context, and confidence thresholds turn its answer into an action, with dismissing held to a higher bar than flagging. Anything uncertain, and any failed call, goes to a human instead of disappearing. LLMs are probabilistic, so the risk is mine to own: every pipeline is evaluated against labeled data (precision, recall, F1) and every model is compared on cost and latency before it ships.",
    chips: ["LangGraph", "LangChain", "RAG", "Evals"],
  },
  {
    num: "2",
    part: "NERVES",
    small: "THE NERVOUS SYSTEM",
    title: "BACKEND",
    text: "Python and FastAPI are my main backend, with Node.js and NestJS when the service calls for it. I start from the business rules: a domain layer that knows nothing about the framework or the database, organized with clean and hexagonal architecture, and I move from one well-built service to microservices only when the problem asks for it. I like the problems that look simple until you write them down, like a slot that must never be booked twice. PostgreSQL underneath, Pydantic at the edges, pytest around the rules, Docker around it all.",
    chips: ["Python", "FastAPI", "PostgreSQL", "Node"],
  },
  {
    num: "3",
    part: "BODY",
    small: "THE BODY",
    title: "FRONTEND",
    text: "On the frontend I focus on the data layer: what the interface needs from the server, and what happens when the answer doesn't arrive as expected. I build with React and TypeScript on Next.js, loading data in Server Components whenever the page allows it, so less code and no secrets reach the browser. Types disappear at runtime, so I validate server responses with Zod before they reach a component, and a broken contract shows up as a clear error instead of a blank screen.",
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
