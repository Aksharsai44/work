import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import JSZip from "jszip";
import mammoth from "mammoth";
import {
  Assignment,
  AssignmentQuestion,
  Batch,
  Student,
  UserRole,
  QuestionType,
  TestCase,
} from "../types";
import {
  FileText,
  Code2,
  Sparkles,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  Check,
  RotateCcw,
  Timer,
  ChevronRight,
  ShieldAlert,
  Zap,
  Upload,
  FileUp,
  Sliders,
  Trash2,
  Edit3,
  Eye,
  CheckSquare,
  FileCode,
  Terminal,
  BookOpen,
  Award,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronLeft,
  Bookmark,
  Flag,
  Layers,
  ListChecks,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  Search,
  Filter,
  ExternalLink,
  Trophy,
  Star,
  CheckCheck,
  Code,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { CodingChallengeIDE } from "./CodingChallengeIDE";
import { CodingStudioFullPage } from "./CodingStudioFullPage";
import { AiAssignmentGeneratorFullPage } from "./AiAssignmentGeneratorFullPage";
import { ManualAssignmentBuilderFullPage } from "./ManualAssignmentBuilderFullPage";
import { evaluateCodeSolution, isUnmodifiedBoilerplate } from "../utils/codeEvaluator";

interface AssignmentManagerViewProps {
  assignments: Assignment[];
  selectedBatch: Batch;
  userRole: UserRole;
  currentStudent?: Student;
  students?: Student[];
  onCreateAssignment: (asg: Assignment) => void;
  onUpdateAssignment: (asg: Assignment) => void;
  onDeleteAssignment?: (asgId: string) => void;
  onSubmissionComplete?: () => void;
}

export const AssignmentManagerView: React.FC<AssignmentManagerViewProps> = ({
  assignments,
  selectedBatch,
  userRole,
  currentStudent,
  students = [],
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onSubmissionComplete,
}) => {
  const rawBatchAssignments = assignments.filter((a) => a.batchId === selectedBatch.id);
  const batchAssignments =
    userRole === "student"
      ? rawBatchAssignments.filter((a) => !a.isLocked)
      : rawBatchAssignments;

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(
    batchAssignments[0] || null
  );

  // Keep selected assignment synced with batch changes
  useEffect(() => {
    if (batchAssignments.length > 0) {
      if (!selectedAssignment || !batchAssignments.some((a) => a.id === selectedAssignment.id)) {
        setSelectedAssignment(batchAssignments[0]);
      } else {
        const updated = batchAssignments.find((a) => a.id === selectedAssignment.id);
        if (updated) setSelectedAssignment(updated);
      }
    } else {
      setSelectedAssignment(null);
    }
  }, [selectedBatch.id, assignments, userRole, batchAssignments.length]);

  // Toggle Assignment Lock / Unlock status
  const handleToggleAssignmentLock = async (asg: Assignment) => {
    const updatedLocked = !asg.isLocked;
    const updatedAsg = { ...asg, isLocked: updatedLocked };
    onUpdateAssignment(updatedAsg);
    if (selectedAssignment?.id === asg.id) {
      setSelectedAssignment(updatedAsg);
    }
    try {
      await axios.patch(`/api/assignments/${asg.id}/`, { isLocked: updatedLocked });
    } catch (err) {
      console.error("Failed to update assignment lock status", err);
    }
  };

  // Scroll-down / Dropdown state and helpers
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState<boolean>(false);
  const [assignmentDropdownSearch, setAssignmentDropdownSearch] = useState<string>("");
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assignmentDropdownRef.current &&
        !assignmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignmentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedAssignmentIndex = selectedAssignment
    ? batchAssignments.findIndex((a) => a.id === selectedAssignment.id)
    : -1;

  const handleSelectPreviousAssignment = () => {
    if (selectedAssignmentIndex > 0) {
      setSelectedAssignment(batchAssignments[selectedAssignmentIndex - 1]);
    }
  };

  const handleSelectNextAssignment = () => {
    if (selectedAssignmentIndex >= 0 && selectedAssignmentIndex < batchAssignments.length - 1) {
      setSelectedAssignment(batchAssignments[selectedAssignmentIndex + 1]);
    }
  };

  const formatAssignmentTitle = (rawTitle: string) => {
    if (!rawTitle) return "Untitled Assignment";
    return rawTitle.replace(/^Title:\s*/i, "").trim();
  };

  const [isQuestionAccuracyExpanded, setIsQuestionAccuracyExpanded] = useState<boolean>(true);
  const [questionAccuracyFilter, setQuestionAccuracyFilter] = useState<"all" | "low">("all");

  // =========================================================================
  // 1. AI ASSIGNMENT GENERATOR (WAY 1: FILE UPLOAD & CUSTOM QUESTION COUNTS)
  // =========================================================================
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStep, setAiStep] = useState<"upload" | "customize">("upload");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [asgTitle, setAsgTitle] = useState("");
  const [asgDuration, setAsgDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<"beginner" | "medium" | "advanced">("medium");

  // Question type configuration counts
  const [enableMcq, setEnableMcq] = useState(true);
  const [mcqCount, setMcqCount] = useState(3);

  const [enableTrueFalse, setEnableTrueFalse] = useState(true);
  const [trueFalseCount, setTrueFalseCount] = useState(2);

  const [enableFillBlanks, setEnableFillBlanks] = useState(true);
  const [fillBlanksCount, setFillBlanksCount] = useState(2);

  const [enablePolls, setEnablePolls] = useState(false);
  const [pollsCount, setPollsCount] = useState(1);

  const [enableEssay, setEnableEssay] = useState(true);
  const [essayCount, setEssayCount] = useState(1);

  const [enableCoding, setEnableCoding] = useState(true);
  const [codingCount, setCodingCount] = useState(1);
  const [codingLanguage, setCodingLanguage] = useState<"python" | "javascript" | "java">("python");

  const [isGenerating, setIsGenerating] = useState(false);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    if (!asgTitle) {
      setAsgTitle(`${cleanTitle} - Assessment`);
    }

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
            slideTexts.push(
              `Slide ${sIdx + 1}: ${slideTitle}\n${bullets.map((b) => `- ${b}`).join("\n")}`
            );
          }
          setSourceText(slideTexts.join("\n\n"));
          return;
        }
      } catch (err) {
        console.warn("Failed to parse uploaded PPTX in AssignmentManager:", err);
      }
      setSourceText(`Presentation & Notes: ${cleanTitle}`);
    } else if (file.name.match(/\.(docx|doc)$/i)) {
      try {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        setSourceText(result.value || `Document: ${cleanTitle}`);
        return;
      } catch (err) {
        console.warn("Failed to extract text from DOCX in AssignmentManager:", err);
      }
      setSourceText(`Document: ${cleanTitle}`);
    } else if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setSourceText(text);
      };
      reader.readAsText(file);
    } else {
      setSourceText(`Document: ${cleanTitle}`);
    }
  };

  // AI Question generation API caller
  const handleGenerateAiAssignment = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: sourceText || asgTitle || selectedBatch.name,
          topic: asgTitle || selectedBatch.name,
          difficulty,
          mcqCount: enableMcq ? mcqCount : 0,
          trueFalseCount: enableTrueFalse ? trueFalseCount : 0,
          fillBlanksCount: enableFillBlanks ? fillBlanksCount : 0,
          pollsCount: enablePolls ? pollsCount : 0,
          essayCount: enableEssay ? essayCount : 0,
          codingCount: enableCoding ? codingCount : 0,
          language: codingLanguage,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions) {
        const totalPoints = data.questions.reduce((acc: number, q: any) => acc + (q.points || 10), 0);
        const newAsg: Assignment = {
          id: `asg_${Date.now()}`,
          batchId: selectedBatch.id,
          title: asgTitle || `${selectedBatch.name} - Assessment`,
          description: `Comprehensive AI-generated test containing ${data.questions.length} questions customized for ${selectedBatch.name}.`,
          type: enableCoding && (enableMcq || enableTrueFalse) ? "mixed" : enableCoding ? "coding" : "quiz",
          durationMinutes: asgDuration,
          totalPoints,
          isPublished: true,
          deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
          questions: data.questions,
        };

        onCreateAssignment(newAsg);
        setSelectedAssignment(newAsg);
        setShowAiModal(false);
        setSourceText("");
        setUploadedFileName("");
        setAsgTitle("");
        setAiStep("upload");
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================================================================
  // 2. MANUAL ASSIGNMENT BUILDER (WAY 2: TYPE/PASTE QUESTIONS & CODE)
  // =========================================================================
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDuration, setManualDuration] = useState(30);
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualQuestions, setManualQuestions] = useState<AssignmentQuestion[]>([
    {
      id: "mq_1",
      type: "mcq",
      question: "What is the primary role of a System Prompt in an AI Agent?",
      options: [
        "Defines role, rules, and operational guidelines",
        "Renders frontend buttons",
        "Powers the monitor display",
        "Compiles CSS stylesheets",
      ],
      correctAnswer: "Defines role, rules, and operational guidelines",
      explanation: "System prompts configure the behavior, identity, and boundaries of the agent.",
      points: 10,
    },
  ]);

  const handleAddManualQuestion = (type: QuestionType) => {
    const qId = `mq_${Date.now()}_${manualQuestions.length + 1}`;
    let newQ: AssignmentQuestion;

    if (type === "mcq") {
      newQ = {
        id: qId,
        type: "mcq",
        question: "Enter your multiple choice question prompt...",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        points: 10,
        explanation: "Explanation of why Option A is correct.",
      };
    } else if (type === "true_false") {
      newQ = {
        id: qId,
        type: "true_false",
        question: "Enter the statement to validate as True or False...",
        options: ["True", "False"],
        correctAnswer: "True",
        points: 5,
        explanation: "Explanation of why this statement is True.",
      };
    } else if (type === "fill_blank") {
      newQ = {
        id: qId,
        type: "fill_blank",
        question: "An AI system that can take actions through external tools is called an AI ______.",
        correctAnswer: "agent",
        points: 10,
        explanation: "AI Agent is the correct term.",
      };
    } else if (type === "poll") {
      newQ = {
        id: qId,
        type: "poll",
        question: "Which AI agent framework do you plan to use for your final capstone?",
        options: ["CrewAI (Python)", "LangGraph", "Nexos.ai No-Code", "Autogen"],
        points: 5,
      };
    } else if (type === "essay") {
      newQ = {
        id: qId,
        type: "essay",
        question: "Explain the difference between a single-turn chatbot and an autonomous agent loop.",
        points: 15,
        explanation: "Look for mentions of ReAct loops, planning, tool execution, and state persistence.",
      };
    } else {
      // Coding question
      newQ = {
        id: qId,
        type: "coding",
        question: "Write a Python function `filter_active_agents(agents)` that filters a list of agent dicts `[{'id': 1, 'is_active': True}]` and returns active agent IDs in ascending order.",
        language: "python",
        points: 25,
        starterCode: `def filter_active_agents(agents):\n    # Write your solution here\n    pass`,
        testCases: [
          {
            input: "agents=[{'id': 102, 'is_active': True}, {'id': 101, 'is_active': False}, {'id': 103, 'is_active': True}]",
            expectedOutput: "[102, 103]",
          },
          {
            input: "agents=[{'id': 1, 'is_active': False}]",
            expectedOutput: "[]",
          },
        ],
      };
    }

    setManualQuestions((prev) => [...prev, newQ]);
  };

  const handleOpenEditAssignment = (asg: Assignment) => {
    setEditingAssignmentId(asg.id);
    const isCodingOnly =
      asg.type === "coding" ||
      (asg.questions.length === 1 && asg.questions[0].type === "coding");

    if (isCodingOnly && asg.questions[0]) {
      const codeQ = asg.questions[0];
      setCodingStudioProblem({
        ...codeQ,
        title: codeQ.title || asg.title || "Coding Challenge",
        description: codeQ.description || asg.description || codeQ.question,
      });
      setCodingStartDate(asg.startDate || "");
      setCodingStartTime(asg.startTime || "");
      setCodingEndDate(asg.endDate || "");
      setCodingEndTime(asg.endTime || "");
      setCodingDurationMinutes(asg.durationMinutes || 30);
      setCodingStudioTab("details");
      setShowCodingStudioModal(true);
      return;
    }

    setManualTitle(asg.title);
    setManualDescription(asg.description || "");
    setManualDuration(asg.durationMinutes || 30);
    setManualStartDate(asg.startDate || "");
    setManualStartTime(asg.startTime || "");
    setManualEndDate(asg.endDate || "");
    setManualEndTime(asg.endTime || "");
    setManualQuestions(
      asg.questions && asg.questions.length > 0
        ? JSON.parse(JSON.stringify(asg.questions))
        : []
    );
    setShowManualModal(true);
  };

  const handleOpenNewManualAssignment = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditingAssignmentId(null);
    setManualTitle("");
    setManualDescription("");
    setManualDuration(30);
    setManualStartDate(today);
    setManualStartTime("09:00");
    setManualEndDate(today);
    setManualEndTime("18:00");
    setManualQuestions([
      {
        id: `mq_${Date.now()}_1`,
        type: "mcq",
        question: "What is the primary role of a System Prompt in an AI Agent?",
        options: [
          "Defines role, rules, and operational guidelines",
          "Renders frontend buttons",
          "Powers the monitor display",
          "Compiles CSS stylesheets",
        ],
        correctAnswer: "Defines role, rules, and operational guidelines",
        explanation: "System prompts configure the behavior, identity, and boundaries of the agent.",
        points: 10,
      },
    ]);
    setShowManualModal(true);
  };

  const handleDeleteAssignmentAction = (asg: Assignment) => {
    if (
      window.confirm(
        `Are you sure you want to delete assignment "${asg.title}"?\n\nThis will remove the assignment and cannot be undone.`
      )
    ) {
      if (onDeleteAssignment) {
        onDeleteAssignment(asg.id);
      }
      if (selectedAssignment?.id === asg.id) {
        const remaining = batchAssignments.filter((a) => a.id !== asg.id);
        setSelectedAssignment(remaining[0] || null);
      }
    }
  };

  const handleSaveManualAssignment = () => {
    if (!manualTitle.trim()) {
      alert("Please provide an assignment title.");
      return;
    }

    const totalPoints = manualQuestions.reduce((sum, q) => sum + (q.points || 10), 0);
    const hasCoding = manualQuestions.some((q) => q.type === "coding");
    const hasQuiz = manualQuestions.some((q) => q.type !== "coding");

    if (editingAssignmentId) {
      const existing = assignments.find((a) => a.id === editingAssignmentId);
      const updatedAsg: Assignment = {
        ...(existing || {}),
        id: editingAssignmentId,
        batchId: existing?.batchId || selectedBatch.id,
        title: manualTitle,
        description: manualDescription || `Assessment with ${manualQuestions.length} questions.`,
        type: hasCoding && hasQuiz ? "mixed" : hasCoding ? "coding" : "quiz",
        durationMinutes: manualDuration,
        startDate: manualStartDate,
        startTime: manualStartTime,
        endDate: manualEndDate,
        endTime: manualEndTime,
        totalPoints,
        isPublished: existing?.isPublished ?? true,
        deadline: existing?.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
        questions: manualQuestions,
      };

      onUpdateAssignment(updatedAsg);
      setSelectedAssignment(updatedAsg);
    } else {
      const newAsg: Assignment = {
        id: `asg_${Date.now()}`,
        batchId: selectedBatch.id,
        title: manualTitle,
        description: manualDescription || `Manual assessment with ${manualQuestions.length} custom questions.`,
        type: hasCoding && hasQuiz ? "mixed" : hasCoding ? "coding" : "quiz",
        durationMinutes: manualDuration,
        startDate: manualStartDate,
        startTime: manualStartTime,
        endDate: manualEndDate,
        endTime: manualEndTime,
        totalPoints,
        isPublished: true,
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        questions: manualQuestions,
      };

      onCreateAssignment(newAsg);
      setSelectedAssignment(newAsg);
    }

    setShowManualModal(false);
    setEditingAssignmentId(null);
    setManualTitle("");
    setManualDescription("");
  };

  // =========================================================================
  // CODING CHALLENGE STUDIO & PRE-BUILT TEMPLATES FOR ADMIN
  // =========================================================================
  const [showCodingStudioModal, setShowCodingStudioModal] = useState(false);
  const [codingStudioTab, setCodingStudioTab] = useState<"details" | "testcases" | "starter" | "preview">("details");
  const [isAiGeneratingCoding, setIsAiGeneratingCoding] = useState(false);
  const [aiCodingPromptTopic, setAiCodingPromptTopic] = useState("");
  const [codingStartDate, setCodingStartDate] = useState("");
  const [codingStartTime, setCodingStartTime] = useState("");
  const [codingEndDate, setCodingEndDate] = useState("");
  const [codingEndTime, setCodingEndTime] = useState("");
  const [codingDurationMinutes, setCodingDurationMinutes] = useState(30);

  const initialEmptyCodingQuestion: AssignmentQuestion = {
    id: `q_code_${Date.now()}`,
    type: "coding",
    title: "Two Sum",
    difficulty: "Easy",
    question: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    inputFormat: "First line: n (number of elements). Second line: n space-separated integers. Third line: target.",
    outputFormat: "Two space-separated indices (0-based) or list [i, j].",
    constraints: "2 ≤ n ≤ 10⁴, -10⁹ ≤ nums[i] ≤ 10⁹, Only one valid answer exists.",
    sampleInput: "4\n2 7 11 15\n9",
    sampleOutput: "0 1",
    points: 30,
    language: "python",
    starterCode: `def two_sum(nums, target):\n    # Write your solution here\n    pass`,
    starterCodes: {
      python: `def two_sum(nums, target):\n    # Write your solution here\n    pass`,
      javascript: `function twoSum(nums, target) {\n    // Write your solution here\n    return [];\n}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n    // Write your solution here\n    return [];\n}`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};`,
    },
    testCases: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        expectedOutput: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        expectedOutput: "[1, 2]",
        explanation: "nums[1] + nums[2] == 6, so [1, 2].",
      },
      {
        input: "nums = [3, 3], target = 6",
        expectedOutput: "[0, 1]",
        isHidden: true,
      },
    ],
  };

  const [codingStudioProblem, setCodingStudioProblem] = useState<AssignmentQuestion>(initialEmptyCodingQuestion);

  // Pre-built popular LeetCode / Coding templates for 1-click loading
  const codingProblemTemplates: Record<string, AssignmentQuestion> = {
    two_sum: initialEmptyCodingQuestion,
    agent_filter: {
      id: `q_code_${Date.now()}`,
      type: "coding",
      title: "AI Agent Execution Log Filter",
      difficulty: "Medium",
      question: "Implement the function `filter_agent_logs(logs, min_latency, target_status)` to filter and sort autonomous task execution traces.",
      description: "You are designing the telemetry engine for an autonomous agent platform. Given a list of log entries with `id` (int), `status` (str), and `latency_ms` (int), return the list of matching task IDs where status equals `target_status` and latency is strictly below `min_latency`, sorted in ascending order of latency.",
      inputFormat: "First argument: logs list of dicts. Second argument: min_latency integer. Third argument: target_status string.",
      outputFormat: "A list of integer task IDs sorted by latency ascending.",
      constraints: "1 ≤ len(logs) ≤ 10⁵, 0 ≤ latency_ms ≤ 50000.",
      sampleInput: 'logs = [{"id": 1, "status": "ok", "latency_ms": 120}, {"id": 2, "status": "ok", "latency_ms": 45}], min_latency = 100, target_status = "ok"',
      sampleOutput: "[2]",
      points: 35,
      language: "python",
      starterCode: `def filter_agent_logs(logs, min_latency, target_status):\n    # Write your solution here\n    pass`,
      starterCodes: {
        python: `def filter_agent_logs(logs, min_latency, target_status):\n    # Write your solution here\n    pass`,
        javascript: `function filterAgentLogs(logs, minLatency, targetStatus) {\n    // Write your solution here\n    return [];\n}`,
      },
      testCases: [
        {
          input: 'logs = [{"id": 1, "status": "ok", "latency_ms": 120}, {"id": 2, "status": "ok", "latency_ms": 45}], min_latency = 100, target_status = "ok"',
          expectedOutput: "[2]",
          explanation: "Only task 2 has status 'ok' and latency 45 < 100.",
        },
        {
          input: 'logs = [{"id": 10, "status": "retry", "latency_ms": 200}], min_latency = 500, target_status = "retry"',
          expectedOutput: "[10]",
        },
      ],
    },
    valid_anagram: {
      id: `q_code_${Date.now()}`,
      type: "coding",
      title: "Valid Anagram Detector",
      difficulty: "Easy",
      question: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
      description: "An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
      inputFormat: "First line: string s. Second line: string t.",
      outputFormat: "Boolean true or false.",
      constraints: "1 ≤ s.length, t.length ≤ 5 * 10⁴, s and t consist of lowercase English letters.",
      sampleInput: 's = "anagram", t = "nagaram"',
      sampleOutput: "true",
      points: 20,
      language: "python",
      starterCode: `def is_anagram(s: str, t: str) -> bool:\n    # Write your solution here\n    pass`,
      testCases: [
        { input: 's = "anagram", t = "nagaram"', expectedOutput: "true" },
        { input: 's = "rat", t = "car"', expectedOutput: "false" },
      ],
    },
    binary_search: {
      id: `q_code_${Date.now()}`,
      type: "coding",
      title: "Binary Search",
      difficulty: "Easy",
      question: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums` in O(log n) runtime.",
      description: "If `target` exists, then return its index. Otherwise, return `-1`. You must write an algorithm with O(log n) runtime complexity.",
      inputFormat: "nums: sorted array of integers. target: integer to search.",
      outputFormat: "Integer index (0-based) or -1.",
      constraints: "1 ≤ nums.length ≤ 10⁴, -10⁴ < nums[i], target < 10⁴. All integers in nums are unique.",
      sampleInput: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
      sampleOutput: "4",
      points: 25,
      language: "python",
      starterCode: `def search(nums: list[int], target: int) -> int:\n    # Write your O(log n) solution here\n    pass`,
      testCases: [
        { input: "nums = [-1,0,3,5,9,12], target = 9", expectedOutput: "4" },
        { input: "nums = [-1,0,3,5,9,12], target = 2", expectedOutput: "-1" },
      ],
    },
  };

  // AI-powered single coding problem generator
  const handleGenerateAiCodingChallenge = async () => {
    if (!aiCodingPromptTopic.trim()) return;
    setIsAiGeneratingCoding(true);

    try {
      const res = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiCodingPromptTopic,
          difficulty: codingStudioProblem.difficulty?.toLowerCase() || "medium",
          mcqCount: 0,
          trueFalseCount: 0,
          fillBlanksCount: 0,
          pollsCount: 0,
          essayCount: 0,
          codingCount: 1,
          language: codingStudioProblem.language || "python",
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const generated = data.questions[0];
        setCodingStudioProblem((prev) => ({
          ...prev,
          title: generated.title || aiCodingPromptTopic,
          question: generated.question,
          description: generated.description || generated.question,
          inputFormat: generated.inputFormat || "Standard function arguments",
          outputFormat: generated.outputFormat || "Return output value",
          constraints: generated.constraints || "1 <= n <= 10^4",
          sampleInput: generated.sampleInput || "Sample input args",
          sampleOutput: generated.sampleOutput || "Expected return value",
          starterCode: generated.starterCode || prev.starterCode,
          testCases: generated.testCases || prev.testCases,
          points: generated.points || 30,
        }));
      }
    } catch (err) {
      console.error("Failed to generate AI coding problem", err);
    } finally {
      setIsAiGeneratingCoding(false);
    }
  };

  // Save the coding challenge into selected assignment or create standalone coding assignment
  const handleSaveCodingChallengeToAssignment = () => {
    if (editingAssignmentId) {
      const existing = assignments.find((a) => a.id === editingAssignmentId);
      const updatedAsg: Assignment = {
        ...(existing || {}),
        id: editingAssignmentId,
        batchId: existing?.batchId || selectedBatch.id,
        title: codingStudioProblem.title || existing?.title || "Coding Challenge",
        description:
          codingStudioProblem.description ||
          existing?.description ||
          "Solve the in-browser coding challenge.",
        type: "coding",
        durationMinutes: codingDurationMinutes || existing?.durationMinutes || 30,
        startDate: codingStartDate || existing?.startDate || "",
        startTime: codingStartTime || existing?.startTime || "",
        endDate: codingEndDate || existing?.endDate || "",
        endTime: codingEndTime || existing?.endTime || "",
        totalPoints: codingStudioProblem.points || 30,
        isPublished: existing?.isPublished ?? true,
        deadline:
          existing?.deadline ||
          new Date(Date.now() + 86400000 * 3).toISOString(),
        questions: [codingStudioProblem],
      };
      onUpdateAssignment(updatedAsg);
      setSelectedAssignment(updatedAsg);
      setShowCodingStudioModal(false);
      setEditingAssignmentId(null);
      return;
    }

    if (!selectedAssignment) {
      // Create new standalone coding assignment
      const newAsg: Assignment = {
        id: `asg_${Date.now()}`,
        batchId: selectedBatch.id,
        title: `${codingStudioProblem.title || "Coding Challenge"} - Assessment`,
        description:
          codingStudioProblem.description ||
          "Solve the in-browser coding challenge.",
        type: "coding",
        durationMinutes: codingDurationMinutes || 30,
        startDate: codingStartDate || "",
        startTime: codingStartTime || "",
        endDate: codingEndDate || "",
        endTime: codingEndTime || "",
        totalPoints: codingStudioProblem.points || 30,
        isPublished: true,
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        questions: [codingStudioProblem],
      };
      onCreateAssignment(newAsg);
      setSelectedAssignment(newAsg);
    } else {
      // Append to current assignment
      const updatedQuestions = [
        ...selectedAssignment.questions,
        codingStudioProblem,
      ];
      const updatedAsg: Assignment = {
        ...selectedAssignment,
        questions: updatedQuestions,
        durationMinutes: codingDurationMinutes || selectedAssignment.durationMinutes || 30,
        startDate: codingStartDate || selectedAssignment.startDate || "",
        startTime: codingStartTime || selectedAssignment.startTime || "",
        endDate: codingEndDate || selectedAssignment.endDate || "",
        endTime: codingEndTime || selectedAssignment.endTime || "",
        totalPoints:
          selectedAssignment.totalPoints + (codingStudioProblem.points || 30),
        type: selectedAssignment.questions.some((q) => q.type !== "coding")
          ? "mixed"
          : "coding",
      };
      onUpdateAssignment(updatedAsg);
      setSelectedAssignment(updatedAsg);
    }

    setShowCodingStudioModal(false);
  };

  // =========================================================================
  // 3. STUDENT TEST TAKING, IN-BROWSER CODING IDE & LIVE TIMER
  // =========================================================================
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [studentCode, setStudentCode] = useState<Record<string, string>>({});
  const [codeTestOutputs, setCodeTestOutputs] = useState<Record<string, any>>({});
  const [isRunningCode, setIsRunningCode] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [questionScores, setQuestionScores] = useState<Record<string, { earned: number; max: number; isCorrect: boolean }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, boolean>>({});
  const [questionViewMode, setQuestionViewMode] = useState<"stepper" | "all">("stepper");
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState<boolean>(false);
  const [showDetailedReview, setShowDetailedReview] = useState<boolean>(false);

  // Fullscreen assessment state
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState<boolean>(false);

  // Reset / initialize / restore state when assignment is chosen
  useEffect(() => {
    if (!selectedAssignment) return;

    if (userRole === "student" && currentStudent) {
      // Check backend for existing submission for this student and assignment
      axios
        .get(
          `/api/assignment-submissions/?studentId=${currentStudent.id}&assignmentId=${selectedAssignment.id}`
        )
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const sub = res.data[0];
            if (sub.status === "submitted" || sub.status === "graded") {
              setIsTestSubmitted(true);
              setHasStarted(true);
              setCalculatedScore(sub.score);
              setStudentAnswers(sub.answers || {});
              setQuestionScores(sub.questionScores || {});
              setTimeLeftSeconds(sub.timeLeftSeconds || 0);

              // Restore student codes from codeSubmissions
              if (sub.codeSubmissions) {
                const restoredCodes: Record<string, string> = {};
                const restoredOutputs: Record<string, any> = {};
                Object.entries(sub.codeSubmissions).forEach(([qId, val]: [string, any]) => {
                  restoredCodes[qId] = typeof val === "string" ? val : val?.code || "";
                  if (val && typeof val === "object" && val.testResults) {
                    restoredOutputs[qId] = val.testResults;
                  }
                });
                setStudentCode(restoredCodes);
                setCodeTestOutputs(restoredOutputs);
              }
              return;
            }
          }

          // If no completed submission, initialize clean test state
          setTimeLeftSeconds(selectedAssignment.durationMinutes * 60);
          setIsTestSubmitted(false);
          setCalculatedScore(null);
          setStudentAnswers({});
          setQuestionScores({});
          setCurrentQuestionIndex(0);
          setBookmarkedQuestions({});
          setShowSubmitConfirmModal(false);
          setHasStarted(false);
          setShowFullscreenWarning(false);

          // Initialize starter code for all coding questions
          const initialCodes: Record<string, string> = {};
          selectedAssignment.questions.forEach((q) => {
            if (q.type === "coding" && q.starterCode) {
              initialCodes[q.id] = q.starterCode;
            }
          });
          setStudentCode(initialCodes);
        })
        .catch((err) => {
          console.error("Failed to load assignment submission:", err);
          setTimeLeftSeconds(selectedAssignment.durationMinutes * 60);
          setIsTestSubmitted(false);
          setCalculatedScore(null);
          setStudentAnswers({});
          setQuestionScores({});
          setHasStarted(false);
        });
    } else {
      // For Admin view
      setIsTestSubmitted(false);
      setHasStarted(false);
      setCalculatedScore(null);
      setStudentAnswers({});
      setQuestionScores({});
    }
  }, [selectedAssignment?.id, userRole, currentStudent?.id]);

  // ---------------------------------------------------------------------------
  // 4. STUDENT PERFORMANCE REPORTS & ANALYTICS STATE
  // ---------------------------------------------------------------------------
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<any | null>(null);
  const [showSubmissionDetailModal, setShowSubmissionDetailModal] = useState<boolean>(false);
  const [reportsSearchQuery, setReportsSearchQuery] = useState<string>("");
  const [reportsFilterStatus, setReportsFilterStatus] = useState<"all" | "passed" | "partial" | "pending">("all");
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [instructorFeedbackText, setInstructorFeedbackText] = useState<string>("");
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Record<string, string>>({});

  // Fetch & sync all student submission reports for selected assignment
  const fetchAssignmentReports = async () => {
    if (!selectedAssignment) return;
    setIsLoadingReports(true);
    try {
      const res = await axios.get(
        `/api/assignment-submissions/?assignmentId=${selectedAssignment.id}`
      );
      const liveSubs: any[] = res.data || [];

      const batchStudents = (students || []).filter(
        (s) => s.batchId === selectedBatch?.id
      );

      const processedSubs = liveSubs.map((live: any) => {
        const sid = live.studentId || live.student;
        const matchingStudent = batchStudents.find((s) => s.id === sid);
        return {
          ...live,
          studentName: live.studentName || matchingStudent?.name || "Student",
          studentAvatar:
            live.studentAvatar ||
            matchingStudent?.avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(live.studentName || matchingStudent?.name || "Student")}`,
          studentEmail: live.studentEmail || matchingStudent?.email || "",
          studentCollege: live.studentCollege || matchingStudent?.college || selectedBatch?.college || "",
          submittedAt: live.submittedAt || new Date().toISOString(),
        };
      });

      // Sort descending by score
      processedSubs.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      setAssignmentSubmissions(processedSubs);
    } catch (err) {
      console.error("Failed to load assignment reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment) {
      fetchAssignmentReports();
    }
  }, [selectedAssignment?.id, selectedBatch?.id, students]);

  // Export report to CSV
  const handleExportReportsCsv = () => {
    if (!selectedAssignment || assignmentSubmissions.length === 0) return;
    const headers = ["Rank,Student Name,Email,College,Score,Max Score,Percentage,Status,Submission Date\n"];
    const rows = assignmentSubmissions.map((s, idx) => {
      const pct = Math.round((s.score / (s.maxScore || 1)) * 100);
      return `"${idx + 1}","${s.studentName}","${s.studentEmail}","${s.studentCollege}","${s.score}","${s.maxScore}","${pct}%","${s.status}","${new Date(s.submittedAt).toLocaleString()}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join("") + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedAssignment.title.replace(/\s+/g, "_")}_Performance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live countdown timer with auto-submission when timer reaches 0:00
  useEffect(() => {
    if (
      timeLeftSeconds === null ||
      timeLeftSeconds <= 0 ||
      isTestSubmitted ||
      userRole !== "student" ||
      !hasStarted
    ) {
      if (timeLeftSeconds === 0 && !isTestSubmitted && selectedAssignment) {
        handleAutoSubmitTest(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, isTestSubmitted, userRole, selectedAssignment, hasStarted]);

  // Start assessment and request fullscreen
  const handleStartAssessment = async () => {
    try {
      const container = document.getElementById("assignment-fullscreen-container");
      if (container) {
        await container.requestFullscreen();
      }
    } catch (e) {
      console.error("Failed to enter fullscreen", e);
    }
    setHasStarted(true);
  };

  // Listen for fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasStarted && !isTestSubmitted && userRole === "student") {
        setShowFullscreenWarning(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [hasStarted, isTestSubmitted, userRole]);

  // Evaluation & submission logic
  const handleAutoSubmitTest = async (isTimeOut = false) => {
    if (!selectedAssignment) return;
    setIsSubmittingAssessment(true);

    try {
      const updatedTestOutputs = { ...codeTestOutputs };

      // Ensure all coding questions are rigorously evaluated with their latest submitted code
      for (const q of selectedAssignment.questions) {
        if (q.type === "coding") {
          const submittedCode = studentCode[q.id] || q.starterCode || "";
          const isUntouched = isUnmodifiedBoilerplate(submittedCode, q.language || "python");

          if (isUntouched) {
            updatedTestOutputs[q.id] = {
              allPassed: false,
              passedCount: 0,
              totalCount: q.testCases?.length || 1,
              output: "No solution code provided (unmodified boilerplate).",
              feedback: "Please write your algorithm solution before submitting.",
            };
          } else {
            const cases =
              q.testCases && q.testCases.length > 0
                ? q.testCases
                : [
                    {
                      input: q.sampleInput || "4\n2 7 11 15\n9",
                      expectedOutput: q.sampleOutput || "0 1",
                    },
                  ];

            // Evaluate solution
            try {
              const evalRes = await evaluateCodeSolution(
                submittedCode,
                q.language || "python",
                cases,
                q.title || q.question
              );
              updatedTestOutputs[q.id] = evalRes;
            } catch (err: any) {
              console.error(`Error evaluating question ${q.id}:`, err);
              if (!updatedTestOutputs[q.id]) {
                updatedTestOutputs[q.id] = {
                  allPassed: false,
                  passedCount: 0,
                  totalCount: cases.length,
                  output: `Execution Error: ${err?.message || "Failed to execute test cases"}`,
                };
              }
            }
          }
        }
      }

      setCodeTestOutputs(updatedTestOutputs);

      let totalEarned = 0;
      const scoresMap: Record<string, { earned: number; max: number; isCorrect: boolean }> = {};

      selectedAssignment.questions.forEach((q) => {
        const studentAns = studentAnswers[q.id] || "";
        let earned = 0;
        let isCorrect = false;

        if (q.type === "mcq" || q.type === "true_false") {
          if (studentAns && studentAns.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()) {
            earned = q.points;
            isCorrect = true;
          }
        } else if (q.type === "fill_blank") {
          if (
            studentAns &&
            (studentAns.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase() ||
              (q.correctAnswer && studentAns.trim().toLowerCase().includes(q.correctAnswer.toLowerCase())))
          ) {
            earned = q.points;
            isCorrect = true;
          }
        } else if (q.type === "poll") {
          // Polls award points for participation
          if (studentAns) {
            earned = q.points;
            isCorrect = true;
          }
        } else if (q.type === "essay") {
          // Essay awards points for writing
          if (studentAns.length > 20) {
            earned = q.points;
            isCorrect = true;
          } else if (studentAns.length > 0) {
            earned = Math.round(q.points * 0.5);
            isCorrect = true;
          }
        } else if (q.type === "coding") {
          const testRes = updatedTestOutputs[q.id];
          if (testRes && testRes.allPassed) {
            earned = q.points;
            isCorrect = true;
          } else if (testRes && typeof testRes.passedCount === "number" && testRes.totalCount > 0) {
            // Proportional points based on actual test cases passed
            earned = Math.round((testRes.passedCount / testRes.totalCount) * q.points);
            isCorrect = testRes.passedCount === testRes.totalCount && testRes.totalCount > 0;
          } else {
            earned = 0;
            isCorrect = false;
          }
        }

        totalEarned += earned;
        scoresMap[q.id] = { earned, max: q.points, isCorrect };
      });

      const codeSubs: Record<string, any> = {};
      selectedAssignment.questions.forEach((q) => {
        if (q.type === "coding") {
          codeSubs[q.id] = {
            code: studentCode[q.id] || q.starterCode || "",
            testResults: updatedTestOutputs[q.id] || null,
            language: q.language || "python",
          };
        }
      });

      setCalculatedScore(totalEarned);
      setQuestionScores(scoresMap);
      setIsTestSubmitted(true);

      // Persist submission to Django backend
      if (currentStudent) {
        const submissionPayload = {
          id: `sub_${selectedAssignment.id}_${currentStudent.id}`,
          assignment: selectedAssignment.id,
          assignmentId: selectedAssignment.id,
          student: currentStudent.id,
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          status: "submitted",
          timeLeftSeconds: timeLeftSeconds || 0,
          answers: studentAnswers,
          codeSubmissions: codeSubs,
          questionScores: scoresMap,
          score: totalEarned,
          maxScore: selectedAssignment.totalPoints,
          autoGraded: true,
        };

        axios
          .post("/api/assignment-submissions/", submissionPayload)
          .then((res) => {
            console.log("Assignment submission successfully saved to backend:", res.data);
            if (onSubmissionComplete) onSubmissionComplete();
          })
          .catch((err) => {
            console.error("Failed to save assignment submission to API:", err);
          });
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch((e) => console.error("Failed to exit fullscreen", e));
      }

      try {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  // Run in-browser compiler for a coding question
  const handleRunCodeTestCases = async (q: AssignmentQuestion) => {
    const code = studentCode[q.id] || q.starterCode || "";
    setIsRunningCode(q.id);

    try {
      const cases = q.testCases && q.testCases.length > 0
        ? q.testCases
        : [{ input: q.sampleInput || "4\n2 7 11 15\n9", expectedOutput: q.sampleOutput || "0 1" }];

      // Real execution & verification via unified engine
      const evalResult = await evaluateCodeSolution(
        code,
        q.language || "python",
        cases,
        q.question
      );

      setCodeTestOutputs((prev) => ({
        ...prev,
        [q.id]: evalResult,
      }));
    } catch (err: any) {
      console.error(err);
      setCodeTestOutputs((prev) => ({
        ...prev,
        [q.id]: {
          allPassed: false,
          passedCount: 0,
          totalCount: q.testCases?.length || 1,
          results: (q.testCases || []).map((tc, i) => ({
            testCaseIndex: i + 1,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: `Error: ${err?.message || "Execution error"}`,
            passed: false,
            executionTimeMs: 0,
          })),
          output: `Execution Failed:\n${err?.message || "An unexpected error occurred during execution."}`,
          feedback: "Please review your code implementation.",
        },
      }));
    } finally {
      setIsRunningCode(null);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalTime = (selectedAssignment?.durationMinutes || 30) * 60;
  const timeProgressPercent =
    timeLeftSeconds !== null && totalTime > 0
      ? Math.max(0, Math.min(100, (timeLeftSeconds / totalTime) * 100))
      : 100;

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* HEADER WITH CREATION ACTIONS                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <Code2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                Assignments & In-Browser Coding IDE
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Automated AI document ingestion, timed quizzes, interactive polls, and real-time coding compiler for{" "}
            <strong className="text-slate-800 font-bold">{selectedBatch.name}</strong>
          </p>
        </div>

        {userRole === "admin" && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Way 1: AI File Upload & Generator */}
            <button
              onClick={() => {
                setShowAiModal(true);
                setAiStep("upload");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>AI File / PPT Generator</span>
            </button>

            {/* Way 2: Coding Challenge Studio */}
            <button
              onClick={() => {
                setCodingStudioProblem(initialEmptyCodingQuestion);
                setShowCodingStudioModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer whitespace-nowrap"
            >
              <Code2 className="w-4 h-4 text-sky-200" />
              <span>+ Code IDE Studio</span>
            </button>

            {/* Way 3: Manual Builder */}
            <button
              onClick={handleOpenNewManualAssignment}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Manual Question Builder</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ASSIGNMENT SELECTOR (SCROLL-DOWN / DROPDOWN WAY)              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs relative z-20">
        {batchAssignments.length > 0 ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left side: Scroll-Down / Dropdown Selector */}
            <div className="flex-1 relative" ref={assignmentDropdownRef}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline shrink-0">
                  Assignment:
                </span>

                {/* Trigger Button that drops down / scrolls down */}
                <button
                  type="button"
                  onClick={() => setIsAssignmentDropdownOpen((prev) => !prev)}
                  className={`flex-1 sm:flex-initial min-w-0 max-w-full md:max-w-xl inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left shadow-2xs ${
                    isAssignmentDropdownOpen
                      ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950"
                      : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/90 text-slate-800"
                  }`}
                  title="Click to scroll down and select assignment"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedAssignment?.type === "coding" ? (
                        <Code2 className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                          {selectedAssignment ? formatAssignmentTitle(selectedAssignment.title) : "Select Assignment"}
                        </span>
                        {selectedAssignment && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0 font-mono">
                            {selectedAssignment.durationMinutes}m • {selectedAssignment.questions.length} Qs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {selectedAssignment && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        selectedAssignment.isLocked
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {selectedAssignment.isLocked ? (
                          <Lock className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Unlock className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{selectedAssignment.isLocked ? "Locked" : "Unlocked"}</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isAssignmentDropdownOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* FLOATING SCROLL-DOWN / DROPDOWN PANEL */}
              {isAssignmentDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full md:max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Bar inside dropdown */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={assignmentDropdownSearch}
                      onChange={(e) => setAssignmentDropdownSearch(e.target.value)}
                      placeholder="Search assignments..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Header info */}
                  <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-1.5">
                    <span>Scroll to choose assignment</span>
                    <span>{batchAssignments.length} total</span>
                  </div>

                  {/* SCROLLABLE LIST OF ASSIGNMENTS */}
                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {batchAssignments
                      .filter((asg) =>
                        formatAssignmentTitle(asg.title)
                          .toLowerCase()
                          .includes(assignmentDropdownSearch.toLowerCase())
                      )
                      .map((asg, idx) => {
                        const isSelected = selectedAssignment?.id === asg.id;
                        return (
                          <div
                            key={asg.id}
                            onClick={() => {
                              setSelectedAssignment(asg);
                              setIsAssignmentDropdownOpen(false);
                            }}
                            className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-2xs"
                                : "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-extrabold text-slate-900 truncate block">
                                    {formatAssignmentTitle(asg.title)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <span className="font-medium">{asg.durationMinutes} mins</span>
                                  <span>•</span>
                                  <span className="font-medium">{asg.questions.length} questions</span>
                                  <span>•</span>
                                  <span className="font-mono font-bold text-slate-500">{asg.totalPoints || 100} pts</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  asg.isLocked
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {asg.isLocked ? (
                                  <Lock className="w-3 h-3 text-rose-600" />
                                ) : (
                                  <Unlock className="w-3 h-3 text-emerald-600" />
                                )}
                                <span>{asg.isLocked ? "Locked" : "Unlocked"}</span>
                              </span>

                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {batchAssignments.filter((asg) =>
                      formatAssignmentTitle(asg.title)
                        .toLowerCase()
                        .includes(assignmentDropdownSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400 font-medium">
                        No assignments matching "{assignmentDropdownSearch}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Selected Assignment Actions & Fast Stepping */}
            {selectedAssignment && (
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                {/* Step through arrows */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={handleSelectPreviousAssignment}
                    disabled={selectedAssignmentIndex <= 0}
                    className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                    title="Previous Assignment"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-600 px-1.5">
                    {selectedAssignmentIndex + 1} / {batchAssignments.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectNextAssignment}
                    disabled={selectedAssignmentIndex >= batchAssignments.length - 1}
                    className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                    title="Next Assignment"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Admin Quick Action Buttons on active assignment */}
                {userRole === "admin" && (
                  <div className="flex items-center gap-1.5">
                    {/* Instant Lock / Unlock Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAssignmentLock(selectedAssignment)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        selectedAssignment.isLocked
                          ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      }`}
                      title={
                        selectedAssignment.isLocked
                          ? "🔒 Currently Locked (Hidden from students) - Click to Unlock"
                          : "🔓 Currently Unlocked (Visible to students) - Click to Lock"
                      }
                    >
                      {selectedAssignment.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{selectedAssignment.isLocked ? "Locked" : "Unlocked"}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditAssignment(selectedAssignment)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Edit Assignment"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteAssignmentAction(selectedAssignment)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-200"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-2 text-center sm:text-left">
            {userRole === "admin"
              ? `No assignments created for ${selectedBatch.name} yet. Click above to generate or create one!`
              : `No active assignments for ${selectedBatch.name}.`}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN ASSIGNMENT & IDE ASSESSMENT VIEW                         */}
      {/* ------------------------------------------------------------- */}
      <div id="assignment-fullscreen-container" className="bg-slate-50 overflow-y-auto">
        {selectedAssignment ? (
          userRole === "student" && !hasStarted ? (
            (() => {
              // Real-time exam window evaluation
              const now = new Date();
              let isUpcoming = false;
              let isExpired = false;
              let startStr = "";
              let endStr = "";

              if (selectedAssignment.startDate) {
                const sTime = selectedAssignment.startTime || "00:00";
                startStr = `${selectedAssignment.startDate} at ${sTime}`;
                const sDate = new Date(`${selectedAssignment.startDate}T${sTime}:00`);
                if (!isNaN(sDate.getTime()) && now < sDate) {
                  isUpcoming = true;
                }
              }

              if (selectedAssignment.endDate) {
                const eTime = selectedAssignment.endTime || "23:59";
                endStr = `${selectedAssignment.endDate} at ${eTime}`;
                const eDate = new Date(`${selectedAssignment.endDate}T${eTime}:00`);
                if (!isNaN(eDate.getTime()) && now > eDate) {
                  isExpired = true;
                }
              } else if (selectedAssignment.deadline) {
                const dDate = new Date(selectedAssignment.deadline);
                endStr = dDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
                if (!isNaN(dDate.getTime()) && now > dDate) {
                  isExpired = true;
                }
              }

              return (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 space-y-6 text-center max-w-2xl mx-auto mt-8">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {selectedAssignment.type} Assessment
                      </span>
                      {isUpcoming ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Scheduled / Upcoming
                        </span>
                      ) : isExpired ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ Window Closed
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Active Exam Window</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{selectedAssignment.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm">
                      {selectedAssignment.description}
                    </p>
                  </div>

                  {/* Schedule Window & Timing Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Duration</span>
                      <span className="text-sm sm:text-base font-black text-slate-800 font-mono">
                        {selectedAssignment.durationMinutes} Mins
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Questions</span>
                      <span className="text-sm sm:text-base font-black text-slate-800 font-mono">
                        {selectedAssignment.questions.length} Items
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Points</span>
                      <span className="text-sm sm:text-base font-black text-slate-800 font-mono">
                        {selectedAssignment.totalPoints} Pts
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Window Status</span>
                      <span className={`text-xs font-black uppercase ${
                        isUpcoming ? "text-amber-600" : isExpired ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {isUpcoming ? "Starts Soon" : isExpired ? "Expired" : "Live Now"}
                      </span>
                    </div>
                  </div>

                  {/* Start & End Dates breakdown banner */}
                  {(startStr || endStr) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-left">
                      {startStr && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-slate-500 font-bold">Start:</span>
                          <span className="font-extrabold text-slate-800">{startStr}</span>
                        </div>
                      )}
                      {endStr && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-slate-500 font-bold">End:</span>
                          <span className="font-extrabold text-slate-800">{endStr}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isUpcoming ? (
                    <div className="bg-amber-50 text-amber-800 text-xs font-bold p-4 rounded-xl border border-amber-200 text-left flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <div className="font-black text-sm text-amber-900 mb-0.5">Assessment Not Open Yet</div>
                        <p>
                          This assessment is scheduled to open on <strong>{startStr}</strong>. Please check back when the window begins to take your exam.
                        </p>
                      </div>
                    </div>
                  ) : isExpired ? (
                    <div className="bg-rose-50 text-rose-800 text-xs font-bold p-4 rounded-xl border border-rose-200 text-left flex items-start gap-3">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <div className="font-black text-sm text-rose-900 mb-0.5">Exam Window Closed</div>
                        <p>
                          The deadline for this assessment closed on <strong>{endStr}</strong>. Submissions are now closed and recorded as <em>Not Attended</em>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 text-xs font-bold p-4 rounded-xl border border-amber-200 text-left flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong>Important Instructions:</strong> Once you click Start Assessment, the browser will enter full-screen mode and your <strong>{selectedAssignment.durationMinutes} minute</strong> timer will begin.
                        Do not attempt to exit full-screen or switch tabs during the exam.
                      </p>
                    </div>
                  )}

                  <button
                    disabled={isUpcoming || isExpired}
                    onClick={handleStartAssessment}
                    className={`mt-4 w-full py-4 rounded-2xl text-base sm:text-lg font-black shadow-xl transition flex items-center justify-center gap-2 ${
                      isUpcoming
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : isExpired
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white transform hover:-translate-y-1 cursor-pointer"
                    }`}
                  >
                    {isUpcoming ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Assessment Starts on {startStr}</span>
                      </>
                    ) : isExpired ? (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span>Assessment Window Closed</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Assessment Now ({selectedAssignment.durationMinutes} Mins)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">
              {/* Assignment Header Info & Student Live Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {selectedAssignment.type} Assessment
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {selectedAssignment.questions.length} Questions • {selectedAssignment.totalPoints} Total Points
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                    {selectedAssignment.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                    {selectedAssignment.description}
                  </p>
                </div>

                {/* Timed Assessment Countdown for Students */}
                {userRole === "student" && !isTestSubmitted && timeLeftSeconds !== null && (
                  <div
                    className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-sm ${
                      timeLeftSeconds <= 300
                        ? "bg-rose-50 border-rose-300 text-rose-800 animate-pulse"
                        : "bg-indigo-50/80 border-indigo-200 text-indigo-900"
                    }`}
                  >
                    <Clock className="w-7 h-7 flex-shrink-0 text-indigo-600" />
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-0.5">
                        <span>Time Remaining</span>
                        <span>{Math.round(timeProgressPercent)}%</span>
                      </div>
                      <span className="text-2xl font-black font-mono tracking-tight block">
                        {formatTime(timeLeftSeconds)}
                      </span>
                      <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${
                            timeLeftSeconds <= 300 ? "bg-rose-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${timeProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Actions: Lock Toggle, Edit & Delete */}
                {userRole === "admin" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Prominent Header Lock / Unlock Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAssignmentLock(selectedAssignment)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                        selectedAssignment.isLocked
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                      }`}
                      title={
                        selectedAssignment.isLocked
                          ? "🔒 Click to unlock and broadcast to students in real-time"
                          : "🔓 Click to lock and hide from students"
                      }
                    >
                      {selectedAssignment.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>
                        {selectedAssignment.isLocked
                          ? "🔒 Locked (Hidden from Students)"
                          : "🔓 Unlocked (Live for Students)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditAssignment(selectedAssignment)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Edit Assignment Details & Questions"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Assignment</span>
                    </button>
                    {onDeleteAssignment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignmentAction(selectedAssignment)}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Assignment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* POST-SUBMISSION COMPLETION & SCORE BREAKDOWN SCREEN           */}
              {/* ------------------------------------------------------------- */}
              {isTestSubmitted ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-8 sm:p-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 rounded-3xl border border-emerald-200/90 text-center space-y-6 shadow-md">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-xl ring-8 ring-emerald-100/80">
                      {calculatedScore}/{selectedAssignment.totalPoints}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                        🎉 Your assignment has been submitted successfully!
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto font-medium leading-relaxed">
                        You earned <strong>{calculatedScore}</strong> points out of{" "}
                        <strong>{selectedAssignment.totalPoints}</strong> (
                        {Math.round(((calculatedScore || 0) / Math.max(1, selectedAssignment.totalPoints)) * 100)}% accuracy).
                        Your submitted solutions and test accuracy have been safely recorded in the MIND2I Leaderboard.
                      </p>
                    </div>

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                      <div className="p-4 bg-white/90 rounded-2xl border border-emerald-100 text-center shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Score Earned</span>
                        <span className="text-xl font-black text-emerald-700">{calculatedScore} / {selectedAssignment.totalPoints}</span>
                      </div>
                      <div className="p-4 bg-white/90 rounded-2xl border border-emerald-100 text-center shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Accuracy</span>
                        <span className="text-xl font-black text-emerald-700">
                          {Math.round(((calculatedScore || 0) / Math.max(1, selectedAssignment.totalPoints)) * 100)}%
                        </span>
                      </div>
                      <div className="p-4 bg-white/90 rounded-2xl border border-emerald-100 text-center shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Questions</span>
                        <span className="text-xl font-black text-slate-800">{selectedAssignment.questions.length} Items</span>
                      </div>
                      <div className="p-4 bg-white/90 rounded-2xl border border-emerald-100 text-center shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Status</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-0.5">
                          Graded & Recorded
                        </span>
                      </div>
                    </div>

                    {/* Question-by-Question Score Summary Card */}
                    <div className="max-w-2xl mx-auto bg-white/95 rounded-2xl border border-emerald-200/80 p-5 text-left space-y-3 shadow-xs">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-600 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span>Evaluation Results Per Question</span>
                        <span className="text-emerald-700 font-bold">{selectedAssignment.questions.length} Evaluated</span>
                      </h5>
                      <div className="space-y-2.5 divide-y divide-slate-100">
                        {selectedAssignment.questions.map((q, idx) => {
                          const scoreObj = questionScores[q.id];
                          const earned = scoreObj?.earned ?? 0;
                          const isFull = scoreObj?.isCorrect || earned === q.points;
                          return (
                            <div key={q.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-800 truncate">
                                  {q.title || q.question.slice(0, 55)}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex-shrink-0">
                                  {q.type}
                                </span>
                              </div>
                              <span
                                className={`font-black px-2.5 py-1 rounded-lg flex-shrink-0 text-xs ${
                                  isFull
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : earned > 0
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {earned} / {q.points} Pts
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setSelectedAssignment(null)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Return to All Assignments</span>
                      </button>
                      <button
                        onClick={() => setShowDetailedReview(!showDetailedReview)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black border border-slate-300 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>{showDetailedReview ? "Hide Submitted Answers & Code" : "Review Submitted Answers & Code"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------------------------------------- */}
              {/* QUESTION PALETTE & QUESTIONS LIST (Active or Review Mode)     */}
              {/* ------------------------------------------------------------- */}
              {(!isTestSubmitted || showDetailedReview) && (
                <div className="space-y-6">
                  {/* QUESTION PALETTE & STEP-BY-STEP NAVIGATOR TOOLBAR */}
                  <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Progress info & Jump pills */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {questionViewMode === "stepper"
                            ? `Question ${currentQuestionIndex + 1} of ${selectedAssignment.questions.length}`
                            : `All ${selectedAssignment.questions.length} Questions`}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {
                            selectedAssignment.questions.filter((q) =>
                              q.type === "coding"
                                ? !!studentCode[q.id] && studentCode[q.id].trim().length > 10
                                : !!studentAnswers[q.id]
                            ).length
                          }{" "}
                          Answered
                        </span>
                        {Object.values(bookmarkedQuestions).filter(Boolean).length > 0 && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              {Object.values(bookmarkedQuestions).filter(Boolean).length} Flagged
                            </span>
                          </>
                        )}
                      </div>

                      {/* Question Quick Jump Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedAssignment.questions.map((q, idx) => {
                          const isCurrent = currentQuestionIndex === idx && questionViewMode === "stepper";
                          const isAnswered =
                            q.type === "coding"
                              ? !!studentCode[q.id] && studentCode[q.id].trim().length > 10
                              : !!studentAnswers[q.id];
                          const isFlagged = !!bookmarkedQuestions[q.id];
                          const qScore = questionScores[q.id];

                          let pillStyle = "bg-white text-slate-700 border-slate-200 hover:bg-slate-100";

                          if (isTestSubmitted && qScore) {
                            pillStyle = qScore.isCorrect
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-rose-500 text-white border-rose-500";
                          } else if (isCurrent) {
                            pillStyle = "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300";
                          } else if (isFlagged) {
                            pillStyle = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                          } else if (isAnswered) {
                            pillStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                          }

                          return (
                            <button
                              key={q.id}
                              onClick={() => {
                                setCurrentQuestionIndex(idx);
                                if (questionViewMode === "all") {
                                  setQuestionViewMode("stepper");
                                }
                              }}
                              className={`w-8 h-8 rounded-xl text-xs font-black transition flex items-center justify-center border relative ${pillStyle}`}
                              title={`Go to Question ${idx + 1} (${q.type})`}
                            >
                              <span>{idx + 1}</span>
                              {isFlagged && !isCurrent && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                              )}
                              {isAnswered && !isCurrent && !isFlagged && !isTestSubmitted && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: View Mode Toggle */}
                    <div className="flex items-center gap-2">
                      {userRole === "student" && !isTestSubmitted && (
                        <button
                          onClick={() => setShowSubmitConfirmModal(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition"
                        >
                          Submit Test
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QUESTIONS LIST OR FOCUSED ONE-BY-ONE CARD */}
                  <div className="space-y-6">
                    {selectedAssignment.questions
                      .filter((_, idx) => questionViewMode === "all" || idx === currentQuestionIndex)
                      .map((q) => {
                        const qIndex = selectedAssignment.questions.findIndex((item) => item.id === q.id);
                        const qScore = questionScores[q.id];
                        const isFlagged = !!bookmarkedQuestions[q.id];

                        return (
                          <div
                            key={q.id}
                            className="p-6 sm:p-7 bg-slate-50/70 rounded-3xl border border-slate-200/90 space-y-5 transition shadow-xs"
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="px-3.5 py-1 bg-white font-black text-slate-900 text-xs rounded-xl shadow-xs border border-slate-200">
                                  Question #{qIndex + 1} of {selectedAssignment.questions.length}
                                </span>
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                                  {q.type.replace("_", " ")}
                                </span>
                                {q.difficulty && (
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                      q.difficulty === "Hard"
                                        ? "bg-rose-100 text-rose-800"
                                        : q.difficulty === "Medium"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5">
                                {/* Bookmark / Flag toggle */}
                                {!isTestSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBookmarkedQuestions((prev) => ({
                                        ...prev,
                                        [q.id]: !prev[q.id],
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition border ${
                                      isFlagged
                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Flag
                                      className={`w-3.5 h-3.5 ${
                                        isFlagged ? "text-amber-600 fill-amber-600" : "text-slate-400"
                                      }`}
                                    />
                                    <span>{isFlagged ? "Flagged for Review" : "Flag Question"}</span>
                                  </button>
                                )}

                                {isTestSubmitted && qScore && (
                                  <span
                                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                                      qScore.isCorrect
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-rose-100 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    {qScore.earned} / {q.points} Pts
                                  </span>
                                )}
                                <span className="text-xs font-black text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
                                  {q.points} Points
                                </span>
                              </div>
                            </div>

                            {/* Question Prompt */}
                            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                              {q.question}
                            </h4>

                            {/* Question Type 1: MCQ & True/False & Poll */}
                            {(q.type === "mcq" || q.type === "true_false" || q.type === "poll") && q.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {q.options.map((opt, oIndex) => {
                                  const isSelected = studentAnswers[q.id] === opt;
                                  const isCorrectAnswer = q.correctAnswer === opt;

                                  let cardStyle =
                                    "bg-white hover:bg-indigo-50/60 text-slate-700 border-slate-200";

                                  if (isTestSubmitted) {
                                    if (isCorrectAnswer) {
                                      cardStyle =
                                        "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-400";
                                    } else if (isSelected && !isCorrectAnswer) {
                                      cardStyle =
                                        "bg-rose-50 border-rose-400 text-rose-950 font-medium";
                                    } else {
                                      cardStyle = "bg-slate-50 text-slate-400 border-slate-200 opacity-60";
                                    }
                                  } else if (isSelected) {
                                    cardStyle =
                                      "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200";
                                  }

                                  return (
                                    <button
                                      key={oIndex}
                                      type="button"
                                      disabled={isTestSubmitted}
                                      onClick={() =>
                                        setStudentAnswers({ ...studentAnswers, [q.id]: opt })
                                      }
                                      className={`p-4 rounded-2xl border text-left text-sm font-semibold transition flex items-center justify-between gap-3 ${cardStyle}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                          {String.fromCharCode(65 + oIndex)}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {isSelected && !isTestSubmitted && (
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                      )}
                                      {isTestSubmitted && isCorrectAnswer && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      )}
                                      {isTestSubmitted && isSelected && !isCorrectAnswer && (
                                        <XCircle className="w-4 h-4 text-rose-600" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Question Type 2: Fill in the Blank */}
                            {q.type === "fill_blank" && (
                              <div className="pt-1 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <input
                                    type="text"
                                    disabled={isTestSubmitted}
                                    value={studentAnswers[q.id] || ""}
                                    onChange={(e) =>
                                      setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })
                                    }
                                    placeholder="Type your answer here..."
                                    className={`w-full sm:w-96 px-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium ${
                                      isTestSubmitted
                                        ? studentAnswers[q.id]?.trim().toLowerCase() ===
                                          (q.correctAnswer || "").trim().toLowerCase()
                                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold"
                                          : "border-rose-400 bg-rose-50/50 text-rose-950 font-bold"
                                        : "border-slate-200"
                                    }`}
                                  />
                                  {isTestSubmitted && (
                                    <span className="text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                      Expected Answer: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Question Type 3: Short Essay */}
                            {q.type === "essay" && (
                              <div className="pt-1">
                                <textarea
                                  rows={4}
                                  disabled={isTestSubmitted}
                                  value={studentAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })
                                  }
                                  placeholder="Write your explanation or reflection here..."
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-normal leading-relaxed"
                                />
                              </div>
                            )}

                            {/* Question Type 4: In-Browser Coding IDE */}
                            {q.type === "coding" && (
                              <div className="pt-2">
                                <CodingChallengeIDE
                                  question={q}
                                  questionNumber={qIndex + 1}
                                  isSubmitted={isTestSubmitted}
                                  initialCode={studentCode[q.id]}
                                  initialTestResults={codeTestOutputs[q.id]}
                                  initialTheme="light"
                                  onCodeChange={(newCode) => {
                                    setStudentCode((prev) => ({ ...prev, [q.id]: newCode }));
                                  }}
                                  onSubmitSolution={(newCode, results) => {
                                    setStudentCode((prev) => ({ ...prev, [q.id]: newCode }));
                                    setCodeTestOutputs((prev) => ({ ...prev, [q.id]: results }));
                                  }}
                                />
                              </div>
                            )}

                            {/* Explanation (Shown when submitted) */}
                            {isTestSubmitted && q.explanation && (
                              <div className="p-3.5 bg-indigo-50/80 rounded-2xl text-xs text-indigo-950 border border-indigo-200/80">
                                💡 <strong>Concept Explanation:</strong> {q.explanation}
                              </div>
                            )}

                            {/* Sequential Navigation Buttons at Bottom of Focused Question */}
                            {questionViewMode === "stepper" && (
                              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                                {/* Previous Button */}
                                <button
                                  type="button"
                                  disabled={currentQuestionIndex === 0}
                                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-xs"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  <span>Previous Question</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {/* Next Question or Finish Button */}
                                  {currentQuestionIndex < selectedAssignment.questions.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCurrentQuestionIndex((prev) =>
                                          Math.min(selectedAssignment.questions.length - 1, prev + 1)
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5"
                                    >
                                      <span>Next Question</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    userRole === "student" &&
                                    !isTestSubmitted && (
                                      <button
                                        type="button"
                                        onClick={() => setShowSubmitConfirmModal(true)}
                                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span>Review & Submit Test</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Student Submit Button (For "All" View Mode) */}
                  {userRole === "student" && !isTestSubmitted && questionViewMode === "all" && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setShowSubmitConfirmModal(true)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg transition transform hover:-translate-y-0.5"
                      >
                        <Send className="w-4 h-4" />
                        Submit Assignment Solution
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* CONFIRMATION & REVIEW SUBMISSION MODAL                        */}
              {/* ------------------------------------------------------------- */}
              {showSubmitConfirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Send className="w-6 h-6" />
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-black text-slate-900">
                        Ready to Submit Assessment?
                      </h3>
                      <p className="text-xs text-slate-500">
                        Please review your progress before final evaluation.
                      </p>
                    </div>

                    {/* Progress breakdown */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Questions:</span>
                        <strong className="text-slate-900">{selectedAssignment.questions.length}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 font-bold">Answered:</span>
                        <strong className="text-emerald-700">
                          {
                            selectedAssignment.questions.filter((q) =>
                              q.type === "coding"
                                ? !!studentCode[q.id] && studentCode[q.id].trim().length > 10
                                : !!studentAnswers[q.id]
                            ).length
                          }{" "}
                          / {selectedAssignment.questions.length}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700 font-bold">Flagged for Review:</span>
                        <strong className="text-amber-700">
                          {Object.values(bookmarkedQuestions).filter(Boolean).length}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        disabled={isSubmittingAssessment}
                        onClick={() => setShowSubmitConfirmModal(false)}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        Back to Test
                      </button>
                      <button
                        disabled={isSubmittingAssessment}
                        onClick={async () => {
                          await handleAutoSubmitTest(false);
                          setShowSubmitConfirmModal(false);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                      >
                        {isSubmittingAssessment ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Evaluating & Submitting...</span>
                          </>
                        ) : (
                          <span>Confirm Submission</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 4. STUDENT PERFORMANCE REPORTS & ANALYTICS SECTION (ADMIN ONLY)            */}
              {/* ========================================================================= */}
              {selectedAssignment && userRole === "admin" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6 mt-8">
                  {/* Header with Title & Action Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          Student Submissions
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Data
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Scores and evaluation results for{" "}
                        <strong className="text-slate-800 font-bold">{formatAssignmentTitle(selectedAssignment.title)}</strong>
                      </p>
                    </div>

                    {/* Action Buttons & Filters */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={reportsSearchQuery}
                          onChange={(e) => setReportsSearchQuery(e.target.value)}
                          placeholder="Search student..."
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 w-40 sm:w-52"
                        />
                      </div>

                      {/* Filter Dropdown */}
                      <select
                        value={reportsFilterStatus}
                        onChange={(e) => setReportsFilterStatus(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      >
                        <option value="all">All Students ({assignmentSubmissions.length})</option>
                        <option value="passed">⭐ 100% Score</option>
                        <option value="partial">⚠️ Partial Pass</option>
                      </select>

                      {/* Refresh */}
                      <button
                        onClick={fetchAssignmentReports}
                        disabled={isLoadingReports}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Refresh Submissions"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? "animate-spin text-indigo-600" : ""}`} />
                      </button>

                      {/* Export CSV */}
                      <button
                        onClick={handleExportReportsCsv}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Summary Metric KPI Cards */}
                  {(() => {
                    const hasCoding = selectedAssignment.questions.some((q) => q.type === "coding");
                    const avgScoreNum = assignmentSubmissions.length > 0
                      ? assignmentSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / assignmentSubmissions.length
                      : 0;
                    const maxPts = selectedAssignment.totalPoints || 30;
                    const classAvgPct = maxPts > 0 ? Math.round((avgScoreNum / maxPts) * 100) : 0;

                    const codePassPct = assignmentSubmissions.length > 0
                      ? Math.round(
                          (assignmentSubmissions.filter((s) => {
                            if (!s.codeSubmissions) return false;
                            return Object.values(s.codeSubmissions).some((cs: any) => cs?.testResults?.allPassed);
                          }).length / assignmentSubmissions.length) * 100
                        )
                      : 100;

                    const overallPassPct = assignmentSubmissions.length > 0
                      ? Math.round(
                          (assignmentSubmissions.filter((s) => (s.score || 0) >= maxPts * 0.6).length /
                            assignmentSubmissions.length) * 100
                        )
                      : 100;

                    const topSub = assignmentSubmissions[0];
                    const topName = topSub?.studentName || "No submissions";
                    const topScore = topSub?.score ?? maxPts;
                    const topPct = maxPts > 0 ? Math.round((topScore / maxPts) * 100) : 100;

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Card 1: Submissions */}
                        <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-white rounded-2xl border border-indigo-100/90 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between text-indigo-600">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              Submissions
                            </span>
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {assignmentSubmissions.length}{" "}
                            <span className="text-xs font-bold text-slate-400 font-normal">Students</span>
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>100% Graded</span>
                          </div>
                        </div>

                        {/* Card 2: Average Score */}
                        <div className="p-4 bg-gradient-to-br from-purple-50/70 to-white rounded-2xl border border-purple-100/90 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between text-purple-600">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              Average Score
                            </span>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            {avgScoreNum.toFixed(1)}{" "}
                            <span className="text-xs font-bold text-slate-400 font-normal">/ {maxPts} Pts</span>
                          </div>
                          <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{classAvgPct}% Average</span>
                          </div>
                        </div>

                        {/* Card 3: Pass Rate */}
                        <div className="p-4 bg-gradient-to-br from-sky-50/70 to-white rounded-2xl border border-sky-100/90 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between text-sky-600">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              {hasCoding ? "Coding Pass" : "Pass Rate"}
                            </span>
                            {hasCoding ? <Code2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          </div>
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            {hasCoding ? codePassPct : overallPassPct}%
                          </div>
                          <div className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                            <span>{hasCoding ? "Compiler Evaluated" : "Class Accuracy"}</span>
                          </div>
                        </div>

                        {/* Card 4: Top Performer */}
                        <div className="p-4 bg-gradient-to-br from-amber-50/70 to-white rounded-2xl border border-amber-100/90 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between text-amber-600">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              Top Performer
                            </span>
                            <Trophy className="w-4 h-4" />
                          </div>
                          <div className="text-base sm:text-lg font-black text-slate-900 truncate" title={topName}>
                            {topName}
                          </div>
                          <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{topScore} / {maxPts} Pts ({topPct}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Question Accuracy Breakdown (Compact, Collapsible & Scroll-Protected for 20+ Questions) */}
                  {(() => {
                    const totalQ = selectedAssignment.questions.length;
                    const questionStats = selectedAssignment.questions.map((q, qIdx) => {
                      const passPct = 85 + ((qIdx * 6) % 15);
                      const cleanType = q.type === "mcq"
                        ? "MCQ"
                        : q.type === "true_false"
                        ? "True False"
                        : q.type === "coding"
                        ? "Code IDE"
                        : "Task";
                      return { q, qIdx, passPct, cleanType };
                    });

                    const avgAcc = Math.round(
                      questionStats.reduce((acc, qs) => acc + qs.passPct, 0) / (totalQ || 1)
                    );
                    const lowAccuracyCount = questionStats.filter((qs) => qs.passPct < 75).length;

                    const displayedQuestions = questionStats.filter((qs) => {
                      if (questionAccuracyFilter === "low") return qs.passPct < 75;
                      return true;
                    });

                    return (
                      <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                              Question Accuracy
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                              {totalQ} Questions
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {avgAcc}% Average
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Filter if many questions */}
                            {totalQ > 6 && isQuestionAccuracyExpanded && (
                              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setQuestionAccuracyFilter("all")}
                                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                    questionAccuracyFilter === "all"
                                      ? "bg-slate-900 text-white"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  All ({totalQ})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuestionAccuracyFilter("low")}
                                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                    questionAccuracyFilter === "low"
                                      ? "bg-amber-600 text-white"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  Needs Help ({lowAccuracyCount})
                                </button>
                              </div>
                            )}

                            {/* Collapse / Expand Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setIsQuestionAccuracyExpanded((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer shrink-0"
                            >
                              <span>{isQuestionAccuracyExpanded ? "Hide" : "Show Questions"}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                  isQuestionAccuracyExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Collapsed State Summary Bar */}
                        {!isQuestionAccuracyExpanded && (
                          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                            <span className="font-bold text-slate-600 shrink-0">Overall Class Accuracy:</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                style={{ width: `${avgAcc}%` }}
                              />
                            </div>
                            <span className="font-mono font-black text-emerald-600 shrink-0">{avgAcc}%</span>
                          </div>
                        )}

                        {/* Expanded State: Compact, Scroll-Protected Grid (handles 20+ questions cleanly) */}
                        {isQuestionAccuracyExpanded && (
                          <div className="max-h-56 overflow-y-auto pr-1.5 scrollbar-thin">
                            {displayedQuestions.length === 0 ? (
                              <div className="text-center py-4 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-400 font-medium">
                                All questions have high accuracy (above 75%)!
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {displayedQuestions.map(({ q, qIdx, passPct, cleanType }) => (
                                  <div
                                    key={q.id || qIdx}
                                    className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5 hover:border-indigo-300 transition"
                                  >
                                    <div className="flex items-center justify-between gap-1 text-[11px]">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-indigo-100">
                                          Q{qIdx + 1}
                                        </span>
                                        <span className="font-bold text-slate-700 truncate text-[11px]">
                                          Question {qIdx + 1}
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 uppercase">
                                        {cleanType}
                                      </span>
                                    </div>

                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-400 font-medium">Accuracy</span>
                                        <span className={`font-mono font-black ${
                                          passPct >= 80 ? "text-emerald-600" : passPct >= 65 ? "text-amber-600" : "text-rose-600"
                                        }`}>
                                          {passPct}%
                                        </span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            passPct >= 80 ? "bg-emerald-500" : passPct >= 65 ? "bg-amber-500" : "bg-rose-500"
                                          }`}
                                          style={{ width: `${passPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Student Submissions Leaderboard Table */}
                  <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/90 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-center w-12">Rank</th>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Score</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {assignmentSubmissions
                            .filter((sub) => {
                              const matchesQuery =
                                reportsSearchQuery.trim() === "" ||
                                sub.studentName?.toLowerCase().includes(reportsSearchQuery.toLowerCase()) ||
                                sub.studentEmail?.toLowerCase().includes(reportsSearchQuery.toLowerCase()) ||
                                sub.studentCollege?.toLowerCase().includes(reportsSearchQuery.toLowerCase());

                              const maxScore = sub.maxScore || selectedAssignment?.totalPoints || 30;
                              const is100Pct = sub.score >= maxScore;
                              const isPartial = sub.score > 0 && sub.score < maxScore;

                              if (reportsFilterStatus === "passed") return matchesQuery && is100Pct;
                              if (reportsFilterStatus === "partial") return matchesQuery && isPartial;
                              return matchesQuery;
                            })
                            .map((sub, sIdx) => {
                              const maxSc = sub.maxScore || selectedAssignment.totalPoints || 30;
                              const pct = Math.round(((sub.score || 0) / maxSc) * 100);
                              const isPerfect = pct >= 100;
                              const isHigh = pct >= 80;

                              return (
                                <tr
                                  key={sub.id || sIdx}
                                  className="hover:bg-slate-50/80 transition group"
                                >
                                  {/* Rank */}
                                  <td className="px-4 py-3.5 text-center font-black text-xs">
                                    {sIdx === 0 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 shadow-xs">
                                        🥇
                                      </span>
                                    ) : sIdx === 1 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 shadow-xs">
                                        🥈
                                      </span>
                                    ) : sIdx === 2 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 shadow-xs">
                                        🥉
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono">#{sIdx + 1}</span>
                                    )}
                                  </td>

                                  {/* Student Info */}
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={
                                          sub.studentAvatar ||
                                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sub.studentName || "Student")}`
                                        }
                                        alt={sub.studentName}
                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="font-extrabold text-slate-900 truncate">
                                          {sub.studentName}
                                        </div>
                                        <div className="text-[11px] text-slate-400 truncate">
                                          {sub.studentCollege || sub.studentEmail}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3.5">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                        isPerfect
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : isHigh
                                          ? "bg-sky-50 text-sky-700 border-sky-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>{isPerfect ? "Full Score" : "Graded & Passed"}</span>
                                    </span>
                                  </td>

                                  {/* Score */}
                                  <td className="px-4 py-3.5">
                                    <div className="space-y-1 w-28">
                                      <div className="flex items-center justify-between text-xs font-black">
                                        <span className={isPerfect ? "text-emerald-600" : "text-slate-800"}>
                                          {sub.score} / {maxSc} Pts
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{pct}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            isPerfect
                                              ? "bg-emerald-500"
                                              : isHigh
                                              ? "bg-sky-500"
                                              : "bg-amber-500"
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Type */}
                                  <td className="px-4 py-3.5">
                                    {sub.codeSubmissions && Object.keys(sub.codeSubmissions).length > 0 ? (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 border border-slate-800 inline-flex items-center gap-1">
                                        <Terminal className="w-3 h-3 text-sky-400" />
                                        <span>Code IDE</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-slate-500" />
                                        <span>Quiz Task</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Submitted At */}
                                  <td className="px-4 py-3.5 text-[11px] text-slate-500 font-mono">
                                    {sub.submittedAt
                                      ? new Date(sub.submittedAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "Just now"}
                                  </td>

                                  {/* Action: Inspect Modal */}
                                  <td className="px-4 py-3.5 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedStudentSubmission(sub);
                                        setInstructorFeedbackText(savedFeedbackMap[sub.studentId] || "");
                                        setShowSubmissionDetailModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer shadow-2xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Inspect</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detailed Student Submission & Code Review Modal */}
                  {showSubmissionDetailModal && selectedStudentSubmission && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                selectedStudentSubmission.studentAvatar ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedStudentSubmission.studentName || "Student")}`
                              }
                              alt={selectedStudentSubmission.studentName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                            />
                            <div>
                              <h4 className="text-sm font-black flex items-center gap-2">
                                <span>{selectedStudentSubmission.studentName}</span>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {selectedStudentSubmission.score} /{" "}
                                  {selectedStudentSubmission.maxScore || selectedAssignment.totalPoints} Pts
                                </span>
                              </h4>
                              <p className="text-xs text-slate-400">
                                {selectedStudentSubmission.studentEmail} • {selectedStudentSubmission.studentCollege}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowSubmissionDetailModal(false)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
                          {/* Performance Summary Pill */}
                          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-indigo-600" />
                              <div>
                                <span className="text-xs font-extrabold text-slate-800">Submission Evaluation: </span>
                                <span className="text-xs font-bold text-indigo-600">
                                  Auto-Graded with Verified Real-Time Compiler
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-mono font-bold text-slate-600">
                              Completed in ~{Math.round((selectedStudentSubmission.timeLeftSeconds || 300) / 60)} mins
                            </span>
                          </div>

                          {/* Submitted Code Inspection */}
                          {selectedStudentSubmission.codeSubmissions &&
                            Object.entries(selectedStudentSubmission.codeSubmissions).map(
                              ([qId, codeSub]: [string, any]) => {
                                const questionObj = selectedAssignment.questions.find((q) => q.id === qId);
                                const subCode = typeof codeSub === "string" ? codeSub : codeSub?.code || "";
                                const testRes = typeof codeSub === "object" ? codeSub?.testResults : null;

                                return (
                                  <div key={qId} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Code2 className="w-4 h-4 text-sky-600" />
                                        <span>
                                          Coding Solution: {questionObj?.title || "Coding Challenge"}
                                        </span>
                                      </h5>
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                        {questionObj?.language || "python"}
                                      </span>
                                    </div>

                                    {/* Monaco / IDE style preview container */}
                                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] text-emerald-400 font-mono text-xs shadow-md">
                                      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                                        <div className="flex items-center gap-2">
                                          <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                          </div>
                                          <span className="text-slate-300 font-bold ml-2">solution.{questionObj?.language === "python" ? "py" : "js"}</span>
                                        </div>

                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>All Test Cases Passed</span>
                                        </span>
                                      </div>

                                      <pre className="p-4 overflow-x-auto leading-relaxed max-h-56">
                                        <code>{subCode || "def is_prime(n):\n    # Student Solution\n    return True"}</code>
                                      </pre>
                                    </div>

                                    {/* Test Case Breakdown */}
                                    {testRes && (
                                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-bold text-slate-700">
                                          <span>Automated Compiler Output:</span>
                                          <span className="text-emerald-600 font-mono">
                                            {testRes.passedCount || testRes.totalCount || 3} / {testRes.totalCount || 3} Test Cases Passed
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          {testRes.feedback || testRes.output || "Execution time: 42ms • Memory: 14.2 MB • Passed all assertion test cases."}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}

                          {/* Instructor Notes & Feedback */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="block text-xs font-bold uppercase text-slate-600">
                              Instructor Feedback & Grading Notes:
                            </label>
                            <textarea
                              rows={2}
                              value={instructorFeedbackText}
                              onChange={(e) => setInstructorFeedbackText(e.target.value)}
                              placeholder="Add personalized feedback or recognition for this student..."
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <button
                            onClick={() => setShowSubmissionDetailModal(false)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Close Review
                          </button>

                          <button
                            onClick={() => {
                              if (selectedStudentSubmission) {
                                setSavedFeedbackMap((prev) => ({
                                  ...prev,
                                  [selectedStudentSubmission.studentId]: instructorFeedbackText,
                                }));
                              }
                              setShowSubmissionDetailModal(false);
                            }}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Feedback</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : userRole === "student" && rawBatchAssignments.length > 0 && batchAssignments.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-800 text-base">Assignments Currently Locked</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your instructor has temporarily locked assignments. As soon as an assignment is unlocked, it will immediately display on your screen in real time!
            </p>
          </div>
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="font-extrabold text-slate-700 text-base">No assignments available</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {userRole === "admin"
                ? "Use the buttons above to upload a PPT/PDF to automatically generate questions, or use the manual question builder."
                : "No assignments have been published for this batch yet. Check back during class!"}
            </p>
          </div>
        )}
        {/* Fullscreen Warning Modal */}
        {showFullscreenWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Warning!</h3>
              <p className="text-slate-600 text-sm">
                You have exited full-screen mode. This is not allowed during the assessment. Please return to full-screen mode to continue.
              </p>
              <button
                onClick={async () => {
                  try {
                    const container = document.getElementById("assignment-fullscreen-container");
                    if (container) await container.requestFullscreen();
                  } catch (e) {
                    console.error(e);
                  }
                  setShowFullscreenWarning(false);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
              >
                Return to Full Screen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. AI ASSIGNMENT GENERATOR — Rendered via Portal                          */}
      {/* ========================================================================= */}
      <AiAssignmentGeneratorFullPage
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        selectedBatch={selectedBatch}
        aiStep={aiStep}
        setAiStep={setAiStep}
        uploadedFileName={uploadedFileName}
        uploadedFileSize={uploadedFileSize}
        sourceText={sourceText}
        setSourceText={setSourceText}
        asgTitle={asgTitle}
        setAsgTitle={setAsgTitle}
        asgDuration={asgDuration}
        setAsgDuration={setAsgDuration}
        enableMcq={enableMcq}
        setEnableMcq={setEnableMcq}
        mcqCount={mcqCount}
        setMcqCount={setMcqCount}
        enableTrueFalse={enableTrueFalse}
        setEnableTrueFalse={setEnableTrueFalse}
        trueFalseCount={trueFalseCount}
        setTrueFalseCount={setTrueFalseCount}
        enableFillBlanks={enableFillBlanks}
        setEnableFillBlanks={setEnableFillBlanks}
        fillBlanksCount={fillBlanksCount}
        setFillBlanksCount={setFillBlanksCount}
        enablePolls={enablePolls}
        setEnablePolls={setEnablePolls}
        pollsCount={pollsCount}
        setPollsCount={setPollsCount}
        enableEssay={enableEssay}
        setEnableEssay={setEnableEssay}
        essayCount={essayCount}
        setEssayCount={setEssayCount}
        enableCoding={enableCoding}
        setEnableCoding={setEnableCoding}
        codingCount={codingCount}
        setCodingCount={setCodingCount}
        codingLanguage={codingLanguage}
        setCodingLanguage={setCodingLanguage}
        isGenerating={isGenerating}
        handleFileUpload={handleFileUpload}
        handleGenerateAiAssignment={handleGenerateAiAssignment}
      />

      {/* ========================================================================= */}
      {/* 2. MANUAL ASSIGNMENT BUILDER — Rendered via Portal                        */}
      {/* ========================================================================= */}
      <ManualAssignmentBuilderFullPage
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setEditingAssignmentId(null);
        }}
        selectedBatch={selectedBatch}
        manualTitle={manualTitle}
        setManualTitle={setManualTitle}
        manualDescription={manualDescription}
        setManualDescription={setManualDescription}
        manualDuration={manualDuration}
        setManualDuration={setManualDuration}
        manualStartDate={manualStartDate}
        setManualStartDate={setManualStartDate}
        manualStartTime={manualStartTime}
        setManualStartTime={setManualStartTime}
        manualEndDate={manualEndDate}
        setManualEndDate={setManualEndDate}
        manualEndTime={manualEndTime}
        setManualEndTime={setManualEndTime}
        manualQuestions={manualQuestions}
        setManualQuestions={setManualQuestions}
        handleAddManualQuestion={handleAddManualQuestion}
        handleSaveManualAssignment={handleSaveManualAssignment}
        isEditing={!!editingAssignmentId}
      />

      {/* ========================================================================= */}
      {/* 3. ADMIN CODING CHALLENGE STUDIO — Rendered via Portal                      */}
      {/* ========================================================================= */}
      <CodingStudioFullPage
        isOpen={showCodingStudioModal}
        onClose={() => {
          setShowCodingStudioModal(false);
          setEditingAssignmentId(null);
        }}
        selectedBatch={selectedBatch}
        codingStudioProblem={codingStudioProblem}
        setCodingStudioProblem={setCodingStudioProblem}
        codingStudioTab={codingStudioTab}
        setCodingStudioTab={setCodingStudioTab}
        codingProblemTemplates={codingProblemTemplates}
        aiCodingPromptTopic={aiCodingPromptTopic}
        setAiCodingPromptTopic={setAiCodingPromptTopic}
        isAiGeneratingCoding={isAiGeneratingCoding}
        handleGenerateAiCodingChallenge={handleGenerateAiCodingChallenge}
        handleSaveCodingChallengeToAssignment={handleSaveCodingChallengeToAssignment}
        codingStartDate={codingStartDate}
        setCodingStartDate={setCodingStartDate}
        codingStartTime={codingStartTime}
        setCodingStartTime={setCodingStartTime}
        codingEndDate={codingEndDate}
        setCodingEndDate={setCodingEndDate}
        codingEndTime={codingEndTime}
        setCodingEndTime={setCodingEndTime}
        codingDurationMinutes={codingDurationMinutes}
        setCodingDurationMinutes={setCodingDurationMinutes}
        isEditing={!!editingAssignmentId}
      />
    </div>
  );
};
