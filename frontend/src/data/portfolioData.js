// ============================================================
// PORTFOLIO DATA — edit this single file to update the site.
// ============================================================

export const SPLINE_SCENE_URL =
  "https://prod.spline.design/3X4Nd1e9lv8rgSg1/scene.splinecode";

export const profile = {
  name: "María Sol Gosende",
  shortMark: "MSG://",
  role: "Full Stack Developer & AI Engineer",
  taglineLines: ["Full Stack Developer", "& AI Engineer"],
  tagline:
    "I build intelligent systems — from neural networks to production-grade web platforms.",
  status: "ONLINE",
  location: "BUENOS AIRES — GLOBAL",
  email: "maria.sol.gosende@example.com",
  socials: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
  },
  bio: [
    "I'm María Sol — a full stack developer and AI engineer who treats software like precision engineering. I design and ship end-to-end systems: reactive frontends, resilient backends, and machine learning pipelines that survive contact with production.",
    "My work sits at the intersection of elegant interfaces and intelligent infrastructure. Whether it's orchestrating LLM agents, training vision models, or crafting interfaces that feel alive, I care about one thing: systems that are as beautiful inside as they are outside.",
  ],
  stats: [
    { value: "6+", label: "Years shipping code" },
    { value: "30+", label: "Projects delivered" },
    { value: "12", label: "AI models in production" },
  ],
};

export const manifesto = [
  {
    num: "01",
    title: "Intelligence is a craft",
    text: "Models are not magic. They are engineered systems — trained, evaluated, monitored. I build AI with the same rigor as any critical infrastructure.",
  },
  {
    num: "02",
    title: "Interfaces are the product",
    text: "The best backend in the world fails if the interface feels dead. Motion, latency, feedback — every millisecond is a design decision.",
  },
  {
    num: "03",
    title: "Ship, measure, refine",
    text: "Perfection is a direction, not a destination. I ship early, instrument everything, and let real usage carve the roadmap.",
  },
];

export const marqueeItems = [
  "FULL STACK DEVELOPMENT",
  "NEURAL NETWORKS",
  "GENERATIVE AI",
  "DISTRIBUTED SYSTEMS",
  "LLM ORCHESTRATION",
  "CREATIVE ENGINEERING",
];

export const robotShots = {
  head: "https://images.unsplash.com/photo-1677212004257-103cfa6b59d0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxmdXR1cmlzdGljJTIwY3liZXJuZXRpYyUyMHJvYm90JTIwaGlnaCUyMHRlY2glMjBkYXJrJTIwZGV0YWlsfGVufDB8fHx8MTc4OTY1Nzg3NXww&ixlib=rb-4.1.0&q=85",
  torso:
    "https://images.unsplash.com/photo-1676115299568-f17971f0bb87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHw0fHxmdXR1cmlzdGljJTIwY3liZXJuZXRpYyUyMHJvYm90JTIwaGlnaCUyMHRlY2glMjBkYXJrJTIwZGV0YWlsfGVufDB8fHx8MTc4OTY1Nzg3NXww&ixlib=rb-4.1.0&q=85",
  arm: "https://images.pexels.com/photos/29054365/pexels-photo-29054365.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export const projects = [
  {
    id: "synthesis",
    title: "SYNTHESIS",
    subtitle: "AI Agent Orchestrator",
    description:
      "Multi-agent LLM platform that plans, executes and self-corrects complex workflows. Tool routing, memory layers and human-in-the-loop checkpoints — all observable in real time.",
    tags: ["Python", "FastAPI", "LangChain", "React", "Redis"],
    github: "https://github.com/",
    demo: "https://example.com/",
    span: "md:col-span-7",
    image: robotShots.torso,
    featured: true,
  },
  {
    id: "neurachat",
    title: "NeuraChat",
    subtitle: "Conversational AI Suite",
    description:
      "Production chat platform with RAG over private docs, streaming responses and sub-second latency at scale.",
    tags: ["Next.js", "OpenAI", "pgvector", "WebSockets"],
    github: "https://github.com/",
    demo: "https://example.com/",
    span: "md:col-span-5",
    image: null,
  },
  {
    id: "visionpipe",
    title: "VisionPipe",
    subtitle: "Real-time CV Pipeline",
    description:
      "GPU-accelerated computer vision pipeline processing 40+ streams — detection, tracking and anomaly scoring on the edge.",
    tags: ["PyTorch", "CUDA", "Docker", "gRPC"],
    github: "https://github.com/",
    demo: null,
    span: "md:col-span-4",
    image: null,
  },
  {
    id: "pulseboard",
    title: "Pulseboard",
    subtitle: "Realtime Analytics",
    description:
      "Streaming analytics dashboard ingesting 1M+ events/day with live visualizations and anomaly alerts.",
    tags: ["React", "D3.js", "Kafka", "ClickHouse"],
    github: "https://github.com/",
    demo: "https://example.com/",
    span: "md:col-span-4",
    image: null,
  },
  {
    id: "forge",
    title: "Forge UI",
    subtitle: "Design System Engine",
    description:
      "Token-driven component engine generating accessible, themeable UI kits from a single design schema.",
    tags: ["TypeScript", "Storybook", "Tailwind"],
    github: "https://github.com/",
    demo: null,
    span: "md:col-span-4",
    image: null,
  },
];

export const capabilities = [
  {
    id: "frontend",
    icon: "Code2",
    title: "Frontend Engineering",
    description:
      "Interfaces that feel alive — motion-first, accessible, obsessively optimized.",
    skills: [
      { name: "React / Next.js", level: 95 },
      { name: "TypeScript", level: 90 },
      { name: "Motion / 3D (Spline, Three.js)", level: 82 },
      { name: "Tailwind / Design Systems", level: 92 },
    ],
  },
  {
    id: "backend",
    icon: "Server",
    title: "Backend Systems",
    description:
      "Resilient APIs and event-driven architectures built for real load.",
    skills: [
      { name: "FastAPI / Node.js", level: 93 },
      { name: "PostgreSQL / MongoDB", level: 88 },
      { name: "Redis / Kafka", level: 80 },
      { name: "API Design / Auth", level: 90 },
    ],
  },
  {
    id: "aiml",
    icon: "BrainCircuit",
    title: "AI / Machine Learning",
    description:
      "From notebooks to production: training, evaluation and serving.",
    skills: [
      { name: "PyTorch / TensorFlow", level: 87 },
      { name: "LLM Fine-tuning / RAG", level: 91 },
      { name: "Computer Vision", level: 78 },
      { name: "MLOps / Eval Harnesses", level: 84 },
    ],
  },
  {
    id: "devops",
    icon: "CloudCog",
    title: "Cloud & DevOps",
    description:
      "Infrastructure as code, observability by default, zero-downtime deploys.",
    skills: [
      { name: "Docker / Kubernetes", level: 85 },
      { name: "AWS / GCP", level: 82 },
      { name: "CI/CD Pipelines", level: 88 },
      { name: "Monitoring / Tracing", level: 79 },
    ],
  },
];

export const terminalBoot = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "maria.sol.gosende — full stack developer & ai engineer" },
  { type: "cmd", text: "cat availability.txt" },
  { type: "out", text: "STATUS: OPEN TO PROJECTS // RESPONSE TIME < 24H" },
];
