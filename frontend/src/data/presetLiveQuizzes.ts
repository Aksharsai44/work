import { LiveQuestion } from "../types";

export interface PresetQuizPack {
  id: string;
  title: string;
  category: string;
  description: string;
  questionCount: number;
  icon: string;
  badgeColor: string;
  questions: Omit<LiveQuestion, "id" | "batchId" | "createdAt" | "responses">[];
}

export const PRESET_QUIZ_PACKS: PresetQuizPack[] = [
  {
    id: "pack_ai_agents_10",
    title: "Autonomous AI Agents & LLM Architectures",
    category: "AI & LLMs",
    description: "10 core questions covering system prompts, tool calling, memory layers, and multi-agent coordination.",
    questionCount: 10,
    icon: "🧠",
    badgeColor: "sky",
    questions: [
      {
        question: "What is the primary role of a System Prompt in an autonomous AI Agent?",
        type: "mcq",
        options: [
          "Defines the agent's persona, operational rules, and behavioral boundaries",
          "Controls the physical monitor display resolution",
          "Compiles frontend CSS stylesheets",
          "Allocates database disk partitions"
        ],
        correctAnswer: "Defines the agent's persona, operational rules, and behavioral boundaries",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "System prompts set the foundational constraints, available tools, and objective guidelines for LLMs.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "How do LLMs execute external actions like querying SQL or sending emails?",
        type: "mcq",
        options: [
          "Through Function Calling / Tool Calling schemas",
          "By directly editing computer hardware transistors",
          "Via physical electrical switches",
          "By increasing the temperature parameter"
        ],
        correctAnswer: "Through Function Calling / Tool Calling schemas",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Tool calling returns structured JSON arguments that client code executes against external APIs.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: Autonomous agents can inspect tool execution errors and attempt self-correction in a loop.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "Reflection and iterative self-healing loops allow agents to diagnose error outputs and retry with adjusted parameters.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Which component provides long-term semantic memory for an AI agent?",
        type: "mcq",
        options: [
          "Vector Database with Embedding Retrieval (RAG)",
          "CPU L1 Cache",
          "Local Browser Cookies only",
          "The GPU cooling fan"
        ],
        correctAnswer: "Vector Database with Embedding Retrieval (RAG)",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Vector stores index semantic embeddings, allowing agents to retrieve relevant historical context on demand.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "In a Multi-Agent Swarm (like CrewAI), why do we assign distinct roles to different agents?",
        type: "mcq",
        options: [
          "To specialize prompt instructions and reduce cognitive clutter per task",
          "To make the application run slower",
          "Because single agents cannot use Python",
          "To disable all external API calls"
        ],
        correctAnswer: "To specialize prompt instructions and reduce cognitive clutter per task",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Role separation allows specialized prompts (e.g. Researcher, Coder, Reviewer) leading to higher accuracy.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Live Pulse Check: Which AI agent framework are you most excited to build with in this workshop?",
        type: "poll",
        options: [
          "CrewAI / Multi-Agent Swarms",
          "LangGraph / State Machine Workflows",
          "Native Google GenAI SDK Functions",
          "n8n / No-Code Automation Pipelines"
        ],
        timeLimitSeconds: 45,
        points: 50,
        explanation: "Live poll to assess cohort interest and guide hands-on lab allocation.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What does the 'Temperature' parameter in LLM generation control?",
        type: "mcq",
        options: [
          "The degree of randomness vs determinism in token sampling",
          "The physical heat of the server hardware",
          "The token generation speed in tokens per second",
          "The maximum context window length"
        ],
        correctAnswer: "The degree of randomness vs determinism in token sampling",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Lower temperature (e.g. 0.1) produces deterministic outputs; higher temperature (e.g. 0.8) encourages creativity.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: Function calling guarantees that the LLM executes the code on the remote API server directly.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "False",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "The LLM only generates the function name and structured JSON arguments; the hosting application executes the actual function.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What is 'Hallucination' in Large Language Models?",
        type: "mcq",
        options: [
          "Generating factually incorrect or ungrounded assertions with high confidence",
          "When the model's server loses power",
          "A visual optical illusion on the screen",
          "When the prompt has syntax errors in HTML"
        ],
        correctAnswer: "Generating factually incorrect or ungrounded assertions with high confidence",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Hallucinations occur when statistical token continuation generates plausible-sounding but factually wrong content.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Quick Check: How prepared do you feel to build and deploy your first AI Agent today?",
        type: "poll",
        options: [
          "🚀 100% Ready - Let's build!",
          "💡 Understand theory, excited for hands-on code",
          "⏳ Need a quick refresher on APIs",
          "☕ Need a quick coffee first"
        ],
        timeLimitSeconds: 30,
        points: 50,
        explanation: "Cohort confidence pulse check.",
        isActive: true,
        isClosed: false,
      }
    ]
  },
  {
    id: "pack_fullstack_15",
    title: "Full-Stack System Design & APIs (15 Questions)",
    category: "Full-Stack",
    description: "15 questions covering REST, WebSockets, State Management, Authentication, and Cloud deployment.",
    questionCount: 15,
    icon: "⚡",
    badgeColor: "emerald",
    questions: [
      {
        question: "Which HTTP status code signifies that a resource was successfully created?",
        type: "mcq",
        options: ["201 Created", "200 OK", "204 No Content", "301 Moved Permanently"],
        correctAnswer: "201 Created",
        timeLimitSeconds: 25,
        points: 100,
        explanation: "201 Created is the standard RESTful response code for successful POST creation requests.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Why are WebSockets preferred over HTTP polling for real-time live Q&A applications?",
        type: "mcq",
        options: [
          "Bi-directional, low-latency persistent connection without HTTP handshake overhead per message",
          "WebSockets do not require an IP address",
          "They only work on mobile phones",
          "They disable browser cookies automatically"
        ],
        correctAnswer: "Bi-directional, low-latency persistent connection without HTTP handshake overhead per message",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "WebSockets maintain a single duplex TCP connection enabling instant push updates from server to client.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: JWT tokens should contain sensitive passwords because they are signed with a secret key.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "False",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "JWT payloads are only Base64-encoded, not encrypted. Anyone can decode and view the claims payload.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Which database indexing strategy is optimal for exact key lookups?",
        type: "mcq",
        options: ["Hash Index or B-Tree Index", "Full Table Scan", "Random Sequential Sort", "Bitwise OR Scan"],
        correctAnswer: "Hash Index or B-Tree Index",
        timeLimitSeconds: 25,
        points: 100,
        explanation: "Hash indexes provide O(1) key lookups, while B-Trees provide O(log N) point and range queries.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What is CORS in web application security?",
        type: "mcq",
        options: [
          "Cross-Origin Resource Sharing mechanism allowing servers to specify allowed origins",
          "Central Operating Relay System for GPU drivers",
          "Code Optimization and Rendering Standard",
          "Cyber Online Recovery Service"
        ],
        correctAnswer: "Cross-Origin Resource Sharing mechanism allowing servers to specify allowed origins",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "CORS prevents unauthorized cross-domain requests by verifying HTTP headers with the host server.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Live Poll: What backend stack do you primarily use for building APIs?",
        type: "poll",
        options: [
          "Node.js / Express / TypeScript",
          "Python / FastAPI / Flask",
          "Go (Golang) / Fiber / Gin",
          "Java / Spring Boot / Kotlin"
        ],
        timeLimitSeconds: 30,
        points: 50,
        explanation: "Backend tooling distribution across students.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What is the primary benefit of React hooks like useMemo and useCallback?",
        type: "mcq",
        options: [
          "Preventing unnecessary recalculations and re-renders through memoization",
          "Connecting to database servers directly without an API",
          "Encrypting user passwords in local storage",
          "Replacing HTML elements with binary files"
        ],
        correctAnswer: "Preventing unnecessary recalculations and re-renders through memoization",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Memoization caches computed values or function instances across re-renders when dependencies have not changed.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: Server-Sent Events (SSE) provide unidirectional streaming from server to client over HTTP.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "SSE uses standard HTTP connections to stream text events (ideal for LLM text streaming).",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Which database ACID property ensures that all parts of a transaction succeed or all fail together?",
        type: "mcq",
        options: ["Atomicity", "Consistency", "Isolation", "Durability"],
        correctAnswer: "Atomicity",
        timeLimitSeconds: 25,
        points: 100,
        explanation: "Atomicity ensures 'all-or-nothing' execution for database transaction operations.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What is Rate Limiting used for in API gateways?",
        type: "mcq",
        options: [
          "Protecting servers from abuse, DDoS attacks, and API key quota exhaustion",
          "Making the internet connection faster",
          "Translating code into machine language",
          "Compressing images automatically"
        ],
        correctAnswer: "Protecting servers from abuse, DDoS attacks, and API key quota exhaustion",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Rate limiting caps the number of requests a client can make in a given window (e.g. 100 req/min).",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: In relational databases, a Foreign Key enforces referential integrity between two tables.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "Foreign keys prevent invalid data insertion that doesn't correspond to existing records in the primary table.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "What does SSR (Server-Side Rendering) improve in modern web applications?",
        type: "mcq",
        options: [
          "Initial page load performance (FCP) and search engine optimization (SEO)",
          "Mouse cursor sensitivity",
          "Audio output quality",
          "Computer battery life only"
        ],
        correctAnswer: "Initial page load performance (FCP) and search engine optimization (SEO)",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Rendering HTML on the server delivers pre-populated markup immediately to crawlers and user viewports.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Live Poll: Have you deployed a containerized application with Docker to the cloud before?",
        type: "poll",
        options: [
          "Yes, frequently (Kubernetes/Cloud Run)",
          "Yes, a few times with basic Dockerfiles",
          "Familiar with theory, want more practice",
          "Brand new to containerization"
        ],
        timeLimitSeconds: 30,
        points: 50,
        explanation: "DevOps & Cloud experience breakdown.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "Which data structure is fundamentally used in Redis for Pub/Sub messaging channels?",
        type: "mcq",
        options: [
          "In-memory Message Broker channels / Streams",
          "Magnetic Tape files",
          "Hard drive swap files",
          "Direct browser localStorage"
        ],
        correctAnswer: "In-memory Message Broker channels / Streams",
        timeLimitSeconds: 30,
        points: 100,
        explanation: "Redis handles blazing-fast pub/sub messaging entirely in RAM with microsecond latencies.",
        isActive: true,
        isClosed: false,
      },
      {
        question: "True or False: HTTPS encrypts both the request URL path, query params, and body data in transit.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        timeLimitSeconds: 20,
        points: 50,
        explanation: "TLS/HTTPS encrypts the entire HTTP payload including the request line (paths and query strings) and body; only the domain name (SNI) is visible.",
        isActive: true,
        isClosed: false,
      }
    ]
  },
  {
    id: "pack_rapid_20",
    title: "20-Question Rapid-Fire Workshop Sprint",
    category: "Rapid Sprint",
    description: "20 fast-paced questions designed for high-energy live competitions with instant accuracy tracking.",
    questionCount: 20,
    icon: "🚀",
    badgeColor: "rose",
    questions: Array.from({ length: 20 }, (_, i) => ({
      question: `Rapid Sprint Challenge #${i + 1}: ${
        [
          "Which algorithm powers semantic search in vector spaces?",
          "What is the maximum context token window of modern Gemini 1.5/2.0 Flash models?",
          "True or False: Prompt Injection is a recognized security vulnerability in LLM applications.",
          "In Git, which command creates a new branch and immediately switches to it?",
          "Which HTTP method is idempotent and used to replace an entire resource?",
          "What does RAG stand for in modern AI engineering?",
          "True or False: SQLite is a serverless, self-contained relational database engine.",
          "Which Python library is standard for numerical array operations?",
          "What is the default port for local development servers in this workshop container?",
          "Live Poll: Rate your overall understanding of agentic workflows so far today.",
          "Which technique is used to prevent race conditions in concurrent database operations?",
          "True or False: Webhooks use push notifications over HTTP POST rather than client polling.",
          "What is the primary difference between synchronous and asynchronous code execution?",
          "Which layer in Docker images is read-write at container runtime?",
          "What is 'Zero-Shot Prompting'?",
          "True or False: TypeScript types exist only at compile time and are stripped at runtime.",
          "Which data format is most standard for REST API payloads?",
          "In modern CI/CD pipelines, what does 'CD' stand for?",
          "Which metric evaluates how fast an API server responds to incoming requests?",
          "Final Sprint Poll: Ready to take on the capstone coding project?"
        ][i]
      }`,
      type: (i === 9 || i === 19) ? "poll" : (i % 3 === 2) ? "true_false" : "mcq",
      options: (i === 9)
        ? ["⭐⭐⭐⭐⭐ Mastered it", "⭐⭐⭐⭐ Very solid", "⭐⭐⭐ Getting there", "⭐⭐ Need review"]
        : (i === 19)
        ? ["🔥 Let's build the capstone!", "💻 Ready with IDE open", "⚡ Teaming up with peers"]
        : (i % 3 === 2)
        ? ["True", "False"]
        : [
            i === 0 ? "Cosine Similarity / k-NN" : i === 1 ? "1 Million to 2 Million Tokens" : i === 3 ? "git checkout -b <branch>" : i === 4 ? "PUT" : i === 5 ? "Retrieval-Augmented Generation" : i === 7 ? "NumPy" : i === 8 ? "Port 3000" : i === 10 ? "Optimistic or Pessimistic Locking" : i === 12 ? "Async does not block the main thread while waiting for I/O" : i === 13 ? "Container layer (topmost)" : i === 14 ? "Prompting without providing any prior examples" : i === 16 ? "JSON" : i === 17 ? "Continuous Delivery / Deployment" : "Latency / TTFB (Time to First Byte)",
            "Linear Brute Search",
            "Random Guessing",
            "Manual Table Inspection"
          ],
      correctAnswer: (i === 9 || i === 19)
        ? undefined
        : (i % 3 === 2)
        ? "True"
        : [
            "Cosine Similarity / k-NN",
            "1 Million to 2 Million Tokens",
            "True",
            "git checkout -b <branch>",
            "PUT",
            "Retrieval-Augmented Generation",
            "True",
            "NumPy",
            "Port 3000",
            undefined,
            "Optimistic or Pessimistic Locking",
            "True",
            "Async does not block the main thread while waiting for I/O",
            "Container layer (topmost)",
            "Prompting without providing any prior examples",
            "True",
            "JSON",
            "Continuous Delivery / Deployment",
            "Latency / TTFB (Time to First Byte)",
            undefined
          ][i],
      timeLimitSeconds: 20,
      points: 75,
      explanation: `Key foundational workshop concept tested in question #${i + 1}.`,
      isActive: true,
      isClosed: false,
    }))
  }
];
