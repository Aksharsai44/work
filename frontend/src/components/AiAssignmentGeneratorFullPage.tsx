import React from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  ChevronLeft,
  XCircle,
  FileUp,
  Sliders,
  Upload,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Batch } from "../types";

interface AiAssignmentGeneratorFullPageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: Batch;
  aiStep: "upload" | "customize";
  setAiStep: React.Dispatch<React.SetStateAction<"upload" | "customize">>;
  uploadedFileName: string;
  uploadedFileSize: string;
  sourceText: string;
  setSourceText: React.Dispatch<React.SetStateAction<string>>;
  asgTitle: string;
  setAsgTitle: React.Dispatch<React.SetStateAction<string>>;
  asgDuration: number;
  setAsgDuration: React.Dispatch<React.SetStateAction<number>>;
  enableMcq: boolean;
  setEnableMcq: React.Dispatch<React.SetStateAction<boolean>>;
  mcqCount: number;
  setMcqCount: React.Dispatch<React.SetStateAction<number>>;
  enableTrueFalse: boolean;
  setEnableTrueFalse: React.Dispatch<React.SetStateAction<boolean>>;
  trueFalseCount: number;
  setTrueFalseCount: React.Dispatch<React.SetStateAction<number>>;
  enableFillBlanks: boolean;
  setEnableFillBlanks: React.Dispatch<React.SetStateAction<boolean>>;
  fillBlanksCount: number;
  setFillBlanksCount: React.Dispatch<React.SetStateAction<number>>;
  enablePolls: boolean;
  setEnablePolls: React.Dispatch<React.SetStateAction<boolean>>;
  pollsCount: number;
  setPollsCount: React.Dispatch<React.SetStateAction<number>>;
  enableEssay: boolean;
  setEnableEssay: React.Dispatch<React.SetStateAction<boolean>>;
  essayCount: number;
  setEssayCount: React.Dispatch<React.SetStateAction<number>>;
  enableCoding: boolean;
  setEnableCoding: React.Dispatch<React.SetStateAction<boolean>>;
  codingCount: number;
  setCodingCount: React.Dispatch<React.SetStateAction<number>>;
  codingLanguage: "python" | "javascript" | "java";
  setCodingLanguage: React.Dispatch<React.SetStateAction<"python" | "javascript" | "java">>;
  isGenerating: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateAiAssignment: () => void;
}

export const AiAssignmentGeneratorFullPage: React.FC<AiAssignmentGeneratorFullPageProps> = ({
  isOpen,
  onClose,
  selectedBatch,
  aiStep,
  setAiStep,
  uploadedFileName,
  uploadedFileSize,
  sourceText,
  setSourceText,
  asgTitle,
  setAsgTitle,
  asgDuration,
  setAsgDuration,
  enableMcq,
  setEnableMcq,
  mcqCount,
  setMcqCount,
  enableTrueFalse,
  setEnableTrueFalse,
  trueFalseCount,
  setTrueFalseCount,
  enableFillBlanks,
  setEnableFillBlanks,
  fillBlanksCount,
  setFillBlanksCount,
  enablePolls,
  setEnablePolls,
  pollsCount,
  setPollsCount,
  enableEssay,
  setEnableEssay,
  essayCount,
  setEssayCount,
  enableCoding,
  setEnableCoding,
  codingCount,
  setCodingCount,
  codingLanguage,
  setCodingLanguage,
  isGenerating,
  handleFileUpload,
  handleGenerateAiAssignment,
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col animate-in fade-in">
      {/* Full Page Sticky Top Bar */}
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>AI File / PPT Generator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedBatch.name}
                </span>
              </h3>
            </div>
          </div>
        </div>

        {/* Stepper Navigation in Top Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setAiStep("upload")}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              aiStep === "upload"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>1. Upload & Topic</span>
          </button>

          <button
            onClick={() => setAiStep("customize")}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              aiStep === "customize"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Question Types</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Close"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Full Page Main Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-6 sm:p-10">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
            {/* STEP 1: FILE UPLOAD */}
            {aiStep === "upload" && (
              <div className="space-y-6">
                {/* Drag & Drop Box */}
                <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-3xl p-8 sm:p-12 text-center bg-indigo-50/20 hover:bg-indigo-50/40 transition group relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pptx,.ppt,.pdf,.docx,.doc,.txt,.md"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base mb-1">
                    {uploadedFileName ? `Selected File: ${uploadedFileName}` : "Upload PPT, PDF, DOC, or Syllabus Notes"}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    {uploadedFileSize ? `File Size: ${uploadedFileSize}` : "Drag and drop your presentation slides or syllabus file here to extract content with AI."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      value={asgTitle}
                      onChange={(e) => setAsgTitle(e.target.value)}
                      placeholder="e.g. AI Agent Core Concepts & Python Coding"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Target Batch
                    </label>
                    <div className="px-4 py-3 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 flex items-center justify-between">
                      <span>{selectedBatch.name}</span>
                      <span className="text-xs font-mono text-slate-400">{selectedBatch.id}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Extracted Slide Content / Notes Text
                  </label>
                  <textarea
                    rows={6}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste slides, notes, syllabus, or lecture topics to base questions on..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-sans focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setAiStep("customize")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Continue to Step 2: Customize Question Types</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CUSTOMIZE QUESTION BREAKDOWN */}
            {aiStep === "customize" && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-xs sm:text-sm text-indigo-900 flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Customize the exact number of questions you want for each format. Uncheck or set to 0 any type you do not want to generate.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Time Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={asgDuration}
                      onChange={(e) => setAsgDuration(parseInt(e.target.value) || 30)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Coding Challenge Language
                    </label>
                    <select
                      value={codingLanguage}
                      onChange={(e) =>
                        setCodingLanguage(e.target.value as "python" | "javascript" | "java")
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                </div>

                {/* Individual Question Type Cards */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">
                    Question Formats & Quantities
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. MCQs */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableMcq}
                          onChange={(e) => setEnableMcq(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Multiple Choice Questions (MCQ)
                          </span>
                          <span className="text-[10px] text-slate-400">4 options with 1 correct option</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          disabled={!enableMcq}
                          value={mcqCount}
                          onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* 2. True / False */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableTrueFalse}
                          onChange={(e) => setEnableTrueFalse(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            True / False Statements
                          </span>
                          <span className="text-[10px] text-slate-400">Rapid factual validation</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          disabled={!enableTrueFalse}
                          value={trueFalseCount}
                          onChange={(e) => setTrueFalseCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* 3. Fill in the blanks */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableFillBlanks}
                          onChange={(e) => setEnableFillBlanks(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Fill in the Blanks
                          </span>
                          <span className="text-[10px] text-slate-400">Vocabulary and syntax terms</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          disabled={!enableFillBlanks}
                          value={fillBlanksCount}
                          onChange={(e) => setFillBlanksCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* 4. Polls */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePolls}
                          onChange={(e) => setEnablePolls(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Interactive Polls & Surveys
                          </span>
                          <span className="text-[10px] text-slate-400">Student feedback & opinion prompts</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!enablePolls}
                          value={pollsCount}
                          onChange={(e) => setPollsCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* 5. Short Essay */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableEssay}
                          onChange={(e) => setEnableEssay(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Short Essay / Concept Explanation
                          </span>
                          <span className="text-[10px] text-slate-400">Written response questions</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!enableEssay}
                          value={essayCount}
                          onChange={(e) => setEssayCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* 6. Coding Problem */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableCoding}
                          onChange={(e) => setEnableCoding(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            Coding IDE Challenges
                          </span>
                          <span className="text-[10px] text-slate-400">Automated test cases and starter code</span>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Count:</span>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          disabled={!enableCoding}
                          value={codingCount}
                          onChange={(e) => setCodingCount(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setAiStep("upload")}
                    className="px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    ← Back to Upload
                  </button>
                  <button
                    disabled={isGenerating}
                    onClick={handleGenerateAiAssignment}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Questions & Code Challenges...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate & Publish Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
