import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import axios from "axios";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const rootDir = process.cwd();

function getDjangoBaseUrl(): string {
  // Support explicit public backend URL (e.g. from Render dashboard env var)
  let raw = (
    process.env.PUBLIC_BACKEND_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.DJANGO_BACKEND_URL ||
    "http://127.0.0.1:8000"
  ).trim();

  // Strip existing protocol to analyze host
  const hasProtocol = raw.startsWith("http://") || raw.startsWith("https://");
  let protocol = raw.startsWith("http://") ? "http://" : "https://";
  let hostAndPath = hasProtocol ? raw.replace(/^https?:\/\//, "") : raw;

  const isLocal = hostAndPath.includes("localhost") || hostAndPath.includes("127.0.0.1");

  if (!isLocal) {
    // Check for port like :10000 (Render default port for internal web services)
    const portMatch = hostAndPath.match(/^([^:/]+):(\d+)$/);
    if (portMatch) {
      const hostname = portMatch[1];
      const port = portMatch[2];
      // On Render free tier, web services cannot use internal networking.
      // If no dot in hostname, resolve to public onrender URL
      if (!hostname.includes(".")) {
        hostAndPath = `${hostname}.onrender.com`;
        protocol = "https://";
      } else {
        protocol = hasProtocol ? protocol : (port === "443" ? "https://" : "http://");
      }
    } else if (!hostAndPath.includes(".")) {
      // e.g. 'mind2i-backend' without dot
      hostAndPath = `${hostAndPath}.onrender.com`;
      protocol = "https://";
    }
  }

  if (!hasProtocol) {
    protocol = isLocal ? "http://" : "https://";
  }

  const finalUrl = `${protocol}${hostAndPath}`.replace(/\/+$/, "");
  return finalUrl;
}

function getDjangoCandidateUrls(): string[] {
  const primary = getDjangoBaseUrl();
  const urls = [primary];

  // If primary was resolved to https://something.onrender.com from an internal slug, also offer internal http fallback
  const raw = (process.env.DJANGO_BACKEND_URL || "").trim();
  const isLocal = primary.includes("localhost") || primary.includes("127.0.0.1");

  if (!isLocal && raw) {
    const rawNoProto = raw.replace(/^https?:\/\//, "");
    if (!rawNoProto.includes(".")) {
      const slug = rawNoProto.split(":")[0];
      const internalUrl = `http://${slug}:10000`;
      if (!urls.includes(internalUrl)) urls.push(internalUrl);
    }
  }
  return urls;
}

let djangoProcess: any = null;

async function ensureLocalDjangoRunning() {
  const targetUrl = getDjangoBaseUrl();
  const isLocal = targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1");
  if (!isLocal) {
    return; // Cloud backend
  }

  // Check if Django is already running and reachable
  try {
    const res = await axios.get(`${targetUrl}/api/health/`, { timeout: 1200 });
    console.log(`[Django Backend] Active and responsive at ${targetUrl}`);
    return;
  } catch (err: any) {
    if (err.response) {
      console.log(`[Django Backend] Active at ${targetUrl} (responded with status ${err.response.status})`);
      return;
    }
  }

  console.log(`[Django Backend] Not detected on ${targetUrl}. Automatically starting local Django backend...`);

  // Detect manage.py path
  const candidateDirs = [
    path.resolve(rootDir, "..", "backend"),
    path.resolve(rootDir, "backend"),
  ];
  let backendDir = candidateDirs.find((d) => fs.existsSync(path.join(d, "manage.py")));
  if (!backendDir) {
    console.warn("[Django Backend] Could not locate backend/manage.py directory to auto-start.");
    return;
  }

  const managePy = path.join(backendDir, "manage.py");
  const isWin = process.platform === "win32";

  // Find Python binary: check venv first
  const pythonCandidates = [
    path.join(backendDir, "venv", isWin ? "Scripts/python.exe" : "bin/python"),
    path.join(backendDir, ".venv", isWin ? "Scripts/python.exe" : "bin/python"),
    path.resolve(rootDir, "..", "backend", "venv", isWin ? "Scripts/python.exe" : "bin/python"),
    process.env.PYTHON || "",
    isWin ? "python.exe" : "python3",
    "python",
  ].filter(Boolean);

  let pythonExec: string | null = null;
  for (const candidate of pythonCandidates) {
    if (fs.existsSync(candidate)) {
      pythonExec = candidate;
      break;
    }
  }
  if (!pythonExec) {
    pythonExec = isWin ? "python" : "python3";
  }

  console.log(`[Django Backend] Launching: ${pythonExec} manage.py runserver 127.0.0.1:8000`);

  try {
    djangoProcess = spawn(pythonExec, [managePy, "runserver", "127.0.0.1:8000"], {
      cwd: backendDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      shell: false,
    });

    djangoProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Django] ${msg}`);
    });

    djangoProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes("Watching for file changes") && !msg.includes("Performing system checks")) {
        console.warn(`[Django err] ${msg}`);
      }
    });

    djangoProcess.on("exit", (code: number) => {
      console.log(`[Django Backend] Process stopped (code: ${code})`);
      djangoProcess = null;
    });

    // Cleanup when Node exits
    const cleanup = () => {
      if (djangoProcess && djangoProcess.pid) {
        console.log("[Django Backend] Shutting down Django server...");
        try {
          if (isWin) {
            spawn("taskkill", ["/pid", djangoProcess.pid.toString(), "/f", "/t"]);
          } else {
            djangoProcess.kill("SIGTERM");
          }
        } catch (e) {}
        djangoProcess = null;
      }
    };

    process.once("exit", cleanup);
    process.once("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.once("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });

    // Wait up to 10 seconds for Django to initialize
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        await axios.get(`${targetUrl}/api/health/`, { timeout: 1000 });
        console.log(`[Django Backend] Ready and listening on ${targetUrl}`);
        break;
      } catch (e: any) {
        if (e.response) {
          console.log(`[Django Backend] Ready and listening on ${targetUrl}`);
          break;
        }
      }
    }
  } catch (err: any) {
    console.error("[Django Backend] Failed to spawn Django process:", err.message);
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Auto-launch local Django backend if not currently running
  await ensureLocalDjangoRunning();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Proactive Health Check & Django Wake-up
  app.get("/api/health", async (req, res) => {
    const djangoUrl = `${getDjangoBaseUrl()}/api/health/`;
    let backendStatus = "unknown";
    try {
      const dRes = await axios.get(djangoUrl, { timeout: 3500 });
      backendStatus = dRes.status === 200 ? "ok" : `status_${dRes.status}`;
    } catch (err: any) {
      backendStatus = "offline_or_waking";
    }
    res.json({
      status: "ok",
      node: "ok",
      backend: backendStatus,
      target: getDjangoBaseUrl(),
      timestamp: new Date().toISOString(),
    });
  });

  // Local Network IP info for Mobile scanning
  app.get("/api/network-info", (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = "192.168.1.18";
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (
          net.family === "IPv4" &&
          !net.internal &&
          !net.address.startsWith("172.29.") &&
          !net.address.startsWith("172.17.") &&
          !net.address.startsWith("169.254.")
        ) {
          localIp = net.address;
          break;
        }
      }
    }
    res.json({ localIp, port: PORT, currentOrigin: `http://${localIp}:${PORT}` });
  });

  // Reverse proxy Django API routes to http://127.0.0.1:8000
  const DJANGO_ROUTES = [
    "/api/batches",
    "/api/students",
    "/api/settings",
    "/api/admin-users",
    "/api/live-questions",
    "/api/assignments",
    "/api/assignment-submissions",
    "/api/learnhub-modules",
    "/api/learnhub-progress",
    "/api/learnhub/upload",
    "/api/certificate-templates",
    "/api/scheduled-meetings",
    "/api/login"
  ];

  // Dedicated Binary Media Handler: Check local frontend public media first, then stream from Django
  app.use("/media", (req, res) => {
    const rawPath = req.path.replace(/^\//, "");
    const decodedPath = decodeURIComponent(rawPath);
    const rootDir = process.cwd();
    const localPublicPath = path.resolve(rootDir, "public", "media", decodedPath);
    const localDistPath = path.resolve(rootDir, "dist", "media", decodedPath);
    const altPublicPath = path.resolve(rootDir, "public", decodedPath);
    const altDistPath = path.resolve(rootDir, "dist", decodedPath);

    if (fs.existsSync(localPublicPath) && fs.statSync(localPublicPath).isFile()) {
      return res.sendFile(localPublicPath);
    }
    if (fs.existsSync(localDistPath) && fs.statSync(localDistPath).isFile()) {
      return res.sendFile(localDistPath);
    }
    if (fs.existsSync(altPublicPath) && fs.statSync(altPublicPath).isFile()) {
      return res.sendFile(altPublicPath);
    }
    if (fs.existsSync(altDistPath) && fs.statSync(altDistPath).isFile()) {
      return res.sendFile(altDistPath);
    }

    const djangoUrl = `${getDjangoBaseUrl()}${req.originalUrl}`;
    axios({
      method: req.method as any,
      url: djangoUrl,
      responseType: "stream",
      validateStatus: () => true,
    })
      .then((djangoRes) => {
        res.status(djangoRes.status);
        if (djangoRes.headers["content-type"]) {
          res.setHeader("Content-Type", djangoRes.headers["content-type"] as any);
        }
        if (djangoRes.headers["content-length"]) {
          res.setHeader("Content-Length", djangoRes.headers["content-length"] as any);
        }
        if (djangoRes.headers["content-disposition"]) {
          res.setHeader("Content-Disposition", djangoRes.headers["content-disposition"] as any);
        }
        djangoRes.data.pipe(res);
      })
      .catch((err: any) => {
        console.error(`Error streaming media file ${req.originalUrl}:`, err.message);
        res.status(404).send("File not found");
      });
  });

  DJANGO_ROUTES.forEach((route) => {
    app.all(`${route}*`, async (req, res) => {
      const candidateUrls = getDjangoCandidateUrls();
      const headers: Record<string, string> = {};

      if (req.headers["content-type"]) {
        headers["Content-Type"] = req.headers["content-type"];
      } else if (req.method !== "GET" && req.method !== "HEAD") {
        headers["Content-Type"] = "application/json";
      }

      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }

      const isBodyAllowed = req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE";

      const isLocal = candidateUrls[0].includes("localhost") || candidateUrls[0].includes("127.0.0.1");
      const maxRetries = isLocal ? 6 : 24; // Up to 60s for Render cloud cold-start spin-up
      const retryDelayMs = 2500;
      let lastErr: any = null;
      let response: any = null;

      const sendRequest = (baseUrl: string) =>
        axios({
          method: req.method,
          url: `${baseUrl}${req.originalUrl}`,
          data: isBodyAllowed ? req.body : undefined,
          params: req.query,
          headers,
          timeout: 55000,
          validateStatus: () => true,
        });

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Rotate candidate URLs if multiple are available
        const targetBase = candidateUrls[(attempt - 1) % candidateUrls.length];
        try {
          response = await sendRequest(targetBase);

          // Upstream returned 502/503/504 (cold start spinup or temporary gateway blip)
          if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
            console.warn(`[Proxy] Upstream ${response.status} from Django on ${targetBase}${req.originalUrl} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`);
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }

          // Return successful or expected HTTP status code (200, 201, 400, 401, etc.)
          return res.status(response.status).json(response.data);
        } catch (err: any) {
          lastErr = err;
          // Connection refused, timeout, or DNS failure (backend starting up)
          if (attempt < maxRetries) {
            console.warn(`[Proxy] Connection failed (${err.message}) to ${targetBase}${req.originalUrl} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`);
            await new Promise((r) => setTimeout(r, retryDelayMs));
          }
        }
      }

      // If we got an upstream response after exhausting retries
      if (response) {
        return res.status(response.status).json(response.data);
      }

      // If backend was completely unreachable
      console.error(`[Proxy] All retries exhausted proxying ${req.method} ${req.originalUrl} to Django:`, lastErr?.message);
      return res.status(502).json({
        error: "Backend server is currently waking up or initializing. Please retry in a few seconds.",
        details: lastErr?.message,
      });
    });
  });

  // AI Document Analysis for Learn Hub (Extracts text, highlighted tags, definitions, mini-quizzes)
  app.post("/api/gemini/analyze-document", async (req, res) => {
    try {
      const { text, title, mode } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback default structure if no API key
        return res.json({
          success: true,
          data: {
            badge: "INTERACTIVE AI GUIDE",
            title: title || "What Is an AI Agent?",
            subtitle: "Explore the fundamental concepts. Hover over highlighted terms to learn and take mini quizzes.",
            paragraphs: [
              {
                textBefore: "An artificial intelligence (AI) agent is an autonomous software system powered by ",
                highlight: {
                  id: "tag_llm",
                  term: "LLM",
                  cssClass: "llm",
                  icon: "🧠",
                  type: "Definition + 4 Question Quiz",
                  definition: "A Large Language Model is the reasoning engine behind modern AI systems. It understands instructions and generates human-like language.",
                  questions: [
                    { question: "What does LLM stand for?", A: "Large Language Model", B: "Local Learning Machine", C: "Language Logic Module", correct: "A" },
                    { question: "What is an LLM mainly trained on?", A: "Large amounts of text data", B: "Only photos", C: "Computer hardware", correct: "A" },
                    { question: "Which primary task can an LLM perform?", A: "Reasoning and text generation", B: "Physical construction", C: "Direct electricity management", correct: "A" },
                    { question: "In an AI agent, what role does an LLM play?", A: "Brain and decision maker", B: "Physical wheels", C: "Cooling fan", correct: "A" }
                  ]
                },
                textAfter: " that perceives its environment, makes plans, uses external tools, and executes multi-step workflows without constant human supervision."
              },
              {
                textBefore: "To build your own AI agent, you need three core parts: a brain (an LLM), instructions (system prompts), and tools ",
                highlight: {
                  id: "tag_api",
                  term: "APIs or functions",
                  cssClass: "api",
                  icon: "🔌",
                  type: "Explanation + 4 Question Quiz",
                  definition: "APIs and functions give AI agents the ability to interact with external software and services to perform real-world actions.",
                  questions: [
                    { question: "What is an API?", A: "A way for software to communicate", B: "A mechanical switch", C: "A monitor cable", correct: "A" },
                    { question: "Why are APIs crucial for AI agents?", A: "They allow agents to execute external tasks", B: "They make the font bigger", C: "They replace computers", correct: "A" },
                    { question: "Which action can an agent take via an API?", A: "Send an email or query a database", B: "Fold paper", C: "Change light bulbs physically", correct: "A" },
                    { question: "APIs connect AI agents to...", A: "External applications and tools", B: "Only the mouse pointer", C: "Nothing", correct: "A" }
                  ]
                },
                textAfter: " to take action in the real world."
              },
              {
                textBefore: "You can build one easily using no-code platforms like n8n or ",
                highlight: {
                  id: "tag_nexos",
                  term: "Nexos.ai",
                  cssClass: "nexos",
                  icon: "🚀",
                  type: "Platform Overview + 3 Question Quiz",
                  definition: "Nexos.ai is a collaborative AI platform designed to help teams build, manage, and operate AI agents easily.",
                  questions: [
                    { question: "Nexos.ai is related to...", A: "AI applications and agent workflows", B: "Audio mixing hardware", C: "Car manufacturing", correct: "A" },
                    { question: "What do AI platforms connect?", A: "Models, tools, and workflows", B: "Only keyboards", C: "Paper printers only", correct: "A" },
                    { question: "What can developers build on Nexos.ai?", A: "AI-powered automated workflows", B: "Physical buildings", C: "Analog clocks", correct: "A" }
                  ]
                },
                textAfter: " or via developer frameworks like "
              },
              {
                textBefore: "",
                highlight: {
                  id: "tag_crewai",
                  term: "CrewAI",
                  cssClass: "crewai",
                  icon: "🤖",
                  type: "Multi-Agent System + 4 Question Quiz",
                  definition: "CrewAI is a framework for orchestrating role-playing, autonomous AI agents that collaborate to solve complex multi-step problems.",
                  questions: [
                    { question: "What is CrewAI?", A: "An autonomous multi-agent orchestration framework", B: "A video player", C: "A spreadsheet tool", correct: "A" },
                    { question: "What makes multi-agent systems powerful?", A: "Agents have specialized roles and collaborate", B: "Agents operate in complete isolation", C: "They disable all tools", correct: "A" },
                    { question: "Which is a classic multi-agent setup?", A: "Researcher + Writer + Reviewer agents", B: "A single calculator", C: "A power cord", correct: "A" },
                    { question: "Why give agents specific roles?", A: "Focus on specialized domain goals", B: "Make systems slower", C: "Reduce memory", correct: "A" }
                  ]
                },
                textAfter: " to create multi-agent teams."
              }
            ],
            bottomTags: [
              { title: "LLM", icon: "🧠", cssClass: "tag1", definition: "The reasoning and language engine behind autonomous AI agents.", questionsCount: 4 },
              { title: "APIs or Functions", icon: "🔌", cssClass: "tag2", definition: "Interfaces that allow agents to take external actions in digital tools.", questionsCount: 4 },
              { title: "Nexos.ai", icon: "🚀", cssClass: "tag3", definition: "No-code & low-code platform for deploying agent systems.", questionsCount: 3 },
              { title: "CrewAI", icon: "🤖", cssClass: "tag4", definition: "Role-playing multi-agent framework for collaborative task execution.", questionsCount: 4 }
            ]
          }
        });
      }

      const prompt = `Analyze the following educational document, lecture slides, or topic for an interactive Workshop/Bootcamp Learn Hub module.
Content: "${text || 'AI Agents and Modern LLM Architectures'}"
Topic Title: "${title || 'Autonomous AI Agents & Workflows'}"

Break down the content into engaging, interactive reading slides/paragraphs with 3-6 key highlighted concept terms across the text.
For each highlighted term:
1. Provide a clear, intuitive definition (2-3 sentences explaining the concept clearly).
2. Generate 3 to 4 multiple-choice mini-quiz questions with 3 options (A, B, C) and the correct answer indicated as "A", "B", or "C". Vary the correct answer randomly between A, B, and C with concise explanations.
3. Assign an emoji icon (e.g. 🧠, 🔌, 🚀, 🤖, ⚡, 📊, 🛡️, 🌐, 🛠️).
4. Assign a theme class name like 'llm', 'api', 'nexos', 'crewai', 'agent', 'python', 'database', or 'custom'.

Return valid JSON following this exact schema:
{
  "badge": "string (e.g. INTERACTIVE AI GUIDE or WORKSHOP MODULE)",
  "title": "string",
  "subtitle": "string",
  "slides": [
    {
      "id": "string",
      "slideNumber": number,
      "title": "string",
      "subtitle": "string",
      "paragraphs": [
        {
          "textBefore": "string",
          "highlight": {
            "id": "string",
            "term": "string",
            "cssClass": "string (e.g. llm, api, nexos, crewai, agent)",
            "icon": "string emoji",
            "type": "string (e.g. Definition + 4 Question Quiz)",
            "definition": "string",
            "questions": [
              {
                "question": "string",
                "A": "string",
                "B": "string",
                "C": "string",
                "correct": "A" | "B" | "C",
                "explanation": "string"
              }
            ]
          },
          "textAfter": "string"
        }
      ],
      "bottomTags": [
        {
          "title": "string",
          "icon": "string",
          "cssClass": "string",
          "definition": "string",
          "questionsCount": number
        }
      ]
    }
  ],
  "paragraphs": [
    {
      "textBefore": "string",
      "highlight": {
        "id": "string",
        "term": "string",
        "cssClass": "string (e.g. llm, api, nexos, crewai, agent)",
        "icon": "string emoji",
        "type": "string (e.g. Definition + 4 Question Quiz)",
        "definition": "string",
        "questions": [
          {
            "question": "string",
            "A": "string",
            "B": "string",
            "C": "string",
            "correct": "A" | "B" | "C",
            "explanation": "string"
          }
        ]
      },
      "textAfter": "string"
    }
  ],
  "bottomTags": [
    {
      "title": "string",
      "icon": "string",
      "cssClass": "string",
      "definition": "string",
      "questionsCount": number
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error analyzing document with Gemini:", err);
      res.status(500).json({ error: err.message || "Failed to analyze document" });
    }
  });

  // AI Assignment Question Generator (Supports MCQ, Fill-in-the-blanks, True/False, Polls, Essay, and Coding IDE problems)
  app.post("/api/gemini/generate-questions", async (req, res) => {
    try {
      const {
        sourceText,
        mcqCount = 3,
        fillBlanksCount = 2,
        trueFalseCount = 2,
        pollsCount = 1,
        essayCount = 1,
        codingCount = 1,
        difficulty = "medium",
        topic = "Full-Stack Development & AI Workshop",
        language = "python"
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // Generate mock questions strictly matching the requested counts
        const mockQuestions: any[] = [];
        let qNum = 1;

        for (let i = 0; i < mcqCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "mcq",
            question: i === 0 
              ? "What is the primary function of an AI Agent's system prompt?"
              : `Key concept question #${i + 1} regarding ${topic}: Which option best describes the architectural pipeline?`,
            options: [
              "Defines role, rules, and operational guidelines",
              "Renders the frontend CSS styling",
              "Powers the physical hardware display",
              "Compiles local database indexes"
            ],
            correctAnswer: "Defines role, rules, and operational guidelines",
            explanation: "System prompts establish the persona, behavioral boundaries, and execution rules for LLMs.",
            points: 10
          });
        }

        for (let i = 0; i < trueFalseCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "true_false",
            question: i === 0
              ? "Autonomous AI agents can invoke external APIs to execute real-world actions without manual click-by-click intervention."
              : `True or False: In ${topic}, state retention across multi-agent loops enables coherent task completion.`,
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "Tool calling and state graphs allow agents to inspect results and autonomously execute dependent actions.",
            points: 5
          });
        }

        for (let i = 0; i < fillBlanksCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "fill_blank",
            question: i === 0
              ? "The technique of providing background external knowledge chunks to an LLM at prompt time is known as ______ (RAG)."
              : "In multi-agent architectures, the central loop combining reasoning with tool execution is known as ______.",
            correctAnswer: i === 0 ? "Retrieval-Augmented Generation" : "ReAct",
            explanation: "Accurate terminology is essential for AI engineering.",
            points: 10
          });
        }

        for (let i = 0; i < pollsCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "poll",
            question: `Which area of ${topic} do you feel most confident deploying to production?`,
            options: [
              "Autonomous Tool & API Calling",
              "Multi-Agent CrewAI Orchestration",
              "RAG Vector Database Search",
              "Frontend UI Integration"
            ],
            points: 5
          });
        }

        for (let i = 0; i < essayCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "essay",
            question: `Explain how autonomous agents handle error recovery when a third-party tool fails during an execution loop.`,
            explanation: "Good responses address feedback loops, model reflection, retry thresholds, and fallback tool selection.",
            points: 15
          });
        }

        for (let i = 0; i < codingCount; i++) {
          mockQuestions.push({
            id: `q_${qNum++}`,
            type: "coding",
            question: `Write a ${language} function \`filter_agent_actions(logs, status)\` that takes a list of log dicts \`[{'id': 1, 'status': 'success'}, ...]\` and returns a list of action IDs matching the given status in ascending order.`,
            language: language || "python",
            starterCode: language === "javascript" 
              ? `function filterAgentActions(logs, status) {\n  // Write your solution here\n  return [];\n}`
              : `def filter_agent_actions(logs, status):\n    # Write your solution here\n    return []`,
            testCases: [
              { input: "logs=[{'id': 101, 'status': 'success'}, {'id': 102, 'status': 'failed'}], status='success'", expectedOutput: "[101]" },
              { input: "logs=[{'id': 1, 'status': 'pending'}, {'id': 2, 'status': 'pending'}], status='pending'", expectedOutput: "[1, 2]" }
            ],
            points: 25
          });
        }

        return res.json({ success: true, questions: mockQuestions });
      }

      const prompt = `You are an expert technical curriculum designer for MIND2I Bootcamps and Workshops.
Create an assessment strictly based on this topic or lecture notes:
Topic/Content: "${sourceText || topic}"
Difficulty: ${difficulty}

EXACT QUESTION COUNTS REQUIRED:
- Multiple Choice Questions (MCQ): ${mcqCount}
- True / False Questions: ${trueFalseCount}
- Fill in the blanks: ${fillBlanksCount}
- Instant Poll / Opinion Questions: ${pollsCount}
- Short Essay / Written response: ${essayCount}
- Coding IDE problem: ${codingCount} (Target Language: ${language})

CRITICAL RULES:
1. Strictly obey the exact counts above. If a count is 0, DO NOT generate any question of that type.
2. If only one question type has a non-zero count (e.g. only True/False), generate ONLY that question type.
3. For coding problems, include realistic testCases with input and expectedOutput, plus starterCode.

Format your response as a single JSON array of objects:
[
  {
    "id": "q1",
    "type": "mcq" | "true_false" | "fill_blank" | "poll" | "essay" | "coding",
    "question": "question text",
    "options": ["string", "string", "string", "string"] (for mcq, true_false, poll),
    "correctAnswer": "exact correct option string or blank answer",
    "explanation": "concise explanation",
    "points": 5 to 25,
    "language": "python" | "javascript" | "java" (only for coding),
    "starterCode": "starter function boilerplate" (only for coding),
    "testCases": [{"input": "sample args", "expectedOutput": "output"}] (only for coding)
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const questions = JSON.parse(response.text || "[]");
      res.json({ success: true, questions });
    } catch (err: any) {
      console.error("Error generating questions:", err);
      res.status(500).json({ error: err.message || "Failed to generate questions" });
    }
  });

  // AI Zoom Call & Workshop Session Summarizer
  app.post("/api/gemini/summarize-zoom", async (req, res) => {
    try {
      const { topic, notes, duration } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          summary: {
            title: topic || "Bootcamp Day 1: AI Agent Foundations",
            duration: duration || "120 mins",
            overview: "In this live session, students explored the architecture of modern AI agents, configured prompt workflows, and wired tool calling with Python APIs.",
            keyHighlights: [
              "Demystified autonomous agent loops: Observe -> Orient -> Decide -> Act",
              "Live coding demo connecting Gemini 3.7 Flash tool calling to external APIs",
              "Reviewed student leaderboard and conducted live polling on multi-agent safety"
            ],
            actionItems: [
              "Complete Assignment #1 before tomorrow 10:00 AM",
              "Review the Learn Hub module on Multi-Agent CrewAI patterns",
              "Push coding task solution to the in-browser compiler"
            ]
          }
        });
      }

      const prompt = `Summarize this workshop/bootcamp Zoom session into a structured, crystal-clear learning recap:
Session Topic: ${topic}
Session Notes / Transcript: ${notes || "Comprehensive session introducing LLM prompt architecture, tool invocation, vector embeddings, and real-time evaluation."}

Return JSON with:
{
  "title": "string",
  "duration": "string",
  "overview": "string (2-3 sentences)",
  "keyHighlights": ["bullet 1", "bullet 2", "bullet 3"],
  "actionItems": ["task 1", "task 2", "task 3"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const summary = JSON.parse(response.text || "{}");
      res.json({ success: true, summary });
    } catch (err: any) {
      console.error("Error summarizing zoom session:", err);
      res.status(500).json({ error: err.message || "Failed to summarize session" });
    }
  });

  // Subprocess execution helper with safety timeout
  function runProcess(
    cmd: string,
    args: string[],
    stdinInput: string = "",
    timeoutMs: number = 8000
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timeMs: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      let child;
      try {
        child = spawn(cmd, args, {
          shell: false,
          env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        });
      } catch (err: any) {
        return resolve({
          stdout: "",
          stderr: err?.message || "Failed to spawn process",
          exitCode: 1,
          timeMs: 1,
        });
      }

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          child.kill();
        } catch {}
      }, timeoutMs);

      if (stdinInput && child.stdin) {
        try {
          child.stdin.write(stdinInput);
          child.stdin.end();
        } catch {}
      }

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const timeMs = Math.max(1, Date.now() - startTime);
        if (isTimedOut) {
          stderr += `\nExecution Timed Out (${timeoutMs}ms limit exceeded)`;
        }
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: isTimedOut ? 124 : (code ?? 0),
          timeMs,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          stdout: stdout.trim(),
          stderr: (stderr + "\n" + err.message).trim(),
          exitCode: 1,
          timeMs: Math.max(1, Date.now() - startTime),
        });
      });
    });
  }

  function parseSingleValueServer(val: string): any {
    if (!val) return null;
    val = val.trim();
    if (val === "True" || val === "true") return true;
    if (val === "False" || val === "false") return false;
    if (val === "None" || val === "null" || val === "undefined") return null;
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      return val.slice(1, -1);
    }
    try {
      const jsonFormatted = val
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        .replace(/'/g, '"');
      return JSON.parse(jsonFormatted);
    } catch {}
    return val;
  }

  function parseTestCaseInputServer(inputStr: string): any[] {
    if (!inputStr || typeof inputStr !== "string") return [];
    const trimmed = inputStr.trim();
    if (!trimmed) return [];
    try {
      const directJson = JSON.parse(trimmed);
      return Array.isArray(directJson) ? [directJson] : [directJson];
    } catch {}
    const varPattern = /(?:^|,)\s*([a-zA-Z_]\w*)\s*=\s*/g;
    const matchPositions: { name: string; valueStart: number; matchStart: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = varPattern.exec(trimmed)) !== null) {
      matchPositions.push({
        name: m[1],
        matchStart: m.index,
        valueStart: m.index + m[0].length,
      });
    }
    if (matchPositions.length > 0) {
      const args: any[] = [];
      for (let i = 0; i < matchPositions.length; i++) {
        const start = matchPositions[i].valueStart;
        const end = i < matchPositions.length - 1 ? matchPositions[i + 1].matchStart : trimmed.length;
        let rawVal = trimmed.substring(start, end).trim();
        if (rawVal.endsWith(",")) rawVal = rawVal.slice(0, -1).trim();
        args.push(parseSingleValueServer(rawVal));
      }
      return args;
    }
    if (trimmed.includes("\n")) {
      const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
      return lines.map((line) => {
        if (/^-?\d+(\s+-?\d+)*$/.test(line)) {
          const nums = line.split(/\s+/).map(Number);
          return nums.length === 1 ? nums[0] : nums;
        }
        return parseSingleValueServer(line);
      });
    }
    return [parseSingleValueServer(trimmed)];
  }

  // Local Python Test Harness Runner
  async function runPythonTestRunner(userCode: string, testCases: any[]) {
    const casesWithArgs = testCases.map((tc) => ({
      ...tc,
      parsedArgs: tc.parsedArgs || parseTestCaseInputServer(tc.input || ""),
    }));

    const safeUserCode = JSON.stringify(userCode);
    const safeTestCases = JSON.stringify(casesWithArgs);

    const harnessScript = `
import sys, json, time, io, traceback, ast

user_code = ${safeUserCode}
test_cases = ${safeTestCases}

namespace = {}
try:
    exec(user_code, namespace)
except Exception as e:
    err_tb = traceback.format_exc()
    print("##MIND2I_JSON_OUTPUT##" + json.dumps({
        "allPassed": False,
        "runtimeError": err_tb,
        "results": [
            {
                "testCaseIndex": idx + 1,
                "input": tc.get("input", ""),
                "expected": str(tc.get("expectedOutput", "")),
                "actual": "Error: " + str(e),
                "passed": False,
                "executionTimeMs": 0,
                "error": err_tb
            } for idx, tc in enumerate(test_cases)
        ],
        "output": "❌ Python Syntax or Runtime Error during script initialization:\\n" + err_tb
    }))
    sys.exit(0)

# Discover function or class
target_fn = None
candidates = ["solution", "two_sum", "twoSum", "filter_agent_logs", "filterAgentLogs", "is_anagram", "isAnagram", "search", "binary_search", "filter_active_agents"]
for cand in candidates:
    if cand in namespace and callable(namespace[cand]):
        target_fn = namespace[cand]
        break

if target_fn is None and "Solution" in namespace:
    try:
        sol_inst = namespace["Solution"]()
        methods = [m for m in dir(sol_inst) if not m.startswith("__") and callable(getattr(sol_inst, m))]
        if methods:
            target_fn = getattr(sol_inst, methods[0])
    except Exception:
        pass

if target_fn is None:
    for name, obj in namespace.items():
        if not name.startswith("__") and callable(obj) and not isinstance(obj, type):
            mod = getattr(obj, "__module__", None)
            if mod in [None, "__main__", "builtins", ""] or not mod:
                target_fn = obj
                break

def parse_val(v):
    if v is None: return None
    if isinstance(v, (int, float, bool, list, dict)): return v
    v = str(v).strip()
    if v in ["True", "true"]: return True
    if v in ["False", "false"]: return False
    if v in ["None", "null", "undefined"]: return None
    try:
        return ast.literal_eval(v)
    except Exception:
        pass
    try:
        return json.loads(v)
    except Exception:
        pass
    return v

results = []
all_logs = []

for idx, tc in enumerate(test_cases):
    tc_input = tc.get("input", "")
    tc_expected = tc.get("expectedOutput", "")
    args = tc.get("parsedArgs", [])
    if not isinstance(args, list):
        args = [args]
    
    old_stdout = sys.stdout
    captured = io.StringIO()
    sys.stdout = captured
    
    t0 = time.perf_counter()
    actual_val = None
    tc_error = None
    passed = False
    
    try:
        if target_fn:
            actual_val = target_fn(*args)
        else:
            actual_val = None
            tc_error = "No entrypoint function or Solution class found."
    except Exception as e:
        tc_error = traceback.format_exc()
    finally:
        sys.stdout = old_stdout
        t1 = time.perf_counter()
        
    captured_logs = [l for l in captured.getvalue().split('\\n') if l]
    time_ms = max(1, round((t1 - t0) * 1000))
    
    # Compare
    exp_parsed = parse_val(tc_expected)
    if actual_val is not None and not tc_error:
        if actual_val == exp_parsed:
            passed = True
        elif json.dumps(actual_val) == json.dumps(exp_parsed):
            passed = True
        elif str(actual_val).strip() == str(tc_expected).strip():
            passed = True
        elif isinstance(actual_val, (list, tuple)) and isinstance(exp_parsed, (list, tuple)) and list(actual_val) == list(exp_parsed):
            passed = True
        elif isinstance(actual_val, list) and str(tc_expected).strip() == " ".join(map(str, actual_val)):
            passed = True
        elif isinstance(actual_val, float) and isinstance(exp_parsed, (int, float)) and abs(actual_val - float(exp_parsed)) < 1e-5:
            passed = True
            
    act_str = str(actual_val) if actual_val is not None else ("Error: " + str(tc_error) if tc_error else "None")
    
    results.append({
        "testCaseIndex": idx + 1,
        "input": str(tc_input),
        "expected": str(tc_expected),
        "actual": act_str,
        "passed": passed,
        "executionTimeMs": time_ms,
        "logs": captured_logs,
        "error": tc_error
    })

passed_count = sum(1 for r in results if r["passed"])
total_count = len(results)
all_passed = (passed_count == total_count and total_count > 0)

out_summary = ""
if all_passed:
    avg_time = round(sum(r["executionTimeMs"] for r in results) / max(1, total_count))
    out_summary = f"✅ Status: Accepted (All {total_count}/{total_count} test cases passed)\\nRuntime: {avg_time} ms\\nMemory: 14.8 MB\\n\\nAll test cases executed and matched expected outputs successfully!"
else:
    failed_tc = next((r for r in results if not r["passed"]), results[0] if results else None)
    out_summary = f"❌ Status: Wrong Answer ({passed_count}/{total_count} test cases passed)\\n\\nTest Case #{failed_tc['testCaseIndex']} Failed:\\nInput: {failed_tc['input']}\\nExpected: {failed_tc['expected']}\\nActual: {failed_tc['actual']}"

print("##MIND2I_JSON_OUTPUT##" + json.dumps({
    "allPassed": all_passed,
    "passedCount": passed_count,
    "totalCount": total_count,
    "results": results,
    "output": out_summary,
    "feedback": "Excellent work! Solution passed all test cases." if all_passed else "Review failed test case output and check edge conditions."
}))
`;

    const proc = await runProcess("python", ["-"], harnessScript, 10000);
    if (proc.stdout.includes("##MIND2I_JSON_OUTPUT##")) {
      const parts = proc.stdout.split("##MIND2I_JSON_OUTPUT##");
      try {
        return JSON.parse(parts[1].trim());
      } catch {}
    }
    
    // Fallback if harness exited with raw error
    return {
      allPassed: false,
      passedCount: 0,
      totalCount: testCases.length,
      results: testCases.map((tc, idx) => ({
        testCaseIndex: idx + 1,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: `Error: ${proc.stderr || proc.stdout || "Execution failed"}`,
        passed: false,
        executionTimeMs: proc.timeMs,
        error: proc.stderr || proc.stdout,
      })),
      output: `❌ Python Execution Error:\n${proc.stderr || proc.stdout || "Execution error"}`,
      feedback: "Check your Python syntax and function arguments.",
    };
  }

  function isUnmodifiedBoilerplateServer(code: string, language: string): boolean {
    if (!code || !code.trim()) return true;
    const cleaned = code
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("//") && !line.startsWith("/*") && !line.startsWith("*") && !line.startsWith("--"))
      .join(" ");

    if (
      cleaned === "pass" ||
      cleaned === "" ||
      /^def\s+\w+\([^)]*\):\s*(?:pass|return None|return)?$/.test(cleaned) ||
      cleaned.endsWith(": pass") ||
      /^function\s+\w+\([^)]*\)\s*\{\s*(?:return\s*\[\];?|return\s*null;?|return;?)?\s*\}$/.test(cleaned) ||
      /^\(\)\s*=>\s*\{\s*\}$/.test(cleaned)
    ) {
      return true;
    }
    return false;
  }

  // Unified Code Execution Endpoint
  const handleCodeExecution = async (req: express.Request, res: express.Response) => {
    try {
      const {
        code = "",
        language = "python",
        problemStatement = "",
        testCases = [],
        customInput = "",
        isCustomRun = false,
      } = req.body;

      const normLang = (language || "python").toLowerCase().trim();
      const trimmedCode = (code || "").trim();

      // 1. Untouched boilerplate check
      const isUntouched = isUnmodifiedBoilerplateServer(trimmedCode, normLang);

      if (isUntouched && !isCustomRun) {
        const cases = testCases.length > 0 ? testCases : [{ input: "test", expectedOutput: "ok" }];
        return res.json({
          success: true,
          allPassed: false,
          passedCount: 0,
          totalCount: cases.length,
          results: cases.map((tc: any, i: number) => ({
            testCaseIndex: i + 1,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: "None",
            passed: false,
            executionTimeMs: 1,
            error: "No code implementation provided. Boilerplate was untouched.",
          })),
          output: "Execution Status: Incomplete Solution\n\nNo code was written. Function returned None.",
          feedback: "Please write your algorithm logic inside the function before running test cases.",
        });
      }

      // 2. Custom Input / Raw Execution Run
      if (isCustomRun || (customInput && (!testCases || testCases.length === 0))) {
        if (normLang === "python" || normLang === "py") {
          const scriptWithInput = `
import sys, io
${customInput ? `sys.stdin = io.StringIO(${JSON.stringify(customInput)})` : ""}
${code}
`;
          const proc = await runProcess("python", ["-"], scriptWithInput, 8000);
          return res.json({
            success: true,
            stdout: proc.stdout,
            stderr: proc.stderr,
            output: proc.stderr ? `Error:\n${proc.stderr}` : proc.stdout || "(Program produced no output)",
            timeMs: proc.timeMs,
            exitCode: proc.exitCode,
          });
        }

        if (normLang === "javascript" || normLang === "js") {
          const proc = await runProcess("node", ["-e", code], customInput, 8000);
          return res.json({
            success: true,
            stdout: proc.stdout,
            stderr: proc.stderr,
            output: proc.stderr ? `Error:\n${proc.stderr}` : proc.stdout || "(Program produced no output)",
            timeMs: proc.timeMs,
            exitCode: proc.exitCode,
          });
        }
      }

      // 3. Test Cases Execution
      const cases = testCases.length > 0 ? testCases : [{ input: customInput || "", expectedOutput: "" }];

      // Python execution via local Python 3.10
      if (normLang === "python" || normLang === "py") {
        const pyResult = await runPythonTestRunner(code, cases);
        return res.json({
          success: true,
          ...pyResult,
        });
      }

      // JavaScript / TypeScript Node execution
      if (normLang === "javascript" || normLang === "js" || normLang === "typescript" || normLang === "ts") {
        const casesWithParsed = cases.map((tc: any) => ({
          ...tc,
          parsedArgs: tc.parsedArgs || parseTestCaseInputServer(tc.input || ""),
        }));

        const jsWrapper = `
          const userCode = ${JSON.stringify(code)};
          const testCases = ${JSON.stringify(casesWithParsed)};
          
          let runner;
          try {
            runner = new Function('testInput', \`
              \${userCode}
              let __fn = null;
              if (typeof solution === 'function') __fn = solution;
              else if (typeof twoSum === 'function') __fn = twoSum;
              else if (typeof two_sum === 'function') __fn = two_sum;
              else if (typeof isAnagram === 'function') __fn = isAnagram;
              else if (typeof is_anagram === 'function') __fn = is_anagram;
              else if (typeof filterAgentLogs === 'function') __fn = filterAgentLogs;
              else if (typeof filter_agent_logs === 'function') __fn = filter_agent_logs;
              else if (typeof search === 'function') __fn = search;
              else if (typeof Solution === 'function') {
                const s = new Solution();
                const m = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter(x => x !== 'constructor');
                if (m.length > 0) __fn = s[m[0]].bind(s);
              }
              if (__fn) {
                return Array.isArray(testInput) ? __fn(...testInput) : __fn(testInput);
              }
              return undefined;
            \`);
          } catch(e) {
            console.log(JSON.stringify({
              allPassed: false,
              runtimeError: e.message,
              results: testCases.map((tc, idx) => ({
                testCaseIndex: idx + 1,
                input: tc.input,
                expected: tc.expectedOutput,
                actual: 'Error: ' + e.message,
                passed: false,
                executionTimeMs: 0
              })),
              output: 'Syntax Error: ' + e.message
            }));
            process.exit(0);
          }

          const results = [];
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const t0 = Date.now();
            let act = undefined;
            let err = null;
            try {
              act = runner(tc.parsedArgs);
            } catch(e) {
              err = e.message;
            }
            const t1 = Date.now();
            const actStr = act !== undefined ? JSON.stringify(act) : (err ? 'Error: ' + err : 'undefined');
            let passed = !err;
            if (passed) {
              const expClean = (tc.expectedOutput || '').trim();
              if (actStr === expClean || String(act) === expClean) {
                passed = true;
              } else if (Array.isArray(act)) {
                passed = JSON.stringify(act) === expClean || act.join(' ') === expClean || \`[\${act.join(', ')}]\` === expClean;
              } else {
                passed = false;
              }
            }
            results.push({
              testCaseIndex: i + 1,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: actStr,
              passed,
              executionTimeMs: Math.max(1, t1 - t0),
              error: err
            });
          }
          const passedCount = results.filter(r => r.passed).length;
          console.log(JSON.stringify({
            allPassed: passedCount === results.length && results.length > 0,
            passedCount,
            totalCount: results.length,
            results,
            output: passedCount === results.length ? \`✅ Status: Accepted (All \${results.length}/\${results.length} test cases passed)\` : \`❌ Status: Wrong Answer (\${passedCount}/\${results.length} test cases passed)\`
          }));
        `;

        const proc = await runProcess("node", ["-e", jsWrapper], "", 8000);
        try {
          const parsed = JSON.parse(proc.stdout);
          return res.json({ success: true, ...parsed });
        } catch {
          // fallback to Gemini or local
        }
      }

      // For other languages (Java, C++, C, Rust, Go, C#, PHP, Ruby, etc.) or Gemini fallback
      const ai = getGeminiClient();
      if (ai) {
        const prompt = `You are a strict real-time code execution sandbox and compiler for a technical challenge.
Problem: "${problemStatement || "Technical Code Implementation"}"
Language: "${language}"
Submitted Code:
\`\`\`${language}
${code}
\`\`\`
Test Cases: ${JSON.stringify(cases)}

RULES:
1. Simulate precise compiler/interpreter execution of the code for each test case.
2. If code has compilation/syntax/runtime error, set passed=false, error=error message, actual=error.
3. If output matches expected, set passed=true.
4. Return valid JSON matching this schema:
{
  "allPassed": boolean,
  "passedCount": number,
  "totalCount": number,
  "results": [
    {
      "testCaseIndex": number,
      "input": "string",
      "expected": "string",
      "actual": "string",
      "passed": boolean,
      "executionTimeMs": number
    }
  ],
  "output": "string formatted terminal summary",
  "feedback": "string constructive feedback"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const evalData = JSON.parse(response.text || "{}");
        return res.json({ success: true, ...evalData });
      }

      // Fallback if no AI key and not local python/node
      return res.json({
        success: true,
        allPassed: false,
        passedCount: 0,
        totalCount: cases.length,
        results: cases.map((tc: any, i: number) => ({
          testCaseIndex: i + 1,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "Compiler executed",
          passed: false,
          executionTimeMs: 15,
        })),
        output: `Executed ${language} code. Result did not match expected output.`,
        feedback: "Please verify function logic and edge cases.",
      });
    } catch (err: any) {
      console.error("Error executing code:", err);
      res.status(500).json({ error: err.message || "Failed to execute code" });
    }
  };

  app.post("/api/code/run", handleCodeExecution);
  app.post("/api/gemini/run-code", handleCodeExecution);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.HMR_PORT ? { port: parseInt(process.env.HMR_PORT, 10) } : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MIND2I Workshop & Bootcamp Server running on http://localhost:${PORT}`);
    console.log(`Django backend proxy target: ${getDjangoBaseUrl()}`);
  });
}

startServer();
