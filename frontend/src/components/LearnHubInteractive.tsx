import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearnHubModule,
  LearnHubSlide,
  LearnHubTag,
  LearnHubTagQuestion,
  TagQuestionType,
  LearnHubParagraph,
  BottomTag,
  UserRole,
  Batch,
  Student,
  LearnHubSourceFile,
} from "../types";
import mammoth from "mammoth";
import JSZip from "jszip";
import { initialLearnHubModule, initialLearnHubModules } from "../data/initialData";
import {
  Brain,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Upload,
  Plus,
  Edit3,
  ExternalLink,
  Lightbulb,
  FileText,
  HelpCircle,
  Flame,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Layers,
  Award,
  Zap,
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  RefreshCw,
  Tag as TagIcon,
  FileUp,
  Copy,
  ArrowLeft,
  ArrowRight,
  MoveLeft,
  MoveRight,
  FolderPlus,
  Sliders,
  CheckCheck,
  Compass,
  GripVertical,
  MousePointerClick,
  BarChart3,
  CheckSquare,
  AlignLeft,
  ToggleLeft,
  Send,
  ThumbsUp,
  ThumbsDown,
  Search,
  Lock,
  Unlock,
  Maximize2,
  Shrink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

export const DEFAULT_TAG_PRESETS: LearnHubTag[] = [
  {
    id: "tag_llm",
    term: "LLM",
    cssClass: "llm",
    icon: "🧠",
    type: "Concept Definition + Multi-Type Interactive Quiz",
    definition:
      "An LLM (Large Language Model) is a type of artificial intelligence trained on massive amounts of text data to understand, summarize, translate, and generate human-like language.",
    questions: [
      {
        type: "mcq",
        question: "What does LLM stand for in artificial intelligence?",
        A: "Large Language Model",
        B: "Local Logic Machine",
        C: "Language Learning Module",
        correct: "A",
        explanation: "LLM stands for Large Language Model.",
      },
      {
        type: "true_false",
        question: "True or False: LLMs can only process static tables and cannot parse natural human language.",
        correct: "False",
        explanation: "False! LLMs are pre-trained on internet-scale natural language text corpora.",
      },
      {
        type: "poll",
        question: "Which LLM agent capability are you most excited to build in this workshop?",
        pollOptions: [
          "Autonomous Coding & Tool Calling",
          "Real-time Multimodal Voice/Vision",
          "Enterprise RAG & Private Search",
          "Autonomous Multi-Agent Swarms"
        ],
        pollVotes: [38, 28, 22, 12],
        explanation: "All 4 capabilities are core pillars of agent engineering.",
      },
      {
        type: "short_answer",
        question: "In your own words, what role does an LLM play in an agent architecture?",
        sampleAnswer: "The central cognitive brain / reasoning engine that plans actions and makes decisions.",
        explanation: "The LLM serves as the cognitive brain of the agent system.",
      },
    ],
  },
  {
    id: "tag_api",
    term: "APIs or functions",
    cssClass: "api",
    icon: "🔌",
    type: "Tool Integration + Multi-Format Quiz",
    definition:
      "APIs (Application Programming Interfaces) and callable functions allow AI agents to interact with external tools, query databases, send messages, and execute real-world digital actions.",
    questions: [
      {
        type: "mcq",
        question: "Why do AI agents need APIs or tool functions?",
        A: "To take digital actions and execute external tasks",
        B: "To make fonts larger",
        C: "To replace the need for an LLM",
        correct: "A",
        explanation: "APIs empower agents to act on the external world.",
      },
      {
        type: "true_false",
        question: "True or False: Function calling allows LLMs to produce structured arguments to invoke APIs.",
        correct: "True",
        explanation: "True! Modern LLMs natively emit validated JSON arguments for tool execution.",
      },
      {
        type: "poll",
        question: "What is the most frequent tool integration in your AI agents?",
        pollOptions: [
          "Database / Cloud Storage queries",
          "Communication (Email, Slack, SMS)",
          "Web Search & Live Browsing",
          "Custom Internal API Microservices"
        ],
        pollVotes: [32, 28, 25, 15],
        explanation: "Combining multiple APIs unlocks full agent autonomy.",
      },
    ],
  },
  {
    id: "tag_nexos",
    term: "Nexos.ai",
    cssClass: "nexos",
    icon: "🚀",
    type: "Platform Overview + Multi-Format Quiz",
    definition:
      "Nexos.ai is an enterprise AI platform that enables developers and teams to build, orchestrate, test, and deploy intelligent agents and autonomous workflows without friction.",
    questions: [
      {
        type: "mcq",
        question: "What is Nexos.ai primarily used for?",
        A: "Deploying and managing AI agents & workflows",
        B: "Playing video games",
        C: "Formatting physical paper",
        correct: "A",
        explanation: "Nexos.ai is designed for AI agent orchestration.",
      },
      {
        type: "true_false",
        question: "True or False: Nexos.ai provides infrastructure for monitoring agent execution traces.",
        correct: "True",
        explanation: "True! Nexos.ai delivers real-time observability and governance.",
      },
    ],
  },
  {
    id: "tag_crewai",
    term: "CrewAI",
    cssClass: "crewai",
    icon: "🤖",
    type: "Multi-Agent System + Multi-Format Quiz",
    definition:
      "CrewAI is a powerful Python framework for orchestrating role-playing autonomous AI agents that collaborate in teams to tackle complex multi-step workflows.",
    questions: [
      {
        type: "mcq",
        question: "What distinguishes CrewAI from single-prompt chatbots?",
        A: "Multi-agent role-playing collaboration",
        B: "Only supports simple arithmetic",
        C: "Does not use language models",
        correct: "A",
        explanation: "CrewAI orchestrates teams of agents with specialized roles.",
      },
      {
        type: "true_false",
        question: "True or False: In CrewAI, agents can delegate tasks to each other dynamically.",
        correct: "True",
        explanation: "True! Task delegation between specialized agents is a signature CrewAI pattern.",
      },
      {
        type: "poll",
        question: "Have you built or deployed a multi-agent system before today?",
        pollOptions: [
          "Yes, regularly in production",
          "Tested experimental tutorials",
          "First time learning today!"
        ],
        pollVotes: [22, 45, 33],
        explanation: "CrewAI makes multi-agent coordination straightforward for all skill levels.",
      },
    ],
  },
  {
    id: "tag_rag",
    term: "RAG & Vector Search",
    cssClass: "database",
    icon: "🔍",
    type: "Retrieval Ingestion + Multi-Format Quiz",
    definition:
      "Retrieval-Augmented Generation (RAG) grounds agent generation by searching and injecting relevant proprietary documents from vector embeddings.",
    questions: [
      {
        type: "mcq",
        question: "What is the primary benefit of RAG?",
        A: "Injects factual context and prevents hallucinations",
        B: "Makes the prompt longer without reason",
        C: "Replaces the need for code",
        correct: "A",
        explanation: "RAG retrieves precise semantic matches from private knowledge.",
      },
      {
        type: "true_false",
        question: "True or False: RAG retrieves facts from external knowledge stores at inference time without requiring model retraining.",
        correct: "True",
        explanation: "True! RAG queries live vector indices on each prompt request.",
      },
    ],
  },
];

export interface TagAttempt {
  studentId: string;
  studentName: string;
  avatar?: string;
  batchId: string;
  moduleId: string;
  tagId: string;
  answers: Record<number, string>;
  score: number;
  totalQuestions: number;
  isCorrect: boolean;
  isCompleted: boolean;
  submittedAt: string;
  responseTimeMs?: number;
}

// 100% Real-Time Analytics based on actual student quiz attempts
function getRealAnalyticsForSlide(
  slide: LearnHubSlide | null,
  module: LearnHubModule,
  students: Student[] = [],
  tagAttempts: Record<string, TagAttempt> = {}
) {
  const rawTags: LearnHubTag[] = [];
  
  const paragraphs = slide ? slide.paragraphs : module.paragraphs || [];
  paragraphs.forEach((p) => {
    if (p.highlight) rawTags.push(p.highlight);
  });

  const bottomTags = slide ? slide.bottomTags : module.bottomTags || [];
  bottomTags?.forEach((bt) => {
    if (bt.tag) {
      // Find the tag from the slide's paragraphs first, then module
      let foundTag = paragraphs.find(p => p.highlight?.id === bt.tag || p.highlight?.term?.toLowerCase() === bt.tag.toLowerCase())?.highlight;
      if (!foundTag && module.paragraphs) {
        foundTag = module.paragraphs.find(p => p.highlight?.id === bt.tag || p.highlight?.term?.toLowerCase() === bt.tag.toLowerCase())?.highlight;
      }
      if (!foundTag && module.slides) {
        for (const s of module.slides) {
          foundTag = s.paragraphs.find(p => p.highlight?.id === bt.tag || p.highlight?.term?.toLowerCase() === bt.tag.toLowerCase())?.highlight;
          if (foundTag) break;
        }
      }
      if (foundTag) {
        rawTags.push(foundTag);
      }
    }
  });

  // Deduplicate strictly by normalized term name (e.g. "python", "software")
  const uniqueTagsMap = new Map<string, { tag: LearnHubTag; allTagIds: Set<string> }>();

  rawTags.forEach((t) => {
    if (!t || !t.term) return;
    const termKey = t.term.trim().toLowerCase();
    if (!termKey) return;

    if (!uniqueTagsMap.has(termKey)) {
      uniqueTagsMap.set(termKey, {
        tag: { ...t },
        allTagIds: new Set([t.id, t.term, termKey]),
      });
    } else {
      const existing = uniqueTagsMap.get(termKey)!;
      existing.allTagIds.add(t.id);
      existing.allTagIds.add(t.term);
      // If existing tag has no questions but current tag has questions, take them
      if ((!existing.tag.questions || existing.tag.questions.length === 0) && t.questions && t.questions.length > 0) {
        existing.tag.questions = t.questions;
      }
    }
  });

  // Filter to unique tags that have quiz questions
  const quizTagsWithIds = Array.from(uniqueTagsMap.values())
    .filter(({ tag }) => tag.questions && tag.questions.length > 0);

  const studentIdSet = new Set(students.map(s => s.id));

  return quizTagsWithIds.map(({ tag, allTagIds }) => {
    // Filter attempts for this specific module, tag (matching any of its IDs or term), and batch students
    const matchingAttempts = Object.values(tagAttempts).filter(att => {
      const matchTag = allTagIds.has(att.tagId) || 
                       allTagIds.has(att.tagId?.toLowerCase()) || 
                       (att.tagId && att.tagId.toLowerCase().includes(tag.term.toLowerCase()));
      const matchModule = !att.moduleId || att.moduleId === module.id;
      const matchBatch = !att.batchId || (module.batchId && att.batchId === module.batchId) || studentIdSet.has(att.studentId);
      return matchTag && matchModule && matchBatch;
    });

    // Group by studentId to take the latest attempt per student
    const studentAttemptsMap = new Map<string, TagAttempt>();
    matchingAttempts.forEach(att => {
      const existing = studentAttemptsMap.get(att.studentId);
      if (!existing || new Date(att.submittedAt).getTime() > new Date(existing.submittedAt).getTime()) {
        studentAttemptsMap.set(att.studentId, att);
      }
    });

    const attemptsForTag = Array.from(studentAttemptsMap.values());

    const attended = attemptsForTag.map(a => a.studentName);
    const results = attemptsForTag.map(a => ({
      student: a.studentName,
      isCorrect: a.isCorrect,
      score: a.score,
      total: a.totalQuestions,
      submittedAt: a.submittedAt,
    }));

    const correctCount = attemptsForTag.filter(r => r.isCorrect).length;
    const incorrectCount = attemptsForTag.length - correctCount;

    return { tag, attended, results, correctCount, incorrectCount };
  });
}

const AdminQuizAnalytics: React.FC<{ 
  slide: LearnHubSlide | null, 
  module: LearnHubModule, 
  students: Student[],
  tagAttempts: Record<string, TagAttempt> 
}> = ({ slide, module, students, tagAttempts }) => {
  const analytics = React.useMemo(() => getRealAnalyticsForSlide(slide, module, students, tagAttempts), [slide, module, students, tagAttempts]);
  const [selectedCardIdx, setSelectedCardIdx] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<"all" | "correct" | "incorrect">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  if (analytics.length === 0) return null;

  const selectedCard = selectedCardIdx !== null ? analytics[selectedCardIdx] : null;
  const filteredResults = selectedCard?.results.filter(r => {
    if (filter === "correct" && !r.isCorrect) return false;
    if (filter === "incorrect" && r.isCorrect) return false;
    if (searchQuery && !r.student.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Admin Quiz Analytics</h3>
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold ml-2">
          {analytics.length} active quizzes
        </span>
        <span className="text-xs text-slate-400 font-medium ml-auto">
          🟢 Live real-time student telemetry
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.map((stat, idx) => (
          <div 
            key={idx} 
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            onClick={() => {
              setSelectedCardIdx(idx);
              setFilter("all");
              setSearchQuery("");
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{stat.tag.icon}</span>
                <h4 className="font-bold text-slate-800 text-sm truncate" title={stat.tag.term}>
                  {stat.tag.term}
                </h4>
              </div>
              <div className="text-slate-400 bg-slate-50 p-1.5 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900">{stat.attended.length}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attended</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-600">{stat.correctCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-rose-500">{stat.incorrectCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Incorrect</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-indigo-100">
                  {selectedCard.tag.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedCard.tag.term}</h3>
                  <p className="text-sm font-medium text-slate-500">Detailed Live Analytics & Student Performance</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCardIdx(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                  <div className="text-4xl font-black text-slate-900 mb-1">{selectedCard.attended.length}</div>
                  <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Attended</div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                  <div className="text-4xl font-black text-emerald-600 mb-1">{selectedCard.correctCount}</div>
                  <div className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Total Correct</div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100">
                  <div className="text-4xl font-black text-rose-500 mb-1">{selectedCard.incorrectCount}</div>
                  <div className="text-xs uppercase font-bold text-rose-700 tracking-wider">Total Incorrect</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800">Student Results</h4>
                {selectedCard.results.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setFilter("all")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        All ({selectedCard.results.length})
                      </button>
                      <button 
                        onClick={() => setFilter("correct")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === "correct" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        Correct ({selectedCard.correctCount})
                      </button>
                      <button 
                        onClick={() => setFilter("incorrect")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === "incorrect" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        Incorrect ({selectedCard.incorrectCount})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedCard.results.length > 0 ? (
                filteredResults && filteredResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                            {r.student.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 block">{r.student}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Score: {r.score}/{r.total}</span>
                          </div>
                        </div>
                        {r.isCorrect ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No student results match the filter.
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    📊
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm mb-1">No Student Submissions Yet</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When students in this batch answer this interactive concept quiz, their live attendance, accuracy, and scores will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


interface LearnHubInteractiveProps {
  modules?: LearnHubModule[];
  module?: LearnHubModule;
  selectedBatch?: Batch;
  userRole: UserRole;
  currentStudent?: Student;
  students?: Student[];
  onUpdateModules?: (updated: LearnHubModule[]) => void;
  onUpdateModule?: (updated: LearnHubModule) => void;
}

interface PptxVisualSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  badge?: string;
  textLines: string[];
  bullets?: string[];
  highlights?: string[];
  images: string[]; // blob URLs for images belonging to this slide
  bgImageUrl?: string; // background image blob URL if present
}

const ExtractedDocumentViewer: React.FC<{
  file: LearnHubSourceFile;
  module?: LearnHubModule;
}> = ({ file, module }) => {
  const [slides, setSlides] = useState<PptxVisualSlide[]>([]);
  const [docHtml, setDocHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const blobUrlsRef = React.useRef<string[]>([]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {
          /* ignore */
        }
      });
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const parseFile = async () => {
      setLoading(true);

      const fileName = file?.name || "";
      const isDoc = fileName.match(/\.(docx|doc)$/i);
      const isPpt =
        fileName.match(/\.(pptx|ppt)$/i) ||
        file?.type?.toLowerCase().includes("presentation") ||
        file?.type?.toLowerCase().includes("pptx");

      let buffer: ArrayBuffer | null = null;

      // 1. Try to fetch arrayBuffer if previewUrl exists
      if (file?.previewUrl) {
        try {
          const cleanUrl = file.previewUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, "");
          const response = await fetch(cleanUrl);
          if (response.ok) {
            buffer = await response.arrayBuffer();
          }
        } catch (fetchErr) {
          console.warn("Could not fetch file previewUrl, falling back to structured presentation generation:", fetchErr);
        }
      }

      // 2. Handle DOCX files
      if (isDoc) {
        if (buffer) {
          try {
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            if (!isCancelled) {
              setDocHtml(result.value);
              setLoading(false);
              return;
            }
          } catch (mErr) {
            console.warn("Mammoth conversion error:", mErr);
          }
        }
        // Fallback for doc
        if (!isCancelled) {
          const fallbackDoc =
            module?.paragraphs
              ?.map(
                (p) =>
                  `<p>${p.textBefore || ""}${p.highlight ? `<strong>${p.highlight.term}</strong>` : ""}${p.textAfter || ""}</p>`
              )
              .join("") || `<p>${module?.subtitle || "Document preview"}</p>`;
          setDocHtml(`<h2>${module?.title || fileName}</h2>${fallbackDoc}`);
          setLoading(false);
          return;
        }
      }

      // 3. Handle PPTX Presentation files
      if (isPpt || true) {
        // Attempt JSZip parsing if buffer is available
        if (buffer) {
          try {
            const zip = await JSZip.loadAsync(buffer);

            // Extract ALL media images from ppt/media/
            const mediaMap: Record<string, string> = {};
            const mediaEntries = Object.keys(zip.files).filter(
              (n) => /^ppt\/media\//i.test(n) && !zip.files[n].dir
            );
            for (const mediaPath of mediaEntries) {
              const blob = await zip.file(mediaPath)!.async("blob");
              const ext = mediaPath.split(".").pop()?.toLowerCase() || "png";
              const mimeType =
                ext === "jpg" || ext === "jpeg"
                  ? "image/jpeg"
                  : ext === "png"
                  ? "image/png"
                  : ext === "gif"
                  ? "image/gif"
                  : ext === "svg"
                  ? "image/svg+xml"
                  : ext === "webp"
                  ? "image/webp"
                  : "image/png";
              const typedBlob = new Blob([blob], { type: mimeType });
              const blobUrl = URL.createObjectURL(typedBlob);
              mediaMap[mediaPath] = blobUrl;
              const justName = mediaPath.split("/").pop() || "";
              mediaMap[justName] = blobUrl;
              blobUrlsRef.current.push(blobUrl);
            }

            // Find all slide XML files and sort them
            const slideFiles = Object.keys(zip.files).filter((name) =>
              /^ppt\/slides\/slide\d+\.xml$/i.test(name)
            );
            slideFiles.sort((a, b) => {
              const numA = parseInt(a.match(/\d+/)![0] || "0");
              const numB = parseInt(b.match(/\d+/)![0] || "0");
              return numA - numB;
            });

            if (slideFiles.length > 0) {
              const parsedSlides: PptxVisualSlide[] = await Promise.all(
                slideFiles.map(async (slidePath, sIdx) => {
                  const slideNum = parseInt(slidePath.match(/\d+/)![0] || String(sIdx + 1));

                  // Parse relationships file to map rIds to media
                  const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
                  const rIdToMedia: Record<string, string> = {};
                  const relsFile = zip.file(relsPath);
                  if (relsFile) {
                    const relsXml = await relsFile.async("text");
                    const relsDoc = new DOMParser().parseFromString(relsXml, "application/xml");
                    const rels = relsDoc.getElementsByTagName("Relationship");
                    for (let r = 0; r < rels.length; r++) {
                      const rel = rels[r];
                      const rType = rel.getAttribute("Type") || "";
                      const rTarget = rel.getAttribute("Target") || "";
                      const rId = rel.getAttribute("Id") || "";
                      if (rType.includes("/image") || rType.includes("/media")) {
                        const resolvedPath = "ppt/" + rTarget.replace(/^\.\.\//, "");
                        const justName = rTarget.split("/").pop() || "";
                        const blobUrl = mediaMap[resolvedPath] || mediaMap[justName];
                        if (blobUrl) {
                          rIdToMedia[rId] = blobUrl;
                        }
                      }
                    }
                  }

                  // Parse slide XML for text and image references
                  const xml = await zip.file(slidePath)!.async("text");
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(xml, "application/xml");

                  // Extract text
                  const pNodes = doc.getElementsByTagName("a:p");
                  const rawText: string[] = [];
                  for (let i = 0; i < pNodes.length; i++) {
                    const tNodes = pNodes[i].getElementsByTagName("a:t");
                    let lineText = "";
                    for (let j = 0; j < tNodes.length; j++) {
                      lineText += tNodes[j].textContent || "";
                    }
                    if (lineText.trim()) {
                      rawText.push(lineText.trim());
                    }
                  }

                  // Extract image rIds referenced in this slide
                  const slideImages: string[] = [];
                  const blipNodes = doc.getElementsByTagName("a:blip");
                  for (let b = 0; b < blipNodes.length; b++) {
                    const embedId =
                      blipNodes[b].getAttribute("r:embed") ||
                      blipNodes[b].getAttributeNS(
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                        "embed"
                      ) ||
                      "";
                    if (embedId && rIdToMedia[embedId]) {
                      slideImages.push(rIdToMedia[embedId]);
                    }
                  }

                  // Background image check
                  let bgImageUrl: string | undefined;
                  const bgElements = doc.getElementsByTagName("p:bg");
                  if (bgElements.length > 0) {
                    const bgBlipNodes = bgElements[0].getElementsByTagName("a:blip");
                    if (bgBlipNodes.length > 0) {
                      const bgRid =
                        bgBlipNodes[0].getAttribute("r:embed") ||
                        bgBlipNodes[0].getAttributeNS(
                          "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                          "embed"
                        ) ||
                        "";
                      if (bgRid && rIdToMedia[bgRid]) {
                        bgImageUrl = rIdToMedia[bgRid];
                      }
                    }
                  }

                  const title = rawText.length > 0 ? rawText[0] : `Slide ${sIdx + 1}`;
                  const bullets = rawText.slice(1);

                  return {
                    slideNumber: sIdx + 1,
                    title,
                    subtitle: bullets.length > 0 ? bullets[0] : undefined,
                    badge: `SLIDE ${sIdx + 1} OF ${slideFiles.length}`,
                    textLines: rawText,
                    bullets,
                    images: slideImages,
                    bgImageUrl,
                  };
                })
              );

              if (!isCancelled && parsedSlides.length > 0) {
                setSlides(parsedSlides);
                setLoading(false);
                return;
              }
            }
          } catch (pptZipErr) {
            console.warn("PPTX zip parse error, falling back to rich structured deck:", pptZipErr);
          }
        }

        // 4. Robust presentation slide generator from module.slides or module.paragraphs
        if (module && module.slides && module.slides.length > 0) {
          const generatedSlides: PptxVisualSlide[] = module.slides.map((s, idx) => {
            const lines: string[] = [];
            const highlights: string[] = [];
            if (s.paragraphs && s.paragraphs.length > 0) {
              s.paragraphs.forEach((p) => {
                const fullText = `${p.textBefore || ""}${p.highlight ? p.highlight.term : ""}${p.textAfter || ""}`.trim();
                if (fullText) lines.push(fullText);
                if (p.highlight?.term) highlights.push(p.highlight.term);
              });
            } else if (module.subtitle) {
              lines.push(module.subtitle);
            }

            return {
              slideNumber: idx + 1,
              title: s.title || `Slide ${idx + 1}: ${module.title}`,
              subtitle: s.subtitle || (idx === 0 ? module.subtitle : undefined),
              badge: s.badge || `SLIDE ${idx + 1} • CORE CONCEPTS`,
              textLines: lines,
              bullets: lines,
              highlights,
              images: [],
            };
          });

          if (!isCancelled) {
            setSlides(generatedSlides);
            setLoading(false);
            return;
          }
        }

        // Fallback using module paragraphs
        if (module && module.paragraphs && module.paragraphs.length > 0) {
          const paras = module.paragraphs;
          const slide1Bullets = paras
            .slice(0, 2)
            .map((p) => `${p.textBefore || ""}${p.highlight ? p.highlight.term : ""}${p.textAfter || ""}`.trim());
          const slide2Bullets = paras
            .slice(2, 5)
            .map((p) => `${p.textBefore || ""}${p.highlight ? p.highlight.term : ""}${p.textAfter || ""}`.trim());
          const highlights = paras.map((p) => p.highlight?.term).filter(Boolean) as string[];

          const generated: PptxVisualSlide[] = [
            {
              slideNumber: 1,
              title: module.title || file?.name?.replace(/\.[^/.]+$/, "") || "Presentation Overview",
              subtitle: module.subtitle || "Masterclass & Interactive Bootcamp Slide Deck",
              badge: module.badge || "SLIDE 1 • OVERVIEW",
              textLines: slide1Bullets,
              bullets: slide1Bullets,
              highlights: highlights.slice(0, 2),
              images: [],
            },
            {
              slideNumber: 2,
              title: "Core Architecture & Key Concepts",
              subtitle: "Foundational workflow patterns and architectural models",
              badge: "SLIDE 2 • ARCHITECTURE",
              textLines: slide2Bullets.length > 0 ? slide2Bullets : slide1Bullets,
              bullets: slide2Bullets.length > 0 ? slide2Bullets : slide1Bullets,
              highlights: highlights.slice(2, 5),
              images: [],
            },
            {
              slideNumber: 3,
              title: "Implementation & Learning Insights",
              subtitle: "Best practices and live execution guidelines",
              badge: "SLIDE 3 • SUMMARY",
              textLines: [
                "Understand the primary system components and data pipeline.",
                "Review interactive definitions and verify understanding with assessment quizzes.",
                "Apply structured knowledge to coding challenges and live practice tasks.",
              ],
              bullets: [
                "Understand the primary system components and data pipeline.",
                "Review interactive definitions and verify understanding with assessment quizzes.",
                "Apply structured knowledge to coding challenges and live practice tasks.",
              ],
              highlights: highlights.slice(0, 3),
              images: [],
            },
          ];

          if (!isCancelled) {
            setSlides(generated);
            setLoading(false);
            return;
          }
        }

        // Final default slide deck
        if (!isCancelled) {
          setSlides([
            {
              slideNumber: 1,
              title: file?.name
                ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
                : "Presentation Deck",
              subtitle: module?.title || "MIND2I Interactive Training Workshop",
              badge: "SLIDE 1 • PRESENTATION",
              textLines: [
                module?.subtitle || "Comprehensive course presentation and workshop lecture deck.",
              ],
              bullets: [
                module?.subtitle || "Comprehensive course presentation and workshop lecture deck.",
                "Click Next to navigate through the presentation slides.",
                "Explore highlighted terminology and interactive quizzes.",
              ],
              images: [],
            },
          ]);
          setLoading(false);
        }
      }
    };

    parseFile();
    return () => {
      isCancelled = true;
    };
  }, [file, module]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentSlideIndex((p) => Math.max(0, p - 1));
      else if (e.key === "ArrowRight")
        setCurrentSlideIndex((p) => Math.min(slides.length - 1, p + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 w-full h-full bg-slate-950">
        <Layers className="w-14 h-14 mb-4 animate-pulse text-indigo-400" />
        <p className="text-white font-bold text-sm">Rendering Presentation…</p>
        <p className="text-slate-500 text-xs mt-1">Preparing presentation slides & visuals</p>
      </div>
    );
  }

  // ─── DOCX viewer ───
  if (file?.name?.match(/\.(docx|doc)$/i)) {
    return (
      <div className="w-full h-full bg-slate-100 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white shadow-xl min-h-[800px] p-8 sm:p-12 text-slate-800 border border-slate-200 rounded-2xl">
          <h1 className="text-2xl sm:text-3xl font-black mb-8 border-b border-slate-200 pb-4 text-center text-slate-900">
            {file?.name || "Document"}
          </h1>
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: docHtml }} />
        </div>
      </div>
    );
  }

  // ─── PPTX Visual Slide Viewer ───
  const safeIdx = Math.min(Math.max(0, currentSlideIndex), Math.max(0, slides.length - 1));
  const activeSlide = slides[safeIdx] || {
    slideNumber: 1,
    title: file?.name || "Presentation",
    textLines: [],
    images: [],
  };
  const hasImages = activeSlide.images.length > 0 || !!activeSlide.bgImageUrl;
  const isTitleSlide = safeIdx === 0;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 select-none">
      {/* ── Top Bar ── */}
      <div className="h-11 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-800 shrink-0 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">
            PPTX DECK
          </span>
          <span className="text-white font-bold truncate max-w-[300px]">
            {file?.name || "Presentation"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px]">
            Slide {safeIdx + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* ── Slide Canvas ── */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-slate-950">
        <div
          className="w-full max-w-5xl aspect-[16/9] relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between"
          style={{
            background: hasImages
              ? "#0a0f1d"
              : isTitleSlide
              ? "linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)"
              : "linear-gradient(145deg, #0b0f19 0%, #111a2e 50%, #0d1322 100%)",
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Background image if present */}
          {activeSlide.bgImageUrl && (
            <img
              src={activeSlide.bgImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Single Main Slide Graphic */}
          {!activeSlide.bgImageUrl && activeSlide.images.length === 1 && (
            <img
              src={activeSlide.images[0]}
              alt={`Slide ${activeSlide.slideNumber}`}
              className="absolute inset-0 w-full h-full object-contain bg-slate-950"
            />
          )}

          {/* Multiple images grid */}
          {!activeSlide.bgImageUrl && activeSlide.images.length > 1 && (
            <div
              className={`absolute inset-0 p-6 flex flex-wrap items-center justify-center gap-4 ${
                activeSlide.images.length <= 2 ? "" : "content-center"
              }`}
            >
              {activeSlide.images.map((imgUrl, imgIdx) => (
                <img
                  key={imgIdx}
                  src={imgUrl}
                  alt={`Slide ${activeSlide.slideNumber} graphic ${imgIdx + 1}`}
                  className="max-h-full object-contain rounded-xl shadow-xl border border-white/10"
                  style={{
                    maxWidth: activeSlide.images.length <= 2 ? "48%" : "45%",
                    maxHeight: activeSlide.images.length <= 2 ? "85%" : "45%",
                  }}
                />
              ))}
            </div>
          )}

          {/* Slide Top Header Bar (Internal to slide) */}
          <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm">
                {activeSlide.badge || `SLIDE ${safeIdx + 1}`}
              </span>
              {activeSlide.highlights && activeSlide.highlights.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {activeSlide.highlights.slice(0, 3).map((h, hIdx) => (
                    <span
                      key={hIdx}
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-amber-300 border border-amber-400/20"
                    >
                      ✦ {h}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-white font-mono text-xs font-bold border border-white/10 shadow-sm">
              {safeIdx + 1} / {slides.length}
            </div>
          </div>

          {/* Slide Center Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 py-4">
            {hasImages ? (
              <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 pt-12">
                <h3 className="text-white font-black text-lg sm:text-2xl drop-shadow-md">
                  {activeSlide.title}
                </h3>
                {activeSlide.textLines.length > 1 && (
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 line-clamp-2">
                    {activeSlide.textLines.slice(1, 3).join(" • ")}
                  </p>
                )}
              </div>
            ) : isTitleSlide ? (
              // Cover Slide Layout
              <div className="max-w-3xl space-y-4 animate-in fade-in">
                <div className="w-12 h-1.5 bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full" />
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {activeSlide.title}
                </h1>
                {activeSlide.subtitle && (
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                    {activeSlide.subtitle}
                  </p>
                )}
                {activeSlide.bullets && activeSlide.bullets.length > 0 && (
                  <div className="pt-3 space-y-2 max-w-2xl">
                    {activeSlide.bullets.slice(0, 2).map((b, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                      >
                        <span className="text-indigo-400 font-bold mt-0.5">▸</span>
                        <span className="line-clamp-2">{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Topic & Content Slide Layout
              <div className="w-full max-w-4xl space-y-5 animate-in fade-in">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                    {activeSlide.title}
                  </h2>
                  {activeSlide.subtitle && (
                    <p className="text-indigo-300 text-xs sm:text-sm font-semibold mt-1">
                      {activeSlide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {(activeSlide.bullets && activeSlide.bullets.length > 0
                    ? activeSlide.bullets
                    : activeSlide.textLines.slice(1)
                  ).map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm transition flex items-start gap-3.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 border border-indigo-500/30">
                        {lIdx + 1}
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slide Footer Info Bar */}
          <div className="relative z-10 px-6 sm:px-8 py-4 border-t border-white/[0.06] bg-black/20 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[280px]">
              {module?.title || "MIND2I Workshop & Bootcamp"}
            </span>
            <span className="font-mono text-slate-500">
              Use ← / → keys or buttons below to navigate
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Controls & Thumbnail Filmstrip ── */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 shrink-0 space-y-2.5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between max-w-5xl mx-auto text-xs">
          <button
            onClick={() => setCurrentSlideIndex((p) => Math.max(0, p - 1))}
            disabled={safeIdx === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-25 disabled:pointer-events-none border border-slate-700 transition font-bold cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold text-xs">
              Slide {safeIdx + 1} of {slides.length}
            </span>
          </div>

          <button
            onClick={() => setCurrentSlideIndex((p) => Math.min(slides.length - 1, p + 1))}
            disabled={safeIdx === slides.length - 1}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-25 disabled:pointer-events-none transition font-black cursor-pointer shadow-md"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Filmstrip */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-5xl mx-auto py-1 custom-scrollbar">
            {slides.map((s, idx) => {
              const active = idx === safeIdx;
              const thumbImg = s.bgImageUrl || (s.images.length > 0 ? s.images[0] : null);
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-shrink-0 w-24 sm:w-28 aspect-[16/9] rounded-xl border-2 overflow-hidden transition-all cursor-pointer relative ${
                    active
                      ? "border-indigo-500 ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20 scale-105"
                      : "border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500"
                  }`}
                  title={`Slide ${idx + 1}: ${s.title}`}
                >
                  {thumbImg ? (
                    <img src={thumbImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex flex-col justify-center items-center p-1.5 text-center">
                      <span className="text-[9px] font-black text-slate-400 truncate max-w-full block">
                        {s.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] text-white text-center py-0.5 font-black">
                    {idx + 1}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const LearnHubInteractive: React.FC<LearnHubInteractiveProps> = ({
  modules,
  module: singleModule,
  selectedBatch,
  userRole,
  currentStudent,
  students = [],
  onUpdateModules,
  onUpdateModule,
}) => {
  // -------------------------------------------------------------
  // 1. MODULE & SLIDE STATE
  // -------------------------------------------------------------
  const allModules: LearnHubModule[] =
    modules && modules.length > 0
      ? modules
      : singleModule
      ? [singleModule]
      : initialLearnHubModules;

  const batchModules = selectedBatch
    ? allModules.filter((m) => m.batchId === selectedBatch.id)
    : allModules;

  const effectiveModules = batchModules;
  const batchStudents = selectedBatch ? students.filter(s => s.batchId === selectedBatch.id) : students;

  const [activeModuleId, setActiveModuleId] = useState<string>(
    effectiveModules.length > 0 ? effectiveModules[0].id : ""
  );

  // Keep activeModuleId valid if modules change
  useEffect(() => {
    if (!effectiveModules.some((m) => m.id === activeModuleId)) {
      setActiveModuleId(effectiveModules[0]?.id || "");
    }
  }, [effectiveModules, activeModuleId]);

  const emptyPlaceholderModule: LearnHubModule = {
    id: "empty-placeholder",
    batchId: selectedBatch?.id || "",
    badge: "NO CONTENT",
    title: "No Content Found",
    subtitle: "This batch currently has no Learn Hub content.",
    slides: [],
    paragraphs: [],
    bottomTags: [],
    isPublished: true,
    createdAt: new Date().toISOString()
  };

  const currentModule: LearnHubModule =
    effectiveModules.find((m) => m.id === activeModuleId) ||
    effectiveModules[0] || 
    emptyPlaceholderModule;

  // Multi-slide management for viewer
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<LearnHubSourceFile | null>(null);
  const [isFullscreenViewer, setIsFullscreenViewer] = useState(false);

  // Reset slide index when switching modules
  useEffect(() => {
    setCurrentSlideIndex(0);
    setActivePreviewFile(null);
    setIsFullscreenViewer(false);
  }, [activeModuleId]);

  // Auto-sync viewed slide with backend student progress
  useEffect(() => {
    if (userRole !== "student" || !currentStudent?.id || !currentModule?.id) return;
    const slideNum = (currentSlide?.slideNumber !== undefined && currentSlide?.slideNumber !== null)
      ? currentSlide.slideNumber
      : (currentSlideIndex + 1);

    axios.post('/api/learnhub-progress/', {
      student: currentStudent.id,
      studentId: currentStudent.id,
      module: currentModule.id,
      moduleId: currentModule.id,
      completedSlides: [slideNum],
      masteredTags: [],
      quizScores: {},
    }).catch(() => {});
  }, [currentModule?.id, currentSlideIndex, currentStudent?.id, userRole]);

  const hasSlides = currentModule.slides && currentModule.slides.length > 0;
  const totalSlides = currentModule.slides ? currentModule.slides.length : 1;
  const hasMultipleSlides = totalSlides > 1;
  const currentSlide: LearnHubSlide | null = hasSlides
    ? currentModule.slides![currentSlideIndex] || currentModule.slides![0]
    : null;

  const activeParagraphs: LearnHubParagraph[] = currentSlide
    ? currentSlide.paragraphs
    : currentModule.paragraphs || [];

  const activeBottomTags: BottomTag[] =
    currentSlide?.bottomTags && currentSlide.bottomTags.length > 0
      ? currentSlide.bottomTags
      : currentModule.bottomTags || [];

  // Helper to commit module update to state
  const commitModuleUpdate = (updated: LearnHubModule) => {
    if (onUpdateModule) {
      onUpdateModule(updated);
    }
    if (onUpdateModules) {
      const exists = allModules.some((m) => m.id === updated.id);
      if (exists) {
        onUpdateModules(allModules.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        onUpdateModules([...allModules, updated]);
      }
    }
  };

  const commitAllModulesUpdate = (updatedList: LearnHubModule[]) => {
    if (onUpdateModules) {
      onUpdateModules(updatedList);
    }
  };

  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleModuleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const files = Array.from(e.target.files) as File[];
    
    if (!editingModule) return;

    setIsUploadingFile(true);
    const newSourceFiles: LearnHubSourceFile[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post("/api/learnhub/upload/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res.data && res.data.fileUrl) {
          newSourceFiles.push({
            name: res.data.name,
            size: res.data.size,
            type: res.data.type,
            uploadedAt: res.data.uploadedAt,
            previewUrl: res.data.previewUrl,
          });
        }
      } catch (err) {
        console.error("Backend file upload fallback to local blob:", err);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        newSourceFiles.push({
          name: file.name,
          size: `${sizeMb} MB`,
          type: file.name.endsWith(".pdf") ? "PDF Document" : file.name.endsWith(".pptx") ? "PPTX Presentation" : file.type.startsWith("image/") ? "Image" : "Document",
          uploadedAt: new Date().toISOString(),
          previewUrl: URL.createObjectURL(file)
        });
      }
    }

    setIsUploadingFile(false);
    commitModuleUpdate({
      ...editingModule,
      sourceFiles: [...(editingModule.sourceFiles || []), ...newSourceFiles]
    });
  };

  const removeModuleFile = (idxToRemove: number) => {
    if (!editingModule || !editingModule.sourceFiles) return;
    commitModuleUpdate({
      ...editingModule,
      sourceFiles: editingModule.sourceFiles.filter((_, idx) => idx !== idxToRemove)
    });
  };

  // Audio speech synthesis (read aloud)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const fullText = activeParagraphs
      .map((p) => `${p.textBefore} ${p.highlight ? p.highlight.term : ""} ${p.textAfter}`)
      .join(" ");

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 2. INTERACTIVE POPUP & QUIZ STATE
  // -------------------------------------------------------------
  const [activeTag, setActiveTag] = useState<LearnHubTag | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const [isPopupLocked, setIsPopupLocked] = useState<boolean>(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState<string>("");
  const [isBasicRevealed, setIsBasicRevealed] = useState<boolean>(false);
  const [selfAssessedResult, setSelfAssessedResult] = useState<"correct" | "review" | null>(null);
  const [pollVotesState, setPollVotesState] = useState<Record<string, number[]>>({});
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [masteredTags, setMasteredTags] = useState<Record<string, boolean>>({});

  // In-progress tag quizzes state (persists answer progress per tag so mouse leave / re-hover never loses progress)
  const [inProgressQuizzes, setInProgressQuizzes] = useState<Record<string, {
    currentQIndex: number;
    answers: Record<number, string>;
    score: number;
    isCompleted?: boolean;
    shortAnswerInput?: string;
    isBasicRevealed?: boolean;
    selfAssessedResult?: "correct" | "review" | null;
  }>>(() => {
    try {
      const stored = localStorage.getItem("learnhub_tag_inprogress");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persistent student tag quiz attempts
  const [tagAttempts, setTagAttempts] = useState<Record<string, TagAttempt>>(() => {
    try {
      const stored = localStorage.getItem("learnhub_tag_attempts");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});
  const quizStartTimeRef = useRef<number>(Date.now());

  // Fetch attempts and in-progress records from PostgreSQL backend on mount / module change
  useEffect(() => {
    if (!currentModule) return;
    axios.get(`/api/learnhub-progress/?moduleId=${currentModule.id}`)
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const fetchedAttempts: Record<string, TagAttempt> = {};
          res.data.forEach((item: any) => {
            if (item.quizScores && typeof item.quizScores === "object") {
              Object.entries(item.quizScores).forEach(([tId, att]: [string, any]) => {
                const bId = selectedBatch?.id || "batch";
                const mId = currentModule.id;
                const sId = item.studentId || item.student;
                const key = `${bId}_${mId}_${tId}_${sId}`;

                if (att && att.inProgress && sId === currentStudent?.id) {
                  setInProgressQuizzes((prev) => ({
                    ...prev,
                    [tId]: {
                      currentQIndex: att.currentQIndex || 0,
                      answers: att.answers || {},
                      score: att.score || 0,
                      isCompleted: false,
                    },
                  }));
                } else if (att && !att.inProgress) {
                  fetchedAttempts[key] = {
                    studentId: sId,
                    studentName: att.studentName || "Student",
                    avatar: att.avatar,
                    batchId: bId,
                    moduleId: mId,
                    tagId: tId,
                    answers: att.answers || {},
                    score: att.score || 0,
                    totalQuestions: att.totalQuestions || 1,
                    isCorrect: att.isCorrect ?? (att.score >= 1),
                    isCompleted: true,
                    submittedAt: att.submittedAt || new Date().toISOString(),
                    responseTimeMs: att.responseTimeMs,
                  };
                }
              });
            }
          });
          setTagAttempts((prev) => ({ ...fetchedAttempts, ...prev }));
        }
      })
      .catch((err) => console.error("Failed to load student progress from API:", err));
  }, [currentModule?.id, selectedBatch?.id, currentStudent?.id]);

  const popupRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInsidePopupRef = useRef(false);

  // Close and unlock tag popup
  const closeTagPopup = () => {
    setActiveTag(null);
    setPopupPos(null);
    setIsPopupLocked(false);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };

  // Outside click / tap listener: tap anywhere outside the popup to unlock and close
  useEffect(() => {
    if (!activeTag) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (popupRef.current && !popupRef.current.contains(target)) {
        // Also ensure click wasn't on another tag trigger
        if (!target.closest("[data-learnhub-tag]")) {
          closeTagPopup();
        }
      }
    };

    // Small delay to prevent current click event from closing immediately
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }, 60);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [activeTag]);

  const openPopupForTag = (tag: LearnHubTag, event: React.MouseEvent<HTMLElement>) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 340;
    const popupHeight = 480;

    let left = rect.left;
    let top = rect.bottom + 12;

    if (left + popupWidth > window.innerWidth - 20) {
      left = window.innerWidth - popupWidth - 20;
    }
    if (left < 10) left = 10;

    if (top + popupHeight > window.innerHeight - 20) {
      top = rect.top - popupHeight - 12;
    }
    if (top < 10) top = 10;

    setActiveTag(tag);
    setPopupPos({ top, left });
    setIsPopupLocked(true); // Automatically lock on display

    // Check if currentStudent has already submitted this assessment
    const attemptKey = currentStudent && selectedBatch
      ? `${selectedBatch.id}_${currentModule.id}_${tag.id}_${currentStudent.id}`
      : null;
    const existingAttempt = attemptKey ? tagAttempts[attemptKey] : null;

    // Check if there is an in-progress quiz for this tag
    const inProgress = inProgressQuizzes[tag.id];

    if (existingAttempt) {
      setIsAlreadySubmitted(true);
      setCurrentAnswers(existingAttempt.answers || {});
      setCurrentQIndex(0);
      setSelectedAnswer(existingAttempt.answers[0] || null);
      setScore(existingAttempt.score);
      setShortAnswerInput("");
      setIsBasicRevealed(false);
      setSelfAssessedResult(null);
      setIsCompleted(true);
    } else if (inProgress) {
      setIsAlreadySubmitted(false);
      const restoredAnswers = inProgress.answers || {};
      setCurrentAnswers(restoredAnswers);
      const restoredIdx = Math.min(inProgress.currentQIndex || 0, Math.max(0, tag.questions.length - 1));
      setCurrentQIndex(restoredIdx);
      setSelectedAnswer(restoredAnswers[restoredIdx] || null);
      setScore(inProgress.score || 0);
      setShortAnswerInput(inProgress.shortAnswerInput || "");
      setIsBasicRevealed(inProgress.isBasicRevealed || false);
      setSelfAssessedResult(inProgress.selfAssessedResult || null);
      setIsCompleted(Boolean(inProgress.isCompleted));
    } else {
      setIsAlreadySubmitted(false);
      setCurrentAnswers({});
      setCurrentQIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setShortAnswerInput("");
      setIsBasicRevealed(false);
      setSelfAssessedResult(null);
      setIsCompleted(false);
      quizStartTimeRef.current = Date.now();
    }
  };

  const handleMouseEnter = (tag: LearnHubTag, e: React.MouseEvent<HTMLElement>) => {
    openPopupForTag(tag, e);
  };

  const handleMouseLeave = () => {
    // If popup is locked, do NOT hide it on cursor mouse leave
    if (isPopupLocked) return;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isInsidePopupRef.current) {
        setActiveTag(null);
        setPopupPos(null);
      }
    }, 300);
  };

  const handlePopupMouseEnter = () => {
    isInsidePopupRef.current = true;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };

  const handlePopupMouseLeave = () => {
    isInsidePopupRef.current = false;
    // If popup is locked, do NOT hide it on cursor mouse leave
    if (isPopupLocked) return;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isInsidePopupRef.current) {
        setActiveTag(null);
        setPopupPos(null);
      }
    }, 250);
  };

  // Helper: Persist in-progress quiz progress locally and to backend
  const saveInProgressQuiz = (
    tagId: string,
    updatedAnswers: Record<number, string>,
    updatedScore: number,
    qIndex: number,
    extra?: { shortAnswerInput?: string; isBasicRevealed?: boolean; selfAssessedResult?: "correct" | "review" | null }
  ) => {
    const data = {
      currentQIndex: qIndex,
      answers: updatedAnswers,
      score: updatedScore,
      isCompleted: false,
      ...(extra || {}),
    };

    setInProgressQuizzes((prev) => {
      const next = { ...prev, [tagId]: data };
      try {
        localStorage.setItem("learnhub_tag_inprogress", JSON.stringify(next));
      } catch {}
      return next;
    });

    // Also persist in-progress attempt to Django backend
    if (currentStudent && currentStudent.id && selectedBatch && currentModule) {
      axios.post('/api/learnhub-progress/', {
        student: currentStudent.id,
        studentId: currentStudent.id,
        module: currentModule.id,
        moduleId: currentModule.id,
        completedSlides: [currentSlide?.slideNumber || (currentSlideIndex + 1)],
        masteredTags: [],
        quizScores: {
          [tagId]: {
            studentId: currentStudent.id,
            tagId,
            answers: updatedAnswers,
            score: updatedScore,
            currentQIndex: qIndex,
            inProgress: true,
            updatedAt: new Date().toISOString(),
          },
        },
      }).catch((err) => console.error("Error persisting in-progress tag quiz to API:", err));
    }
  };

  // 1. Select MCQ Answer
  const handleSelectMCQ = (choice: "A" | "B" | "C" | "D") => {
    if (selectedAnswer || isAlreadySubmitted || !activeTag) return;
    const currentQ = activeTag.questions[currentQIndex];
    const isCorrect = choice === currentQ.correct;
    const newAnswers = { ...currentAnswers, [currentQIndex]: choice };
    const newScore = isCorrect ? score + 1 : score;
    setSelectedAnswer(choice);
    setCurrentAnswers(newAnswers);
    if (isCorrect) {
      setScore(newScore);
    }
    saveInProgressQuiz(activeTag.id, newAnswers, newScore, currentQIndex);
  };

  // 2. Select True / False Answer
  const handleSelectTrueFalse = (choice: "True" | "False") => {
    if (selectedAnswer || isAlreadySubmitted || !activeTag) return;
    const currentQ = activeTag.questions[currentQIndex];
    const correctVal = currentQ.correct || "True";
    const isCorrect = choice.toLowerCase() === correctVal.toLowerCase();
    const newAnswers = { ...currentAnswers, [currentQIndex]: choice };
    const newScore = isCorrect ? score + 1 : score;
    setSelectedAnswer(choice);
    setCurrentAnswers(newAnswers);
    if (isCorrect) {
      setScore(newScore);
    }
    saveInProgressQuiz(activeTag.id, newAnswers, newScore, currentQIndex);
  };

  // 3. Vote in Poll
  const handleVotePoll = (optionIdx: number, optionText: string) => {
    if (selectedAnswer || isAlreadySubmitted || !activeTag) return;
    const pollKey = `${activeTag.id}_q${currentQIndex}`;
    const currentQ = activeTag.questions[currentQIndex];
    const baseVotes = currentQ.pollVotes || [40, 30, 20, 10];
    const currentVotes = pollVotesState[pollKey] || [...baseVotes];
    
    // Add vote
    const updated = [...currentVotes];
    if (updated[optionIdx] !== undefined) {
      updated[optionIdx] += 1;
    }
    setPollVotesState((prev) => ({ ...prev, [pollKey]: updated }));
    const choice = optionText || `Option ${optionIdx + 1}`;
    const newAnswers = { ...currentAnswers, [currentQIndex]: choice };
    const newScore = score + 1;
    setSelectedAnswer(choice);
    setCurrentAnswers(newAnswers);
    setScore(newScore);
    saveInProgressQuiz(activeTag.id, newAnswers, newScore, currentQIndex);
  };

  // 4. Reveal Basic / Short Question
  const handleRevealBasicAnswer = () => {
    setIsBasicRevealed(true);
    if (activeTag) {
      saveInProgressQuiz(activeTag.id, currentAnswers, score, currentQIndex, {
        shortAnswerInput,
        isBasicRevealed: true,
        selfAssessedResult,
      });
    }
  };

  // 5. Self-assess basic question
  const handleSelfAssessBasic = (result: "correct" | "review") => {
    if (selfAssessedResult || isAlreadySubmitted || !activeTag) return;
    const newAnswers = { ...currentAnswers, [currentQIndex]: result };
    const newScore = result === "correct" ? score + 1 : score;
    setSelfAssessedResult(result);
    setSelectedAnswer("self_assessed");
    setCurrentAnswers(newAnswers);
    if (result === "correct") {
      setScore(newScore);
    }
    saveInProgressQuiz(activeTag.id, newAnswers, newScore, currentQIndex, {
      shortAnswerInput,
      isBasicRevealed,
      selfAssessedResult: result,
    });
  };

  const handlePrevQuestion = () => {
    if (!activeTag) return;
    if (currentQIndex > 0) {
      const prevIdx = currentQIndex - 1;
      setCurrentQIndex(prevIdx);
      setSelectedAnswer(currentAnswers[prevIdx] || null);
      setShortAnswerInput("");
      setIsBasicRevealed(false);
      setSelfAssessedResult(null);
      saveInProgressQuiz(activeTag.id, currentAnswers, score, prevIdx);
    }
  };

  const handleNextQuestion = () => {
    if (!activeTag) return;
    if (currentQIndex < activeTag.questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedAnswer(currentAnswers[nextIdx] || null);
      setShortAnswerInput("");
      setIsBasicRevealed(false);
      setSelfAssessedResult(null);
      saveInProgressQuiz(activeTag.id, currentAnswers, score, nextIdx);
    } else {
      setIsCompleted(true);
      const totalQ = activeTag.questions.length;
      
      // If student is finishing for the first time, save the attempt permanently!
      if (!isAlreadySubmitted && currentStudent && selectedBatch) {
        const finalScore = score;
        const isPassed = finalScore >= Math.ceil(totalQ * 0.5);
        const attemptKey = `${selectedBatch.id}_${currentModule.id}_${activeTag.id}_${currentStudent.id}`;
        
        const newAttempt: TagAttempt = {
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          avatar: currentStudent.avatar,
          batchId: selectedBatch.id,
          moduleId: currentModule.id,
          tagId: activeTag.id,
          answers: currentAnswers,
          score: finalScore,
          totalQuestions: totalQ,
          isCorrect: isPassed,
          isCompleted: true,
          submittedAt: new Date().toISOString(),
          responseTimeMs: Math.max(700, Date.now() - (quizStartTimeRef.current || Date.now())),
        };

        setTagAttempts((prev) => {
          const next = { ...prev, [attemptKey]: newAttempt };
          try {
            localStorage.setItem("learnhub_tag_attempts", JSON.stringify(next));
          } catch {}
          return next;
        });

        setIsAlreadySubmitted(true);

        // Remove from in-progress quizzes since it is now permanently completed
        setInProgressQuizzes((prev) => {
          const next = { ...prev };
          delete next[activeTag.id];
          try {
            localStorage.setItem("learnhub_tag_inprogress", JSON.stringify(next));
          } catch {}
          return next;
        });

        if (isPassed) {
          setMasteredTags((prev) => ({ ...prev, [activeTag.id]: true }));
        }

        // Persist to PostgreSQL API
        axios.post('/api/learnhub-progress/', {
          student: currentStudent.id,
          studentId: currentStudent.id,
          module: currentModule.id,
          moduleId: currentModule.id,
          completedSlides: [currentSlide?.slideNumber || (currentSlideIndex + 1)],
          masteredTags: isPassed ? [activeTag.id] : [],
          quizScores: {
            [activeTag.id]: newAttempt,
          },
        }).catch((err) => console.error("Error persisting student quiz progress to API:", err));

        if (isPassed) {
          try {
            confetti({
              particleCount: 55,
              spread: 65,
              origin: { y: 0.7 },
            });
          } catch {}
        }
      }
    }
  };

  const handleRestartQuiz = () => {
    // Only allow restart if NOT already submitted
    if (isAlreadySubmitted || !activeTag) return;
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setCurrentAnswers({});
    setShortAnswerInput("");
    setIsBasicRevealed(false);
    setSelfAssessedResult(null);
    setScore(0);
    setIsCompleted(false);
    setInProgressQuizzes((prev) => {
      const next = { ...prev };
      delete next[activeTag.id];
      try {
        localStorage.setItem("learnhub_tag_inprogress", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // -------------------------------------------------------------
  // 3. ADMIN CREATOR & STUDIO STATE
  // -------------------------------------------------------------
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [studioTab, setStudioTab] = useState<
    "manual_builder" | "modules_manager" | "ai_upload" | "tags_manager"
  >("manual_builder");

  // Selected module for studio editing
  const [studioModuleId, setStudioModuleId] = useState<string>(activeModuleId);
  const [studioSlideIndex, setStudioSlideIndex] = useState(0);

  // Helper to extract tags specifically defined on a module
  const extractTagsFromModule = (mod?: LearnHubModule): LearnHubTag[] => {
    if (!mod) return [];
    const tagMap = new Map<string, LearnHubTag>();
    mod.slides?.forEach((s) => {
      s.paragraphs?.forEach((p) => {
        if (p.highlight && p.highlight.term) {
          tagMap.set(p.highlight.term.toLowerCase(), p.highlight);
        }
      });
    });
    mod.paragraphs?.forEach((p) => {
      if (p.highlight && p.highlight.term) {
        tagMap.set(p.highlight.term.toLowerCase(), p.highlight);
      }
    });
    return Array.from(tagMap.values());
  };

  // Module-scoped and slide-scoped tag library for builder
  const [tagLibrary, setTagLibrary] = useState<LearnHubTag[]>(() =>
    extractTagsFromModule(currentModule)
  );

  // Sync tagLibrary when switching modules in studio
  useEffect(() => {
    const mod = allModules.find((m) => m.id === studioModuleId) || currentModule;
    setTagLibrary(extractTagsFromModule(mod));
  }, [studioModuleId]);

  // Keyboard navigation for slides (Left & Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        showStudioModal
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        if (currentModule.slides && currentModule.slides.length > 0) {
          setCurrentSlideIndex((prev) =>
            Math.min(currentModule.slides!.length - 1, prev + 1)
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentModule.slides, showStudioModal]);

  // Sync studio selection when opening modal
  const handleOpenStudio = (moduleId?: string, slideIdx: number = 0) => {
    const targetModId = moduleId || activeModuleId;
    setStudioModuleId(targetModId);
    setStudioSlideIndex(slideIdx);
    const targetMod = allModules.find((m) => m.id === targetModId) || currentModule;
    setTagLibrary(extractTagsFromModule(targetMod));
    setShowStudioModal(true);
    setStudioTab("manual_builder");
  };

  // Drag and drop state for module reordering
  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);
  const [dragOverModuleIdx, setDragOverModuleIdx] = useState<number | null>(null);

  const handleModuleDragStart = (idx: number) => {
    setDraggedModuleIdx(idx);
  };

  const handleModuleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverModuleIdx !== idx) {
      setDragOverModuleIdx(idx);
    }
  };

  const handleModuleDrop = (targetIdx: number) => {
    if (draggedModuleIdx === null || draggedModuleIdx === targetIdx) {
      setDraggedModuleIdx(null);
      setDragOverModuleIdx(null);
      return;
    }
    const updated = [...allModules];
    const [moved] = updated.splice(draggedModuleIdx, 1);
    updated.splice(targetIdx, 0, moved);
    commitAllModulesUpdate(updated);
    setDraggedModuleIdx(null);
    setDragOverModuleIdx(null);
  };

  // Drag and drop state for slide reordering
  const [draggedSlideIdx, setDraggedSlideIdx] = useState<number | null>(null);
  const [dragOverSlideIdx, setDragOverSlideIdx] = useState<number | null>(null);

  const handleSlideDragStart = (idx: number) => {
    setDraggedSlideIdx(idx);
  };

  const handleSlideDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSlideIdx !== idx) {
      setDragOverSlideIdx(idx);
    }
  };

  const handleSlideDrop = (targetIdx: number, isStudio: boolean = false) => {
    if (draggedSlideIdx === null || draggedSlideIdx === targetIdx) {
      setDraggedSlideIdx(null);
      setDragOverSlideIdx(null);
      return;
    }
    const targetMod = isStudio ? editingModule : currentModule;
    const slidesList = targetMod.slides && targetMod.slides.length > 0 ? targetMod.slides : [];
    if (slidesList.length <= 1) {
      setDraggedSlideIdx(null);
      setDragOverSlideIdx(null);
      return;
    }

    const updated = [...slidesList];
    const [moved] = updated.splice(draggedSlideIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const reindexed = updated.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
    }));

    const updatedMod: LearnHubModule = {
      ...targetMod,
      slides: reindexed,
      paragraphs: reindexed[0].paragraphs,
      bottomTags: reindexed[0].bottomTags || targetMod.bottomTags,
    };

    commitModuleUpdate(updatedMod);
    if (isStudio) {
      setStudioSlideIndex(targetIdx);
    } else {
      setCurrentSlideIndex(targetIdx);
    }
    setDraggedSlideIdx(null);
    setDragOverSlideIdx(null);
  };

  // Text selection detection state
  const [selectedText, setSelectedText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end && end > start) {
        const text = textareaRef.current.value.substring(start, end).trim();
        if (text.length >= 2 && text.length <= 60) {
          setSelectedText(text);
          return;
        }
      }
    }
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length >= 2 && sel.length <= 60) {
      setSelectedText(sel);
    } else {
      setSelectedText("");
    }
  };

  // Inline active tag for editing in the manual builder
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<"all" | "slide">("slide");
  const [showInlineNewTag, setShowInlineNewTag] = useState(false);
  const [inlineTagTerm, setInlineTagTerm] = useState("");
  const [inlineTagDef, setInlineTagDef] = useState("");
  const [inlineTagIcon, setInlineTagIcon] = useState("💡");
  const [inlineTagColor, setInlineTagColor] = useState("llm");
  const [inlineTagQuestion, setInlineTagQuestion] = useState("");
  const [inlineTagOptA, setInlineTagOptA] = useState("");
  const [inlineTagOptB, setInlineTagOptB] = useState("");
  const [inlineTagOptC, setInlineTagOptC] = useState("");
  const [inlineTagCorrect, setInlineTagCorrect] = useState<"A" | "B" | "C">("A");
  const [inlineTagExplanation, setInlineTagExplanation] = useState("");

  const editingModule: LearnHubModule =
    allModules.find((m) => m.id === studioModuleId) ||
    allModules[0] ||
    initialLearnHubModule;

  // Safe slides array for the currently edited module
  const editingSlides: LearnHubSlide[] =
    editingModule.slides && editingModule.slides.length > 0
      ? editingModule.slides
      : [
          {
            id: `slide_1_${editingModule.id}`,
            slideNumber: 1,
            title: editingModule.title || "Module Introduction",
            subtitle: editingModule.subtitle || "Overview of fundamental principles.",
            badge: editingModule.badge || "SLIDE 1 • FOUNDATIONS",
            paragraphs: editingModule.paragraphs || [],
            bottomTags: editingModule.bottomTags || [],
          },
        ];

  const safeStudioSlideIndex = Math.min(
    Math.max(0, studioSlideIndex),
    editingSlides.length - 1
  );
  const activeStudioSlide = editingSlides[safeStudioSlideIndex] || editingSlides[0];

  // Helper to convert structured paragraphs to raw multi-line text for textarea
  const decompileParagraphsToRawText = (paras: LearnHubParagraph[]): string => {
    if (!paras || paras.length === 0) return "";
    return paras
      .map((p) => {
        const highlightText = p.highlight ? p.highlight.term : "";
        return `${p.textBefore}${highlightText}${p.textAfter}`;
      })
      .join("\n\n");
  };

  // Convert raw textarea text + tags into structured paragraphs with highlight matches (each tag highlighted only ONCE)
  const compileRawTextToParagraphs = (
    rawText: string,
    tags: LearnHubTag[]
  ): LearnHubParagraph[] => {
    if (!rawText || !rawText.trim()) return [];

    // Deduplicate tags by term name (keep only unique terms)
    const uniqueTagsMap = new Map<string, LearnHubTag>();
    tags.forEach((t) => {
      if (t && t.term && t.term.trim().length > 0) {
        const key = t.term.trim().toLowerCase();
        if (!uniqueTagsMap.has(key)) {
          uniqueTagsMap.set(key, t);
        }
      }
    });
    const validTags = Array.from(uniqueTagsMap.values());

    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
    const resultParagraphs: LearnHubParagraph[] = [];
    const usedTerms = new Set<string>();

    lines.forEach((line) => {
      interface TagMatch {
        start: number;
        end: number;
        tag: LearnHubTag;
      }

      const matches: TagMatch[] = [];

      validTags.forEach((tag) => {
        const termKey = tag.term.trim().toLowerCase();
        // Highlight each tag term ONLY ONCE across the entire slide
        if (usedTerms.has(termKey)) return;

        const term = tag.term.trim();
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        const m = regex.exec(line);
        if (m !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            tag,
          });
          usedTerms.add(termKey);
        }
      });

      if (matches.length === 0) {
        resultParagraphs.push({
          textBefore: line,
          textAfter: "",
        });
        return;
      }

      // Sort by start index
      matches.sort((a, b) => a.start - b.start);

      // Remove overlapping matches (keep earliest / longest)
      const nonOverlapping: TagMatch[] = [];
      let lastEnd = 0;
      for (const match of matches) {
        if (match.start >= lastEnd) {
          nonOverlapping.push(match);
          lastEnd = match.end;
        }
      }

      let currentPos = 0;
      for (let i = 0; i < nonOverlapping.length; i++) {
        const match = nonOverlapping[i];
        const textBefore = line.slice(currentPos, match.start);
        const isLast = i === nonOverlapping.length - 1;
        const textAfter = isLast ? line.slice(match.end) : "";

        resultParagraphs.push({
          textBefore,
          highlight: match.tag,
          textAfter,
        });

        currentPos = match.end;
      }
    });

    return resultParagraphs;
  };

  // Textarea state for currently active slide
  const [slideRawText, setSlideRawText] = useState(
    decompileParagraphsToRawText(activeStudioSlide?.paragraphs || [])
  );

  // Update textarea when active slide changes
  useEffect(() => {
    setSlideRawText(decompileParagraphsToRawText(activeStudioSlide?.paragraphs || []));
  }, [studioModuleId, safeStudioSlideIndex]);

  // Insert tag keyword directly into slide textarea
  const handleInsertTagToText = (tagTerm: string) => {
    setSlideRawText((prev) => {
      if (prev.toLowerCase().includes(tagTerm.toLowerCase())) {
        return prev;
      }
      return prev ? `${prev} ${tagTerm}` : tagTerm;
    });
  };

  // Save current slide edits into module state
  const handleSaveSlideChanges = (updatedSlideData: Partial<LearnHubSlide>) => {
    const updatedParagraphs = compileRawTextToParagraphs(slideRawText, tagLibrary);

    // Auto-derive bottom tags from highlighted tags in this slide
    const slideTags: LearnHubTag[] = [];
    updatedParagraphs.forEach((p) => {
      if (p.highlight && !slideTags.some((t) => t.id === p.highlight?.id)) {
        slideTags.push(p.highlight);
      }
    });

    const derivedBottomTags: BottomTag[] = slideTags.map((t, idx) => ({
      tag: t.id,
      title: t.term,
      icon: t.icon || "💡",
      cssClass: t.cssClass || `tag${idx + 1}`,
      definition: t.definition,
      questionsCount: t.questions.length,
    }));

    const updatedSlideList = [...editingSlides];
    updatedSlideList[safeStudioSlideIndex] = {
      ...updatedSlideList[safeStudioSlideIndex],
      ...updatedSlideData,
      paragraphs: updatedParagraphs,
      bottomTags:
        derivedBottomTags.length > 0
          ? derivedBottomTags
          : updatedSlideList[safeStudioSlideIndex].bottomTags || [],
    };

    const updatedModule: LearnHubModule = {
      ...editingModule,
      slides: updatedSlideList,
      // Keep root paragraphs synced to slide 1
      paragraphs: updatedSlideList[0].paragraphs,
      bottomTags: updatedSlideList[0].bottomTags || editingModule.bottomTags,
    };

    commitModuleUpdate(updatedModule);
  };

  // Add a new slide to current module
  const handleAddNewSlide = () => {
    const newSlideNum = editingSlides.length + 1;
    const newSlide: LearnHubSlide = {
      id: `slide_${Date.now()}`,
      slideNumber: newSlideNum,
      title: `Slide ${newSlideNum}: New Concept Section`,
      subtitle: "Add a concise summary or learning objective for this slide.",
      badge: `SLIDE ${newSlideNum} • ADVANCED CONCEPTS`,
      paragraphs: [
        {
          textBefore:
            "Write your explanatory text here. Any keywords matching your tag library will be highlighted automatically.",
          textAfter: "",
        },
      ],
      bottomTags: [],
    };

    const updatedSlideList = [...editingSlides, newSlide];
    const updatedModule: LearnHubModule = {
      ...editingModule,
      slides: updatedSlideList,
    };

    commitModuleUpdate(updatedModule);
    setStudioSlideIndex(updatedSlideList.length - 1);
  };

  // Duplicate a slide
  const handleDuplicateSlide = (idx: number) => {
    const targetSlide = editingSlides[idx];
    if (!targetSlide) return;

    const clonedSlide: LearnHubSlide = {
      ...targetSlide,
      id: `slide_${Date.now()}`,
      slideNumber: editingSlides.length + 1,
      title: `${targetSlide.title} (Copy)`,
      paragraphs: [...targetSlide.paragraphs],
      bottomTags: targetSlide.bottomTags ? [...targetSlide.bottomTags] : [],
    };

    const updatedSlideList = [...editingSlides, clonedSlide];
    const updatedModule: LearnHubModule = {
      ...editingModule,
      slides: updatedSlideList,
    };

    commitModuleUpdate(updatedModule);
    setStudioSlideIndex(updatedSlideList.length - 1);
  };

  // Delete a slide
  const handleDeleteSlide = (idx: number) => {
    if (editingSlides.length <= 1) {
      alert("A module must contain at least one slide.");
      return;
    }

    const updatedSlideList = editingSlides
      .filter((_, i) => i !== idx)
      .map((s, i) => ({
        ...s,
        slideNumber: i + 1,
      }));

    const updatedModule: LearnHubModule = {
      ...editingModule,
      slides: updatedSlideList,
      paragraphs: updatedSlideList[0].paragraphs,
    };

    commitModuleUpdate(updatedModule);
    setStudioSlideIndex(Math.max(0, idx - 1));
  };

  // Reorder slides
  const handleMoveSlide = (idx: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editingSlides.length) return;

    const updatedSlideList = [...editingSlides];
    const [moved] = updatedSlideList.splice(idx, 1);
    updatedSlideList.splice(targetIdx, 0, moved);

    // Re-index slide numbers
    const reindexed = updatedSlideList.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
    }));

    const updatedModule: LearnHubModule = {
      ...editingModule,
      slides: reindexed,
      paragraphs: reindexed[0].paragraphs,
    };

    commitModuleUpdate(updatedModule);
    setStudioSlideIndex(targetIdx);
  };

  // Create a brand new module with completely empty/clean fields
  const handleCreateNewModule = () => {
    const newModuleId = `mod_${Date.now()}`;
    const newModuleNum = allModules.length + 1;
    const newModule: LearnHubModule = {
      id: newModuleId,
      batchId: selectedBatch?.id || "",
      badge: `MODULE ${newModuleNum}`,
      title: "",
      subtitle: "",
      createdAt: new Date().toISOString(),
      isPublished: true,
      slides: [
        {
          id: `slide_1_${newModuleId}`,
          slideNumber: 1,
          title: "",
          subtitle: "",
          badge: "SLIDE 1",
          paragraphs: [],
          bottomTags: [],
        },
      ],
      paragraphs: [],
      bottomTags: [],
    };

    commitModuleUpdate(newModule);
    setStudioModuleId(newModule.id);
    setActiveModuleId(newModule.id);
    setStudioSlideIndex(0);
    setSlideRawText("");
    setTagLibrary([]); // Empty tag library for new module
    setStudioTab("manual_builder");
  };

  // Helper to create tag from highlighted/selected text
  const handleCreateTagFromSelection = (textToUse?: string) => {
    const term = (textToUse || selectedText).trim();
    if (!term) return;

    // Check if tag already exists in library
    const existing = tagLibrary.find((t) => t.term.toLowerCase() === term.toLowerCase());
    if (existing) {
      setExpandedTagId(existing.id);
      setShowInlineNewTag(false);
      setSelectedText("");
      handleInsertTagToText(existing.term);
      return;
    }

    const newTagId = `tag_${Date.now()}`;
    const newTag: LearnHubTag = {
      id: newTagId,
      term,
      cssClass: "custom",
      icon: "💡",
      type: "Concept Definition + Micro Quiz",
      definition: `${term} is an essential concept in this topic.`,
      questions: [
        {
          question: `What is the core function of ${term}?`,
          A: `Key functional definition of ${term}`,
          B: "Incorrect distraction choice 1",
          C: "Incorrect distraction choice 2",
          correct: "A",
          explanation: `Understanding ${term} provides key insights into this architecture.`,
        },
      ],
    };

    setTagLibrary((prev) => [newTag, ...prev]);
    setExpandedTagId(newTagId);
    setShowInlineNewTag(false);
    setSelectedText("");
    handleInsertTagToText(term);
  };

  // Helper to save inline custom new tag
  const handleSaveInlineNewTag = () => {
    if (!inlineTagTerm.trim()) {
      alert("Please provide a term name for the tag.");
      return;
    }

    const newTagId = `tag_${Date.now()}`;
    const newTag: LearnHubTag = {
      id: newTagId,
      term: inlineTagTerm.trim(),
      cssClass: inlineTagColor || "llm",
      icon: inlineTagIcon.trim() || "💡",
      type: "Concept Definition + Micro Quiz",
      definition:
        inlineTagDef.trim() || `${inlineTagTerm.trim()} is an important concept in this topic.`,
      questions: [
        {
          question:
            inlineTagQuestion.trim() || `What is the primary role of ${inlineTagTerm.trim()}?`,
          A: inlineTagOptA.trim() || `Core characteristic of ${inlineTagTerm.trim()}`,
          B: inlineTagOptB.trim() || "Incorrect alternative B",
          C: inlineTagOptC.trim() || "Incorrect alternative C",
          correct: inlineTagCorrect,
          explanation: inlineTagExplanation.trim(),
        },
      ],
    };

    setTagLibrary((prev) => [newTag, ...prev]);
    handleInsertTagToText(newTag.term);
    setExpandedTagId(newTagId);
    setShowInlineNewTag(false);
    setInlineTagTerm("");
    setInlineTagDef("");
    setInlineTagIcon("💡");
    setInlineTagQuestion("");
    setInlineTagOptA("");
    setInlineTagOptB("");
    setInlineTagOptC("");
    setInlineTagCorrect("A");
    setInlineTagExplanation("");
  };

  // Duplicate an entire module
  const handleDuplicateModule = (mod: LearnHubModule) => {
    const clonedMod: LearnHubModule = {
      ...mod,
      id: `mod_${Date.now()}`,
      title: `${mod.title} (Cloned)`,
      createdAt: new Date().toISOString(),
      slides: mod.slides?.map((s, i) => ({
        ...s,
        id: `slide_${i + 1}_${Date.now()}`,
      })),
    };

    commitModuleUpdate(clonedMod);
    setStudioModuleId(clonedMod.id);
    setActiveModuleId(clonedMod.id);
  };

  // Delete an entire module
  const handleDeleteModule = (modId: string) => {
    if (allModules.length <= 1) {
      alert("You must keep at least one module in your curriculum.");
      return;
    }

    if (confirm("Are you sure you want to delete this entire module and all its slides?")) {
      const remaining = allModules.filter((m) => m.id !== modId);
      commitAllModulesUpdate(remaining);
      setActiveModuleId(remaining[0].id);
      setStudioModuleId(remaining[0].id);
    }
  };

  // -------------------------------------------------------------
  // AI DOCUMENT ANALYZER (MULTI-SLIDE PPT / PDF INGESTION)
  // -------------------------------------------------------------
  const [aiDocTitle, setAiDocTitle] = useState("");
  const [aiDocText, setAiDocText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [uploadedFileBlob, setUploadedFileBlob] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileBlob(file);
    setUploadedFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFileSize(`${sizeMb} MB`);

    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setAiDocTitle(cleanName);

    if (file.name.match(/\.(pptx|ppt)$/i) || file.type.includes("presentation")) {
      try {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const slideFiles = Object.keys(zip.files).filter((name) =>
          /^ppt\/slides\/slide[_\d]+\.xml$/i.test(name)
        );
        slideFiles.sort((a, b) => {
          const numA = parseInt((a.match(/\d+/) || ["0"])[0]);
          const numB = parseInt((b.match(/\d+/) || ["0"])[0]);
          return numA - numB;
        });

        if (slideFiles.length > 0) {
          const slideTexts: string[] = [];
          for (let sIdx = 0; sIdx < slideFiles.length; sIdx++) {
            const slideXml = await zip.file(slideFiles[sIdx])!.async("text");
            const parser = new DOMParser();
            const doc = parser.parseFromString(slideXml, "application/xml");
            const pNodes = doc.getElementsByTagName("a:p");
            const lines: string[] = [];
            for (let i = 0; i < pNodes.length; i++) {
              const tNodes = pNodes[i].getElementsByTagName("a:t");
              let line = "";
              for (let j = 0; j < tNodes.length; j++) {
                line += tNodes[j].textContent || "";
              }
              if (line.trim()) lines.push(line.trim());
            }

            const slideTitle = lines[0] || `Slide ${sIdx + 1}`;
            const bullets = lines.slice(1);
            if (sIdx === 0 && lines[0]) {
              setAiDocTitle(lines[0]);
            }
            slideTexts.push(
              `Slide ${sIdx + 1}: ${slideTitle}\n${bullets.map((b) => `- ${b}`).join("\n")}`
            );
          }
          setAiDocText(slideTexts.join("\n\n"));
          return;
        }
      } catch (err) {
        console.warn("Failed to extract text from uploaded PPTX:", err);
      }
      setAiDocText(`Presentation Deck: ${cleanName}`);
    } else if (file.name.match(/\.(docx|doc)$/i)) {
      try {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        setAiDocText(result.value || `Document: ${cleanName}`);
        return;
      } catch (err) {
        console.warn("Failed to extract text from DOCX:", err);
      }
      setAiDocText(`Document: ${cleanName}`);
    } else if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAiDocText(text);
      };
      reader.readAsText(file);
    } else {
      setAiDocText(`Document: ${cleanName}`);
    }
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/gemini/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiDocText || aiDocTitle,
          title: aiDocTitle || "Autonomous AI Agents & Workflows",
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const generated = data.data;

        const newMod: LearnHubModule = {
          id: `mod_${Date.now()}`,
          batchId: selectedBatch?.id || "",
          badge: generated.badge || "INTERACTIVE AI GUIDE",
          title: generated.title || aiDocTitle || "Interactive Learning Module",
          subtitle:
            generated.subtitle ||
            "Explore core concepts, hover to inspect definitions, and take interactive micro-quizzes.",
          sourceFiles: uploadedFileName
            ? [
                {
                  name: uploadedFileName,
                  size: uploadedFileSize || "3.4 MB",
                  type:
                    uploadedFileName.endsWith(".pptx") || uploadedFileName.endsWith(".ppt")
                      ? "PPTX Presentation"
                      : uploadedFileName.endsWith(".pdf")
                      ? "PDF Document"
                      : "Document",
                  uploadedAt: new Date().toISOString(),
                  slideCount: generated.slides?.length || 3,
                  previewUrl: uploadedFileBlob
                    ? URL.createObjectURL(uploadedFileBlob)
                    : undefined,
                },
              ]
            : undefined,
          slides: generated.slides && generated.slides.length > 0
            ? generated.slides.map((s: any, idx: number) => ({
                id: s.id || `slide_${idx + 1}_${Date.now()}`,
                slideNumber: s.slideNumber || idx + 1,
                title: s.title || `Slide ${idx + 1}`,
                subtitle: s.subtitle || "",
                badge: s.badge || `SLIDE ${idx + 1} • KEY TOPICS`,
                paragraphs: s.paragraphs || [],
                bottomTags: s.bottomTags || [],
              }))
            : [
                {
                  id: "slide_1",
                  slideNumber: 1,
                  title: generated.title || "Core Concepts",
                  subtitle: generated.subtitle,
                  badge: "SLIDE 1 • FOUNDATIONS",
                  paragraphs: generated.paragraphs || [],
                  bottomTags: generated.bottomTags || [],
                },
              ],
          paragraphs: generated.paragraphs || [],
          bottomTags: generated.bottomTags || [],
          isPublished: true,
          createdAt: new Date().toISOString(),
        };

        commitModuleUpdate(newMod);
        setActiveModuleId(newMod.id);
        setStudioModuleId(newMod.id);
        setStudioSlideIndex(0);
        setShowStudioModal(false);
        setUploadedFileName("");
        setAiDocText("");
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTagClass = (cssClass: string) => {
    switch (cssClass) {
      case "llm":
      case "tag1":
        return "term-llm";
      case "api":
      case "tag2":
        return "term-api";
      case "nexos":
      case "tag3":
        return "term-nexos";
      case "crewai":
      case "tag4":
        return "term-crewai";
      case "agent":
        return "term-agent";
      case "python":
        return "term-python";
      case "database":
        return "term-database";
      default:
        return "term-custom";
    }
  };

  const totalMasteredCount = Object.keys(masteredTags).length;

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 px-2 sm:px-4 space-y-5">
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: MODULE SELECTOR & ADMIN ACTIONS                      */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Modules ({effectiveModules.length}):
          </span>

          <div className="relative flex-1 min-w-[200px] sm:max-w-md">
            <select
              value={activeModuleId}
              onChange={(e) => {
                setActiveModuleId(e.target.value);
                setCurrentSlideIndex(0);
              }}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold rounded-xl py-2 pl-3 pr-9 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs transition truncate"
            >
              {effectiveModules.map((m, mIdx) => {
                const slideCount = m.slides?.length || 1;
                return (
                  <option key={m.id} value={m.id} className="text-slate-800 font-semibold py-1">
                    Module {mIdx + 1}: {m.title ? (m.title.length > 35 ? `${m.title.slice(0, 35)}...` : m.title) : `Untitled Module ${mIdx + 1}`} ({slideCount} {slideCount === 1 ? "slide" : "slides"})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="hidden sm:inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/60 flex-shrink-0">
            {currentModule.slides?.length || 1} {(currentModule.slides?.length || 1) === 1 ? "slide" : "slides"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {userRole === "student" && totalMasteredCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-bold shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{totalMasteredCount} Concepts Mastered</span>
            </div>
          )}

          {userRole === "admin" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateNewModule()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition border border-emerald-200/60 shadow-2xs cursor-pointer"
                title="Create an empty new curriculum module"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Module</span>
              </button>

              <button
                onClick={() => handleOpenStudio(activeModuleId, currentSlideIndex)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                title="Open Studio to build slides, paragraphs, and tags"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ATTACHED PPT / DOCUMENT BANNER (IF AVAILABLE)                 */}
      {/* ------------------------------------------------------------- */}
      {/* ATTACHED PPT / DOCUMENT BANNER (IF AVAILABLE)                 */}
      {/* ------------------------------------------------------------- */}
      {(currentModule.sourceFile || (currentModule.sourceFiles && currentModule.sourceFiles.length > 0)) && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg font-bold flex-shrink-0 shadow-inner">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                  {currentModule.sourceFiles ? `${currentModule.sourceFiles.length} FILES` : currentModule.sourceFile?.type}
                </span>
                <span className="text-xs text-slate-400">
                  {currentModule.sourceFile?.slideCount || (currentModule.slides?.length ?? 3)} Slides
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                {currentModule.sourceFiles ? `${currentModule.sourceFiles.length} Attached Deck Files` : currentModule.sourceFile?.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                if (currentModule.sourceFiles && currentModule.sourceFiles.length > 0) {
                  setShowFilesModal(true);
                } else if (currentModule.sourceFile) {
                  setActivePreviewFile(currentModule.sourceFile);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{currentModule.sourceFiles && currentModule.sourceFiles.length > 1 ? "Preview Deck Files" : "Preview Deck File"}</span>
            </button>
          </div>
        </div>
      )}
      
      {showFilesModal && currentModule.sourceFiles && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Attached Deck Files</h3>
                  <p className="text-sm text-slate-500">Select a file to preview</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFilesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3">
              {currentModule.sourceFiles.map((file, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition-colors gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                      {file.name?.endsWith('.pdf') ? '📄' : file.name?.endsWith('.pptx') ? '📊' : '📝'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm truncate max-w-[200px] sm:max-w-xs" title={file.name || "File"}>
                        {file.name || "Attached File"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          {file.type || "Document"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{file.size || ""}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActivePreviewFile(file);
                      setShowFilesModal(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MULTI-SLIDE NAVIGATION CONTROLS                               */}
      {/* ------------------------------------------------------------- */}
      {hasSlides && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              <Layers className="w-4 h-4 text-indigo-600" />
              Slide:
            </span>

            <button
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition flex-shrink-0 cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slide Dropdown Selector */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-md">
              <select
                value={currentSlideIndex}
                onChange={(e) => setCurrentSlideIndex(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold rounded-xl py-2 pl-3 pr-9 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs transition truncate"
              >
                {currentModule.slides!.map((s, idx) => (
                  <option key={s.id || idx} value={idx} className="text-slate-800 font-semibold py-1">
                    Slide {idx + 1}{s.title ? `: ${s.title}` : ""}{s.badge ? ` • ${s.badge}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              disabled={currentSlideIndex === currentModule.slides!.length - 1}
              onClick={() =>
                setCurrentSlideIndex((prev) =>
                  Math.min(currentModule.slides!.length - 1, prev + 1)
                )
              }
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition flex-shrink-0 cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl whitespace-nowrap flex-shrink-0">
              {currentSlideIndex + 1} of {currentModule.slides!.length}
            </span>
          </div>

          {/* Admin Fast Edit Button for Current Slide */}
          {userRole === "admin" && (
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={() => handleOpenStudio(activeModuleId, currentSlideIndex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Slide</span>
              </button>

              <button
                onClick={() => {
                  handleOpenStudio(activeModuleId, currentSlideIndex);
                  handleAddNewSlide();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
              <button
                onClick={() => {
                  if (!currentSlide) return;
                  const updatedSlide = { ...currentSlide, tagsLocked: !currentSlide.tagsLocked };
                  const updatedSlides = [...(currentModule.slides || [])];
                  updatedSlides[currentSlideIndex] = updatedSlide;
                  commitModuleUpdate({ ...currentModule, slides: updatedSlides });
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                  currentSlide?.tagsLocked
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {currentSlide?.tagsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{currentSlide?.tagsLocked ? "Unlock Tags" : "Lock Tags"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN INTERACTIVE LEARNING GUIDE CARD                          */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        key={`${activeModuleId}_${currentSlideIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-100 relative transition-all"
      >
        {/* Floating Side Left Arrow for Previous Slide */}
        {hasMultipleSlides && (
          <button
            disabled={currentSlideIndex === 0}
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            className="absolute left-2 sm:-left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-md sm:shadow-lg border border-slate-200/90 flex items-center justify-center transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none z-20 cursor-pointer group hover:scale-105 active:scale-95"
            title="Previous Slide (Keyboard: ←)"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        {/* Floating Side Right Arrow for Next Slide */}
        {hasMultipleSlides && (
          <button
            disabled={currentSlideIndex === totalSlides - 1}
            onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
            className="absolute right-2 sm:-right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-md sm:shadow-lg border border-slate-200/90 flex items-center justify-center transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none z-20 cursor-pointer group hover:scale-105 active:scale-95"
            title="Next Slide (Keyboard: →)"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {/* Top Header Row with Badge, Slide Switcher Arrows & Audio Speech Button */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {currentSlide?.badge || currentModule.badge || `SLIDE ${currentSlideIndex + 1} • CORE CONCEPTS`}
            </div>

            {/* Quick Header Slide Arrows */}
            {hasMultipleSlides && (
              <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                  title="Previous Slide (←)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-extrabold text-slate-700 px-1.5">
                  {currentSlideIndex + 1} / {totalSlides}
                </span>
                <button
                  disabled={currentSlideIndex === totalSlides - 1}
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
                  className="p-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                  title="Next Slide (→)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {activePreviewFile ? (
          <div className={isFullscreenViewer ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col p-4 animate-in fade-in" : "space-y-4 animate-in fade-in duration-200"}>
            <div className={`flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 ${isFullscreenViewer ? 'mb-4' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                  {activePreviewFile.name?.endsWith('.pdf') ? '📄' : activePreviewFile.name?.endsWith('.pptx') ? '📊' : '📝'}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">{activePreviewFile.name || "Attached Document"}</h3>
                  <p className="text-xs text-slate-500">{activePreviewFile.size || "File"} • {activePreviewFile.type || "Document"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activePreviewFile.previewUrl && (
                  <a
                    href={activePreviewFile.previewUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, "")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </a>
                )}
                <button
                  onClick={() => setIsFullscreenViewer(!isFullscreenViewer)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {isFullscreenViewer ? <Shrink className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isFullscreenViewer ? "Exit Full Screen" : "Full Screen"}</span>
                </button>
                <button
                  onClick={() => { setActivePreviewFile(null); setIsFullscreenViewer(false); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Close Preview</span>
                </button>
              </div>
            </div>
            
            {/* Dynamic File Viewer Container */}
            <div className={`w-full bg-slate-900 rounded-2xl border-[6px] border-slate-800 shadow-inner flex flex-col items-center justify-center text-slate-400 relative overflow-hidden ${isFullscreenViewer ? 'flex-1' : 'aspect-video sm:h-[580px]'}`}>
              {activePreviewFile.previewUrl && ((activePreviewFile.type && activePreviewFile.type.includes("Image")) || (activePreviewFile.name && activePreviewFile.name.match(/\.(jpeg|jpg|gif|png|webp)$/i))) ? (
                <img src={activePreviewFile.previewUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, "")} alt={activePreviewFile.name || "Preview"} className="w-full h-full object-contain bg-slate-950" />
              ) : activePreviewFile.previewUrl && activePreviewFile.name && activePreviewFile.name.endsWith(".pdf") ? (
                <iframe src={`${activePreviewFile.previewUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, "")}#toolbar=0`} className="w-full h-full bg-white border-0" title={activePreviewFile.name || "Document Preview"} />
              ) : (
                <ExtractedDocumentViewer file={activePreviewFile} module={currentModule} />
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2.5">
              {currentSlide?.title || currentModule.title}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-500 text-sm sm:text-base mb-6 leading-relaxed font-medium">
              {currentSlide?.subtitle || currentModule.subtitle}
            </p>

            {/* Paragraphs with Interactive Highlight Badges */}
            <div className="space-y-4 text-slate-700 text-base sm:text-[17px] leading-relaxed font-normal">
              {activeParagraphs && activeParagraphs.length > 0 ? (
                <p className="leading-relaxed transition-colors">
                  {(() => {
                    const renderedTagTerms = new Set<string>();
                    return activeParagraphs.map((para, idx) => {
                      const termKey = para.highlight?.term?.trim().toLowerCase();
                      const isFirstOccurrence =
                        Boolean(termKey) && !renderedTagTerms.has(termKey!);
                      if (termKey) renderedTagTerms.add(termKey);

                      const shouldHighlight =
                        para.highlight &&
                        isFirstOccurrence &&
                        (!currentSlide?.tagsLocked || userRole === "admin");

                      return (
                        <React.Fragment key={idx}>
                          <span>{para.textBefore}</span>

                          {shouldHighlight ? (
                            <span
                              data-learnhub-tag="true"
                              onMouseEnter={(e) => handleMouseEnter(para.highlight!, e)}
                              onMouseLeave={handleMouseLeave}
                              onClick={(e) => openPopupForTag(para.highlight!, e)}
                              className={`highlight-term ${getTagClass(
                                para.highlight!.cssClass
                              )} mx-1 cursor-pointer inline-flex items-center gap-1`}
                              title="Click or hover to inspect definition & mini quiz (locks in place)"
                            >
                              {para.highlight!.icon && <span>{para.highlight!.icon}</span>}
                              <span>{para.highlight!.term}</span>
                            </span>
                          ) : para.highlight ? (
                            <span>{para.highlight.term}</span>
                          ) : null}

                          <span>{para.textAfter}</span>
                        </React.Fragment>
                      );
                    });
                  })()}
                </p>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm font-bold mb-2">
                    No paragraphs added to this slide yet.
                  </p>
                  {userRole === "admin" && (
                    <button
                      onClick={() => handleOpenStudio(activeModuleId, currentSlideIndex)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Open Paragraph Builder in Studio</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {userRole === "admin" && !activePreviewFile && (
          <AdminQuizAnalytics slide={currentSlide} module={currentModule} students={batchStudents} tagAttempts={tagAttempts} />
        )}

        {/* Bottom Slide Deck Navigation & Progress Bar */}
        {hasMultipleSlides && (
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 text-slate-700 text-xs font-extrabold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Previous Slide</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {currentModule.slides!.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    currentSlideIndex === idx
                      ? "w-6 bg-indigo-600"
                      : "w-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                  title={`Go to Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              disabled={currentSlideIndex === totalSlides - 1}
              onClick={() =>
                setCurrentSlideIndex((prev) =>
                  Math.min(totalSlides - 1, prev + 1)
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs group"
            >
              <span className="hidden sm:inline">Next Slide</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* ========================================================= */}
      {/* FLOATING INTERACTIVE POPUP MODAL                          */}
      {/* ========================================================= */}
      {activeTag && popupPos && (
        <div
          ref={popupRef}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
          style={{
            top: `${popupPos.top}px`,
            left: `${popupPos.left}px`,
          }}
          className="fixed z-50 w-[310px] sm:w-[340px] max-h-[500px] flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Sticky Header — always visible at top */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl px-4 sm:px-5 pt-4 sm:pt-5 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between gap-2.5 mb-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-inner flex-shrink-0">
                  {activeTag.icon || "💡"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                    {activeTag.term}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {activeTag.type || "Definition + Mini Quiz"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Lock / Unlock Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsPopupLocked(!isPopupLocked)}
                  title={isPopupLocked ? "Locked in place (Click to unlock)" : "Unlocked (Hover mode)"}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer border ${
                    isPopupLocked
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {isPopupLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 text-slate-400" />
                      <span>Unlocked</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeTagPopup}
                  title="Tap to unlock and close"
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold cursor-pointer transition flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1 mb-2.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pinned in place
              </span>
              <span>Tap outside to unlock & close</span>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto flex-1 px-4 sm:px-5 pb-4 sm:pb-5">
            {/* Definition */}
            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100 mb-3 font-normal">
              {activeTag.definition}
            </div>

          {/* Quiz Section */}
          {activeTag.questions && activeTag.questions.length > 0 && (
            <div>
              {!isCompleted ? (
                <>
                  {/* Progress Indicator & Question Type Badge */}
                  {(() => {
                    const currentQ = activeTag.questions[currentQIndex];
                    const qType: TagQuestionType = currentQ.type || "mcq";

                    return (
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {activeTag.questions.length > 1 && (
                              <button
                                disabled={currentQIndex === 0}
                                onClick={handlePrevQuestion}
                                className="p-0.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                title="Previous Question"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span>
                              Q{currentQIndex + 1}/{activeTag.questions.length}
                            </span>
                            {activeTag.questions.length > 1 && (
                              <button
                                disabled={currentQIndex === activeTag.questions.length - 1}
                                onClick={handleNextQuestion}
                                className="p-0.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                title="Next Question"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                              {qType === "mcq"
                                ? "Multiple Choice"
                                : qType === "true_false"
                                ? "True / False"
                                : qType === "poll"
                                ? "Live Poll"
                                : "Concept Check"}
                            </span>
                          </div>
                          <span className="text-indigo-600 font-extrabold">Score: {score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
                            style={{
                              width: `${((currentQIndex + 1) / activeTag.questions.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Question Text */}
                  {(() => {
                    const currentQ = activeTag.questions[currentQIndex];
                    const qType: TagQuestionType = currentQ.type || "mcq";
                    const hasAnswered = selectedAnswer !== null;

                    return (
                      <>
                        {isAlreadySubmitted && (
                          <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-between text-[11px] font-bold text-indigo-800">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Assessment Submitted (Read-Only Review)
                            </span>
                            <span className="text-[10px] text-indigo-500 font-semibold">
                              Q{currentQIndex + 1}/{activeTag.questions.length}
                            </span>
                          </div>
                        )}

                        <h4 className="font-bold text-slate-800 text-xs leading-snug mb-2.5">
                          {currentQ.question}
                        </h4>

                        {/* TYPE 1: MULTIPLE CHOICE (MCQ) */}
                        {qType === "mcq" && (
                          <div className="space-y-1.5 mb-3">
                            {(["A", "B", "C", "D"] as const).map((choice) => {
                              const optionText = currentQ[choice];
                              if (!optionText) return null;

                              const isSelected = selectedAnswer === choice;
                              const isCorrectChoice = currentQ.correct === choice;

                              let btnStyle =
                                "bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300";

                              if (hasAnswered) {
                                if (isCorrectChoice) {
                                  btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                                } else if (isSelected && !isCorrectChoice) {
                                  btnStyle = "bg-rose-50 border-rose-500 text-rose-800 font-bold";
                                } else {
                                  btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={choice}
                                  disabled={hasAnswered || isAlreadySubmitted}
                                  onClick={() => handleSelectMCQ(choice)}
                                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-150 flex items-center justify-between ${hasAnswered || isAlreadySubmitted ? 'cursor-default' : 'cursor-pointer'} ${btnStyle}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-indigo-600">{choice}.</span>
                                    <span className="leading-snug">{optionText}</span>
                                  </div>
                                  {hasAnswered && isCorrectChoice && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  )}
                                  {hasAnswered && isSelected && !isCorrectChoice && (
                                    <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* TYPE 2: TRUE / FALSE */}
                        {qType === "true_false" && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {(["True", "False"] as const).map((choice) => {
                              const isSelected = selectedAnswer === choice;
                              const correctChoice = currentQ.correct || "True";
                              const isCorrectChoice =
                                choice.toLowerCase() === correctChoice.toLowerCase();

                              let btnStyle =
                                "bg-slate-50 border-slate-200 text-slate-800 hover:bg-indigo-50 hover:border-indigo-300";

                              if (hasAnswered) {
                                if (isCorrectChoice) {
                                  btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                                } else if (isSelected && !isCorrectChoice) {
                                  btnStyle = "bg-rose-50 border-rose-500 text-rose-800 font-bold";
                                } else {
                                  btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={choice}
                                  disabled={hasAnswered || isAlreadySubmitted}
                                  onClick={() => handleSelectTrueFalse(choice)}
                                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${hasAnswered || isAlreadySubmitted ? 'cursor-default' : 'cursor-pointer'} ${btnStyle}`}
                                >
                                  {choice === "True" ? (
                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                                  )}
                                  <span>{choice}</span>
                                  {hasAnswered && isCorrectChoice && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                                  )}
                                  {hasAnswered && isSelected && !isCorrectChoice && (
                                    <XCircle className="w-3.5 h-3.5 text-rose-600 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* TYPE 3: LIVE POLL / SURVEY */}
                        {qType === "poll" && (
                          <div className="space-y-1.5 mb-3">
                            {(() => {
                              const pollOpts =
                                currentQ.pollOptions && currentQ.pollOptions.length > 0
                                  ? currentQ.pollOptions
                                  : [currentQ.A, currentQ.B, currentQ.C].filter(Boolean) as string[];
                              
                              const pollKey = `${activeTag.id}_q${currentQIndex}`;
                              const votes = pollVotesState[pollKey] || currentQ.pollVotes || [40, 30, 20, 10];
                              const totalVotes = votes
                                .slice(0, pollOpts.length)
                                .reduce((acc, v) => acc + (v || 0), 0) || 1;

                              return pollOpts.map((opt, optIdx) => {
                                const optVotes = votes[optIdx] || 0;
                                const percentage = Math.round((optVotes / totalVotes) * 100);
                                const isSelected = selectedAnswer === opt;

                                if (hasAnswered || isAlreadySubmitted) {
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`relative overflow-hidden p-2 rounded-xl border text-xs font-medium transition ${
                                        isSelected
                                          ? "bg-indigo-50/80 border-indigo-400 text-indigo-900 font-bold"
                                          : "bg-slate-50 border-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {/* Background Percentage Progress Fill */}
                                      <div
                                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                          isSelected ? "bg-indigo-200/50" : "bg-slate-200/40"
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                      <div className="relative z-10 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 truncate">
                                          {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                          )}
                                          <span className="truncate">{opt}</span>
                                        </div>
                                        <span className="font-extrabold text-[11px] text-indigo-600 flex-shrink-0">
                                          {percentage}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleVotePoll(optIdx, opt)}
                                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center justify-between"
                                  >
                                    <span>{opt}</span>
                                    <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        )}

                        {/* TYPE 4: BASIC / SHORT QUESTION (SELF-CHECK) */}
                        {qType === "short_answer" && (
                          <div className="space-y-2 mb-3">
                            <textarea
                              rows={2}
                              value={shortAnswerInput}
                              disabled={isBasicRevealed || isAlreadySubmitted}
                              onChange={(e) => setShortAnswerInput(e.target.value)}
                              placeholder="Type your brief answer or thoughts..."
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-indigo-400 focus:outline-none transition leading-relaxed"
                            />

                            {!isBasicRevealed && !isAlreadySubmitted ? (
                              <button
                                onClick={handleRevealBasicAnswer}
                                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Reveal Model Answer & Check</span>
                              </button>
                            ) : (
                              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1.5">
                                <div className="flex items-center gap-1 font-bold text-indigo-900 text-[11px]">
                                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Model Answer:</span>
                                </div>
                                <p className="text-slate-800 leading-relaxed font-medium">
                                  {currentQ.sampleAnswer || currentQ.explanation || "Review the key concept definition above."}
                                </p>

                                {!selfAssessedResult && !isAlreadySubmitted ? (
                                  <div className="pt-1">
                                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                                      Did your answer match the concept?
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <button
                                        onClick={() => handleSelfAssessBasic("correct")}
                                        className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>I got it (+1 pt)</span>
                                      </button>
                                      <button
                                        onClick={() => handleSelfAssessBasic("review")}
                                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Need review</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Self-assessment complete!</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback Message */}
                        {hasAnswered && (
                          <div
                            className={`p-2.5 rounded-xl text-xs font-semibold mb-2.5 leading-relaxed ${
                              qType === "poll"
                                ? "bg-indigo-50 border border-indigo-100 text-indigo-900"
                                : qType === "short_answer"
                                ? "bg-slate-100 text-slate-800"
                                : (qType === "true_false"
                                    ? selectedAnswer?.toLowerCase() === (currentQ.correct || "true").toLowerCase()
                                    : selectedAnswer === currentQ.correct)
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {qType === "poll" ? (
                              <span>📊 Your vote is recorded! +1 Participation point.</span>
                            ) : qType === "short_answer" ? (
                              <span>💡 Great reflection. Knowledge logged into your session.</span>
                            ) : (qType === "true_false"
                                ? selectedAnswer?.toLowerCase() === (currentQ.correct || "true").toLowerCase()
                                : selectedAnswer === currentQ.correct) ? (
                              <span>✓ Correct! Great job.</span>
                            ) : (
                              <span>
                                ✕ Not quite. Correct answer:{" "}
                                {qType === "true_false"
                                  ? currentQ.correct || "True"
                                  : `Option ${currentQ.correct}`}
                                .{currentQ.explanation ? ` ${currentQ.explanation}` : ""}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Next / Finish & Back Buttons */}
                        {(hasAnswered || isAlreadySubmitted) && (
                          <div className="flex items-center gap-2">
                            {currentQIndex > 0 && (
                              <button
                                onClick={handlePrevQuestion}
                                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Previous Question"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Back</span>
                              </button>
                            )}
                            <button
                              onClick={handleNextQuestion}
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>
                                {currentQIndex === activeTag.questions.length - 1
                                  ? "See Final Score"
                                  : "Next Question"}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-2.5">
                  <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black shadow-inner">
                    {score}/{activeTag.questions.length}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                    {score === activeTag.questions.length
                      ? "🏆 Perfect Score!"
                      : score >= activeTag.questions.length * 0.7
                      ? "🎉 Excellent Understanding!"
                      : "📚 Good Effort!"}
                  </h4>

                  <p className="text-xs text-slate-500 mb-3 px-2">
                    {score === activeTag.questions.length
                      ? "You have completely mastered all questions in this concept."
                      : "Review the definition and question explanations below."}
                  </p>

                  {isAlreadySubmitted ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Assessment Recorded in Analytics</span>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setIsCompleted(false);
                            setCurrentQIndex(0);
                            setSelectedAnswer(currentAnswers[0] || null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Review Questions & Explanations
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRestartQuiz}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          </div>{/* end scrollable content area */}
        </div>
        )}


      {/* ========================================================= */}
      {/* ADMIN STUDIO MODAL (MULTI-MODULE & MULTI-SLIDE STUDIO)    */}
      {/* ========================================================= */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
          <div className="bg-white w-full h-full p-4 sm:p-6 shadow-xl flex flex-col overflow-hidden">
            {/* Modal Header Bar with Module Selector & Create New */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Admin Learn Hub Studio
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold uppercase">
                      Multi-Module & Multi-Slide
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Add multiple modules, configure multi-slide decks per module, and build interactive paragraphs with concept tags.
                  </p>
                </div>
              </div>

              {/* Module Selector & Close Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-slate-500 px-2">Module:</span>
                  <select
                    value={studioModuleId}
                    onChange={(e) => {
                      setStudioModuleId(e.target.value);
                      setStudioSlideIndex(0);
                    }}
                    className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs max-w-[200px] truncate"
                  >
                    {allModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title || "Untitled Module"} ({m.slides?.length || 1} slides)
                      </option>
                    ))}
                  </select>

                  {allModules.length > 1 && (
                    <button
                      onClick={() => handleDeleteModule(studioModuleId)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200/50"
                      title="Delete current module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleCreateNewModule}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                    title="Add a new clean empty module"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Module</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowStudioModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
                  title="Close Studio"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-2xl flex-shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setStudioTab("manual_builder")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  studioTab === "manual_builder"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Slide Deck & Paragraph Builder</span>
              </button>

              <button
                onClick={() => setStudioTab("modules_manager")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  studioTab === "modules_manager"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Manage Modules ({allModules.length})</span>
              </button>

              <button
                onClick={() => setStudioTab("ai_upload")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  studioTab === "ai_upload"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>PPTX / PDF & AI Ingestion</span>
              </button>

              <button
                onClick={() => setStudioTab("tags_manager")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  studioTab === "tags_manager"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TagIcon className="w-3.5 h-3.5" />
                <span>Concept Tags ({tagLibrary.length})</span>
              </button>
            </div>

            {/* Scrollable Studio Content Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* ========================================================= */}
              {/* TAB 1: SLIDE DECK & PARAGRAPH BUILDER (MULTI-SLIDE)       */}
              {/* ========================================================= */}
              {studioTab === "manual_builder" && (
                <div className="space-y-4">
                  {/* Module Metadata Editor Card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        Module Settings: {editingModule.title || "Untitled Module"}
                      </span>
                      <div className="flex items-center gap-2">
                        {allModules.length > 1 && (
                          <button
                            onClick={() => handleDeleteModule(studioModuleId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition"
                            title="Delete entire module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Module</span>
                          </button>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          Batch: {selectedBatch?.name || "All Batches"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Module Title
                        </label>
                        <input
                          type="text"
                          value={editingModule.title}
                          onChange={(e) => {
                            commitModuleUpdate({
                              ...editingModule,
                              title: e.target.value,
                            });
                          }}
                          placeholder="e.g. What Is an AI Agent?"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Badge Label
                        </label>
                        <input
                          type="text"
                          value={editingModule.badge || "INTERACTIVE AI GUIDE"}
                          onChange={(e) => {
                            commitModuleUpdate({
                              ...editingModule,
                              badge: e.target.value,
                            });
                          }}
                          placeholder="e.g. INTERACTIVE AI GUIDE"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Module Overview / Subtitle
                      </label>
                      <input
                        type="text"
                        value={editingModule.subtitle || ""}
                        onChange={(e) => {
                          commitModuleUpdate({
                            ...editingModule,
                            subtitle: e.target.value,
                          });
                        }}
                        placeholder="Brief summary of learning goals..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Attached Files Section */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase">
                        Attached Deck Files
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          disabled={isUploadingFile}
                          onChange={handleModuleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-sm pointer-events-none">
                          {isUploadingFile ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                              <span>Uploading to Server...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Upload Files</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {editingModule.sourceFiles && editingModule.sourceFiles.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {editingModule.sourceFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-lg flex-shrink-0">{file.name?.endsWith('.pdf') ? '📄' : file.name?.endsWith('.pptx') ? '📊' : '📝'}</span>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-700 truncate" title={file.name || "File"}>{file.name || "File"}</p>
                                <p className="text-[10px] text-slate-400">{file.size || ""} • {file.type || "Document"}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeModuleFile(idx)}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors flex-shrink-0"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        <p className="text-xs text-slate-400 font-medium">No files attached to this module yet.</p>
                      </div>
                    )}
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* MULTI-SLIDE NAVIGATION & SLIDE MANAGEMENT BAR                 */}
                  {/* ------------------------------------------------------------- */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          Slide Deck Manager ({editingSlides.length} Slides in this Module)
                        </h4>
                        <p className="text-[11px] text-indigo-700/80">
                          Drag and drop slides to reorder, select a slide to edit paragraphs, or add new slides.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleAddNewSlide}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Slide</span>
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Slide Deck Carousel with Drag-and-Drop */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                      {editingSlides.map((slide, sIdx) => {
                        const isDragging = draggedSlideIdx === sIdx;
                        const isDragOver = dragOverSlideIdx === sIdx;
                        return (
                          <div
                            key={slide.id || sIdx}
                            draggable
                            onDragStart={() => handleSlideDragStart(sIdx)}
                            onDragOver={(e) => handleSlideDragOver(e, sIdx)}
                            onDrop={() => handleSlideDrop(sIdx, true)}
                            onClick={() => setStudioSlideIndex(sIdx)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex-shrink-0 w-52 sm:w-56 text-left relative group ${
                              isDragging ? "opacity-40 scale-95" : "opacity-100"
                            } ${
                              isDragOver
                                ? "ring-2 ring-indigo-500 bg-indigo-50"
                                : safeStudioSlideIndex === sIdx
                                ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                                : "bg-white/80 border-slate-200 hover:border-indigo-300 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  safeStudioSlideIndex === sIdx
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <GripVertical className="w-2.5 h-2.5 opacity-50 cursor-grab" />
                                Slide {sIdx + 1}
                              </span>

                              {/* Reorder / Action icons */}
                              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                <button
                                  disabled={sIdx === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveSlide(sIdx, "left");
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded"
                                  title="Move Left"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={sIdx === editingSlides.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveSlide(sIdx, "right");
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded"
                                  title="Move Right"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateSlide(sIdx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  title="Duplicate Slide"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {editingSlides.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlide(sIdx);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Delete Slide"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <h5 className="text-xs font-extrabold text-slate-800 truncate">
                              {slide.title || `Slide ${sIdx + 1}`}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {slide.paragraphs?.length || 1} paragraph(s) •{" "}
                              {slide.bottomTags?.length || 0} tag(s)
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* ACTIVE SLIDE EDITOR (TITLE, SUBTITLE, PARAGRAPH TEXT, TAGS)  */}
                  {/* ------------------------------------------------------------- */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {safeStudioSlideIndex + 1}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Editing Slide {safeStudioSlideIndex + 1} of {editingSlides.length}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleSaveSlideChanges({
                              title: activeStudioSlide.title,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Slide Updates</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Slide Title
                        </label>
                        <input
                          type="text"
                          value={activeStudioSlide.title}
                          onChange={(e) => {
                            const updatedTitle = e.target.value;
                            handleSaveSlideChanges({ title: updatedTitle });
                          }}
                          placeholder="e.g. Autonomous Agent Loops & Memory"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Slide Badge
                        </label>
                        <input
                          type="text"
                          value={activeStudioSlide.badge || `SLIDE ${safeStudioSlideIndex + 1}`}
                          onChange={(e) => {
                            handleSaveSlideChanges({ badge: e.target.value });
                          }}
                          placeholder={`SLIDE ${safeStudioSlideIndex + 1} • ARCHITECTURE`}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Slide Objective / Subtitle
                      </label>
                      <input
                        type="text"
                        value={activeStudioSlide.subtitle || ""}
                        onChange={(e) => {
                          handleSaveSlideChanges({ subtitle: e.target.value });
                        }}
                        placeholder="Brief 1-sentence learning objective for this slide..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Slide Paragraph Textarea with Text Selection Detection */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Slide Paragraph Content (Type or Paste Text)
                        </label>
                        <span className="text-[11px] text-indigo-600 font-bold">
                          ✨ Matching tag terms from library are highlighted automatically!
                        </span>
                      </div>

                      <textarea
                        ref={textareaRef}
                        rows={6}
                        value={slideRawText}
                        onChange={(e) => setSlideRawText(e.target.value)}
                        onSelect={handleTextareaSelect}
                        onMouseUp={handleTextareaSelect}
                        onKeyUp={handleTextareaSelect}
                        placeholder="Type paragraphs here. Enter a blank line for new paragraphs..."
                        className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-sans leading-relaxed focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Selected Text Highlight Action Bar */}
                    {selectedText && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-2xl shadow-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs font-bold text-slate-700">
                            Selected:{" "}
                            <span className="px-2 py-0.5 bg-white border border-amber-300 rounded-lg text-indigo-700 font-mono font-extrabold">
                              "{selectedText}"
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleCreateTagFromSelection(selectedText)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Create Tag & Quiz from Selection</span>
                          </button>
                          <button
                                type="button"
                            onClick={() => setSelectedText("")}
                            className="text-xs text-slate-400 hover:text-slate-600 p-1"
                            title="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Insert Tag Helper Bar */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase">
                          Quick Insert Tags for This Slide (Click to Add):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInlineNewTag(true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Create Custom Tag for Slide</span>
                          </button>
                        </div>
                      </div>

                      {tagLibrary.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          No tags created on this slide yet. Select any word in the slide paragraph above or click "+ Create Custom Tag for Slide".
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tagLibrary.map((tag) => {
                            const isHighlighted = slideRawText
                              .toLowerCase()
                              .includes(tag.term.toLowerCase());
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleInsertTagToText(tag.term)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs hover:scale-105 transition transform ${getTagClass(
                                  tag.cssClass
                                )} ${isHighlighted ? "ring-2 ring-indigo-500" : ""}`}
                                title={
                                  isHighlighted
                                    ? `"${tag.term}" is active on this slide`
                                    : `Click to insert "${tag.term}" into slide text`
                                }
                              >
                                <span>{tag.icon}</span>
                                <span>
                                  {isHighlighted ? "✓ " : "+ "}
                                  {tag.term}
                                </span>
                                <span className="text-[10px] opacity-75">
                                  ({tag.questions.length} Qs)
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* INTEGRATED CONCEPT TAGS & MICRO-QUIZ LIBRARY (INLINE ON SLIDE)*/}
                    {/* ------------------------------------------------------------- */}
                    <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              Slide Concept Tags & Micro-Quiz Library
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                              {
                                tagLibrary.filter((t) =>
                                  slideRawText.toLowerCase().includes(t.term.toLowerCase())
                                ).length
                              }{" "}
                              Active on Slide
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Manage concept definitions and multiple micro-quiz questions directly for this slide.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => setTagFilter("slide")}
                              className={`px-2.5 py-1 rounded-lg transition ${
                                tagFilter === "slide"
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Active on Slide (
                              {
                                tagLibrary.filter((t) =>
                                  slideRawText.toLowerCase().includes(t.term.toLowerCase())
                                ).length
                              }
                              )
                            </button>
                            <button
                              type="button"
                              onClick={() => setTagFilter("all")}
                              className={`px-2.5 py-1 rounded-lg transition ${
                                tagFilter === "all"
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              All Module Tags ({tagLibrary.length})
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowInlineNewTag((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{showInlineNewTag ? "Close Form" : "Create New Tag for Slide"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline New Tag Form */}
                      {showInlineNewTag && (
                        <div className="p-4 bg-white rounded-2xl border-2 border-indigo-300 shadow-sm space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-indigo-700 uppercase flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Create New Concept Tag & Micro-Quiz for Slide
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowInlineNewTag(false)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Tag Term / Keyword (will be highlighted in text)
                              </label>
                              <input
                                type="text"
                                value={inlineTagTerm}
                                onChange={(e) => setInlineTagTerm(e.target.value)}
                                placeholder="e.g. Python, Syntax, List Comprehension..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Icon & Style
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={inlineTagIcon}
                                  onChange={(e) => setInlineTagIcon(e.target.value)}
                                  className="w-10 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold"
                                  title="Emoji Icon"
                                />
                                <select
                                  value={inlineTagColor}
                                  onChange={(e) => setInlineTagColor(e.target.value)}
                                  className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                >
                                  <option value="llm">Purple / AI</option>
                                  <option value="api">Green / APIs</option>
                                  <option value="crew">Indigo / Multi-Agent</option>
                                  <option value="database">Cyan / Search & DB</option>
                                  <option value="tag1">Orange / Platform</option>
                                  <option value="custom">Slate / Neutral</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Concept Explanation / Popover Definition
                            </label>
                            <textarea
                              rows={2}
                              value={inlineTagDef}
                              onChange={(e) => setInlineTagDef(e.target.value)}
                              placeholder="Concise educational explanation shown when student hovers or clicks this term..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>

                          {/* Initial Micro Quiz Question */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-600 uppercase">
                              Micro-Quiz Question 1
                            </span>
                            <input
                              type="text"
                              value={inlineTagQuestion}
                              onChange={(e) => setInlineTagQuestion(e.target.value)}
                              placeholder="Question prompt for student to test their knowledge..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={inlineTagOptA}
                                onChange={(e) => setInlineTagOptA(e.target.value)}
                                placeholder="Option A (Correct default)"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                              />
                              <input
                                type="text"
                                value={inlineTagOptB}
                                onChange={(e) => setInlineTagOptB(e.target.value)}
                                placeholder="Option B"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                              />
                              <input
                                type="text"
                                value={inlineTagOptC}
                                onChange={(e) => setInlineTagOptC(e.target.value)}
                                placeholder="Option C"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Correct Choice:
                              </span>
                              <div className="flex items-center gap-2">
                                {(["A", "B", "C"] as const).map((choice) => (
                                  <label
                                    key={choice}
                                    className="flex items-center gap-1 text-xs font-bold cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name="inlineCorrect"
                                      value={choice}
                                      checked={inlineTagCorrect === choice}
                                      onChange={() => setInlineTagCorrect(choice)}
                                    />
                                    <span>Choice {choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <input
                              type="text"
                              value={inlineTagExplanation}
                              onChange={(e) => setInlineTagExplanation(e.target.value)}
                              placeholder="Explanation of why this answer is correct..."
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={handleSaveInlineNewTag}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                              Save Tag & Insert to Slide
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tag List with Question Manager */}
                      <div className="space-y-3">
                        {tagLibrary.length === 0 ? (
                          <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                            <div className="text-3xl">🏷️</div>
                            <h5 className="text-xs font-bold text-slate-700">No Concept Tags on this Slide</h5>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                              Highlight any term in the slide paragraph above to create definitions & micro-quizzes, or click "+ Create New Tag for Slide".
                            </p>
                            <div className="flex items-center justify-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowInlineNewTag(true)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Custom Tag for Slide</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          tagLibrary
                            .filter((tag) => {
                              if (tagFilter === "slide") {
                                return slideRawText
                                  .toLowerCase()
                                  .includes(tag.term.toLowerCase());
                              }
                              return true;
                            })
                            .map((tag, tIdx) => {
                            const isHighlighted = slideRawText
                              .toLowerCase()
                              .includes(tag.term.toLowerCase());
                            const isExpanded = expandedTagId === tag.id;

                            return (
                              <div
                                key={tag.id}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                  isHighlighted
                                    ? "bg-white border-indigo-200 shadow-xs"
                                    : "bg-white/90 border-slate-200"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`highlight-term ${getTagClass(
                                        tag.cssClass
                                      )}`}
                                    >
                                      <span>{tag.icon}</span>
                                      <span>{tag.term}</span>
                                    </span>

                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                                      {tag.questions.length}{" "}
                                      {tag.questions.length === 1 ? "Question" : "Questions"}
                                    </span>

                                    {isHighlighted ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                        <Check className="w-3 h-3" />
                                        <span>Active in Slide</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleInsertTagToText(tag.term)}
                                        className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full font-bold transition"
                                      >
                                        + Insert Term into Slide Text
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedTagId(isExpanded ? null : tag.id)
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                                    >
                                      <Sliders className="w-3 h-3" />
                                      <span>{isExpanded ? "Collapse" : "Edit Definition & Quizzes"}</span>
                                    </button>

                                    {tagLibrary.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTagLibrary((prev) =>
                                            prev.filter((t) => t.id !== tag.id)
                                          );
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                        title="Delete Tag"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Expanded Tag & Quiz Editor */}
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                          Term Name
                                        </label>
                                        <input
                                          type="text"
                                          value={tag.term}
                                          onChange={(e) => {
                                            const updated = [...tagLibrary];
                                            const idx = updated.findIndex((t) => t.id === tag.id);
                                            if (idx !== -1) {
                                              updated[idx].term = e.target.value;
                                              setTagLibrary(updated);
                                            }
                                          }}
                                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                          Icon
                                        </label>
                                        <input
                                          type="text"
                                          value={tag.icon}
                                          onChange={(e) => {
                                            const updated = [...tagLibrary];
                                            const idx = updated.findIndex((t) => t.id === tag.id);
                                            if (idx !== -1) {
                                              updated[idx].icon = e.target.value;
                                              setTagLibrary(updated);
                                            }
                                          }}
                                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                          Color Theme
                                        </label>
                                        <select
                                          value={tag.cssClass}
                                          onChange={(e) => {
                                            const updated = [...tagLibrary];
                                            const idx = updated.findIndex((t) => t.id === tag.id);
                                            if (idx !== -1) {
                                              updated[idx].cssClass = e.target.value;
                                              setTagLibrary(updated);
                                            }
                                          }}
                                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                                        >
                                          <option value="llm">Purple (LLM)</option>
                                          <option value="api">Teal (API)</option>
                                          <option value="nexos">Orange (Nexos)</option>
                                          <option value="crewai">Pink (CrewAI)</option>
                                          <option value="agent">Cyan (Agent)</option>
                                          <option value="python">Amber (Python)</option>
                                          <option value="database">Violet (DB)</option>
                                          <option value="custom">Blue (Custom)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                        Concept Definition
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={tag.definition}
                                        onChange={(e) => {
                                          const updated = [...tagLibrary];
                                          const idx = updated.findIndex((t) => t.id === tag.id);
                                          if (idx !== -1) {
                                            updated[idx].definition = e.target.value;
                                            setTagLibrary(updated);
                                          }
                                        }}
                                        placeholder="Detailed concept definition..."
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                      />
                                    </div>

                                    {/* Questions List */}
                                    <div className="space-y-2.5">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                                          Interactive Questions ({tag.questions.length})
                                        </span>
                                        <div className="flex items-center flex-wrap gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions.push({
                                                  type: "mcq",
                                                  question: `What is the primary role of ${tag.term}?`,
                                                  A: `Core capability of ${tag.term}`,
                                                  B: "Alternative choice B",
                                                  C: "Alternative choice C",
                                                  correct: "A",
                                                  explanation: "",
                                                });
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>+ MCQ</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions.push({
                                                  type: "true_false",
                                                  question: `True or False: ${tag.term} executes autonomously.`,
                                                  correct: "True",
                                                  explanation: "",
                                                });
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>+ True/False</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions.push({
                                                  type: "poll",
                                                  question: `Which feature of ${tag.term} is most beneficial?`,
                                                  pollOptions: [
                                                    "Workflow Automation",
                                                    "Data Synchronization",
                                                    "System Extensibility",
                                                  ],
                                                  pollVotes: [40, 35, 25],
                                                  explanation: "",
                                                });
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>+ Live Poll</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions.push({
                                                  type: "short_answer",
                                                  question: `Explain why ${tag.term} is crucial for production architectures.`,
                                                  sampleAnswer: `${tag.term} provides deterministic execution and reliability.`,
                                                  explanation: "",
                                                });
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            className="px-2 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>+ Basic Question</span>
                                          </button>
                                        </div>
                                      </div>

                                      {tag.questions.map((q, qIdx) => {
                                        const qType: TagQuestionType = q.type || "mcq";

                                        return (
                                          <div
                                            key={qIdx}
                                            className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-[11px] text-slate-700">
                                                  Question {qIdx + 1}:
                                                </span>
                                                <select
                                                  value={qType}
                                                  onChange={(e) => {
                                                    const updated = [...tagLibrary];
                                                    const idx = updated.findIndex((t) => t.id === tag.id);
                                                    if (idx !== -1) {
                                                      const newType = e.target.value as TagQuestionType;
                                                      updated[idx].questions[qIdx].type = newType;
                                                      if (newType === "true_false" && !updated[idx].questions[qIdx].correct) {
                                                        updated[idx].questions[qIdx].correct = "True";
                                                      }
                                                      if (
                                                        newType === "poll" &&
                                                        (!updated[idx].questions[qIdx].pollOptions ||
                                                          updated[idx].questions[qIdx].pollOptions?.length === 0)
                                                      ) {
                                                        updated[idx].questions[qIdx].pollOptions = [
                                                          "Core Functionality",
                                                          "System Scalability",
                                                          "Community Workflow",
                                                        ];
                                                        updated[idx].questions[qIdx].pollVotes = [45, 35, 20];
                                                      }
                                                      if (newType === "short_answer" && !updated[idx].questions[qIdx].sampleAnswer) {
                                                        updated[idx].questions[qIdx].sampleAnswer =
                                                          "Reference explanation and model response for self-assessment.";
                                                      }
                                                      setTagLibrary(updated);
                                                    }
                                                  }}
                                                  className="px-2 py-0.5 rounded-md border border-slate-300 bg-white font-extrabold text-[10px] text-indigo-700 cursor-pointer"
                                                >
                                                  <option value="mcq">🔘 Multiple Choice (MCQ)</option>
                                                  <option value="true_false">⚖️ True / False</option>
                                                  <option value="poll">📊 Live Poll / Survey</option>
                                                  <option value="short_answer">✍️ Basic Question (Self-Check)</option>
                                                </select>
                                              </div>
                                              {tag.questions.length > 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                  const updated = [...tagLibrary];
                                                  const idx = updated.findIndex((t) => t.id === tag.id);
                                                  if (idx !== -1) {
                                                    updated[idx].questions = updated[idx].questions.filter(
                                                      (_, i) => i !== qIdx
                                                    );
                                                    setTagLibrary(updated);
                                                  }
                                                }}
                                                className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
                                              >
                                                Remove Question
                                              </button>
                                            )}
                                          </div>

                                          <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions[qIdx].question = e.target.value;
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            placeholder="Question prompt..."
                                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                                          />

                                          {/* 1. MCQ OPTIONS & CORRECT CHOICE */}
                                          {qType === "mcq" && (
                                            <div className="space-y-2 pt-1">
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <input
                                                  type="text"
                                                  value={q.A || ""}
                                                  onChange={(e) => {
                                                    const updated = [...tagLibrary];
                                                    const idx = updated.findIndex((t) => t.id === tag.id);
                                                    if (idx !== -1) {
                                                      updated[idx].questions[qIdx].A = e.target.value;
                                                      setTagLibrary(updated);
                                                    }
                                                  }}
                                                  placeholder="Option A"
                                                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                                                />
                                                <input
                                                  type="text"
                                                  value={q.B || ""}
                                                  onChange={(e) => {
                                                    const updated = [...tagLibrary];
                                                    const idx = updated.findIndex((t) => t.id === tag.id);
                                                    if (idx !== -1) {
                                                      updated[idx].questions[qIdx].B = e.target.value;
                                                      setTagLibrary(updated);
                                                    }
                                                  }}
                                                  placeholder="Option B"
                                                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                                                />
                                                <input
                                                  type="text"
                                                  value={q.C || ""}
                                                  onChange={(e) => {
                                                    const updated = [...tagLibrary];
                                                    const idx = updated.findIndex((t) => t.id === tag.id);
                                                    if (idx !== -1) {
                                                      updated[idx].questions[qIdx].C = e.target.value;
                                                      setTagLibrary(updated);
                                                    }
                                                  }}
                                                  placeholder="Option C"
                                                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                                                />
                                              </div>

                                              <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                  Correct:
                                                </span>
                                                {(["A", "B", "C"] as const).map((choice) => (
                                                  <label
                                                    key={choice}
                                                    className="flex items-center gap-1 text-xs font-bold cursor-pointer"
                                                  >
                                                    <input
                                                      type="radio"
                                                      name={`correct_${tag.id}_${qIdx}`}
                                                      value={choice}
                                                      checked={q.correct === choice}
                                                      onChange={() => {
                                                        const updated = [...tagLibrary];
                                                        const idx = updated.findIndex((t) => t.id === tag.id);
                                                        if (idx !== -1) {
                                                          updated[idx].questions[qIdx].correct = choice;
                                                          setTagLibrary(updated);
                                                        }
                                                      }}
                                                    />
                                                    <span>Choice {choice}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* 2. TRUE / FALSE SELECTOR */}
                                          {qType === "true_false" && (
                                            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Correct Answer:
                                              </span>
                                              {(["True", "False"] as const).map((choice) => (
                                                <label
                                                  key={choice}
                                                  className="flex items-center gap-1 text-xs font-bold cursor-pointer"
                                                >
                                                  <input
                                                    type="radio"
                                                    name={`tf_correct_${tag.id}_${qIdx}`}
                                                    value={choice}
                                                    checked={
                                                      (q.correct || "True").toLowerCase() ===
                                                      choice.toLowerCase()
                                                    }
                                                    onChange={() => {
                                                      const updated = [...tagLibrary];
                                                      const idx = updated.findIndex((t) => t.id === tag.id);
                                                      if (idx !== -1) {
                                                        updated[idx].questions[qIdx].correct = choice;
                                                        setTagLibrary(updated);
                                                      }
                                                    }}
                                                  />
                                                  <span>{choice}</span>
                                                </label>
                                              ))}
                                            </div>
                                          )}

                                          {/* 3. POLL OPTIONS LIST */}
                                          {qType === "poll" && (
                                            <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                  Poll Choices (Real-time student feedback)
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...tagLibrary];
                                                    const idx = updated.findIndex((t) => t.id === tag.id);
                                                    if (idx !== -1) {
                                                      const currentOpts = updated[idx].questions[qIdx].pollOptions || [
                                                        "Option 1",
                                                        "Option 2",
                                                      ];
                                                      if (currentOpts.length < 5) {
                                                        updated[idx].questions[qIdx].pollOptions = [
                                                          ...currentOpts,
                                                          `Option ${currentOpts.length + 1}`,
                                                        ];
                                                        setTagLibrary(updated);
                                                      }
                                                    }
                                                  }}
                                                  className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer"
                                                >
                                                  + Add Option
                                                </button>
                                              </div>

                                              {(q.pollOptions || ["Option 1", "Option 2"]).map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-1.5">
                                                  <span className="text-[10px] font-bold text-slate-400 w-4">
                                                    {optIdx + 1}.
                                                  </span>
                                                  <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                      const updated = [...tagLibrary];
                                                      const idx = updated.findIndex((t) => t.id === tag.id);
                                                      if (idx !== -1) {
                                                        const list = [
                                                          ...(updated[idx].questions[qIdx].pollOptions || [
                                                            "Option 1",
                                                            "Option 2",
                                                          ]),
                                                        ];
                                                        list[optIdx] = e.target.value;
                                                        updated[idx].questions[qIdx].pollOptions = list;
                                                        setTagLibrary(updated);
                                                      }
                                                    }}
                                                    placeholder={`Poll Choice ${optIdx + 1}...`}
                                                    className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs"
                                                  />
                                                  {(q.pollOptions || []).length > 2 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const updated = [...tagLibrary];
                                                        const idx = updated.findIndex((t) => t.id === tag.id);
                                                        if (idx !== -1) {
                                                          const list = (
                                                            updated[idx].questions[qIdx].pollOptions || []
                                                          ).filter((_, i) => i !== optIdx);
                                                          updated[idx].questions[qIdx].pollOptions = list;
                                                          setTagLibrary(updated);
                                                        }
                                                      }}
                                                      className="text-rose-500 text-xs px-1 hover:text-rose-700 cursor-pointer"
                                                    >
                                                      ✕
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* 4. BASIC / SHORT QUESTION MODEL ANSWER */}
                                          {qType === "short_answer" && (
                                            <div>
                                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                                Expected Model Answer / Key Takeaway
                                              </label>
                                              <textarea
                                                rows={2}
                                                value={q.sampleAnswer || ""}
                                                onChange={(e) => {
                                                  const updated = [...tagLibrary];
                                                  const idx = updated.findIndex((t) => t.id === tag.id);
                                                  if (idx !== -1) {
                                                    updated[idx].questions[qIdx].sampleAnswer = e.target.value;
                                                    setTagLibrary(updated);
                                                  }
                                                }}
                                                placeholder="Model answer or reference explanation that student will compare against..."
                                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                                              />
                                            </div>
                                          )}

                                          <input
                                            type="text"
                                            value={q.explanation}
                                            onChange={(e) => {
                                              const updated = [...tagLibrary];
                                              const idx = updated.findIndex((t) => t.id === tag.id);
                                              if (idx !== -1) {
                                                updated[idx].questions[qIdx].explanation = e.target.value;
                                                setTagLibrary(updated);
                                              }
                                            }}
                                            placeholder="Explanation of answer..."
                                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                                          />
                                        </div>
                                      );
                                    })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Live Slide Preview Card */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Live Interactive Student Preview for Slide {safeStudioSlideIndex + 1}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Hover or click highlighted terms
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white mb-1">
                        {activeStudioSlide.title || "Untitled Slide"}
                      </h3>
                      <p className="text-xs text-slate-300 mb-4">
                        {activeStudioSlide.subtitle || "No objective set"}
                      </p>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-slate-800/60 p-4 rounded-xl">
                        {compileRawTextToParagraphs(slideRawText, tagLibrary).length > 0 ? (
                          <p className="leading-relaxed">
                            {(() => {
                              const renderedPreviewTerms = new Set<string>();
                              return compileRawTextToParagraphs(slideRawText, tagLibrary).map(
                                (para, pIdx) => {
                                  const termKey = para.highlight?.term?.trim().toLowerCase();
                                  const isFirstOccurrence =
                                    Boolean(termKey) && !renderedPreviewTerms.has(termKey!);
                                  if (termKey) renderedPreviewTerms.add(termKey);

                                  const shouldHighlight =
                                    para.highlight && isFirstOccurrence;

                                  return (
                                    <React.Fragment key={pIdx}>
                                      <span>{para.textBefore}</span>
                                      {shouldHighlight ? (
                                        <span
                                          data-learnhub-tag="true"
                                          onClick={(e) => openPopupForTag(para.highlight!, e)}
                                          className={`highlight-term ${getTagClass(
                                            para.highlight!.cssClass
                                          )} mx-1 cursor-pointer inline-flex items-center gap-1`}
                                          title="Click to test quiz popup (locks in place)"
                                        >
                                          {para.highlight!.icon && (
                                            <span>{para.highlight!.icon}</span>
                                          )}
                                          <span>{para.highlight!.term}</span>
                                        </span>
                                      ) : para.highlight ? (
                                        <span>{para.highlight.term}</span>
                                      ) : null}
                                      <span>{para.textAfter}</span>
                                    </React.Fragment>
                                  );
                                }
                              );
                            })()}
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">
                            No paragraph content entered yet. Type text above to preview here.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: CURRICULUM & MODULES MANAGER                       */}
              {/* ========================================================= */}
              {studioTab === "modules_manager" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Curriculum Module Overview
                      </h4>
                      <p className="text-xs text-slate-400">
                        Manage all modules, add multi-slide curriculum topics, duplicate, or reorder.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateNewModule}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Module</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {allModules.map((mod, mIdx) => {
                      const slideCount = mod.slides?.length || 1;
                      const isCurrent = mod.id === activeModuleId;

                      return (
                        <div
                          key={mod.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isCurrent
                              ? "bg-indigo-50/40 border-indigo-300 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner">
                              {mIdx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {mod.badge || "MODULE"}
                                </span>
                                <span className="text-xs text-indigo-600 font-bold">
                                  {slideCount} {slideCount === 1 ? "Slide" : "Slides"}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Active in Viewer
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                                {mod.title}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {mod.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => {
                                setStudioModuleId(mod.id);
                                setStudioSlideIndex(0);
                                setStudioTab("manual_builder");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                            >
                              Edit Slides ({slideCount})
                            </button>

                            <button
                              onClick={() => {
                                setActiveModuleId(mod.id);
                                setShowStudioModal(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                              title="View as Student"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicateModule(mod)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                              title="Duplicate Module"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {allModules.length > 1 && (
                              <button
                                onClick={() => handleDeleteModule(mod.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete Module"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: PPTX / PDF UPLOAD & AI INGESTION                   */}
              {/* ========================================================= */}
              {studioTab === "ai_upload" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center bg-slate-50/60 transition group relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pptx,.ppt,.pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-1">
                      {uploadedFileName
                        ? `Selected: ${uploadedFileName}`
                        : "Upload Presentation (PPTX / PDF)"}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Gemini AI will automatically extract slides, build multi-slide reading paragraphs, detect key terms, and generate micro-quizzes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Module Title
                      </label>
                      <input
                        type="text"
                        value={aiDocTitle}
                        onChange={(e) => setAiDocTitle(e.target.value)}
                        placeholder="e.g. AI Agents & Multi-Agent Architecture"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Target Batch
                      </label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                        {selectedBatch?.name || "Current Batch"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Extracted Text / Presentation Content
                    </label>
                    <textarea
                      rows={6}
                      value={aiDocText}
                      onChange={(e) => setAiDocText(e.target.value)}
                      placeholder="Paste slides, notes, or raw topic text here..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      disabled={isAnalyzing || (!aiDocText.trim() && !aiDocTitle.trim())}
                      onClick={handleRunAiAnalysis}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md transition"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Analyzing Slides & Generating Tags...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Auto-Generate Multi-Slide Module
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: CONCEPT TAGS & MINI-QUIZZES LIBRARY                */}
              {/* ========================================================= */}
              {studioTab === "tags_manager" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Concept Tags & Micro-Quiz Library
                      </h4>
                      <p className="text-xs text-slate-400">
                        These tags are automatically highlighted across all module slides and trigger interactive mini-quizzes.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newTag: LearnHubTag = {
                          id: `tag_${Date.now()}`,
                          term: "New Concept",
                          cssClass: "custom",
                          icon: "⚡",
                          type: "Concept Definition + 3 Question Quiz",
                          definition: "Write comprehensive concept definition here...",
                          questions: [
                            {
                              question: "What is the primary characteristic of this concept?",
                              A: "Key feature or definition explanation",
                              B: "Incorrect distraction option 1",
                              C: "Incorrect distraction option 2",
                              correct: "A",
                              explanation: "Explanation of why option A is correct.",
                            },
                          ],
                        };
                        setTagLibrary((prev) => [...prev, newTag]);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Tag</span>
                    </button>
                  </div>

                  <div className="space-y-3 pr-1">
                    {tagLibrary.map((tag, idx) => (
                      <div
                        key={tag.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={tag.icon}
                              onChange={(e) => {
                                const updated = [...tagLibrary];
                                updated[idx].icon = e.target.value;
                                setTagLibrary(updated);
                              }}
                              className="w-10 h-8 rounded-lg bg-white border border-slate-200 text-center text-sm"
                              title="Emoji Icon"
                            />
                            <input
                              type="text"
                              value={tag.term}
                              onChange={(e) => {
                                const updated = [...tagLibrary];
                                updated[idx].term = e.target.value;
                                setTagLibrary(updated);
                              }}
                              placeholder="Term Name (e.g. LLM)"
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-extrabold w-48"
                            />
                            <select
                              value={tag.cssClass}
                              onChange={(e) => {
                                const updated = [...tagLibrary];
                                updated[idx].cssClass = e.target.value;
                                setTagLibrary(updated);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                            >
                              <option value="llm">Purple (LLM)</option>
                              <option value="api">Teal (APIs)</option>
                              <option value="nexos">Orange (Nexos.ai)</option>
                              <option value="crewai">Pink (CrewAI)</option>
                              <option value="agent">Cyan (Agent)</option>
                              <option value="python">Amber (Python)</option>
                              <option value="database">Violet (DB / Search)</option>
                              <option value="custom">Blue (Custom)</option>
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              setTagLibrary((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Definition Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Definition & Concept Explanation
                          </label>
                          <textarea
                            rows={2}
                            value={tag.definition}
                            onChange={(e) => {
                              const updated = [...tagLibrary];
                              updated[idx].definition = e.target.value;
                              setTagLibrary(updated);
                            }}
                            placeholder="Comprehensive 2-3 sentence definition..."
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs leading-relaxed"
                          />
                        </div>

                        {/* Micro-Quiz Questions for this tag */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                              Mini Quiz Questions ({tag.questions.length})
                            </span>
                            <button
                              onClick={() => {
                                const updated = [...tagLibrary];
                                updated[idx].questions.push({
                                  question: "New question prompt for this concept?",
                                  A: "Option A",
                                  B: "Option B",
                                  C: "Option C",
                                  correct: "A",
                                  explanation: "",
                                });
                                setTagLibrary(updated);
                              }}
                              className="text-[11px] text-indigo-600 font-bold hover:underline"
                            >
                              + Add Question
                            </button>
                          </div>

                          {tag.questions.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="p-2.5 bg-white rounded-xl border border-slate-200 mb-2 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col flex-1 gap-1">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={q.type || "mcq"}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].type = e.target.value as any;
                                        setTagLibrary(updated);
                                      }}
                                      className="px-2 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-bold w-28 sm:w-32"
                                    >
                                      <option value="mcq">MCQ</option>
                                      <option value="true_false">True / False</option>
                                      <option value="poll">Poll</option>
                                      <option value="short_answer">Short Ans</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={q.question}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].question = e.target.value;
                                        setTagLibrary(updated);
                                      }}
                                      placeholder={`Question ${qIdx + 1}`}
                                      className="w-full px-2 py-1 rounded border border-slate-200 font-semibold flex-1"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = [...tagLibrary];
                                    updated[idx].questions = updated[idx].questions.filter(
                                      (_, i) => i !== qIdx
                                    );
                                    setTagLibrary(updated);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 px-1 text-xs"
                                >
                                  ✕
                                </button>
                              </div>

                              {(!q.type || q.type === "mcq") && (
                                <>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      value={q.A || ""}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].A = e.target.value;
                                        setTagLibrary(updated);
                                      }}
                                      placeholder="Option A"
                                      className="px-2 py-1 rounded border border-slate-200"
                                    />
                                    <input
                                      type="text"
                                      value={q.B || ""}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].B = e.target.value;
                                        setTagLibrary(updated);
                                      }}
                                      placeholder="Option B"
                                      className="px-2 py-1 rounded border border-slate-200"
                                    />
                                    <input
                                      type="text"
                                      value={q.C || ""}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].C = e.target.value;
                                        setTagLibrary(updated);
                                      }}
                                      placeholder="Option C"
                                      className="px-2 py-1 rounded border border-slate-200"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                      Correct Answer:
                                    </span>
                                    <select
                                      value={q.correct || "A"}
                                      onChange={(e) => {
                                        const updated = [...tagLibrary];
                                        updated[idx].questions[qIdx].correct = e.target.value;
                                        setTagLibrary(updated);
                                      }}
                                      className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-xs font-bold"
                                    >
                                      <option value="A">Option A</option>
                                      <option value="B">Option B</option>
                                      <option value="C">Option C</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {q.type === "true_false" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500 font-semibold">Correct Answer:</span>
                                  <select
                                    value={q.correct || "True"}
                                    onChange={(e) => {
                                      const updated = [...tagLibrary];
                                      updated[idx].questions[qIdx].correct = e.target.value;
                                      setTagLibrary(updated);
                                    }}
                                    className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-xs font-bold"
                                  >
                                    <option value="True">True</option>
                                    <option value="False">False</option>
                                  </select>
                                </div>
                              )}

                              {q.type === "short_answer" && (
                                <div>
                                  <input
                                    type="text"
                                    value={q.sampleAnswer || ""}
                                    onChange={(e) => {
                                      const updated = [...tagLibrary];
                                      updated[idx].questions[qIdx].sampleAnswer = e.target.value;
                                      setTagLibrary(updated);
                                    }}
                                    placeholder="Model / Sample Answer"
                                    className="w-full px-2 py-1 rounded border border-slate-200"
                                  />
                                </div>
                              )}

                              {q.type === "poll" && (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={(q.pollOptions || []).join(", ")}
                                    onChange={(e) => {
                                      const updated = [...tagLibrary];
                                      updated[idx].questions[qIdx].pollOptions = e.target.value.split(",").map(s => s.trim());
                                      setTagLibrary(updated);
                                    }}
                                    placeholder="Poll Options (comma separated)"
                                    className="w-full px-2 py-1 rounded border border-slate-200"
                                  />
                                </div>
                              )}

                              <div>
                                <input
                                  type="text"
                                  value={q.explanation || ""}
                                  onChange={(e) => {
                                    const updated = [...tagLibrary];
                                    updated[idx].questions[qIdx].explanation = e.target.value;
                                    setTagLibrary(updated);
                                  }}
                                  placeholder="Explanation or extra context..."
                                  className="w-full px-2 py-1 rounded border border-slate-200 text-slate-600 bg-slate-50"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 flex-shrink-0">
              <span className="text-xs text-slate-400">
                All changes are automatically synced to your batch curriculum.
              </span>
              <button
                onClick={() => setShowStudioModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Close Studio & View Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
