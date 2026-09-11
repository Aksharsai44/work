import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Edit3,
  ChevronLeft,
  XCircle,
  FileText,
  ListChecks,
  Plus,
  Trash2,
  Check,
  Code2,
  Sparkles,
  Terminal,
  Eye,
  Settings2,
  Calendar,
  Clock,
  Timer,
} from "lucide-react";
import { AssignmentQuestion, Batch, QuestionType } from "../types";
import { CodingStudioFullPage } from "./CodingStudioFullPage";

interface ManualAssignmentBuilderFullPageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: Batch;
  manualTitle: string;
  setManualTitle: React.Dispatch<React.SetStateAction<string>>;
  manualDescription: string;
  setManualDescription: React.Dispatch<React.SetStateAction<string>>;
  manualDuration: number;
  setManualDuration: React.Dispatch<React.SetStateAction<number>>;
  manualStartDate?: string;
  setManualStartDate?: React.Dispatch<React.SetStateAction<string>>;
  manualStartTime?: string;
  setManualStartTime?: React.Dispatch<React.SetStateAction<string>>;
  manualEndDate?: string;
  setManualEndDate?: React.Dispatch<React.SetStateAction<string>>;
  manualEndTime?: string;
  setManualEndTime?: React.Dispatch<React.SetStateAction<string>>;
  manualQuestions: AssignmentQuestion[];
  setManualQuestions: React.Dispatch<React.SetStateAction<AssignmentQuestion[]>>;
  handleAddManualQuestion: (type: QuestionType) => void;
  handleSaveManualAssignment: () => void;
  isEditing?: boolean;
}

export const ManualAssignmentBuilderFullPage: React.FC<ManualAssignmentBuilderFullPageProps> = ({
  isOpen,
  onClose,
  selectedBatch,
  manualTitle,
  setManualTitle,
  manualDescription,
  setManualDescription,
  manualDuration,
  setManualDuration,
  manualStartDate,
  setManualStartDate,
  manualStartTime,
  setManualStartTime,
  manualEndDate,
  setManualEndDate,
  manualEndTime,
  setManualEndTime,
  manualQuestions,
  setManualQuestions,
  handleAddManualQuestion,
  handleSaveManualAssignment,
  isEditing = false,
}) => {
  if (!isOpen) return null;

  // Local fallback states for timing if not controlled externally
  const [internalStartDate, setInternalStartDate] = useState<string>("");
  const [internalStartTime, setInternalStartTime] = useState<string>("");
  const [internalEndDate, setInternalEndDate] = useState<string>("");
  const [internalEndTime, setInternalEndTime] = useState<string>("");

  const effectiveStartDate = manualStartDate !== undefined ? manualStartDate : internalStartDate;
  const setEffectiveStartDate = setManualStartDate || setInternalStartDate;
  const effectiveStartTime = manualStartTime !== undefined ? manualStartTime : internalStartTime;
  const setEffectiveStartTime = setManualStartTime || setInternalStartTime;
  const effectiveEndDate = manualEndDate !== undefined ? manualEndDate : internalEndDate;
  const setEffectiveEndDate = setManualEndDate || setInternalEndDate;
  const effectiveEndTime = manualEndTime !== undefined ? manualEndTime : internalEndTime;
  const setEffectiveEndTime = setManualEndTime || setInternalEndTime;

  // ---------------------------------------------------------------------------
  // Embedded Coding Studio Full Page State
  // ---------------------------------------------------------------------------
  const initialEmptyCodingQuestion: AssignmentQuestion = {
    id: `q_code_${Date.now()}`,
    type: "coding",
    title: "Prime Numbers up to N",
    difficulty: "Easy",
    question:
      "Given an integer N, print all prime numbers between 2 and N in ascending order. A prime number is a number greater than 1 that has exactly two factors: 1 and itself.",
    description:
      "Given an integer N, print all prime numbers between 2 and N in ascending order. A prime number is a number greater than 1 that has exactly two factors: 1 and itself.",
    inputFormat: "First line: An integer N",
    outputFormat: "Print all prime numbers from 2 to N, separated by spaces.",
    constraints: "2 ≤ N ≤ 10^5",
    sampleInput: "10",
    sampleOutput: "2 3 5 7",
    points: 30,
    language: "python",
    starterCode: `def is_prime(n):\n    # Write your solution here\n    pass`,
    starterCodes: {
      python: `def is_prime(n):\n    # Write your solution here\n    pass`,
      javascript: `function isPrime(n) {\n    // Write your solution here\n    return false;\n}`,
      typescript: `function isPrime(n: number): boolean {\n    // Write your solution here\n    return false;\n}`,
      java: `class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    },
    testCases: [
      {
        input: "10",
        expectedOutput: "2 3 5 7",
        explanation: "Prime numbers up to 10 are 2, 3, 5, and 7.",
      },
      {
        input: "20",
        expectedOutput: "2 3 5 7 11 13 17 19",
        explanation: "Prime numbers up to 20.",
      },
      {
        input: "5",
        expectedOutput: "2 3 5",
        isHidden: true,
      },
    ],
  };

  const [showCodingStudioModal, setShowCodingStudioModal] = useState<boolean>(false);
  const [codingStudioProblem, setCodingStudioProblem] = useState<AssignmentQuestion>(initialEmptyCodingQuestion);
  const [editingCodingQuestionIndex, setEditingCodingQuestionIndex] = useState<number | null>(null);
  const [codingStudioTab, setCodingStudioTab] = useState<"details" | "testcases" | "starter" | "preview">("details");
  const [aiCodingPromptTopic, setAiCodingPromptTopic] = useState<string>("");
  const [isAiGeneratingCoding, setIsAiGeneratingCoding] = useState<boolean>(false);

  // Pre-built popular templates
  const codingProblemTemplates: Record<string, AssignmentQuestion> = {
    prime_numbers: initialEmptyCodingQuestion,
    two_sum: {
      id: `q_code_${Date.now()}`,
      type: "coding",
      title: "Two Sum",
      difficulty: "Easy",
      question:
        "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      description:
        "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice.",
      inputFormat: "First line: n. Second line: nums list. Third line: target.",
      outputFormat: "Two space-separated indices or list [i, j].",
      constraints: "2 ≤ n ≤ 10⁴, -10⁹ ≤ nums[i] ≤ 10⁹.",
      sampleInput: "nums = [2, 7, 11, 15], target = 9",
      sampleOutput: "[0, 1]",
      points: 30,
      language: "python",
      starterCode: `def two_sum(nums, target):\n    # Write your solution here\n    pass`,
      starterCodes: {
        python: `def two_sum(nums, target):\n    # Write your solution here\n    pass`,
        javascript: `function twoSum(nums, target) {\n    return [];\n}`,
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
        },
      ],
    },
    agent_filter: {
      id: `q_code_${Date.now()}`,
      type: "coding",
      title: "AI Agent Execution Log Filter",
      difficulty: "Medium",
      question:
        "Implement the function `filter_agent_logs(logs, min_latency, target_status)` to filter and sort autonomous task execution traces.",
      description:
        "You are designing the telemetry engine for an autonomous agent platform. Given a list of log entries with `id` (int), `status` (str), and `latency_ms` (int), return the list of matching task IDs where status equals `target_status` and latency is strictly below `min_latency`, sorted in ascending order of latency.",
      inputFormat: "First argument: logs list of dicts. Second argument: min_latency integer. Third argument: target_status string.",
      outputFormat: "A list of integer task IDs sorted by latency ascending.",
      constraints: "1 ≤ len(logs) ≤ 10⁵, 0 ≤ latency_ms ≤ 50000.",
      sampleInput: 'logs = [{"id": 1, "status": "ok", "latency_ms": 120}, {"id": 2, "status": "ok", "latency_ms": 45}], min_latency = 100, target_status = "ok"',
      sampleOutput: "[2]",
      points: 35,
      language: "python",
      starterCode: `def filter_agent_logs(logs, min_latency, target_status):\n    # Write your solution here\n    pass`,
      testCases: [
        {
          input: 'logs = [{"id": 1, "status": "ok", "latency_ms": 120}, {"id": 2, "status": "ok", "latency_ms": 45}], min_latency = 100, target_status = "ok"',
          expectedOutput: "[2]",
        },
      ],
    },
  };

  // Open Coding Studio for a new or existing question
  const handleOpenCodingStudio = (existingIndex?: number) => {
    if (existingIndex !== undefined && manualQuestions[existingIndex]) {
      const q = manualQuestions[existingIndex];
      setCodingStudioProblem({
        ...q,
        title: q.title || q.question.slice(0, 40) || "Coding Challenge",
        description: q.description || q.question || "",
        inputFormat: q.inputFormat || "Standard input arguments",
        outputFormat: q.outputFormat || "Expected return value",
        constraints: q.constraints || "1 <= n <= 10^5",
        sampleInput: q.sampleInput || "",
        sampleOutput: q.sampleOutput || "",
        starterCode: q.starterCode || `def solution():\n    pass`,
        starterCodes: q.starterCodes || { python: q.starterCode || `def solution():\n    pass` },
        testCases: q.testCases && q.testCases.length > 0 ? q.testCases : [
          { input: q.sampleInput || "sample", expectedOutput: q.sampleOutput || "expected" }
        ],
        points: q.points || 30,
        language: q.language || "python",
      });
      setEditingCodingQuestionIndex(existingIndex);
    } else {
      setCodingStudioProblem({
        ...initialEmptyCodingQuestion,
        id: `q_code_${Date.now()}`,
      });
      setEditingCodingQuestionIndex(null);
    }
    setCodingStudioTab("details");
    setShowCodingStudioModal(true);
  };

  // Save / Update coding challenge from CodingStudioFullPage into manualQuestions
  const handleSaveCodingStudioProblem = () => {
    if (editingCodingQuestionIndex !== null) {
      const updated = [...manualQuestions];
      updated[editingCodingQuestionIndex] = codingStudioProblem;
      setManualQuestions(updated);
    } else {
      setManualQuestions((prev) => [...prev, codingStudioProblem]);
    }
    setShowCodingStudioModal(false);
    setEditingCodingQuestionIndex(null);
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
          starterCodes: {
            [prev.language || "python"]: generated.starterCode || prev.starterCode,
          },
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

  const content = (
    <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col animate-in fade-in">
      {/* Sticky Full-Page Top Bar */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{isEditing ? "Edit Assignment" : "Manual Question Builder"}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedBatch.name}
                </span>
                {isEditing && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Editing Mode
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            {manualQuestions.length} Qs •{" "}
            {manualQuestions.reduce((acc, q) => acc + (q.points || 0), 0)} Pts
          </span>

          <button
            onClick={handleSaveManualAssignment}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? "Update & Save" : "Save & Publish"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-6 sm:p-10 space-y-6">
          {/* Assignment Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Assignment Settings & Instructions</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Day 2: AI Agents & Coding Assessment"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Duration (Minutes)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={manualDuration}
                  onChange={(e) => setManualDuration(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black text-slate-800"
                />
              </div>
            </div>

            {/* Exam Schedule & Time Window (Start/End Date & Time) */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Exam Window & Attendance Schedule</span>
                </span>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Real-time Schedule Controls
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Starting Date */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={effectiveStartDate}
                    onChange={(e) => setEffectiveStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Starting Time */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={effectiveStartTime}
                    onChange={(e) => setEffectiveStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Ending Date */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-500" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    value={effectiveEndDate}
                    onChange={(e) => setEffectiveEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {/* Ending Time */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span>End Time</span>
                  </label>
                  <input
                    type="time"
                    value={effectiveEndTime}
                    onChange={(e) => setEffectiveEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Description / Instructions for Students
              </label>
              <input
                type="text"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Instructions for students taking this assessment..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Questions Toolbar & List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  <span>Questions ({manualQuestions.length})</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add new question blocks below or launch the full Coding IDE Studio for rich coding challenges.
                </p>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleAddManualQuestion("mcq")}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>MCQ</span>
                </button>
                <button
                  onClick={() => handleAddManualQuestion("true_false")}
                  className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>True/False</span>
                </button>
                <button
                  onClick={() => handleAddManualQuestion("fill_blank")}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Blank</span>
                </button>
                <button
                  onClick={() => handleAddManualQuestion("essay")}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Essay</span>
                </button>
                <button
                  onClick={() => handleOpenCodingStudio()}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm transform hover:-translate-y-0.5"
                  title="Open full Coding IDE Studio with AI Generator, Test Cases & Live Preview"
                >
                  <Code2 className="w-4 h-4" />
                  <span>+ Coding IDE Studio</span>
                </button>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-6">
              {manualQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border space-y-4 transition ${
                    q.type === "coding"
                      ? "bg-gradient-to-br from-slate-900 to-[#0b1222] text-slate-100 border-slate-800 shadow-md"
                      : "bg-slate-50/80 hover:bg-slate-50 text-slate-900 border-slate-200/90"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        q.type === "coding" ? "bg-sky-500 text-slate-950" : "bg-indigo-600 text-white"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${
                        q.type === "coding" ? "text-sky-400 font-mono" : "text-slate-500"
                      }`}>
                        {q.type === "coding" ? "⚡ CODING CHALLENGE (IDE)" : q.type.replace("_", " ")}
                      </span>
                      {q.type === "coding" && q.difficulty && (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          q.difficulty === "Hard"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : q.difficulty === "Medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {q.difficulty}
                        </span>
                      )}
                      {q.type === "coding" && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {q.language || "python"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${q.type === "coding" ? "text-slate-400" : "text-slate-400"}`}>
                          Points:
                        </span>
                        <input
                          type="number"
                          value={q.points || (q.type === "coding" ? 30 : 10)}
                          onChange={(e) => {
                            const updated = [...manualQuestions];
                            updated[idx].points = parseInt(e.target.value) || 0;
                            setManualQuestions(updated);
                          }}
                          className={`w-14 px-2 py-1 rounded-lg text-xs font-bold text-center border ${
                            q.type === "coding"
                              ? "bg-slate-800 text-white border-slate-700"
                              : "bg-white text-slate-900 border-slate-200"
                          }`}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          q.type === "coding"
                            ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            : "text-slate-400 hover:text-rose-500 hover:bg-slate-200/60"
                        }`}
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${
                      q.type === "coding" ? "text-slate-400" : "text-slate-400"
                    }`}>
                      {q.type === "coding" ? "Problem Title & Statement:" : "Question Prompt:"}
                    </label>
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...manualQuestions];
                        updated[idx].question = e.target.value;
                        if (q.type === "coding") {
                          updated[idx].title = e.target.value.slice(0, 40);
                        }
                        setManualQuestions(updated);
                      }}
                      placeholder="Type question prompt here..."
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold focus:ring-2 border ${
                        q.type === "coding"
                          ? "bg-slate-800/90 text-white border-slate-700 focus:ring-sky-500"
                          : "bg-white text-slate-900 border-slate-200 focus:ring-indigo-500"
                      }`}
                    />
                  </div>

                  {/* MCQ / True/False Options */}
                  {(q.type === "mcq" || q.type === "true_false" || q.type === "poll") && q.options && (
                    <div className="space-y-3 pt-1">
                      <span className="text-xs font-bold uppercase text-slate-400">Options:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400 font-bold">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...manualQuestions];
                                if (updated[idx].options) {
                                  updated[idx].options![optIdx] = e.target.value;
                                  setManualQuestions(updated);
                                }
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      {q.type !== "poll" && (
                        <div className="flex items-center gap-2.5 pt-2">
                          <span className="text-xs text-slate-600 font-bold">
                            Correct Answer:
                          </span>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...manualQuestions];
                              updated[idx].correctAnswer = e.target.value;
                              setManualQuestions(updated);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          >
                            {q.options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fill in the blank Correct Answer */}
                  {q.type === "fill_blank" && (
                    <div className="pt-1">
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Exact Correct Blank Answer:
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer || ""}
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[idx].correctAnswer = e.target.value;
                          setManualQuestions(updated);
                        }}
                        placeholder="e.g. LangChain"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  )}

                  {/* Coding Challenge Block with Studio Launch Button */}
                  {q.type === "coding" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Terminal className="w-3.5 h-3.5 text-sky-400" />
                            <span>
                              <strong>{q.testCases?.length || 0}</strong> Test Cases Configured
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {q.language || "python"}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400">
                            Includes live runner & test evaluation
                          </span>
                        </div>

                        {/* Starter Code Preview */}
                        <pre className="p-3 bg-[#070b14] rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-28 border border-slate-850">
                          <code>{q.starterCode || `def solution():\n    pass`}</code>
                        </pre>

                        {/* Open in Studio Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCodingStudio(idx)}
                          className="w-full py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                        >
                          <Code2 className="w-4 h-4" />
                          <span>Open in Coding IDE Studio (Configure Test Cases, AI & Live Preview)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualAssignment}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Publish Assignment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Modal: Full Coding Studio (Launched directly from Manual Builder) ── */}
      <CodingStudioFullPage
        isOpen={showCodingStudioModal}
        onClose={() => {
          setShowCodingStudioModal(false);
          setEditingCodingQuestionIndex(null);
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
        handleSaveCodingChallengeToAssignment={handleSaveCodingStudioProblem}
        isEditing={editingCodingQuestionIndex !== null}
      />
    </div>
  );

  return createPortal(content, document.body);
};
