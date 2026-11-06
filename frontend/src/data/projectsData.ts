// Scene 3 projects (design/HANDOFF.md P3, copy from mock C).
// `media`: the looping clip in the GIF player. The current files in
// public/projects/ are abstract placeholders; swap them for the real screen
// recordings (mp4 or webm, ~16:10, muted) and keep the same path or update it.

export interface ShowcaseProject {
  id: string;
  /** Plain number, rendered with the slashed zero (Ø3.1). */
  num: string;
  name: string;
  tags: string[];
  /** Empty hides the status line. */
  status: string;
  body: string;
  chips: string[];
  /** The review flow strip under the player (Arcturus only). */
  flow?: string[];
  /** Caption over the player, describing what the clip shows. */
  caption: string;
  media: string;
  /** Fallback length when the clip doesn't report a duration (MediaRecorder webm). */
  seconds: number;
  /** Static art behind the clip (poster while it loads, and the folder back panel). */
  art: string;
  /** Empty renders the tab without a link. TODO: case study URLs. */
  caseStudyUrl: string;
  /** Placeholder copy, waiting for María Sol. */
  draft?: boolean;
}

const art = (from: number, hi: string, lo: string) =>
  `radial-gradient(ellipse 55% 45% at ${hi}, rgba(214,220,226,0.6), rgba(214,220,226,0) 62%), ` +
  `radial-gradient(ellipse 70% 60% at ${lo}, rgba(110,120,132,0.55), rgba(0,0,0,0) 66%), ` +
  `conic-gradient(from ${from}deg at 58% 46%, #0C0E11, #3A424C 18%, #0C0E11 38%, #6B7580 58%, #15191E 78%, #0C0E11)`;

export const showcaseProjects: ShowcaseProject[] = [
  {
    id: "arcturus",
    num: "3.1",
    name: "ARCTURUS",
    tags: ["MULTI-AGENT PR REVIEW", "FEATURED"],
    status: "",
    body: "A LangGraph pipeline where agents review a pull request against business rules. The last agent rates the result from everything the previous states found — and a developer only steps in when that rating misses the correction threshold, not on every change.",
    chips: ["LangGraph", "Python", "LLM agents", "Human-in-the-loop"],
    flow: ["PR DIFF", "AGENTS · RULES", "RATING", "< THRESHOLD · HUMAN"],
    caption: "[ GIF: a PR moving through the agents — and the moment it hands off to a human ]",
    media: "/projects/arcturus.webm",
    seconds: 8,
    art: art(210, "24% 30%", "80% 76%"),
    caseStudyUrl: "",
  },
  {
    id: "ethos",
    num: "3.2",
    name: "ETHOS",
    tags: ["CLINIC APP"],
    status: "Backend in progress",
    body: "A fictional functional-medicine clinic, built end to end: React front, a Node gateway, a FastAPI data engine over PostgreSQL. Right now I'm rebuilding the appointments service from the MVP's business rules.",
    chips: ["React", "Node", "FastAPI", "PostgreSQL"],
    caption: "[ GIF · booking an appointment, front to database ]",
    media: "/projects/ethos.webm",
    seconds: 8,
    art: art(120, "70% 28%", "22% 80%"),
    caseStudyUrl: "",
  },
  {
    id: "apsis",
    num: "3.3",
    name: "APSIS",
    tags: ["AI ASSISTANT"],
    status: "In progress",
    body: "An assistant I'm building for my own workflow, one module at a time. Each module gets its own agent — the first reads incoming job proposals and drafts the replies.",
    chips: ["React", "TypeScript", "FastAPI", "LLM agents"],
    caption: "[ GIF · a job proposal in, a drafted reply out ]",
    media: "/projects/apsis.webm",
    seconds: 8,
    art: art(300, "40% 70%", "78% 24%"),
    caseStudyUrl: "",
  },
  {
    // TODO: Polaris copy from María Sol (HANDOFF P3: placeholders until then).
    id: "polaris",
    num: "3.4",
    name: "POLARIS",
    tags: ["[ CATEGORY ]"],
    status: "[ Status ]",
    body: "[ What Polaris is, in two sentences: the problem it solves and the one technical decision you're proudest of. ]",
    chips: ["[ Stack ]"],
    caption: "[ GIF · Polaris in action ]",
    media: "/projects/polaris.webm",
    seconds: 8,
    art: art(30, "82% 62%", "20% 30%"),
    caseStudyUrl: "",
    draft: true,
  },
];
