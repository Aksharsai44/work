import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Code2,
  Sparkles,
  Plus,
  Check,
  Trash2,
  Eye,
  FileCode,
  Terminal,
  ChevronLeft,
  XCircle,
  Calendar,
  Clock,
  Timer,
} from "lucide-react";
import { AssignmentQuestion, Batch } from "../types";
import { CodingChallengeIDE } from "./CodingChallengeIDE";

interface CodingStudioFullPageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: Batch;
  codingStudioProblem: AssignmentQuestion;
  setCodingStudioProblem: React.Dispatch<React.SetStateAction<AssignmentQuestion>>;
  codingStudioTab: "details" | "testcases" | "starter" | "preview";
  setCodingStudioTab: React.Dispatch<React.SetStateAction<"details" | "testcases" | "starter" | "preview">>;
  codingProblemTemplates: Record<string, AssignmentQuestion>;
  aiCodingPromptTopic: string;
  setAiCodingPromptTopic: React.Dispatch<React.SetStateAction<string>>;
  isAiGeneratingCoding: boolean;
  handleGenerateAiCodingChallenge: () => void;
  handleSaveCodingChallengeToAssignment: () => void;
  codingStartDate?: string;
  setCodingStartDate?: React.Dispatch<React.SetStateAction<string>>;
  codingStartTime?: string;
  setCodingStartTime?: React.Dispatch<React.SetStateAction<string>>;
  codingEndDate?: string;
  setCodingEndDate?: React.Dispatch<React.SetStateAction<string>>;
  codingEndTime?: string;
  setCodingEndTime?: React.Dispatch<React.SetStateAction<string>>;
  codingDurationMinutes?: number;
  setCodingDurationMinutes?: React.Dispatch<React.SetStateAction<number>>;
  isEditing?: boolean;
}

export const CodingStudioFullPage: React.FC<CodingStudioFullPageProps> = ({
  isOpen,
  onClose,
  selectedBatch,
  codingStudioProblem,
  setCodingStudioProblem,
  codingStudioTab,
  setCodingStudioTab,
  codingProblemTemplates,
  aiCodingPromptTopic,
  setAiCodingPromptTopic,
  isAiGeneratingCoding,
  handleGenerateAiCodingChallenge,
  handleSaveCodingChallengeToAssignment,
  codingStartDate,
  setCodingStartDate,
  codingStartTime,
  setCodingStartTime,
  codingEndDate,
  setCodingEndDate,
  codingEndTime,
  setCodingEndTime,
  codingDurationMinutes,
  setCodingDurationMinutes,
  isEditing = false,
}) => {
  if (!isOpen) return null;

  // Local fallback states for timing if not controlled externally
  const [internalStartDate, setInternalStartDate] = useState<string>("");
  const [internalStartTime, setInternalStartTime] = useState<string>("");
  const [internalEndDate, setInternalEndDate] = useState<string>("");
  const [internalEndTime, setInternalEndTime] = useState<string>("");
  const [internalDuration, setInternalDuration] = useState<number>(30);

  const effectiveStartDate = codingStartDate !== undefined ? codingStartDate : internalStartDate;
  const setEffectiveStartDate = setCodingStartDate || setInternalStartDate;
  const effectiveStartTime = codingStartTime !== undefined ? codingStartTime : internalStartTime;
  const setEffectiveStartTime = setCodingStartTime || setInternalStartTime;
  const effectiveEndDate = codingEndDate !== undefined ? codingEndDate : internalEndDate;
  const setEffectiveEndDate = setCodingEndDate || setInternalEndDate;
  const effectiveEndTime = codingEndTime !== undefined ? codingEndTime : internalEndTime;
  const setEffectiveEndTime = setCodingEndTime || setInternalEndTime;
  const effectiveDuration = codingDurationMinutes !== undefined ? codingDurationMinutes : internalDuration;
  const setEffectiveDuration = setCodingDurationMinutes || setInternalDuration;

  const content = (
    <div className="fixed inset-0 z-[99999] bg-[#090d16] text-slate-100 flex flex-col">
      {/* ── Top Header — Two Rows ── */}
      <div className="flex-shrink-0 bg-[#0b111e] border-b border-slate-800 shadow-xl">
        {/* Row 1: Back + Title + Actions */}
        <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-3 border-b border-slate-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-5 w-px bg-slate-700 flex-shrink-0 hidden sm:block" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black text-white truncate">
                {isEditing ? "Edit Coding Challenge" : "Coding Challenge Studio"}
              </h3>
              <span className="flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 hidden sm:inline-block">
                IDE
              </span>
              {isEditing ? (
                <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Editing Mode
                </span>
              ) : (
                <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hidden md:inline-block">
                  {selectedBatch.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSaveCodingChallengeToAssignment}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white rounded-lg text-xs font-black shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? "Update Challenge" : "Save Challenge"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Row 2: Tab Navigation */}
        <div className="px-4 sm:px-8 py-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCodingStudioTab("details")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              codingStudioTab === "details"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Problem Details</span>
          </button>
          <button
            onClick={() => setCodingStudioTab("testcases")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              codingStudioTab === "testcases"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>2. Test Cases ({codingStudioProblem.testCases?.length || 0})</span>
          </button>
          <button
            onClick={() => setCodingStudioTab("starter")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              codingStudioTab === "starter"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>3. Starter Code</span>
          </button>
          <button
            onClick={() => setCodingStudioTab("preview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              codingStudioTab === "preview"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>4. Live Preview</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-6">
          {/* AI Problem Generator Quick-Prompt Bar */}
          <div className="p-4 bg-[#0f172a] rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 shadow-md">
            <div className="flex items-center gap-2 text-xs font-black text-sky-400 whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>AI Problem Generator:</span>
            </div>
            <input
              type="text"
              value={aiCodingPromptTopic}
              onChange={(e) => setAiCodingPromptTopic(e.target.value)}
              placeholder="e.g. Dynamic Programming Subsequence, AI Prompt Ingestion Loop, Graph BFS..."
              className="flex-1 w-full px-4 py-2.5 bg-[#090d16] text-white rounded-xl border border-slate-700/80 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              disabled={isAiGeneratingCoding || !aiCodingPromptTopic.trim()}
              onClick={handleGenerateAiCodingChallenge}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition whitespace-nowrap cursor-pointer"
            >
              {isAiGeneratingCoding ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Tab 1: Problem Details */}
          {codingStudioTab === "details" && (
            <div className="bg-[#0b111e] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <h4 className="text-sm font-black uppercase tracking-wider text-sky-400 border-b border-slate-800/80 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Problem Statement & Specification</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Problem Title
                  </label>
                  <input
                    type="text"
                    value={codingStudioProblem.title || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, title: e.target.value })
                    }
                    placeholder="e.g. Two Sum"
                    className="w-full px-4 py-3 bg-[#090d16] text-white rounded-xl border border-slate-800 text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={codingStudioProblem.difficulty || "Easy"}
                    onChange={(e) =>
                      setCodingStudioProblem({
                        ...codingStudioProblem,
                        difficulty: e.target.value as "Easy" | "Medium" | "Hard",
                      })
                    }
                    className="w-full px-4 py-3 bg-[#090d16] text-white rounded-xl border border-slate-800 text-sm font-bold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Points
                  </label>
                  <input
                    type="number"
                    value={codingStudioProblem.points}
                    onChange={(e) =>
                      setCodingStudioProblem({
                        ...codingStudioProblem,
                        points: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#090d16] text-white rounded-xl border border-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Exam Schedule & Time Window Controls */}
              <div className="bg-[#090d16] p-5 rounded-2xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Exam Window & Duration Controls</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-300 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/50">
                    Real-time Student Access Window
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Start Date */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-400" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveStartDate}
                      onChange={(e) => setEffectiveStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b111e] text-white rounded-xl border border-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>Start Time</span>
                    </label>
                    <input
                      type="time"
                      value={effectiveStartTime}
                      onChange={(e) => setEffectiveStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b111e] text-white rounded-xl border border-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      <span>End Date</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveEndDate}
                      onChange={(e) => setEffectiveEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b111e] text-white rounded-xl border border-slate-800 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      <span>End Time</span>
                    </label>
                    <input
                      type="time"
                      value={effectiveEndTime}
                      onChange={(e) => setEffectiveEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b111e] text-white rounded-xl border border-slate-800 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Duration (Minutes) */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Timer className="w-3 h-3 text-emerald-400" />
                      <span>Duration (Mins)</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={effectiveDuration}
                      onChange={(e) => setEffectiveDuration(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 bg-[#0b111e] text-emerald-300 font-black rounded-xl border border-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                  Problem Description (Markdown / Text)
                </label>
                <textarea
                  rows={6}
                  value={codingStudioProblem.description || ""}
                  onChange={(e) =>
                    setCodingStudioProblem({
                      ...codingStudioProblem,
                      description: e.target.value,
                      question: e.target.value,
                    })
                  }
                  placeholder="Given an array of integers `nums` and an integer `target`, return indices..."
                  className="w-full p-4 bg-[#090d16] text-slate-200 rounded-2xl border border-slate-800 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Input Format, Output Format, Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                    Input Format
                  </label>
                  <input
                    type="text"
                    value={codingStudioProblem.inputFormat || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, inputFormat: e.target.value })
                    }
                    placeholder="e.g. First line: n elements..."
                    className="w-full px-4 py-2.5 bg-[#090d16] text-slate-200 rounded-xl border border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                    Output Format
                  </label>
                  <input
                    type="text"
                    value={codingStudioProblem.outputFormat || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, outputFormat: e.target.value })
                    }
                    placeholder="e.g. Two space-separated indices..."
                    className="w-full px-4 py-2.5 bg-[#090d16] text-slate-200 rounded-xl border border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                    Constraints
                  </label>
                  <input
                    type="text"
                    value={codingStudioProblem.constraints || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, constraints: e.target.value })
                    }
                    placeholder="e.g. 2 <= n <= 10^4..."
                    className="w-full px-4 py-2.5 bg-[#090d16] text-slate-200 rounded-xl border border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Sample Input / Output */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                    Sample Input
                  </label>
                  <textarea
                    rows={3}
                    value={codingStudioProblem.sampleInput || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, sampleInput: e.target.value })
                    }
                    placeholder={"4\n2 7 11 15\n9"}
                    className="w-full p-3.5 bg-[#090d16] text-emerald-400 font-mono rounded-xl border border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                    Sample Output
                  </label>
                  <textarea
                    rows={3}
                    value={codingStudioProblem.sampleOutput || ""}
                    onChange={(e) =>
                      setCodingStudioProblem({ ...codingStudioProblem, sampleOutput: e.target.value })
                    }
                    placeholder="0 1"
                    className="w-full p-3.5 bg-[#090d16] text-emerald-400 font-mono rounded-xl border border-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Test Cases */}
          {codingStudioTab === "testcases" && (
            <div className="bg-[#0b111e] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span>Automated Test Suite ({codingStudioProblem.testCases?.length || 0})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define public sample test cases and hidden test cases for automated evaluation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const current = codingStudioProblem.testCases || [];
                    setCodingStudioProblem({
                      ...codingStudioProblem,
                      testCases: [
                        ...current,
                        {
                          input: `arg_${current.length + 1} = test`,
                          expectedOutput: "expected",
                          explanation: "Test case explanation",
                          isHidden: false,
                        },
                      ],
                    });
                  }}
                  className="px-4 py-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 rounded-xl text-xs font-bold transition border border-sky-500/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test Case</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codingStudioProblem.testCases?.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-[#090d16] rounded-2xl border border-slate-800 space-y-3 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-2">
                        <span>Test Case #{idx + 1}</span>
                        {tc.isHidden && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Hidden
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tc.isHidden || false}
                            onChange={(e) => {
                              const list = [...(codingStudioProblem.testCases || [])];
                              list[idx].isHidden = e.target.checked;
                              setCodingStudioProblem({ ...codingStudioProblem, testCases: list });
                            }}
                            className="rounded text-sky-500"
                          />
                          <span>Hidden test</span>
                        </label>
                        <button
                          onClick={() => {
                            const list = (codingStudioProblem.testCases || []).filter((_, i) => i !== idx);
                            setCodingStudioProblem({ ...codingStudioProblem, testCases: list });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Input Argument:</label>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) => {
                            const list = [...(codingStudioProblem.testCases || [])];
                            list[idx].input = e.target.value;
                            setCodingStudioProblem({ ...codingStudioProblem, testCases: list });
                          }}
                          className="w-full px-3.5 py-2 bg-[#050811] text-slate-200 rounded-xl border border-slate-800 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Expected Return / Output:</label>
                        <input
                          type="text"
                          value={tc.expectedOutput}
                          onChange={(e) => {
                            const list = [...(codingStudioProblem.testCases || [])];
                            list[idx].expectedOutput = e.target.value;
                            setCodingStudioProblem({ ...codingStudioProblem, testCases: list });
                          }}
                          className="w-full px-3.5 py-2 bg-[#050811] text-emerald-400 rounded-xl border border-slate-800 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Starter Code */}
          {codingStudioTab === "starter" && (
            <div className="bg-[#0b111e] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    <span>Student Starter Boilerplate Template</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Provide standard starter function signatures and hints for students in their chosen language.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Language:</span>
                  <select
                    value={codingStudioProblem.language || "python"}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      const currentCode = codingStudioProblem.starterCodes?.[newLang] || codingStudioProblem.starterCode;
                      setCodingStudioProblem((prev) => ({
                        ...prev,
                        language: newLang as any,
                        starterCode: currentCode,
                        starterCodes: {
                          ...(prev.starterCodes || {}),
                          [newLang]: currentCode || "",
                        },
                      }));
                    }}
                    className="px-3 py-1.5 bg-[#121a2d] text-sky-400 font-mono text-xs rounded-xl border border-slate-700 font-bold cursor-pointer"
                  >
                    <option value="python">🐍 Python</option>
                    <option value="javascript">🟨 JavaScript</option>
                    <option value="typescript">🔷 TypeScript</option>
                    <option value="java">☕ Java</option>
                    <option value="cpp">⚡ C++</option>
                    <option value="c">⚙️ C</option>
                    <option value="csharp">🟣 C#</option>
                    <option value="go">🐹 Go</option>
                    <option value="rust">🦀 Rust</option>
                    <option value="php">🐘 PHP</option>
                    <option value="ruby">💎 Ruby</option>
                    <option value="swift">🦅 Swift</option>
                    <option value="kotlin">🎯 Kotlin</option>
                    <option value="dart">🎯 Dart</option>
                    <option value="scala">🔴 Scala</option>
                    <option value="sql">🗄️ SQL</option>
                    <option value="bash">🐚 Bash</option>
                    <option value="r">📊 R</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#070a12]">
                <div className="px-4 py-2.5 bg-[#0b111e] border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>
                    starter_template.
                    {(() => {
                      const l = (codingStudioProblem.language || "python").toLowerCase();
                      if (l === "javascript") return "js";
                      if (l === "typescript") return "ts";
                      if (l === "python") return "py";
                      if (l === "cpp") return "cpp";
                      if (l === "c") return "c";
                      if (l === "java") return "java";
                      if (l === "csharp") return "cs";
                      if (l === "go") return "go";
                      if (l === "rust") return "rs";
                      if (l === "php") return "php";
                      if (l === "ruby") return "rb";
                      if (l === "swift") return "swift";
                      if (l === "kotlin") return "kt";
                      if (l === "dart") return "dart";
                      if (l === "scala") return "scala";
                      if (l === "sql") return "sql";
                      if (l === "bash") return "sh";
                      if (l === "r") return "r";
                      return "txt";
                    })()}
                  </span>
                  <span className="text-[10px] text-slate-500">Provide clean function signature & docstrings</span>
                </div>
                <textarea
                  rows={12}
                  value={codingStudioProblem.starterCode || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const lang = codingStudioProblem.language || "python";
                    setCodingStudioProblem((prev) => ({
                      ...prev,
                      starterCode: val,
                      starterCodes: {
                        ...(prev.starterCodes || {}),
                        [lang]: val,
                      },
                    }));
                  }}
                  placeholder="def solution(...):&#10;    # Write starter code here&#10;    pass"
                  className="w-full p-4 bg-transparent text-emerald-400 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Live Split Preview */}
          {codingStudioTab === "preview" && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-950/40 text-sky-300 text-xs sm:text-sm rounded-2xl border border-sky-800/40 flex items-center gap-3">
                <Eye className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <span>
                  <strong>Interactive Live Preview:</strong> This is exactly how students will see, code, and execute this challenge with in-browser compilation.
                </span>
              </div>
              <CodingChallengeIDE
                key={`${codingStudioProblem.id}_${codingStudioProblem.language}_${codingStudioProblem.starterCode || ""}`}
                question={codingStudioProblem}
                questionNumber={1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render via portal to bypass parent stacking context (overflow, z-index, transform)
  return createPortal(content, document.body);
};
