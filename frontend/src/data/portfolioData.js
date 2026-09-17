// ============================================================
// PORTFOLIO DATA — edit this single file to update the site.
// ============================================================

export const SPLINE_SCENE_URL =
  "https://prod.spline.design/3X4Nd1e9lv8rgSg1/scene.splinecode";

export const SPLINE_SCENE_2_URL =
  "https://prod.spline.design/PU4OS9xwmiHIeZOj/scene.splinecode";

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
  },
];

export const systemFeatures = [
  {
    num: "01",
    part: "HEAD",
    title: "AI ENGINEERING",
    text: "LLMs, agents and RAG pipelines — intelligence engineered for production.",
    side: "left",
    top: "20%",
    from: { x: 26, y: 27 },
    to: { x: 50, y: 30 },
  },
  {
    num: "02",
    part: "HANDS",
    title: "FRONTEND",
    text: "React interfaces with cinematic motion and real-time 3D.",
    side: "right",
    top: "46%",
    from: { x: 74, y: 53 },
    to: { x: 63, y: 62 },
  },
  {
    num: "03",
    part: "TORSO",
    title: "BACKEND",
    text: "FastAPI services, databases and APIs built for real load.",
    side: "left",
    top: "68%",
    from: { x: 26, y: 74 },
    to: { x: 50, y: 58 },
  },
];

export const capabilities = [
  {
    id: "frontend",
    num: "01",
    title: "Frontend",
    description:
      "Interfaces that feel alive — motion-first, accessible, obsessively optimized.",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Spline / Three.js", "Radix / shadcn"],
  },
  {
    id: "backend",
    num: "02",
    title: "Backend",
    description:
      "Resilient APIs and event-driven architectures built for real load.",
    tags: ["FastAPI", "Node.js", "PostgreSQL", "MongoDB", "Redis", "Kafka", "REST / gRPC", "Auth"],
  },
  {
    id: "ai",
    num: "03",
    title: "AI",
    description:
      "From notebooks to production: training, evaluation and serving.",
    tags: ["PyTorch", "LLM Fine-tuning", "RAG", "Agents / LangChain", "Computer Vision", "Eval Harnesses", "MLOps"],
  },
  {
    id: "tools",
    num: "04",
    title: "Tools",
    description:
      "Infrastructure as code, observability by default, zero-downtime deploys.",
    tags: ["Docker", "Kubernetes", "AWS / GCP", "CI/CD", "Git", "Observability", "Linux"],
  },
];

export const terminalBoot = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "maria.sol.gosende — full stack developer & ai engineer" },
  { type: "cmd", text: "cat availability.txt" },
  { type: "out", text: "STATUS: OPEN TO PROJECTS // RESPONSE TIME < 24H" },
];
