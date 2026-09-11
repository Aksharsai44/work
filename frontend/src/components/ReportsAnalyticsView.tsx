import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Batch,
  Student,
  UserRole,
  AttendanceSession,
  LiveQuestion,
  Assignment,
  LearnHubModule,
  AppSettings,
} from "../types";
import {
  BarChart3,
  TrendingUp,
  Download,
  Award,
  CheckCircle2,
  Calendar,
  Zap,
  Clock,
  Printer,
  ChevronRight,
  Flame,
  ShieldCheck,
  User,
  Users,
  Eye,
  ArrowLeft,
  Sparkles,
  Target,
  BrainCircuit,
  Mail,
  Phone,
  Building2,
  Code2,
  Activity,
  Terminal,
  Trophy,
  Star,
  Search,
  Filter,
  Check,
  Share2,
  CheckSquare,
  BadgeCheck,
  Layers,
  Cpu,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  PieChart,
  SlidersHorizontal,
  ArrowDownUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ExecutiveEvaluationReport } from "./ExecutiveEvaluationReport";

interface ReportsAnalyticsViewProps {
  batches: Batch[];
  selectedBatch: Batch;
  students: Student[];
  attendanceSessions?: AttendanceSession[];
  liveQuestions?: LiveQuestion[];
  assignments?: Assignment[];
  learnHubModules?: LearnHubModule[];
  settings?: AppSettings;
  userRole: UserRole;
  currentStudent?: Student;
  onViewStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  batches,
  selectedBatch,
  students,
  attendanceSessions = [],
  liveQuestions = [],
  assignments = [],
  learnHubModules = [],
  settings,
  userRole,
  currentStudent,
  onViewStudent,
  onUpdateStudent,
}) => {
  const batchStudents = students.filter((s) => s.batchId === selectedBatch?.id);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | undefined>(
    userRole === "student" && currentStudent ? currentStudent : batchStudents[0]
  );

  const [viewMode, setViewMode] = useState<"individual" | "batch" | "full_batch">(
    userRole === "student" ? "individual" : "batch"
  );
  const [previousViewMode, setPreviousViewMode] = useState<"batch" | "full_batch">("batch");

  const [reportFormat, setReportFormat] = useState<"executive_sample" | "dossier">("executive_sample");

  const [activeDossierTab, setActiveDossierTab] = useState<
    "overview" | "skills" | "telemetry" | "coding" | "attendance"
  >("overview");

  const [searchFilterQuery, setSearchFilterQuery] = useState<string>("");
  const [cohortFilterCategory, setCohortFilterCategory] = useState<
    "all" | "top" | "coding" | "speed" | "streak" | "attention"
  >("all");

  const [fullReviewPriorityFilter, setFullReviewPriorityFilter] = useState<
    "all" | "critical" | "warning" | "on_track" | "mastery"
  >("all");
  const [fullReviewSortBy, setFullReviewSortBy] = useState<
    "priority" | "score_desc" | "score_asc" | "speed_asc" | "att_desc"
  >("priority");
  const [fullReviewSearch, setFullReviewSearch] = useState<string>("");

  const [instructorNotesText, setInstructorNotesText] = useState<string>("");
  const [savedNotesMap, setSavedNotesMap] = useState<Record<string, string>>({});
  const [isLiveTelemetryStreaming, setIsLiveTelemetryStreaming] = useState<boolean>(true);
  const [telemetryTickerIndex, setTelemetryTickerIndex] = useState<number>(0);

  // Overall Batch Report state (backend-connected, real-time)
  const [batchReport, setBatchReport] = useState<any>(null);
  const [isBatchReportLoading, setIsBatchReportLoading] = useState<boolean>(false);
  const [batchReportError, setBatchReportError] = useState<string | null>(null);

  const fetchBatchReport = useCallback(async () => {
    if (!selectedBatch?.id || userRole !== "admin") return;
    setIsBatchReportLoading(true);
    setBatchReportError(null);
    try {
      const res = await axios.get(`/api/batches/${selectedBatch.id}/batch_report/`);
      setBatchReport(res.data);
    } catch (err: any) {
      console.error("Failed to fetch batch report:", err);
      setBatchReportError("Could not load batch report. Please try again.");
    } finally {
      setIsBatchReportLoading(false);
    }
  }, [selectedBatch?.id, userRole]);

  // Fetch batch report on mount & batch change
  useEffect(() => {
    fetchBatchReport();
  }, [fetchBatchReport]);

  // Auto-refresh batch report every 30 seconds
  useEffect(() => {
    if (userRole !== "admin" || viewMode !== "batch") return;
    const interval = setInterval(() => {
      fetchBatchReport();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBatchReport, userRole, viewMode]);

  // Sync selected student on batch switch
  useEffect(() => {
    if (userRole === "admin" && batchStudents.length > 0) {
      if (!selectedStudentForReport || selectedStudentForReport.batchId !== selectedBatch?.id) {
        setSelectedStudentForReport(batchStudents[0]);
      }
    } else if (userRole === "student" && currentStudent) {
      setSelectedStudentForReport(currentStudent);
    }
  }, [selectedBatch?.id, students, currentStudent, userRole]);

  // Live real-time telemetry stream events ticker from real batch students
  const telemetryEvents = batchStudents.length > 0 ? [
    {
      student: batchStudents[0]?.name || "Student",
      action: "Participating in active learning session",
      result: `Accuracy: ${batchStudents[0]?.scores?.overallAccuracy ?? 0}%`,
      time: "Just now",
      icon: "⚡",
      color: "text-emerald-400",
    },
    ...(batchStudents.length > 1 ? [{
      student: batchStudents[1]?.name || "Student",
      action: "Active on learning portal",
      result: `${batchStudents[1]?.totalPoints ?? 0} Points`,
      time: "1m ago",
      icon: "🚀",
      color: "text-sky-400",
    }] : []),
    ...(batchStudents.length > 2 ? [{
      student: batchStudents[2]?.name || "Student",
      action: "Continuous learning streak",
      result: `${batchStudents[2]?.activeStreakDays ?? 1}-Day Streak`,
      time: "3m ago",
      icon: "🔥",
      color: "text-amber-400",
    }] : []),
    ...(batchStudents.length > 3 ? [{
      student: batchStudents[3]?.name || "Student",
      action: "Completed module exercises",
      result: `Score: ${batchStudents[3]?.scores?.assignmentScore ?? 0}%`,
      time: "5m ago",
      icon: "🎯",
      color: "text-indigo-400",
    }] : []),
  ] : [
    {
      student: "Platform",
      action: "System ready & listening",
      result: "Ready for live sessions",
      time: "Live",
      icon: "⚡",
      color: "text-emerald-400",
    }
  ];

  // Rotate ticker every 4 seconds for lively real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTickerIndex((prev) => (prev + 1) % telemetryEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [telemetryEvents.length]);

  // Batch analytics aggregations
  const totalEnrolled = batchStudents.length;
  const avgAccuracy =
    totalEnrolled > 0
      ? Number(
          (
            batchStudents.reduce((acc, s) => acc + (s.scores?.overallAccuracy ?? 0), 0) /
            totalEnrolled
          ).toFixed(1)
        )
      : 0;
  const avgQuiz =
    totalEnrolled > 0
      ? Math.round(
          batchStudents.reduce((acc, s) => acc + (s.scores?.quizScore ?? 0), 0) / totalEnrolled
        )
      : 0;
  const avgCoding =
    totalEnrolled > 0
      ? Math.round(
          batchStudents.reduce((acc, s) => acc + (s.scores?.codingScore ?? 0), 0) / totalEnrolled
        )
      : 0;
  const avgLiveQA =
    totalEnrolled > 0
      ? Math.round(
          batchStudents.reduce((acc, s) => acc + (s.scores?.liveQAScore ?? 0), 0) / totalEnrolled
        )
      : 0;

  const avgSpeedMs =
    totalEnrolled > 0
      ? Math.round(
          batchStudents.reduce(
            (acc, s) => acc + (s.fastestResponseMs || 2200),
            0
          ) / totalEnrolled
        )
      : 2200;

  const handlePrintOrDownloadPdf = () => {
    window.print();
  };

  const handleTriggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"],
      });
    } catch {}
  };

  // Priority and enriched metrics for all students
  const enrichedBatchStudents = batchStudents.map((s) => {
    const accuracy = s.scores?.overallAccuracy ?? 0;
    const coding = s.scores?.codingScore ?? 0;
    const quiz = s.scores?.quizScore ?? 0;
    const attTotal = s.totalSessions || 0;
    const attAttended = s.attendedSessions || 0;
    const attPct = attTotal > 0 ? Math.round((attAttended / attTotal) * 100) : (s.scores?.attendancePct ?? 100);
    const speedMs = s.fastestResponseMs || 0;

    let priorityLevel: "critical" | "warning" | "on_track" | "mastery" = "on_track";
    let priorityLabel = "On Track";
    let priorityBadge = "bg-sky-50 text-sky-700 border-sky-200";
    let priorityDot = "bg-sky-500";
    let priorityRank = 3;

    if (accuracy < 50 || attPct < 60) {
      priorityLevel = "critical";
      priorityLabel = "Needs Attention";
      priorityBadge = "bg-rose-50 text-rose-700 border-rose-200";
      priorityDot = "bg-rose-500";
      priorityRank = 1;
    } else if (accuracy < 70 || attPct < 80) {
      priorityLevel = "warning";
      priorityLabel = "Needs Practice";
      priorityBadge = "bg-amber-50 text-amber-800 border-amber-200";
      priorityDot = "bg-amber-500";
      priorityRank = 2;
    } else if (accuracy >= 90) {
      priorityLevel = "mastery";
      priorityLabel = "Top Performer";
      priorityBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
      priorityDot = "bg-emerald-500";
      priorityRank = 4;
    }

    return {
      ...s,
      accuracy,
      coding,
      quiz,
      attPct,
      speedMs,
      priorityLevel,
      priorityLabel,
      priorityBadge,
      priorityDot,
      priorityRank,
    };
  });

  const countCritical = enrichedBatchStudents.filter((s) => s.priorityLevel === "critical").length;
  const countWarning = enrichedBatchStudents.filter((s) => s.priorityLevel === "warning").length;
  const countOnTrack = enrichedBatchStudents.filter((s) => s.priorityLevel === "on_track").length;
  const countMastery = enrichedBatchStudents.filter((s) => s.priorityLevel === "mastery").length;

  const fullReviewFilteredStudents = enrichedBatchStudents
    .filter((s) => {
      const matchText =
        !fullReviewSearch.trim() ||
        s.name.toLowerCase().includes(fullReviewSearch.toLowerCase()) ||
        (s.college || "").toLowerCase().includes(fullReviewSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(fullReviewSearch.toLowerCase());
      if (!matchText) return false;
      if (fullReviewPriorityFilter === "all") return true;
      return s.priorityLevel === fullReviewPriorityFilter;
    })
    .sort((a, b) => {
      if (fullReviewSortBy === "priority") {
        if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
        return b.accuracy - a.accuracy;
      }
      if (fullReviewSortBy === "score_desc") return b.accuracy - a.accuracy;
      if (fullReviewSortBy === "score_asc") return a.accuracy - b.accuracy;
      if (fullReviewSortBy === "speed_asc") return (a.speedMs || 99999) - (b.speedMs || 99999);
      if (fullReviewSortBy === "att_desc") return b.attPct - a.attPct;
      return 0;
    });

  // Score distribution counts (synced with backend report or calculated)
  const distExc = batchReport?.scoreDistribution?.excellent ?? countMastery;
  const distGood = batchReport?.scoreDistribution?.good ?? countOnTrack;
  const distAvg = batchReport?.scoreDistribution?.average ?? countWarning;
  const distNeeds = batchReport?.scoreDistribution?.needsWork ?? countCritical;
  const distTotal = Math.max(1, distExc + distGood + distAvg + distNeeds);

  const batchDonutRadius = 38;
  const batchDonutCirc = 2 * Math.PI * batchDonutRadius;
  const batchArcExc = (distExc / distTotal) * batchDonutCirc;
  const batchArcGood = (distGood / distTotal) * batchDonutCirc;
  const batchArcAvg = (distAvg / distTotal) * batchDonutCirc;
  const batchArcNeeds = (distNeeds / distTotal) * batchDonutCirc;

  const batchOffExc = 0;
  const batchOffGood = -batchArcExc;
  const batchOffAvg = -(batchArcExc + batchArcGood);
  const batchOffNeeds = -(batchArcExc + batchArcGood + batchArcAvg);

  const displayAvgAcc = batchReport ? batchReport.avgAccuracy : avgAccuracy;
  const displayAvgQuiz = batchReport ? batchReport.avgQuizScore : avgQuiz;
  const displayAvgCoding = batchReport ? batchReport.avgCodingScore : avgCoding;
  const displayAvgAtt = batchReport ? batchReport.avgAttendancePct : (totalEnrolled > 0 ? Math.round(enrichedBatchStudents.reduce((a, s) => a + s.attPct, 0) / totalEnrolled) : 100);
  const displayAvgSpeedMs = batchReport ? batchReport.avgResponseSpeedMs : avgSpeedMs;
  const displaySpeedScore = displayAvgSpeedMs > 0 ? Math.min(100, Math.max(10, Math.round(100 - (displayAvgSpeedMs / 1000) * 12))) : 80;

  const handleExportBatchCsv = () => {
    const headers =
      "Rank,Priority,Student Name,Email,Mobile,Batch,College,Quiz Score,Coding Score,Live QA Score,Overall Accuracy,Total Points,Speed (ms),Attendance\n";
    const rows = enrichedBatchStudents
      .sort((a, b) => b.accuracy - a.accuracy)
      .map(
        (s, i) =>
          `${i + 1},"${s.priorityLabel}","${s.name}","${s.email}","${s.mobile}","${s.batchName || selectedBatch.name}","${s.college}",${s.scores?.quizScore ?? 0}%,${s.scores?.codingScore ?? 0}%,${s.scores?.liveQAScore ?? 0}%,${s.scores?.overallAccuracy ?? 0}%,${s.totalPoints ?? 0},${s.fastestResponseMs ?? 0}ms,"${s.attendedSessions ?? 0}/${s.totalSessions ?? 0}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MIND2I_${selectedBatch.name.replace(/\s+/g, "_")}_Performance_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for generating dynamic text based on scores
  const getCohortSummaryText = () => {
    if (avgAccuracy > 85)
      return "This batch is doing excellent work! Students are learning fast, solving problems well, and scoring high on all tasks. Great overall performance.";
    if (avgAccuracy > 70)
      return "The batch is making good, steady progress. Students are actively participating and understanding the material well. Scores are looking solid across the board.";
    return "This batch needs some extra help and practice. We suggest more hands-on exercises and one-on-one support to help students improve their scores.";
  };

  const getStudentSummaryText = (score: number) => {
    if (score > 90)
      return "Outstanding performance! This student is learning quickly, getting high scores on all tasks, and responding fast during live sessions. Keep up the great work!";
    if (score > 75)
      return "Good performance overall. Consistently completing assignments and showing solid understanding. Could improve further with more practice on advanced topics.";
    if (score > 60)
      return "Decent progress with room to grow. The student is completing basic tasks but would benefit from reviewing core topics and practicing more coding problems.";
    return "Needs more support and practice. We recommend working closely with a mentor on basic exercises to build confidence and improve scores.";
  };

  // Filtered students in directory
  const filteredStudents = enrichedBatchStudents
    .filter((s) => {
      const matchText =
        searchFilterQuery.trim() === "" ||
        s.name.toLowerCase().includes(searchFilterQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchFilterQuery.toLowerCase()) ||
        (s.college || "").toLowerCase().includes(searchFilterQuery.toLowerCase());

      if (cohortFilterCategory === "top")
        return matchText && s.accuracy >= 90;
      if (cohortFilterCategory === "coding")
        return matchText && s.coding >= 90;
      if (cohortFilterCategory === "speed")
        return matchText && (s.speedMs || 3000) <= 1800;
      if (cohortFilterCategory === "streak")
        return matchText && s.activeStreakDays >= 4;
      if (cohortFilterCategory === "attention")
        return matchText && (s.priorityLevel === "critical" || s.priorityLevel === "warning");
      return matchText;
    })
    .sort((a, b) => {
      if ((b.totalPoints ?? 0) !== (a.totalPoints ?? 0)) return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return (a.speedMs || 9999) - (b.speedMs || 9999);
    });

  const activeEvent = telemetryEvents[telemetryTickerIndex];

  return (
    <div className="space-y-6 pb-12 print:space-y-0 print:pb-0">
      {/* ── Top Header Bar (Hidden in Print) ── */}
      <div className="print:hidden no-print bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>
                {userRole === "admin"
                  ? "Performance Reports"
                  : "My Report"}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Updates
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Student scores, attendance, speed, and reports.
          </p>
        </div>

        {userRole === "admin" && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {viewMode !== "batch" && (
              <button
                onClick={() => setViewMode("batch")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batch View</span>
              </button>
            )}

            {viewMode === "batch" && (
              <button
                onClick={() => {
                  setPreviousViewMode("batch");
                  setViewMode("full_batch");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Review</span>
              </button>
            )}

            <button
              onClick={handlePrintOrDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-xs"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportBatchCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Live Updates Ticker Strip (Hidden in Print) ── */}
      <div className="print:hidden no-print p-3 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-sky-400 animate-pulse" />
            LIVE UPDATES
          </span>

          <div className="flex items-center gap-2 truncate text-xs">
            <span className="text-base">{activeEvent?.icon}</span>
            <strong className="text-white font-extrabold truncate">
              {activeEvent?.student}:
            </strong>
            <span className="text-slate-300 truncate">{activeEvent?.action}</span>
            <span className={`font-mono font-bold ${activeEvent?.color}`}>
              ({activeEvent?.result})
            </span>
          </div>
        </div>

        <span className="flex-shrink-0 text-[10px] text-slate-400 font-mono hidden sm:inline-block">
          Updated {activeEvent?.time}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. EMPTY STATE IF NO STUDENTS                                             */}
      {/* ========================================================================= */}
      {batchStudents.length === 0 && userRole === "admin" ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center animate-in fade-in">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Students Enrolled Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            There are no members in this batch. Once students register and participate in live challenges, their performance and reports will display here.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. BATCH-WIDE PERFORMANCE & COHORT ANALYTICS VIEW                         */}
          {/* ========================================================================= */}
          {viewMode === "batch" && userRole === "admin" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* AI Cohort Diagnostics Hero Banner */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <BrainCircuit className="w-44 h-44" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Batch Summary</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {selectedBatch.name} • Overview
                  </h3>
                  <p className="text-sm text-indigo-100/80 leading-relaxed max-w-3xl">
                    {getCohortSummaryText()}
                  </p>
                </div>
              </div>

              {/* 4 Summary KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Enrolled */}
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Total Students
                    </span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {totalEnrolled} <span className="text-xs font-bold text-slate-400">Students</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-full" />
                  </div>
                </div>

                {/* Avg Accuracy */}
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Overall Accuracy
                    </span>
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-black text-emerald-600">
                    {avgAccuracy}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${avgAccuracy}%` }}
                    />
                  </div>
                </div>

                {/* Avg Coding */}
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Coding Score
                    </span>
                    <Code2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-3xl font-black text-purple-600">
                    {avgCoding}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${avgCoding}%` }}
                    />
                  </div>
                </div>

                {/* Avg Reflex Speed */}
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Response Speed
                    </span>
                    <Clock className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-3xl font-black text-sky-600">
                    {(avgSpeedMs / 1000).toFixed(2)}s
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full w-4/5" />
                  </div>
                </div>
              </div>

              {/* ── OVERALL BATCH REPORT (Backend-Connected, Real-Time) ── */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span>Batch Report</span>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time summary of the entire batch from the server.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setViewMode("full_batch")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm hover:shadow-md"
                      title="Open Full Page Batch Report Review"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Full Review</span>
                    </button>

                    <button
                      onClick={handlePrintOrDownloadPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-xs"
                      title="Print or Save Batch Summary as PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={fetchBatchReport}
                      disabled={isBatchReportLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Refresh real-time batch metrics"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBatchReportLoading ? 'animate-spin' : ''}`} />
                      <span>{isBatchReportLoading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {batchReportError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{batchReportError} (Displaying live calculated metrics from active sessions)</span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* 6 Metric Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider block">Students</span>
                      <span className="text-2xl font-black text-slate-900">{totalEnrolled}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider block">Overall Accuracy</span>
                      <span className="text-2xl font-black text-emerald-700">{displayAvgAcc}%</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider block">Quiz Score</span>
                      <span className="text-2xl font-black text-purple-700">{displayAvgQuiz}%</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider block">Coding Score</span>
                      <span className="text-2xl font-black text-sky-700">{displayAvgCoding}%</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-teal-600 tracking-wider block">Attendance Rate</span>
                      <span className="text-2xl font-black text-teal-700">{displayAvgAtt}%</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">Response Speed</span>
                      <span className="text-2xl font-black text-amber-700">
                        {displayAvgSpeedMs > 0 ? `${(displayAvgSpeedMs / 1000).toFixed(1)}s` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Visual Grid: Donut Chart, Domain Bar Chart, and Priority Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Panel 1: Score Distribution with Circular SVG Donut */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Score Distribution</span>
                      </h4>

                      <div className="flex items-center gap-4">
                        {/* Circular Donut Visual */}
                        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={batchDonutRadius}
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="12"
                            />
                            {distExc > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r={batchDonutRadius}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="12"
                                strokeDasharray={`${batchArcExc} ${batchDonutCirc}`}
                                strokeDashoffset={batchOffExc}
                              />
                            )}
                            {distGood > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r={batchDonutRadius}
                                fill="none"
                                stroke="#0ea5e9"
                                strokeWidth="12"
                                strokeDasharray={`${batchArcGood} ${batchDonutCirc}`}
                                strokeDashoffset={batchOffGood}
                              />
                            )}
                            {distAvg > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r={batchDonutRadius}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="12"
                                strokeDasharray={`${batchArcAvg} ${batchDonutCirc}`}
                                strokeDashoffset={batchOffAvg}
                              />
                            )}
                            {distNeeds > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r={batchDonutRadius}
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="12"
                                strokeDasharray={`${batchArcNeeds} ${batchDonutCirc}`}
                                strokeDashoffset={batchOffNeeds}
                              />
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-base font-black text-slate-900 leading-none">{totalEnrolled}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">Students</span>
                          </div>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="flex-1 space-y-1.5">
                          {[
                            { label: 'Top Performer (90%+)', count: distExc, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                            { label: 'On Track (70-89%)', count: distGood, color: 'bg-sky-500', textColor: 'text-sky-700' },
                            { label: 'Needs Practice (50-69%)', count: distAvg, color: 'bg-amber-500', textColor: 'text-amber-700' },
                            { label: 'Needs Attention (<50%)', count: distNeeds, color: 'bg-rose-500', textColor: 'text-rose-700' },
                          ].map((tier) => (
                            <div key={tier.label} className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-600 truncate">{tier.label}</span>
                                <span className={`font-black font-mono ${tier.textColor}`}>{tier.count}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${tier.color} rounded-full transition-all duration-500`}
                                  style={{ width: `${distTotal > 0 ? (tier.count / distTotal) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Cross-Domain Performance Bar Chart */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Domain Performance</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">Benchmark: 75%</span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { name: 'Overall Accuracy', score: displayAvgAcc, color: 'bg-indigo-600', icon: '🎯' },
                          { name: 'Quiz Score', score: displayAvgQuiz, color: 'bg-purple-600', icon: '📝' },
                          { name: 'Coding Score', score: displayAvgCoding, color: 'bg-sky-600', icon: '💻' },
                          { name: 'Attendance Rate', score: displayAvgAtt, color: 'bg-teal-600', icon: '📅' },
                          { name: 'Response Speed', score: displaySpeedScore, color: 'bg-amber-500', icon: '⚡' },
                        ].map((domain) => (
                          <div key={domain.name} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <span>{domain.icon}</span>
                                <span>{domain.name}</span>
                              </span>
                              <span className="font-mono font-black text-slate-900">{domain.score}%</span>
                            </div>
                            <div className="relative w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${domain.color} rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(100, Math.max(0, domain.score))}%` }}
                              />
                              <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-400/60" title="Target Benchmark: 75%" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Panel 3: Priority Overview & Top Performers */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Top Performers</span>
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            countCritical > 0
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {countCritical > 0 ? `${countCritical} Need Help` : 'All On Track'}
                          </span>
                        </div>

                        <div className="space-y-2 mt-2">
                          {(batchReport?.topPerformers || enrichedBatchStudents.slice(0, 3)).map((p: any, idx: number) => (
                            <div key={p.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                                  idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">{p.name}</span>
                                  <span className="text-[9px] text-slate-400">{p.college || `${p.totalPoints || 0} pts`}</span>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-600 font-mono">
                                {p.accuracy ?? p.scores?.overallAccuracy ?? 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setViewMode("full_batch")}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 rounded-xl text-xs font-black border border-indigo-200 shadow-xs transition cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>All Students Priority ({totalEnrolled})</span>
                      </button>
                    </div>
                  </div>

                  {/* Last Updated Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-refreshes every 30 seconds
                    </span>
                    <span className="font-mono">
                      Last updated: {batchReport?.generatedAt ? new Date(batchReport.generatedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Directory Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Student List ({batchStudents.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click the view button on any student to open their complete performance report.
                    </p>
                  </div>

                  {/* Search & Category Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchFilterQuery}
                        onChange={(e) => setSearchFilterQuery(e.target.value)}
                        placeholder="Filter by name, email, college..."
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                      />
                    </div>

                    <select
                      value={cohortFilterCategory}
                      onChange={(e) => setCohortFilterCategory(e.target.value as any)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="all">All Students ({batchStudents.length})</option>
                      <option value="attention">⚠️ Needs Attention ({countCritical + countWarning})</option>
                      <option value="top">⭐ Top 10% Leaders</option>
                      <option value="coding">⚡ Coding Masters</option>
                      <option value="speed">🚀 Fast Responders</option>
                      <option value="streak">🔥 Streak Heroes</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/90 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 pl-4 w-12 text-center">Rank</th>
                        <th className="py-3.5 px-3">Student Name & College</th>
                        <th className="py-3.5 px-3">Overall Accuracy</th>
                        <th className="py-3.5 px-3">Coding Score</th>
                        <th className="py-3.5 px-3">Response Speed</th>
                        <th className="py-3.5 px-3">Streak</th>
                        <th className="py-3.5 pr-4 text-right">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            No students match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50/80 transition group"
                          >
                            {/* Rank */}
                            <td className="py-3.5 pl-4 text-center font-mono font-bold text-xs text-slate-400">
                              #{idx + 1}
                            </td>

                            {/* Name, Avatar & Priority */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                                  {s.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 block leading-tight">
                                      {s.name}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.priorityBadge}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${s.priorityDot}`} />
                                      {s.priorityLabel}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium block">
                                    {s.college || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Overall Accuracy */}
                            <td className="py-3.5 px-3">
                              <span className="font-mono font-black text-slate-900">
                                {s.scores?.overallAccuracy ?? 0}%
                              </span>
                            </td>

                            {/* Coding */}
                            <td className="py-3.5 px-3">
                              <span className="font-mono font-black text-purple-700">
                                {s.scores?.codingScore ?? 0}%
                              </span>
                            </td>

                            {/* Response Speed */}
                            <td className="py-3.5 px-3 text-xs font-mono font-bold">
                              {s.fastestResponseMs && s.fastestResponseMs > 0 ? (
                                <span className="text-amber-600 font-extrabold flex items-center gap-1">
                                  ⚡ {((s.fastestResponseMs) / 1000).toFixed(2)}s
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">
                                  ⚡ 2.00s
                                </span>
                              )}
                            </td>

                            {/* Streak */}
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                                <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                                <span>{s.activeStreakDays}d</span>
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedStudentForReport(s);
                                    setReportFormat("executive_sample");
                                    setPreviousViewMode("batch");
                                    setViewMode("individual");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer"
                                  title="View Student Performance Report"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>View Report</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedStudentForReport(s);
                                    setReportFormat("dossier");
                                    setPreviousViewMode("batch");
                                    setViewMode("individual");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                  title="View Detailed Analytics"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Details</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2.5 FULL PAGE BATCH REPORT REVIEW (Interactive Charts & Priority Students)   */}
          {/* ========================================================================= */}
          {viewMode === "full_batch" && (
            <div id="printable-batch-report" className="space-y-6 print:space-y-4 animate-in fade-in duration-300">
              {/* Top Navigation & Actions Bar (Print Hidden) */}
              <div className="print:hidden no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode("batch")}
                    className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </button>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>Batch Full Review</span>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedBatch.name}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handlePrintOrDownloadPdf}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
                    title="Print or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handleExportBatchCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs"
                    title="Export Student Performance to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={fetchBatchReport}
                    disabled={isBatchReportLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBatchReportLoading ? 'animate-spin' : ''}`} />
                    <span>{isBatchReportLoading ? 'Refreshing...' : 'Refresh Data'}</span>
                  </button>
                </div>
              </div>

              {/* Hero Banner with Batch Metadata */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Batch Report
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Data
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {selectedBatch.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      {getCohortSummaryText()}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                      <span>🏛️ {selectedBatch.college || "Partner College"}</span>
                      <span>📅 {selectedBatch.startDate ? `${selectedBatch.startDate} to ${selectedBatch.endDate || 'Ongoing'}` : 'Current Cohort'}</span>
                      <span>👥 {totalEnrolled} Students Enrolled</span>
                    </div>
                  </div>

                  {/* High Level Health Badge */}
                  <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1 sm:min-w-[180px]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Cohort Health</span>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {displayAvgAcc}%
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 block">
                      {displayAvgAcc >= 85 ? '🌟 Outstanding' : displayAvgAcc >= 70 ? '👍 Solid Progress' : '⚠️ Attention Needed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Students</span>
                  <span className="text-2xl font-black text-slate-900">{totalEnrolled}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">100% active</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider block">Overall Accuracy</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">{displayAvgAcc}%</span>
                  <span className="text-[10px] text-emerald-600 block font-medium">Target: 75%</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider block">Quiz Score</span>
                  <span className="text-2xl font-black text-purple-700 font-mono">{displayAvgQuiz}%</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Quizzes taken</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider block">Coding Score</span>
                  <span className="text-2xl font-black text-sky-700 font-mono">{displayAvgCoding}%</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Lab challenges</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-teal-600 tracking-wider block">Attendance Rate</span>
                  <span className="text-2xl font-black text-teal-700 font-mono">{displayAvgAtt}%</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Session attendance</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">Response Speed</span>
                  <span className="text-2xl font-black text-amber-700 font-mono">
                    {displayAvgSpeedMs > 0 ? `${(displayAvgSpeedMs / 1000).toFixed(2)}s` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">Avg question time</span>
                </div>
              </div>

              {/* Visual Charts Row: Donut Chart & Domain Performance Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Card A: Score Distribution Donut */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-600" />
                        <span>Score Distribution</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Students divided by overall score brackets</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">Total: {totalEnrolled}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                    {/* SVG Circular Donut */}
                    <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r={batchDonutRadius}
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth="14"
                        />
                        {distExc > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={batchDonutRadius}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="14"
                            strokeDasharray={`${batchArcExc} ${batchDonutCirc}`}
                            strokeDashoffset={batchOffExc}
                          />
                        )}
                        {distGood > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={batchDonutRadius}
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="14"
                            strokeDasharray={`${batchArcGood} ${batchDonutCirc}`}
                            strokeDashoffset={batchOffGood}
                          />
                        )}
                        {distAvg > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={batchDonutRadius}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="14"
                            strokeDasharray={`${batchArcAvg} ${batchDonutCirc}`}
                            strokeDashoffset={batchOffAvg}
                          />
                        )}
                        {distNeeds > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={batchDonutRadius}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="14"
                            strokeDasharray={`${batchArcNeeds} ${batchDonutCirc}`}
                            strokeDashoffset={batchOffNeeds}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900 leading-none">{totalEnrolled}</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">Students</span>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="flex-1 w-full space-y-3">
                      {[
                        { label: 'Top Performer', range: '90%+', count: distExc, color: 'bg-emerald-500', textColor: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
                        { label: 'On Track', range: '70-89%', count: distGood, color: 'bg-sky-500', textColor: 'text-sky-700', badge: 'bg-sky-50 border-sky-200' },
                        { label: 'Needs Practice', range: '50-69%', count: distAvg, color: 'bg-amber-500', textColor: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
                        { label: 'Needs Attention', range: '<50%', count: distNeeds, color: 'bg-rose-500', textColor: 'text-rose-700', badge: 'bg-rose-50 border-rose-200' },
                      ].map((tier) => (
                        <div key={tier.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                              <span className="font-bold text-slate-800">{tier.label}</span>
                              <span className="text-slate-400 text-[11px]">({tier.range})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400 text-[11px]">
                                {distTotal > 0 ? Math.round((tier.count / distTotal) * 100) : 0}%
                              </span>
                              <span className={`font-mono font-black ${tier.textColor} px-2 py-0.5 rounded-md border ${tier.badge} text-xs`}>
                                {tier.count}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${tier.color} rounded-full transition-all duration-500`}
                              style={{ width: `${distTotal > 0 ? (tier.count / distTotal) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart Card B: Domain Performance Bar Chart */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Domain Performance</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Average proficiency across all learning tracks</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      <span>Benchmark: 75%</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {[
                      { name: 'Overall Accuracy', score: displayAvgAcc, color: 'bg-indigo-600', icon: '🎯' },
                      { name: 'Quiz Score', score: displayAvgQuiz, color: 'bg-purple-600', icon: '📝' },
                      { name: 'Coding Score', score: displayAvgCoding, color: 'bg-sky-600', icon: '💻' },
                      { name: 'Attendance Rate', score: displayAvgAtt, color: 'bg-teal-600', icon: '📅' },
                      { name: 'Response Speed', score: displaySpeedScore, color: 'bg-amber-500', icon: '⚡' },
                    ].map((domain) => (
                      <div key={domain.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-2">
                            <span>{domain.icon}</span>
                            <span>{domain.name}</span>
                          </span>
                          <span className="font-mono font-black text-slate-900">{domain.score}%</span>
                        </div>
                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${domain.color} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(0, domain.score))}%` }}
                          />
                          <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-400/80 z-10" title="Target Benchmark: 75%" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>0% Poor</span>
                    <span className="text-indigo-600 font-bold">| 75% Target Goal</span>
                    <span>100% Mastery</span>
                  </div>
                </div>
              </div>

              {/* All Students Ranked by Priority Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Student Priority Directory</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {fullReviewFilteredStudents.length} / {totalEnrolled}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All students sorted by priority. Click View Report to inspect individual student evaluation.
                    </p>
                  </div>

                  {/* Search, Sort, and Priority Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullReviewSearch}
                        onChange={(e) => setFullReviewSearch(e.target.value)}
                        placeholder="Search student or college..."
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 w-44 sm:w-52"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={fullReviewSortBy}
                        onChange={(e) => setFullReviewSortBy(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      >
                        <option value="priority">Sort: Priority First</option>
                        <option value="score_desc">Score: High to Low</option>
                        <option value="score_asc">Score: Low to High</option>
                        <option value="speed_asc">Speed: Fastest First</option>
                        <option value="att_desc">Attendance: Highest</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Priority Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
                  <button
                    onClick={() => setFullReviewPriorityFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      fullReviewPriorityFilter === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Students ({enrichedBatchStudents.length})
                  </button>

                  <button
                    onClick={() => setFullReviewPriorityFilter("critical")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      fullReviewPriorityFilter === "critical"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Needs Attention ({countCritical})</span>
                  </button>

                  <button
                    onClick={() => setFullReviewPriorityFilter("warning")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      fullReviewPriorityFilter === "warning"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Needs Practice ({countWarning})</span>
                  </button>

                  <button
                    onClick={() => setFullReviewPriorityFilter("on_track")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      fullReviewPriorityFilter === "on_track"
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>On Track ({countOnTrack})</span>
                  </button>

                  <button
                    onClick={() => setFullReviewPriorityFilter("mastery")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      fullReviewPriorityFilter === "mastery"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Top Performer ({countMastery})</span>
                  </button>
                </div>

                {/* Priority Students Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 pl-4 w-12 text-center">Rank</th>
                        <th className="py-3.5 px-3">Priority</th>
                        <th className="py-3.5 px-3">Student Name & College</th>
                        <th className="py-3.5 px-3">Overall Accuracy</th>
                        <th className="py-3.5 px-3">Coding Score</th>
                        <th className="py-3.5 px-3">Quiz Score</th>
                        <th className="py-3.5 px-3">Attendance Rate</th>
                        <th className="py-3.5 px-3">Response Speed</th>
                        <th className="py-3.5 pr-4 text-right">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {fullReviewFilteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                            No students match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        fullReviewFilteredStudents.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                            {/* Rank */}
                            <td className="py-3.5 pl-4 text-center font-mono font-bold text-xs text-slate-400">
                              #{idx + 1}
                            </td>

                            {/* Priority Badge */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.priorityBadge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.priorityDot}`} />
                                {s.priorityLabel}
                              </span>
                            </td>

                            {/* Student Name */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                                  {s.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-900 block leading-tight">
                                    {s.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium block">
                                    {s.college || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Accuracy */}
                            <td className="py-3.5 px-3">
                              <div className="space-y-1 w-24">
                                <span className="font-mono font-black text-slate-900 text-xs">
                                  {s.accuracy}%
                                </span>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      s.accuracy >= 90 ? 'bg-emerald-500' : s.accuracy >= 70 ? 'bg-sky-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, s.accuracy))}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Coding */}
                            <td className="py-3.5 px-3 font-mono font-black text-purple-700">
                              {s.coding}%
                            </td>

                            {/* Quiz */}
                            <td className="py-3.5 px-3 font-mono font-black text-indigo-700">
                              {s.quiz}%
                            </td>

                            {/* Attendance */}
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                {s.attPct}%
                              </span>
                            </td>

                            {/* Response Speed */}
                            <td className="py-3.5 px-3 text-xs font-mono font-bold">
                              {s.speedMs && s.speedMs > 0 ? (
                                <span className="text-amber-600 font-extrabold flex items-center gap-1">
                                  ⚡ {(s.speedMs / 1000).toFixed(2)}s
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">⚡ 2.00s</span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 pr-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedStudentForReport(s);
                                  setReportFormat("executive_sample");
                                  setPreviousViewMode("full_batch");
                                  setViewMode("individual");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer"
                                title="View Student Performance Report"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable Document Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <span>MIND2I Workshop & Bootcamp Hub • Batch Performance Report</span>
                <span className="font-mono">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. STUNNING 360° STUDENT TELEMETRY DOSSIER (INDIVIDUAL VIEW)               */}
          {/* ========================================================================= */}
          {(viewMode === "individual" || userRole === "student") && selectedStudentForReport && (
            <div className="space-y-6 print:space-y-0 print:p-0 print:m-0 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Report Format Switcher Bar */}
              <div className="print:hidden no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setReportFormat("executive_sample")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      reportFormat === "executive_sample"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Student Report</span>
                  </button>

                  <button
                    onClick={() => setReportFormat("dossier")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      reportFormat === "dossier"
                        ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Detailed Report</span>
                  </button>
                </div>

                {userRole === "admin" && (
                  <button
                    onClick={() => setViewMode(previousViewMode || "batch")}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to List</span>
                  </button>
                )}
              </div>

              {/* RENDER MODE A: EXECUTIVE EVALUATION REPORT (REFERENCE SAMPLE REPLICA) */}
              {reportFormat === "executive_sample" ? (
                <ExecutiveEvaluationReport
                  student={selectedStudentForReport}
                  batch={selectedBatch}
                  students={batchStudents}
                  attendanceSessions={attendanceSessions}
                  liveQuestions={liveQuestions}
                  assignments={assignments}
                  learnHubModules={learnHubModules}
                  settings={settings}
                  onSelectStudent={setSelectedStudentForReport}
                  onUpdateStudent={(updatedStu) => {
                    setSelectedStudentForReport(updatedStu);
                    if (onUpdateStudent) onUpdateStudent(updatedStu);
                  }}
                />
              ) : (
                /* RENDER MODE B: 360° LIVE UPDATES DOSSIER */
                <>
              {/* Hero Ambient Dossier Card */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-[#0b101e] via-[#11192e] to-[#0b101e] text-white rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Cpu className="w-64 h-64 text-sky-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800/80">
                  {/* Student Profile Info */}
                  <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          selectedStudentForReport.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudentForReport.name}`
                        }
                        alt={selectedStudentForReport.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-sky-400/40 object-cover shadow-xl ring-4 ring-sky-500/10"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-2 border-slate-900 shadow-md">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {selectedStudentForReport.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          Rank #{(() => {
                            const sorted = [...batchStudents].sort((a, b) => (b.scores?.overallAccuracy ?? 0) - (a.scores?.overallAccuracy ?? 0));
                            const idx = sorted.findIndex((s) => s.id === selectedStudentForReport.id);
                            return idx >= 0 ? idx + 1 : 1;
                          })()} in Batch
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedStudentForReport.email}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {selectedStudentForReport.college || selectedBatch.college || "College / Institution"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] font-extrabold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                          {selectedStudentForReport.batchName || selectedBatch.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Print PDF & Celebration Confetti */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={handleTriggerCelebration}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Award Recognition</span>
                    </button>

                    <button
                      onClick={handlePrintOrDownloadPdf}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Download PDF Report</span>
                    </button>
                  </div>
                </div>

                {/* 4 Telemetry Quick-Metric Glass Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Overall Accuracy */}
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                      Overall Accuracy
                    </span>
                    <div className="text-3xl font-black text-emerald-400">
                      {selectedStudentForReport.scores?.overallAccuracy ?? 0}%
                    </div>
                    <span className="text-[10px] text-emerald-500/90 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Cumulative Score
                    </span>
                  </div>

                  {/* Total Points */}
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                      Total Points
                    </span>
                    <div className="text-3xl font-black text-amber-400">
                      {selectedStudentForReport.totalPoints ?? 0}
                    </div>
                    <span className="text-[10px] text-amber-500/90 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500" /> Platform XP
                    </span>
                  </div>

                  {/* Reflex Speed */}
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                      Response Speed
                    </span>
                    <div className="text-3xl font-black text-sky-400">
                      {selectedStudentForReport.fastestResponseMs
                        ? `${((selectedStudentForReport.fastestResponseMs) / 1000).toFixed(2)}s`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Live Q&A Speed
                    </span>
                  </div>

                  {/* Learning Streak */}
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                      Daily Streak
                    </span>
                    <div className="text-3xl font-black text-orange-400 flex items-center gap-1">
                      <span>{selectedStudentForReport.activeStreakDays ?? 0}</span>
                      <Flame className="w-6 h-6 text-orange-500 fill-orange-400 animate-bounce" />
                    </div>
                    <span className="text-[10px] text-orange-400/90 font-bold">
                      Active daily momentum
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Tabs Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveDossierTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    activeDossierTab === "overview"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>AI Overview</span>
                </button>

                <button
                  onClick={() => setActiveDossierTab("skills")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    activeDossierTab === "skills"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Skills Breakdown</span>
                </button>

                <button
                  onClick={() => setActiveDossierTab("telemetry")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    activeDossierTab === "telemetry"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Response Speed</span>
                </button>

                <button
                  onClick={() => setActiveDossierTab("coding")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    activeDossierTab === "coding"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Coding & Tasks</span>
                  {settings?.enableCodingIDE === false && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 ml-1">
                      OFF
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveDossierTab("attendance")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    activeDossierTab === "attendance"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Attendance Records</span>
                </button>
              </div>

              {/* ── TAB 1: 360° AI OVERVIEW ── */}
              {activeDossierTab === "overview" && (
                <div className="space-y-6">
                  {/* AI Diagnostic Summary Box */}
                  <div className="p-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-slate-50 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Overview</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Live Profile
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {getStudentSummaryText(selectedStudentForReport.scores?.overallAccuracy ?? 0)}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-white rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Coding Score
                        </span>
                        <span className="text-xs font-extrabold text-indigo-700">
                          {selectedStudentForReport.scores?.codingScore ?? 0}% Code Accuracy
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Response Speed
                        </span>
                        <span className="text-xs font-extrabold text-sky-700">
                          {selectedStudentForReport.scores?.liveQAScore ?? 0}% Response Rate
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Quiz Score
                        </span>
                        <span className="text-xs font-extrabold text-purple-700">
                          {selectedStudentForReport.scores?.assignmentScore ?? selectedStudentForReport.scores?.quizScore ?? 0}% Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Skill Gauges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gauge 1 */}
                    <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Quizzes
                        </span>
                        <span className="text-lg font-black text-emerald-600 font-mono">
                          {selectedStudentForReport.scores?.quizScore ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                          style={{ width: `${selectedStudentForReport.scores?.quizScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Understanding of core workshop concepts and topics.
                      </span>
                    </div>

                    {/* Gauge 2 */}
                    <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Coding Tasks
                        </span>
                        <span className="text-lg font-black text-purple-600 font-mono">
                          {selectedStudentForReport.scores?.codingScore ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                          style={{ width: `${selectedStudentForReport.scores?.codingScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Writes correct code solutions that pass all test cases.
                      </span>
                    </div>

                    {/* Gauge 3 */}
                    <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Response Speed
                        </span>
                        <span className="text-lg font-black text-sky-600 font-mono">
                          {selectedStudentForReport.scores?.liveQAScore ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
                          style={{ width: `${selectedStudentForReport.scores?.liveQAScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Response speed and accuracy during interactive classroom rounds.
                      </span>
                    </div>

                    {/* Gauge 4 */}
                    <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Assignments
                        </span>
                        <span className="text-lg font-black text-indigo-600 font-mono">
                          {selectedStudentForReport.scores?.assignmentScore ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                          style={{ width: `${selectedStudentForReport.scores?.assignmentScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Submission completion and quality of sprint assignments.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: SKILL MASTERY MATRIX ── */}
              {activeDossierTab === "skills" && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <span>Skills Breakdown</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Detailed breakdown of student performance across key learning areas.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        skill: "Theory & Concepts",
                        pct: Math.min(100, Math.round(selectedStudentForReport.scores?.quizScore ?? selectedStudentForReport.scores?.overallAccuracy ?? 0)),
                        level: (selectedStudentForReport.scores?.quizScore ?? 0) >= 80 ? "Master" : (selectedStudentForReport.scores?.quizScore ?? 0) >= 50 ? "Proficient" : "Foundational",
                        color: "from-indigo-500 to-purple-600",
                      },
                      {
                        skill: "Coding Tasks",
                        pct: Math.min(100, Math.round(selectedStudentForReport.scores?.codingScore ?? 0)),
                        level: (selectedStudentForReport.scores?.codingScore ?? 0) >= 80 ? "Master" : (selectedStudentForReport.scores?.codingScore ?? 0) >= 50 ? "Proficient" : "Foundational",
                        color: "from-emerald-400 to-teal-600",
                      },
                      {
                        skill: "Response Speed",
                        pct: Math.min(100, Math.round(selectedStudentForReport.scores?.liveQAScore ?? 0)),
                        level: (selectedStudentForReport.scores?.liveQAScore ?? 0) >= 80 ? "Master" : (selectedStudentForReport.scores?.liveQAScore ?? 0) >= 50 ? "Proficient" : "Foundational",
                        color: "from-sky-400 to-blue-600",
                      },
                      {
                        skill: "Assignments",
                        pct: Math.min(100, Math.round(selectedStudentForReport.scores?.assignmentScore ?? 0)),
                        level: (selectedStudentForReport.scores?.assignmentScore ?? 0) >= 80 ? "Master" : (selectedStudentForReport.scores?.assignmentScore ?? 0) >= 50 ? "Proficient" : "Foundational",
                        color: "from-amber-400 to-orange-500",
                      },
                      {
                        skill: "Overall Performance",
                        pct: Math.min(100, Math.round(selectedStudentForReport.scores?.overallAccuracy ?? 0)),
                        level: (selectedStudentForReport.scores?.overallAccuracy ?? 0) >= 80 ? "Master" : (selectedStudentForReport.scores?.overallAccuracy ?? 0) >= 50 ? "Proficient" : "Foundational",
                        color: "from-rose-400 to-pink-600",
                      },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {item.skill}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {item.level}
                            </span>
                            <span className="text-xs font-black font-mono text-slate-900">
                              {item.pct}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 3: SPEED & REFLEX TELEMETRY ── */}
              {activeDossierTab === "telemetry" && (() => {
                const batchQs = (liveQuestions || []).filter(
                  (q) => String(q.batchId || (q as any).batch) === String(selectedBatch?.id)
                );
                const tfQs = batchQs.filter((q) => q.type === "true_false");
                const pollQs = batchQs.filter((q) => q.type === "poll" || (q as any).category === "poll");
                const mcqQs = batchQs.filter((q) => q.type === "mcq");
                const openQs = batchQs.filter((q) => q.type === "open");

                const stuTfResp = tfQs.flatMap((q) => (q.responses || []).filter((r) => String(r.studentId) === String(selectedStudentForReport.id)));
                const stuPollResp = pollQs.flatMap((q) => (q.responses || []).filter((r) => String(r.studentId) === String(selectedStudentForReport.id)));
                const stuMcqResp = mcqQs.flatMap((q) => (q.responses || []).filter((r) => String(r.studentId) === String(selectedStudentForReport.id)));
                const stuOpenResp = openQs.flatMap((q) => (q.responses || []).filter((r) => String(r.studentId) === String(selectedStudentForReport.id)));

                const tfTimed = stuTfResp.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
                const pollTimed = stuPollResp.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
                const mcqTimed = stuMcqResp.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
                const openTimed = stuOpenResp.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);

                const allTimes = [
                  ...(selectedStudentForReport.fastestResponseMs > 0 ? [selectedStudentForReport.fastestResponseMs] : []),
                  ...tfTimed.map((r) => r.responseTimeMs),
                  ...pollTimed.map((r) => r.responseTimeMs),
                  ...mcqTimed.map((r) => r.responseTimeMs),
                  ...openTimed.map((r) => r.responseTimeMs),
                ].filter((ms): ms is number => typeof ms === "number" && ms > 0);

                const stuFastestMs = allTimes.length > 0 ? Math.min(...allTimes) : (selectedStudentForReport.fastestResponseMs || 0);
                const stuAvgMs = allTimes.length > 0
                  ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
                  : (selectedStudentForReport.averageResponseMs || stuFastestMs || avgSpeedMs);

                let lightCount = 0, swiftCount = 0, modCount = 0, delibCount = 0;
                allTimes.forEach((ms) => {
                  if (ms < 1500) lightCount++;
                  else if (ms <= 3000) swiftCount++;
                  else if (ms <= 5000) modCount++;
                  else delibCount++;
                });

                const totalEvents = allTimes.length;
                const reflexScore = stuFastestMs > 0 ? Math.min(99, Math.max(10, Math.round(100 - (stuFastestMs / 1000) * 12))) : 80;

                const avgTf = tfTimed.length > 0 ? Math.round(tfTimed.reduce((a, r) => a + r.responseTimeMs, 0) / tfTimed.length) : 0;
                const avgPoll = pollTimed.length > 0 ? Math.round(pollTimed.reduce((a, r) => a + r.responseTimeMs, 0) / pollTimed.length) : 0;
                const avgMcq = mcqTimed.length > 0 ? Math.round(mcqTimed.reduce((a, r) => a + r.responseTimeMs, 0) / mcqTimed.length) : 0;
                const avgOpen = openTimed.length > 0 ? Math.round(openTimed.reduce((a, r) => a + r.responseTimeMs, 0) / openTimed.length) : 0;

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-sky-600" />
                          <span>Response Speed</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Speed and timing across live classroom questions.
                        </p>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono w-fit">
                        Speed Score: {reflexScore}%
                      </span>
                    </div>

                    {/* 3 KPI Hero Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Fastest Speed</span>
                        <div className="text-3xl font-black text-sky-600 font-mono">
                          {stuFastestMs > 0 ? `${(stuFastestMs / 1000).toFixed(2)}s` : "N/A"}
                        </div>
                        <span className="text-[11px] font-bold text-sky-700">Fastest Response</span>
                      </div>

                      <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Average Speed</span>
                        <div className="text-3xl font-black text-indigo-600 font-mono">
                          {stuAvgMs > 0 ? `${(stuAvgMs / 1000).toFixed(2)}s` : "N/A"}
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700">{totalEvents} Questions</span>
                      </div>

                      <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Overall Accuracy</span>
                        <div className="text-3xl font-black text-emerald-600 font-mono">
                          {selectedStudentForReport.scores?.overallAccuracy ?? 0}%
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">Accuracy Rate</span>
                      </div>
                    </div>

                    {/* Dual Visual Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                      {/* Left: Velocity Tier Distribution */}
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                            Speed Breakdown
                          </span>
                          <span className="text-[10px] font-black text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                            {totalEvents} Questions
                          </span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { label: "⚡ Super Fast (<1.5s)", count: lightCount, color: "bg-emerald-500", textColor: "text-emerald-700" },
                            { label: "🚀 Fast (1.5s - 3.0s)", count: swiftCount, color: "bg-sky-500", textColor: "text-sky-700" },
                            { label: "⏱️ Normal (3.0s - 5.0s)", count: modCount, color: "bg-amber-400", textColor: "text-amber-700" },
                            { label: "⏳ Slow (>5.0s)", count: delibCount, color: "bg-rose-400", textColor: "text-rose-700" },
                          ].map((tier, tIdx) => {
                            const pct = totalEvents > 0 ? Math.round((tier.count / totalEvents) * 100) : 0;
                            return (
                              <div key={tIdx} className="space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                  <span className={tier.textColor}>{tier.label}</span>
                                  <span className="font-mono text-slate-800 font-extrabold">{tier.count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                  <div className={`h-full ${tier.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-200/70">
                          <span>Speed Level</span>
                          <span className="text-sky-600 font-extrabold">{stuFastestMs <= 1500 ? "Super Fast" : stuFastestMs <= 3000 ? "Fast" : "Average Pace"}</span>
                        </div>
                      </div>

                      {/* Right: Cross-Domain Response Latency */}
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            Category Speed
                          </span>
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                            5.0s Benchmark
                          </span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { domain: "True / False", avgMs: avgTf, count: stuTfResp.length, color: "bg-rose-500", textCol: "text-rose-700" },
                            { domain: "Live Polls", avgMs: avgPoll, count: stuPollResp.length, color: "bg-sky-500", textCol: "text-sky-700" },
                            { domain: "Quiz MCQs", avgMs: avgMcq, count: stuMcqResp.length, color: "bg-amber-500", textCol: "text-amber-700" },
                            { domain: "Written Answers", avgMs: avgOpen, count: stuOpenResp.length, color: "bg-emerald-500", textCol: "text-emerald-700" },
                          ].map((dom, dIdx) => {
                            const barPct = dom.avgMs > 0 ? Math.min(100, Math.round((dom.avgMs / 5000) * 100)) : 0;
                            return (
                              <div key={dIdx} className="space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                  <span className={dom.textCol}>{dom.domain}</span>
                                  <span className="font-mono text-slate-800 font-extrabold">
                                    {dom.avgMs > 0 ? `${(dom.avgMs / 1000).toFixed(2)}s avg` : "Pending"}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                  <div className={`h-full ${dom.color} rounded-full transition-all duration-700`} style={{ width: `${barPct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-200/70">
                          <span>Response Times</span>
                          <span className="text-emerald-600 font-extrabold">Real Milliseconds</span>
                        </div>
                      </div>
                    </div>

                    {/* Speedometer Gauge Track */}
                    <div className="space-y-2 py-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-sky-500" />
                          Speed Gauge
                        </span>
                        <span className="font-mono text-sky-700 font-extrabold">{stuFastestMs > 0 ? `${stuFastestMs}ms` : "--"}</span>
                      </div>
                      <div className="relative pt-1.5 pb-1">
                        <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 via-amber-400 to-rose-400 overflow-hidden shadow-inner" />
                        <div
                          className="absolute top-0 mt-0.5 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                          style={{
                            left: `${Math.min(95, Math.max(5, Math.round(reflexScore)))}%`,
                          }}
                        >
                          <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider pt-0.5">
                        <span className="text-emerald-600">⚡ Super Fast (&lt;1.5s)</span>
                        <span className="text-sky-600">Fast (1.5-3.0s)</span>
                        <span className="text-amber-600">Average (3.0-5.0s)</span>
                        <span className="text-slate-500">Slow (&gt;5.0s)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── TAB 4: ASSIGNMENTS & CODING CHALLENGES ── */}
              {activeDossierTab === "coding" && (() => {
                const isCodingEnabled = settings?.enableCodingIDE !== false;
                const tabBatchAssignments = (assignments || []).filter(
                  (a) => !a.batchId || a.batchId === selectedBatch?.id || (a as any).batch === selectedBatch?.id
                );
                const tabIsWorkshop = selectedBatch?.type === "workshop" || selectedBatch?.name?.toLowerCase().includes("workshop");
                const tabTargetSprints = tabIsWorkshop ? 1 : 3;
                let tabTotalCoding = 0;
                let tabTotalQuiz = 0;
                tabBatchAssignments.forEach((a) => {
                  (a.questions || []).forEach((q: any) => {
                    if (q.type === "code" || q.type === "coding") {
                      tabTotalCoding += 1;
                    } else {
                      tabTotalQuiz += 1;
                    }
                  });
                });
                if (tabTotalCoding === 0 && tabTotalQuiz === 0) {
                  tabTotalCoding = tabIsWorkshop ? 2 : 5;
                  tabTotalQuiz = tabIsWorkshop ? 3 : 10;
                }
                const tabCodingScore = selectedStudentForReport.scores?.codingScore ?? 0;
                const tabAssignmentScore = selectedStudentForReport.scores?.assignmentScore ?? 0;
                const tabCodingSubmitted = Math.min(tabTotalCoding, Math.max(1, Math.round((tabTotalCoding * tabCodingScore) / 100)));
                const tabQuizSubmitted = Math.min(tabTotalQuiz, Math.max(1, Math.round((tabTotalQuiz * tabAssignmentScore) / 100)));
                const tabDeliveryPct = Math.min(100, Math.round((tabBatchAssignments.length / tabTargetSprints) * 100));

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-purple-600" />
                          <span>Coding & Tasks</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Practical problems and quiz theory retention.
                        </p>
                      </div>
                      <div>
                        {isCodingEnabled ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-purple-600" />
                            Active Module
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Module Off
                          </span>
                        )}
                      </div>
                    </div>

                    {!isCodingEnabled ? (
                      <div className="p-8 text-center bg-gradient-to-br from-amber-50/70 via-slate-50 to-white rounded-2xl border border-amber-200/80 space-y-3 shadow-xs">
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-black text-slate-900">Module Turned Off</h5>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                          Coding IDE and Assignments have been turned off in <strong>Settings</strong>. 
                          Scores have been automatically rebalanced so student accuracy is not affected.
                        </p>
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-200 inline-block">
                            Module Off • Rebalanced
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 4 Comparative Telemetry Gauges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] font-black uppercase text-purple-700">Coding Tasks</span>
                              <span className="font-mono font-black text-slate-900">{tabCodingSubmitted}/{tabTotalCoding}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded-full"
                                style={{ width: `${Math.round((tabCodingSubmitted / tabTotalCoding) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">Coding problems</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] font-black uppercase text-indigo-700">Quizzes</span>
                              <span className="font-mono font-black text-slate-900">{tabQuizSubmitted}/{tabTotalQuiz}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.round((tabQuizSubmitted / tabTotalQuiz) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">Quiz questions</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] font-black uppercase text-emerald-700">Pass Rate</span>
                              <span className="font-mono font-black text-emerald-700">{tabCodingScore}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${tabCodingScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">Tests passed</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] font-black uppercase text-amber-700">Tasks Done</span>
                              <span className="font-mono font-black text-slate-900">{tabBatchAssignments.length}/{tabTargetSprints} Target</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${tabDeliveryPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">{tabIsWorkshop ? "Workshop target: 1–2" : "Bootcamp target: 3+"}</span>
                          </div>
                        </div>

                        {/* Compiler Status Card */}
                        {tabCodingScore > 0 ? (
                          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] text-emerald-400 font-mono text-xs shadow-md space-y-0">
                            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-slate-300 font-bold ml-2">Test Results</span>
                              </div>
                              <span className="text-emerald-400 font-bold">
                                ✓ Score: {tabCodingScore}%
                              </span>
                            </div>

                            <div className="p-6 text-center space-y-2">
                              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-7 h-7" />
                              </div>
                              <h5 className="text-sm font-bold text-white">Code Checked</h5>
                              <p className="text-xs text-slate-400 max-w-md mx-auto">
                                Student has solved practical coding challenges with a score of <strong className="text-emerald-400">{tabCodingScore}%</strong>.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto border border-purple-100">
                              <Code2 className="w-5 h-5" />
                            </div>
                            <h5 className="text-sm font-bold text-slate-800">Pending Submissions</h5>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              No code submissions recorded yet for this student.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ── TAB 5: ATTENDANCE & TIMELINE ── */}
              {activeDossierTab === "attendance" && (() => {
                const dossierBatchSessions = (attendanceSessions || []).filter(
                  (s) => s.batchId === selectedBatch?.id || (s as any).batch === selectedBatch?.id
                );
                const dossierPresentSessions = dossierBatchSessions.filter((s) =>
                  s.records?.some(
                    (r) => r.studentId === selectedStudentForReport.id && (r.status === "present" || r.status === "late")
                  )
                );
                const dossierTotalCount = dossierBatchSessions.length > 0
                  ? dossierBatchSessions.length
                  : selectedStudentForReport.totalSessions || 0;
                const dossierAttendedCount = dossierBatchSessions.length > 0
                  ? dossierPresentSessions.length
                  : selectedStudentForReport.attendedSessions || 0;
                const dossierAttendancePct = dossierTotalCount > 0
                  ? Math.min(100, Math.round((dossierAttendedCount / dossierTotalCount) * 100))
                  : 0;
                const dossierPresentCount = dossierBatchSessions.length > 0
                  ? dossierBatchSessions.filter((s) =>
                      s.records?.some((r) => r.studentId === selectedStudentForReport.id && r.status === "present")
                    ).length
                  : dossierAttendedCount;
                const dossierLateCount = dossierBatchSessions.length > 0
                  ? dossierBatchSessions.filter((s) =>
                      s.records?.some((r) => r.studentId === selectedStudentForReport.id && r.status === "late")
                    ).length
                  : 0;
                const dossierAbsentCount = dossierBatchSessions.length > 0
                  ? dossierBatchSessions.filter((s) =>
                      s.records?.some((r) => r.studentId === selectedStudentForReport.id && r.status === "absent")
                    ).length
                  : Math.max(0, dossierTotalCount - dossierAttendedCount);
                const dossierSortedSessions = [...dossierBatchSessions].sort((a, b) => {
                  const dateComp = (a.date || "").localeCompare(b.date || "");
                  if (dateComp !== 0) return dateComp;
                  return (a.fromTime || "").localeCompare(b.fromTime || "");
                });

                const cRadius = 38;
                const cCircumference = 2 * Math.PI * cRadius;
                const safeTotal = Math.max(1, dossierTotalCount);
                const pArc = (dossierPresentCount / safeTotal) * cCircumference;
                const lArc = (dossierLateCount / safeTotal) * cCircumference;
                const aArc = (dossierAbsentCount / safeTotal) * cCircumference;
                const lOffset = -pArc;
                const aOffset = -(pArc + lArc);

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                      <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>Attendance Records</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Morning and afternoon session logs for this batch.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                          {selectedBatch?.startDate && selectedBatch?.endDate
                            ? `${selectedBatch.startDate} ➔ ${selectedBatch.endDate}`
                            : selectedBatch?.durationLabel || "Multi-Day"}
                        </span>
                      </div>
                    </div>

                    {/* Circular Chart & Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/70">
                      {/* Donut Chart */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="w-28 h-28 relative flex items-center justify-center">
                          <svg className="w-28 h-28 -rotate-90 transform origin-center" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={cRadius}
                              fill="transparent"
                              stroke="#f1f5f9"
                              strokeWidth="10"
                            />
                            {dossierTotalCount > 0 && (
                              <>
                                {dossierPresentCount > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={cRadius}
                                    fill="transparent"
                                    stroke="#0d9488"
                                    strokeWidth="10"
                                    strokeDasharray={`${pArc} ${cCircumference}`}
                                    strokeDashoffset={0}
                                  />
                                )}
                                {dossierLateCount > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={cRadius}
                                    fill="transparent"
                                    stroke="#f59e0b"
                                    strokeWidth="10"
                                    strokeDasharray={`${lArc} ${cCircumference}`}
                                    strokeDashoffset={lOffset}
                                  />
                                )}
                                {dossierAbsentCount > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={cRadius}
                                    fill="transparent"
                                    stroke="#f43f5e"
                                    strokeWidth="10"
                                    strokeDasharray={`${aArc} ${cCircumference}`}
                                    strokeDashoffset={aOffset}
                                  />
                                )}
                              </>
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-2xl font-black text-slate-900 font-mono leading-none">
                              {dossierAttendancePct}%
                            </span>
                            <span className="text-[8px] font-black text-teal-700 tracking-wider uppercase mt-1">
                              ATTENDANCE
                            </span>
                          </div>
                        </div>

                        {/* Donut Legend */}
                        <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-2 border-t border-slate-100 text-center">
                          <div>
                            <span className="text-xs font-black text-teal-700 font-mono">{dossierPresentCount}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400 block">Present</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-amber-600 font-mono">{dossierLateCount}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400 block">Late</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-rose-600 font-mono">{dossierAbsentCount}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400 block">Absent</span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Summary Cards */}
                      <div className="md:col-span-8 grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Attendance Rate
                          </span>
                          <span className="text-xl font-black text-indigo-950 font-mono">
                            {dossierAttendancePct}%
                          </span>
                          <span className="text-[10px] font-bold text-teal-600 block">
                            {dossierAttendedCount}/{dossierTotalCount} Sessions
                          </span>
                        </div>

                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Total Hours
                          </span>
                          <span className="text-xl font-black text-indigo-950 font-mono">
                            {Math.round(dossierAttendedCount * 1.5)} hrs
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 block">
                            1.5h per slot
                          </span>
                        </div>

                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Daily Schedule
                          </span>
                          <span className="text-sm font-black text-slate-800 block">
                            2x Per Day
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 block">
                            Morning & Afternoon
                          </span>
                        </div>

                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Batch Dates
                          </span>
                          <span className="text-sm font-black text-slate-800 block truncate">
                            {selectedBatch?.durationLabel || "Workshop"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block truncate">
                            {selectedBatch?.startDate || "Start"} to {selectedBatch?.endDate || "End"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session-by-Session Slot Log Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                          Attendance Slots ({dossierSortedSessions.length})
                        </h5>
                        <span className="text-[10px] font-bold text-slate-400">
                          Roll-call records for {selectedStudentForReport.name}
                        </span>
                      </div>

                      {dossierSortedSessions.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                              <tr>
                                <th className="p-3">Slot #</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Timing</th>
                                <th className="p-3">Slot Title</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {dossierSortedSessions.map((sess, idx) => {
                                const rec = sess.records?.find(
                                  (r) => r.studentId === selectedStudentForReport.id
                                );
                                const isPM =
                                  (sess.fromTime || "").toLowerCase().includes("pm") ||
                                  (sess.title || "").toLowerCase().includes("afternoon");
                                const slotType = isPM ? "Afternoon Slot" : "Morning Slot";

                                return (
                                  <tr key={sess.id || idx} className="hover:bg-slate-50/60 transition">
                                    <td className="p-3 font-mono font-black text-indigo-600">
                                      #{idx + 1}
                                    </td>
                                    <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                                      {sess.date || `Day ${idx + 1}`}
                                    </td>
                                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                                      {sess.fromTime} - {sess.toTime}{" "}
                                      <span className="text-[10px] font-sans font-bold text-slate-400">
                                        ({slotType})
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-700 font-medium truncate max-w-xs">
                                      {sess.title}
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      {rec?.status === "present" ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          ✓ Present
                                        </span>
                                      ) : rec?.status === "late" ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                          ⏱ Late
                                        </span>
                                      ) : rec?.status === "absent" ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                          ✕ Absent
                                        </span>
                                      ) : rec?.status === "excused" ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                          ⚑ Excused
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                          ○ Scheduled
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                          <h6 className="text-sm font-bold text-slate-800">
                            No Attendance Slots
                          </h6>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Slots can be scheduled up to 2 times a day (Morning & Afternoon) in Attendance Manager across the batch dates ({selectedBatch?.startDate || "Start"} to {selectedBatch?.endDate || "End"}).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Instructor Notes & Feedback Card */}
              {userRole === "admin" && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>Instructor Notes</span>
                  </h4>
                  <textarea
                    rows={2}
                    value={
                      instructorNotesText ||
                      savedNotesMap[selectedStudentForReport.id] ||
                      selectedStudentForReport.notes ||
                      ""
                    }
                    onChange={(e) => setInstructorNotesText(e.target.value)}
                    placeholder="Add private evaluation notes or feedback for this student..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSavedNotesMap((prev) => ({
                          ...prev,
                          [selectedStudentForReport.id]: instructorNotesText,
                        }));
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsAnalyticsView;

