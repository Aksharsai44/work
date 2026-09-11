import React, { useState, useRef, useEffect } from "react";
import {
  Batch,
  Student,
  LiveQuestion,
  Assignment,
  AppSettings,
  ScheduledMeeting,
} from "../types";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Clock,
  Award,
  BarChart3,
  Plus,
  Radio,
  Send,
  Eye,
  Sparkles,
  ArrowRight,
  Flame,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Trophy,
  X,
  Search,
  Check,
  Filter,
  Layers,
  BellRing,
  HelpCircle,
  ExternalLink,
  GraduationCap,
  Medal,
  GripHorizontal,
  FileText,
} from "lucide-react";
import { LiveSessionBanner } from "./LiveSessionBanner";

interface AdminDashboardViewProps {
  batches: Batch[];
  selectedBatch: Batch;
  onSelectBatch: (b: Batch) => void;
  students: Student[];
  liveQuestions: LiveQuestion[];
  assignments: Assignment[];
  settings?: AppSettings;
  scheduledMeetings?: ScheduledMeeting[];
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onToggleRecordingUnlock?: () => void;
  onNavigateTab: (tab: string) => void;
  onCreateInstantPoll: (q: {
    question: string;
    options: string[];
    correctAnswer?: string;
    type: "mcq" | "poll" | "true_false" | "open";
    codeSnippet?: string;
    points?: number;
    timerSeconds?: number;
  }) => void;
  onViewStudent?: (student: Student) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  students,
  liveQuestions,
  assignments,
  settings,
  scheduledMeetings = [],
  onUpdateSettings,
  onToggleRecordingUnlock,
  onNavigateTab,
  onCreateInstantPoll,
  onViewStudent,
}) => {
  // Widget filter / drill-down modal state
  const [drilldownMetric, setDrilldownMetric] = useState<
    "all" | "attempting" | "not_attending" | "top_performers" | null
  >(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [nudgeSentIds, setNudgeSentIds] = useState<{ [id: string]: boolean }>({});

  // Question detail modal for top 5 speed leaderboard & who answered correct/wrong
  const [inspectedQuestion, setInspectedQuestion] = useState<LiveQuestion | null>(null);
  const [questionTab, setQuestionTab] = useState<"speed" | "correct" | "wrong" | "unattempted" | "submissions">("speed");

  // Instant Poll / Quiz creation modal
  const [showInstantPollModal, setShowInstantPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollType, setPollType] = useState<"mcq" | "poll" | "true_false" | "open">("mcq");
  const [pollOptions, setPollOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [pollCorrect, setPollCorrect] = useState<string>("Option 1");
  const [pollTimeLimit, setPollTimeLimit] = useState(30);
  const [pollPoints, setPollPoints] = useState(100);
  const [pollExplanation, setPollExplanation] = useState("");
  const [pollSampleReference, setPollSampleReference] = useState("");

  // Batch students calculation
  const batchStudents = students.filter((s) => s.batchId === selectedBatch.id);
  const totalBatchMembers = batchStudents.length;

  // Stat metrics
  const attemptingStudents = batchStudents.filter((s) => (s.scores?.overallAccuracy ?? 0) > 0);
  const notAttendingStudents = batchStudents.filter((s) => (s.scores?.overallAccuracy ?? 0) === 0);
  const topPerformerStudents = batchStudents.filter((s) => (s.scores?.overallAccuracy ?? 0) >= 85);

  const attemptingCount = attemptingStudents.length;
  const notAttendingCount = notAttendingStudents.length;
  const topPerformersCount = topPerformerStudents.length;

  const avgAccuracy =
    totalBatchMembers === 0
      ? "0.0"
      : (
          batchStudents.reduce((acc, s) => acc + (s.scores?.overallAccuracy ?? 0), 0) /
          totalBatchMembers
        ).toFixed(1);

  // Display latest questions for this batch (sorted by createdAt descending)
  const batchQuestions = [...liveQuestions]
    .filter((q) => q.batchId === selectedBatch.id)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const activeQuestions = batchQuestions.slice(0, 6);

  // Poll creation submit handler
  const handleCreatePollSubmit = () => {
    if (!pollQuestion.trim()) return;
    const filteredOptions = pollOptions.filter((o) => o.trim());
    onCreateInstantPoll({
      question: pollQuestion.trim(),
      options: pollType === "open" ? [] : filteredOptions,
      correctAnswer:
        pollType === "mcq" || pollType === "true_false"
          ? pollCorrect
          : undefined,
      type: pollType,
      timeLimitSeconds: pollTimeLimit,
      points: pollPoints,
      explanation: pollExplanation.trim() || undefined,
    });
    setShowInstantPollModal(false);
    setPollQuestion("");
    setPollOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
    setPollCorrect("Option 1");
    setPollExplanation("");
    setPollSampleReference("");
    setPollTimeLimit(30);
    setPollPoints(100);
  };

  // Filter students for the metric drill-down modal
  const getModalStudents = () => {
    let list = batchStudents;
    if (drilldownMetric === "attempting") {
      list = attemptingStudents;
    } else if (drilldownMetric === "not_attending") {
      list = notAttendingStudents;
    } else if (drilldownMetric === "top_performers") {
      list = topPerformerStudents;
    }

    if (!modalSearchQuery.trim()) return list;
    const query = modalSearchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.college && s.college.toLowerCase().includes(query))
    );
  };

  const handleSendNudge = (studentId: string) => {
    setNudgeSentIds((prev) => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setNudgeSentIds((prev) => ({ ...prev, [studentId]: false }));
    }, 4000);
  };

  // Batch Dropdown Selector State (drag down and select)
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        batchDropdownRef.current &&
        !batchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBatchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
      b.college.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(batchSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. BATCH NAME & DROP-DOWN SELECTOR (DRAG/DROP DOWN TO SELECT BATCH)        */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Active Selected Batch Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xl shadow-inner border border-sky-100/80 flex-shrink-0">
            {selectedBatch.type === "workshop" ? "⚡" : "🚀"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                {selectedBatch.type}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                📅 {selectedBatch.durationLabel}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                ● Live Active
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">
              {selectedBatch.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate">{selectedBatch.college}</p>
          </div>
        </div>

        {/* Right: Dropdown Menu to Select Batch */}
        <div className="flex items-center gap-2.5 relative flex-shrink-0" ref={batchDropdownRef}>
          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 hover:border-sky-200 transition font-bold text-xs shadow-xs min-w-[200px] sm:min-w-[240px] cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span>{selectedBatch.type === "workshop" ? "🛠️" : "⛺"}</span>
              <span className="truncate font-black text-slate-900">{selectedBatch.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
              <span className="text-[10px] font-black bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                {students.filter((s) => s.batchId === selectedBatch.id).length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                  isBatchDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Manage Batches Link Shortcut */}
          <button
            type="button"
            onClick={() => onNavigateTab("batch")}
            className="p-2.5 rounded-2xl text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 flex-shrink-0 transition font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            title="Manage all batches"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Manage</span>
          </button>

          {/* Dropdown Menu Panel (Drag/Drop down list) */}
          {isBatchDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header & Search */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Select Batch ({batches.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchDropdownOpen(false);
                      onNavigateTab("batch");
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
                  >
                    + Create New
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={batchSearchQuery}
                    onChange={(e) => setBatchSearchQuery(e.target.value)}
                    placeholder="Search by batch name, college..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Batches List in Dropdown */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1.5">
                {filteredBatches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No batches found matching "{batchSearchQuery}"
                  </div>
                ) : (
                  filteredBatches.map((b) => {
                    const isSelected = b.id === selectedBatch.id;
                    const studentCount = students.filter((s) => s.batchId === b.id).length;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          onSelectBatch(b);
                          setIsBatchDropdownOpen(false);
                          setBatchSearchQuery("");
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-sky-50 text-sky-900 border border-sky-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                              isSelected
                                ? "bg-sky-500 text-white font-bold"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {b.type === "workshop" ? "⚡" : "🚀"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-slate-900 truncate">
                                {b.name}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {b.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{b.college}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {studentCount} students
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium pl-1">
                  Active: <strong className="text-slate-700">{selectedBatch.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchDropdownOpen(false);
                    onNavigateTab("batch");
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                >
                  All Batches &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5 LIVE ZOOM SESSION & MEETING CONTROL BANNER                            */}
      {/* ========================================================================= */}
      {settings && (
        <LiveSessionBanner
          settings={settings}
          userRole="admin"
          batch={selectedBatch}
          scheduledMeetings={scheduledMeetings}
          onUpdateSettings={onUpdateSettings || (() => {})}
          onToggleRecordingUnlock={onToggleRecordingUnlock || (() => {})}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE STAT METRIC WIDGETS (Click to open Drill-down Modal)       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Batch Telemetry & Exam Engagement Metrics
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
            💡 Click any card below to view detailed student roster & actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Widget 1: Total Batch Members */}
          <div
            onClick={() => setDrilldownMetric("all")}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group transform hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition">
                Total Batch Members
              </span>
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition border border-indigo-100">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalBatchMembers}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Roster Active
              </span>
              <span className="text-[11px] font-extrabold text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Widget 2: Attempting / Completed Exam */}
          <div
            onClick={() => setDrilldownMetric("attempting")}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition cursor-pointer group transform hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition">
                Attempting / Attended
              </span>
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600">{attemptingCount}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span className="font-bold text-emerald-600">
                {totalBatchMembers > 0
                  ? Math.round((attemptingCount / totalBatchMembers) * 100)
                  : 0}
                % Completed Exam
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                View List <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Widget 3: Not Attending / Pending Exam */}
          <div
            onClick={() => setDrilldownMetric("not_attending")}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-amber-300 hover:shadow-md transition cursor-pointer group transform hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition">
                Not Attending / Pending
              </span>
              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition border border-amber-100">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-amber-600">{notAttendingCount}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span className="font-bold text-amber-700">
                {totalBatchMembers > 0
                  ? Math.round((notAttendingCount / totalBatchMembers) * 100)
                  : 0}
                % Pending Exam
              </span>
              <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                Send Alert <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Widget 4: High Performers & Accuracy */}
          <div
            onClick={() => setDrilldownMetric("top_performers")}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition cursor-pointer group transform hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-purple-700 transition">
                Batch Accuracy Avg
              </span>
              <span className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition border border-purple-100">
                <Trophy className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-purple-700">{avgAccuracy}%</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span className="font-bold text-purple-700 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {topPerformersCount} Stars (&gt;85%)
              </span>
              <span className="text-[11px] font-extrabold text-purple-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                Honors <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INSTANT POLLS / QUIZZES / LIVE Q&A (Max 4 Questions on Dashboard)      */}
      {/* ========================================================================= */}
      <div>
        {/* Main Content: Active Live Questions & Telemetry */}
        <div className="space-y-5">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg flex items-center gap-2.5">
                    Live Q&A Arena
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-rose-300 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-white/50 font-medium mt-0.5">
                    Real-time interactive polls broadcasted to student portals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowInstantPollModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Poll / Quiz</span>
                </button>

                <button
                  onClick={() => onNavigateTab("live_qa")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-xs font-bold border border-white/10 transition"
                >
                  <span>Q&A Room</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* List of Questions */}
          <div className="space-y-4">
            {activeQuestions.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-100">
                  <Radio className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-800">
                  No Active Polls or Quizzes
                </h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Launch an instant MCQ quiz, speed trivia, or opinion poll. Students will see it in real-time on their dashboard.
                </p>
                <button
                  onClick={() => setShowInstantPollModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <Plus className="w-4 h-4" /> Launch First Poll
                </button>
              </div>
            ) : (
              activeQuestions.map((q, idx) => {
                const totalResponses = q.responses.length;
                const correctCount = q.responses.filter((r) => r.isCorrect).length;
                const wrongCount = q.responses.filter((r) => r.isCorrect === false).length;
                const unattempted = Math.max(0, totalBatchMembers - totalResponses);

                const isOpen = q.type === "open";
                const isPoll = q.type === "poll";
                const isObjective = q.type === "mcq" || q.type === "true_false";

                const submittedPct =
                  totalBatchMembers > 0
                    ? Math.round((totalResponses / totalBatchMembers) * 100)
                    : 0;
                const correctPct =
                  totalBatchMembers > 0
                    ? Math.round((correctCount / totalBatchMembers) * 100)
                    : 0;
                const wrongPct =
                  totalBatchMembers > 0
                    ? Math.round((wrongCount / totalBatchMembers) * 100)
                    : 0;
                const unattemptedPct =
                  totalBatchMembers > 0
                    ? Math.round((unattempted / totalBatchMembers) * 100)
                    : 100;

                const reviewedCount = q.responses.filter(
                  (r) => r.rating !== undefined && r.rating !== null
                ).length;

                // Sort fastest responders for this question
                const fastestResponders = [...q.responses]
                  .sort((a, b) => a.responseTimeMs - b.responseTimeMs)
                  .slice(0, 5);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300 overflow-hidden"
                  >
                    {/* Question Card Header */}
                    <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                          Q{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            q.type === "mcq"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : q.type === "open"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : q.type === "true_false"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {q.type === "open"
                            ? "Open Challenge"
                            : q.type === "true_false"
                            ? "True / False"
                            : q.type === "poll"
                            ? "Live Poll"
                            : "MCQ"}
                        </span>
                        {isObjective && q.correctAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            Answer: {q.correctAnswer}
                          </span>
                        )}
                        {isOpen && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            Free-form Written
                          </span>
                        )}
                        {isPoll && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            Live Sentiment Poll
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-800">
                            {totalResponses}/{totalBatchMembers}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {isOpen ? "written" : isPoll ? "voted" : "submitted"}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setInspectedQuestion(q);
                            setQuestionTab(isOpen ? "submissions" : "speed");
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 border border-amber-200"
                          title={
                            isOpen
                              ? "View and review student written responses"
                              : "Open Speed Leaderboard and detailed student responses"
                          }
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          Inspect
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="px-6 pb-4">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-[15px] leading-relaxed">
                        {q.question}
                      </h4>
                    </div>

                    {/* Animated Multi-color Telemetry Progress Bar */}
                    <div className="px-6 pb-4 space-y-2.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 flex-wrap gap-2">
                        {isOpen ? (
                          <>
                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md font-bold">
                              <Send className="w-3 h-3" /> {totalResponses} submitted ({submittedPct}%)
                            </span>
                            {reviewedCount > 0 && (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                                ★ {reviewedCount} evaluated
                              </span>
                            )}
                            <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                              {unattempted} pending ({unattemptedPct}%)
                            </span>
                          </>
                        ) : isPoll ? (
                          <>
                            <span className="flex items-center gap-1 text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-md font-bold">
                              <BarChart3 className="w-3 h-3" /> {totalResponses} votes cast ({submittedPct}%)
                            </span>
                            <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                              {unattempted} pending ({unattemptedPct}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> {correctCount} correct ({correctPct}%)
                            </span>
                            {q.type === "mcq" && (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                {wrongCount} wrong ({wrongPct}%)
                              </span>
                            )}
                            <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                              {unattempted} pending ({unattemptedPct}%)
                            </span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        {isOpen ? (
                          <>
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 transition-all duration-700"
                              style={{ width: `${submittedPct}%` }}
                            />
                            <div
                              className="h-full bg-slate-200 transition-all duration-700"
                              style={{ width: `${unattemptedPct}%` }}
                            />
                          </>
                        ) : isPoll ? (
                          <>
                            <div
                              className="h-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700"
                              style={{ width: `${submittedPct}%` }}
                            />
                            <div
                              className="h-full bg-slate-200 transition-all duration-700"
                              style={{ width: `${unattemptedPct}%` }}
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                              style={{ width: `${correctPct}%` }}
                            />
                            <div
                              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
                              style={{ width: `${wrongPct}%` }}
                            />
                            <div
                              className="h-full bg-slate-200 transition-all duration-700"
                              style={{ width: `${unattemptedPct}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Responses / Fastest Submissions */}
                    {fastestResponders.length > 0 && (
                      <div className="px-6 pb-5 pt-3 border-t border-slate-100/80 bg-slate-50/30">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                          <span className="flex items-center gap-1.5 text-indigo-600">
                            {isOpen ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <Flame className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{isOpen ? "Student Written Submissions" : "Fastest Responders"}</span>
                          </span>
                          <span>Speed</span>
                        </div>

                        {isOpen ? (
                          <div className="flex flex-col gap-2">
                            {fastestResponders.map((resp, rIdx) => (
                              <div
                                key={rIdx}
                                onClick={() => {
                                  setInspectedQuestion(q);
                                  setQuestionTab("submissions");
                                }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                      rIdx === 0
                                        ? "bg-amber-100 text-amber-700"
                                        : rIdx === 1
                                        ? "bg-slate-200 text-slate-600"
                                        : rIdx === 2
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {rIdx === 0 ? "🥇" : rIdx === 1 ? "🥈" : rIdx === 2 ? "🥉" : `#${rIdx + 1}`}
                                  </span>
                                  <span className="font-extrabold text-slate-800 text-xs truncate flex-shrink-0">
                                    {resp.studentName.split(" ")[0]}
                                  </span>
                                  <span className="text-slate-300 hidden sm:inline flex-shrink-0">•</span>
                                  <span className="text-xs text-slate-600 italic truncate max-w-[280px] sm:max-w-[340px]">
                                    “{resp.answer}”
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                  {resp.rating ? (
                                    <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                      ★ {resp.rating}/5
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                      Written
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                    {(resp.responseTimeMs / 1000).toFixed(2)}s
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {fastestResponders.map((resp, rIdx) => (
                              <div
                                key={rIdx}
                                onClick={() => {
                                  setInspectedQuestion(q);
                                  setQuestionTab("speed");
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                                  resp.isCorrect !== false
                                    ? "bg-white text-emerald-800 border-emerald-200 shadow-sm"
                                    : "bg-white text-rose-800 border-rose-200 shadow-sm"
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                    rIdx === 0
                                      ? "bg-amber-100 text-amber-700"
                                      : rIdx === 1
                                      ? "bg-slate-200 text-slate-600"
                                      : rIdx === 2
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {rIdx === 0 ? "🥇" : rIdx === 1 ? "🥈" : rIdx === 2 ? "🥉" : `#${rIdx + 1}`}
                                </span>
                                <span className="font-extrabold truncate max-w-[100px]">
                                  {resp.studentName.split(" ")[0]}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                                  {(resp.responseTimeMs / 1000).toFixed(2)}s
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: STAT METRIC DRILL-DOWN (Roster of Attempted / Not Attempted)    */}
      {/* ========================================================================= */}
      {drilldownMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  {drilldownMetric === "attempting" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : drilldownMetric === "not_attending" ? (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  ) : drilldownMetric === "top_performers" ? (
                    <Trophy className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Users className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {drilldownMetric === "attempting"
                      ? `Students Attempting / Completed Exam (${attemptingCount})`
                      : drilldownMetric === "not_attending"
                      ? `Students Not Attending / Pending Exam (${notAttendingCount})`
                      : drilldownMetric === "top_performers"
                      ? `Top Academic Performers (${topPerformersCount})`
                      : `Total Batch Roster (${totalBatchMembers})`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedBatch.name} • {selectedBatch.college}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDrilldownMetric(null);
                  setModalSearchQuery("");
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold w-full sm:w-auto">
                <button
                  onClick={() => setDrilldownMetric("all")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    drilldownMetric === "all"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({totalBatchMembers})
                </button>
                <button
                  onClick={() => setDrilldownMetric("attempting")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    drilldownMetric === "attempting"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Attempted ({attemptingCount})
                </button>
                <button
                  onClick={() => setDrilldownMetric("not_attending")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    drilldownMetric === "not_attending"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({notAttendingCount})
                </button>
                <button
                  onClick={() => setDrilldownMetric("top_performers")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    drilldownMetric === "top_performers"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Stars ({topPerformersCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search student..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[380px]">
              {getModalStudents().length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No students found matching this criteria.
                </div>
              ) : (
                getModalStudents().map((stu) => {
                  const accuracy = stu.scores?.overallAccuracy ?? 0;
                  const hasAttempted = accuracy > 0;
                  const isNudged = nudgeSentIds[stu.id];

                  return (
                    <div
                      key={stu.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200/80 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            stu.avatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${stu.name}`
                          }
                          alt={stu.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {stu.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                            {stu.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`text-xs font-black block ${
                              hasAttempted ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {hasAttempted
                              ? `${accuracy}% Score`
                              : "Not Attempted"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {stu.totalPoints ?? 0} Points Earned
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!hasAttempted && (
                            <button
                              onClick={() => handleSendNudge(stu.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                isNudged
                                  ? "bg-emerald-500 text-white"
                                  : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                              }`}
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>{isNudged ? "Alert Sent!" : "Nudge"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setDrilldownMetric(null);
                              onViewStudent(stu);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {getModalStudents().length} of {totalBatchMembers} students
              </span>
              <button
                onClick={() => {
                  setDrilldownMetric(null);
                  onNavigateTab("batch");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition"
              >
                Open Full Batch Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: QUESTION TELEMETRY & SPEED LEADERBOARD (Top 5 & Breakdown)      */}
      {/* ========================================================================= */}
      {inspectedQuestion && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-100">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100/50 shadow-sm">
                    {inspectedQuestion.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {inspectedQuestion.responses.length} / {totalBatchMembers} Submissions
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {inspectedQuestion.question}
                </h3>
              </div>

              <button
                onClick={() => setInspectedQuestion(null)}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl text-xs font-bold">
              {inspectedQuestion.type === "open" ? (
                <>
                  <button
                    onClick={() => setQuestionTab("submissions")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "submissions"
                        ? "bg-white text-indigo-700 shadow-sm font-black ring-1 ring-indigo-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <FileText className={`w-4 h-4 ${questionTab === "submissions" ? "text-indigo-500" : ""}`} />
                    <span>Submissions ({inspectedQuestion.responses.length})</span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("speed")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "speed"
                        ? "bg-white text-amber-700 shadow-sm font-black ring-1 ring-amber-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${questionTab === "speed" ? "text-amber-500" : ""}`} />
                    <span>Speed Podium</span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("unattempted")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "unattempted"
                        ? "bg-white text-slate-800 shadow-sm font-black ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${questionTab === "unattempted" ? "text-slate-500" : ""}`} />
                    <span>
                      Pending ({Math.max(0, totalBatchMembers - inspectedQuestion.responses.length)})
                    </span>
                  </button>
                </>
              ) : inspectedQuestion.type === "poll" ? (
                <>
                  <button
                    onClick={() => setQuestionTab("speed")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "speed"
                        ? "bg-white text-amber-700 shadow-sm font-black ring-1 ring-amber-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${questionTab === "speed" ? "text-amber-500" : ""}`} />
                    <span>Speed Podium</span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("submissions")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "submissions"
                        ? "bg-white text-violet-700 shadow-sm font-black ring-1 ring-violet-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <BarChart3 className={`w-4 h-4 ${questionTab === "submissions" ? "text-violet-500" : ""}`} />
                    <span>Votes & Answers ({inspectedQuestion.responses.length})</span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("unattempted")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "unattempted"
                        ? "bg-white text-slate-800 shadow-sm font-black ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${questionTab === "unattempted" ? "text-slate-500" : ""}`} />
                    <span>
                      Pending ({Math.max(0, totalBatchMembers - inspectedQuestion.responses.length)})
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setQuestionTab("speed")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "speed"
                        ? "bg-white text-amber-700 shadow-sm font-black ring-1 ring-amber-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${questionTab === "speed" ? "text-amber-500" : ""}`} />
                    <span>Speed Podium</span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("correct")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "correct"
                        ? "bg-white text-emerald-700 shadow-sm font-black ring-1 ring-emerald-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${questionTab === "correct" ? "text-emerald-500" : ""}`} />
                    <span>
                      Correct ({inspectedQuestion.responses.filter((r) => r.isCorrect).length})
                    </span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("wrong")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "wrong"
                        ? "bg-white text-rose-700 shadow-sm font-black ring-1 ring-rose-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 ${questionTab === "wrong" ? "text-rose-500" : ""}`} />
                    <span>
                      Wrong (
                      {inspectedQuestion.responses.filter((r) => r.isCorrect === false).length})
                    </span>
                  </button>

                  <button
                    onClick={() => setQuestionTab("unattempted")}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      questionTab === "unattempted"
                        ? "bg-white text-slate-800 shadow-sm font-black ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${questionTab === "unattempted" ? "text-slate-500" : ""}`} />
                    <span>
                      Pending ({Math.max(0, totalBatchMembers - inspectedQuestion.responses.length)})
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Tab: Open Submissions & Answers */}
            {questionTab === "submissions" && (
              <div className="flex-1 space-y-3 pr-1 max-h-[420px] overflow-y-auto custom-scrollbar">
                {inspectedQuestion.responses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-slate-400 text-sm font-medium">No student submissions recorded yet.</span>
                  </div>
                ) : (
                  inspectedQuestion.responses.map((resp, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50/70 hover:bg-indigo-50/20 rounded-2xl border border-slate-200/80 transition-all duration-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={resp.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${resp.studentName}`}
                            alt={resp.studentName}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {resp.studentName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {(resp.responseTimeMs / 1000).toFixed(2)}s latency
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {resp.rating ? (
                            <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                              ★ {resp.rating}/5 Evaluated
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg">
                              Submitted
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setInspectedQuestion(null);
                              onNavigateTab("live_qa");
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                          >
                            Review in Q&A
                          </button>
                        </div>
                      </div>

                      {/* Student Answer Box */}
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-800 font-medium leading-relaxed shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Student Written Response:
                        </div>
                        <p className="text-slate-900 whitespace-pre-wrap font-sans">
                          {resp.answer}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 1: Top 5 Speed Leaderboard Podium */}
            {questionTab === "speed" && (
              <div className="flex-1 space-y-4 pr-1">
                <div className="text-center py-2 relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-amber-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200 shadow-sm">
                      {inspectedQuestion.type === "open"
                        ? "⚡ Fastest Written Submissions"
                        : inspectedQuestion.type === "poll"
                        ? "⚡ Fastest Poll Responders"
                        : "⚡ Fastest Correct Responders"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                {[...inspectedQuestion.responses]
                  .sort((a, b) => a.responseTimeMs - b.responseTimeMs)
                  .slice(0, 5)
                  .map((resp, rank) => (
                    <div
                      key={rank}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group hover:-translate-y-0.5 hover:shadow-md ${
                        rank === 0
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-200 shadow-sm"
                          : rank === 1
                          ? "bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200 shadow-sm"
                          : rank === 2
                          ? "bg-gradient-to-r from-orange-50 to-orange-100/30 border-orange-200 shadow-sm"
                          : "bg-white border-slate-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-xl font-black text-lg flex items-center justify-center shadow-sm border ${
                          rank === 0 ? "bg-amber-100 text-amber-700 border-amber-200"
                          : rank === 1 ? "bg-slate-200 text-slate-700 border-slate-300"
                          : rank === 2 ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                          {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-[15px]">
                            {resp.studentName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5 line-clamp-1">
                            Answered: <strong className="text-slate-700">{resp.answer}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={`font-mono font-black text-sm ${
                          rank === 0 ? "text-amber-600"
                          : rank === 1 ? "text-slate-600"
                          : rank === 2 ? "text-orange-600"
                          : "text-slate-600"
                        }`}>
                          {(resp.responseTimeMs / 1000).toFixed(2)}s
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${
                          inspectedQuestion.type === "open"
                            ? "text-indigo-700 bg-indigo-50 border border-indigo-100"
                            : inspectedQuestion.type === "poll"
                            ? "text-violet-700 bg-violet-50 border border-violet-100"
                            : "text-emerald-600 bg-emerald-50"
                        }`}>
                          {inspectedQuestion.type === "open"
                            ? (resp.rating ? `★ ${resp.rating}/5` : "Submitted")
                            : inspectedQuestion.type === "poll"
                            ? "Voted"
                            : `+${inspectedQuestion.points || 100} pts`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Correct Students */}
            {questionTab === "correct" && (
              <div className="flex-1 space-y-2 pr-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                {inspectedQuestion.responses.filter((r) => r.isCorrect).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-slate-400 text-sm font-medium">No correct responses yet.</span>
                  </div>
                ) : (
                  inspectedQuestion.responses
                    .filter((r) => r.isCorrect)
                    .map((resp, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 flex items-center justify-between text-sm transition-colors hover:bg-emerald-50"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="font-bold text-slate-900">
                            {resp.studentName}
                          </span>
                          <span className="text-slate-400 text-xs hidden sm:inline-block truncate max-w-[200px]">
                            — {resp.answer}
                          </span>
                        </div>
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-100/50 px-2.5 py-1 rounded-lg text-xs">
                          {(resp.responseTimeMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Tab 3: Wrong Students */}
            {questionTab === "wrong" && (
              <div className="flex-1 space-y-2 pr-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                {inspectedQuestion.responses.filter((r) => r.isCorrect === false).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-slate-400 text-sm font-medium">Great news! No incorrect responses recorded.</span>
                  </div>
                ) : (
                  inspectedQuestion.responses
                    .filter((r) => r.isCorrect === false)
                    .map((resp, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100/50 flex flex-col sm:flex-row sm:items-center justify-between text-sm transition-colors hover:bg-rose-50 gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <span className="font-bold text-slate-900">
                            {resp.studentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 sm:pl-0 pl-8">
                          <span className="text-rose-700 font-medium text-xs bg-rose-100/50 px-2.5 py-1 rounded-lg">
                            Answered: {resp.answer}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Review</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Tab 4: Unattempted Students */}
            {questionTab === "unattempted" && (
              <div className="flex-1 space-y-2 pr-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                {batchStudents.filter(
                  (s) => !inspectedQuestion.responses.some((r) => r.studentId === s.id)
                ).length === 0 ? (
                  <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-dashed border-emerald-200">
                    <span className="text-emerald-700 text-sm font-bold">🎉 All enrolled students have attempted!</span>
                  </div>
                ) : (
                  batchStudents
                    .filter(
                      (s) => !inspectedQuestion.responses.some((r) => r.studentId === s.id)
                    )
                    .map((stu) => {
                      const isNudged = nudgeSentIds[stu.id];
                      return (
                        <div
                          key={stu.id}
                          className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 flex items-center justify-between text-sm transition-colors hover:bg-slate-100"
                        >
                          <span className="font-bold text-slate-800">{stu.name}</span>
                          <button
                            onClick={() => handleSendNudge(stu.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isNudged
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs"
                            }`}
                          >
                            {isNudged ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Notified
                              </>
                            ) : (
                              <>
                                <BellRing className="w-3.5 h-3.5 text-amber-500" /> Nudge
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE LIVE QUESTION / POLL / OPEN PROMPT STUDIO                */}
      {/* ========================================================================= */}
      {showInstantPollModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 my-6 sm:my-8 relative animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-tight">
                    Create Live Question / Poll / Open Prompt
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Instantly publish to student screens in <strong className="text-slate-800 font-bold">{selectedBatch.name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstantPollModal(false)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60 self-end sm:self-auto cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Question Format (4 choices) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Select Question Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "mcq", label: "⚡ MCQ Quiz", desc: "1 Graded Correct Option" },
                  { id: "poll", label: "📊 Live Poll", desc: "Interactive Opinion Pulse" },
                  { id: "true_false", label: "⚖️ True / False", desc: "Binary Speed Choice" },
                  { id: "open", label: "💬 Open Text", desc: "Written Theory / Code" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setPollType(t.id as any);
                      if (t.id === "true_false") {
                        setPollOptions(["True", "False"]);
                        setPollCorrect("True");
                      } else if (t.id === "mcq" || t.id === "poll") {
                        if (pollOptions.length < 2) {
                          setPollOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
                          setPollCorrect("Option 1");
                        }
                      } else {
                        setPollOptions([]);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                      pollType === t.id
                        ? "bg-gradient-to-br from-sky-50 to-indigo-50/50 border-sky-400 text-sky-950 ring-2 ring-sky-400/30 shadow-sm"
                        : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900">{t.label}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* LEFT COLUMN: Question Text & Options (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Question Prompt */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Question Prompt *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder={
                      pollType === "open"
                        ? "e.g. Explain how an LLM agent uses function calling to interact with tools and APIs."
                        : "e.g. Which sampling parameter controls randomness in LLMs?"
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition shadow-xs leading-relaxed"
                  />
                </div>

                {/* Options for MCQ / Poll */}
                {pollType === "mcq" || pollType === "poll" ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Options & {pollType === "mcq" ? "Correct Key (Select Radio)" : "Choices"}
                      </label>
                      {pollOptions.length < 6 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-100 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                            pollType === "mcq" && pollCorrect === opt
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30"
                              : "bg-slate-50/60 border-slate-200"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>

                          {pollType === "mcq" && (
                            <input
                              type="radio"
                              name="poll_correct_answer"
                              checked={pollCorrect === opt}
                              onChange={() => setPollCorrect(opt)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                              title="Mark as correct answer"
                            />
                          )}

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...pollOptions];
                              updated[idx] = e.target.value;
                              setPollOptions(updated);
                              if (pollCorrect === opt) setPollCorrect(e.target.value);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                          />

                          {pollType === "mcq" && pollCorrect === opt && (
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md flex-shrink-0">
                              Correct
                            </span>
                          )}

                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove option"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : pollType === "true_false" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Correct Answer Choice
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["True", "False"].map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setPollCorrect(tf)}
                          className={`py-3.5 rounded-2xl border font-black text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                            pollCorrect === tf
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/30"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${pollCorrect === tf ? 'text-white' : 'text-slate-400'}`} />
                          <span>{tf}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-900 tracking-wide">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Open-Ended Technical Challenge</span>
                    </div>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                      Students will submit free-form written or code logic. All responses stream in real-time for automated AI 5-star evaluation and manual instructor review without requiring a fixed model answer.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Settings & Live Preview (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Timer Limit (Minutes & Seconds) - Full Width */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Timer Limit</span>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 normal-case tracking-normal">
                          Min & Sec
                        </span>
                      </label>
                    </div>
                    <span className="text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                      {pollTimeLimit === 0
                        ? "No Timer"
                        : pollTimeLimit < 60
                        ? `${pollTimeLimit}s`
                        : pollTimeLimit % 60 === 0
                        ? `${Math.floor(pollTimeLimit / 60)} min`
                        : `${Math.floor(pollTimeLimit / 60)}m ${pollTimeLimit % 60}s (${pollTimeLimit}s)`}
                    </span>
                  </div>

                  {/* Dual Minutes & Seconds Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Minutes Box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Minutes</span>
                        <span className="text-[9px] text-slate-400 font-medium">0 - 60 min</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={Math.floor(pollTimeLimit / 60) || ""}
                          onChange={(e) => {
                            const mins = Math.max(0, parseInt(e.target.value) || 0);
                            const secs = pollTimeLimit % 60;
                            setPollTimeLimit(mins * 60 + secs);
                          }}
                          className="w-full pl-3.5 pr-11 py-2 rounded-xl border border-slate-200 text-xs font-black bg-white shadow-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          min
                        </span>
                      </div>
                    </div>

                    {/* Seconds Box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Seconds</span>
                        <span className="text-[9px] text-slate-400 font-medium">0 - 59 sec</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={pollTimeLimit % 60 || (pollTimeLimit === 0 ? "" : 0)}
                          onChange={(e) => {
                            const mins = Math.floor(pollTimeLimit / 60);
                            const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                            setPollTimeLimit(mins * 60 + secs);
                          }}
                          className="w-full pl-3.5 pr-11 py-2 rounded-xl border border-slate-200 text-xs font-black bg-white shadow-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          sec
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                    {[
                      { val: 30, label: "30s" },
                      { val: 45, label: "45s" },
                      { val: 60, label: "1 min" },
                      { val: 120, label: "2 min" },
                      { val: 300, label: "5 min" },
                      { val: 0, label: "No Timer" },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => setPollTimeLimit(chip.val)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          pollTimeLimit === chip.val
                            ? "bg-sky-500 text-white shadow-2xs font-black ring-2 ring-sky-500/25"
                            : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Point Value */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        Point Value
                      </label>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                      +{pollPoints} pts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-4 relative">
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        step={10}
                        value={pollPoints}
                        onChange={(e) => setPollPoints(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs font-black bg-white shadow-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                        placeholder="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        pts
                      </span>
                    </div>
                    {/* Quick Chips */}
                    <div className="sm:col-span-8 flex items-center gap-1.5 flex-wrap">
                      {[25, 50, 100, 150, 200].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPollPoints(p)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            pollPoints === p
                              ? "bg-amber-500 text-white shadow-2xs font-black ring-2 ring-amber-500/25"
                              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Explanation Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Explanation / Concept Insight (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={pollExplanation}
                    onChange={(e) => setPollExplanation(e.target.value)}
                    placeholder="Shown to students after submission to reinforce learning and explain the answer..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {/* Quick Summary Pill / Tip */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Live Broadcast Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Broadcasting triggers real-time sound effects and telemetric speed leaderboards on all connected student devices in this batch.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInstantPollModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePollSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:from-sky-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Launch Question Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
