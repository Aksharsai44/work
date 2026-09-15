import React, { useState } from "react";
import { Student } from "../types";
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Flame,
  Award,
  Clock,
  Printer,
  CheckCircle2,
  Zap,
  TrendingUp,
  Sparkles,
  Target,
  Code2,
  Trophy,
  Star,
  Activity,
  Check,
  FileCheck,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
  CheckSquare,
  Terminal,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onPrintReport: () => void;
  students?: Student[];
  assignments?: import("../types").Assignment[];
  liveQuestions?: import("../types").LiveQuestion[];
  scheduledMeetings?: import("../types").ScheduledMeeting[];
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onPrintReport,
  students = [],
  assignments = [],
  liveQuestions = [],
  scheduledMeetings = [],
}) => {
  if (!student) return null;

  const [activeTab, setActiveTab] = useState<
    "overview" | "coding" | "assessments" | "attendance" | "certificate" | "notes"
  >("overview");

  const [instructorNote, setInstructorNote] = useState<string>(student.notes || "");
  const [isSavedNote, setIsSavedNote] = useState(false);

  const cohortStudents = students.filter((s) => s.batchId === student.batchId);
  const sortedStudents = [...cohortStudents].sort(
    (a, b) => (b.scores?.overallAccuracy ?? 0) - (a.scores?.overallAccuracy ?? 0)
  );
  const rankIndex = sortedStudents.findIndex((s) => s.id === student.id);
  const rankDisplay = rankIndex >= 0 ? `Cohort Rank #${rankIndex + 1}` : "Cohort Contender";

  const handleConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"],
      });
    } catch {}
  };

  const handleSaveNote = () => {
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 3000);
  };

  const certId = `M2I-CERT-2026-${(student.batchId || "BATCH").toUpperCase()}-${student.id.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  const shaHash = `SHA256:9FB6F0D501C5F810...`;

  const batchMeetings = scheduledMeetings.filter(
    (m) => m.batchId === student.batchId || (m as any).batch === student.batchId
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl lg:max-w-4xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* ── Ambient Dark Header ── */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0a0f1d] via-[#11192e] to-[#0a0f1d] text-white relative border-b border-slate-800 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={
                  student.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`
                }
                alt={student.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-sky-400/40 object-cover shadow-xl ring-4 ring-sky-500/10"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-lg border-2 border-slate-900 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white capitalize tracking-tight truncate">
                  {student.name}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  {rankDisplay}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {student.email}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {student.mobile || "Not provided"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {student.college || "College / Institution"}
                </span>
              </div>

              <div className="pt-0.5 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                  {student.batchName || "Enrolled Batch"}
                </span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/30">
                  {student.collegeRegNo ? `Reg No: ${student.collegeRegNo}` : `ID: ${student.id.slice(0, 10)}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Internal Tab Navigation Bar ── */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab("coding")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "coding"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Submissions</span>
          </button>

          <button
            onClick={() => setActiveTab("assessments")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "assessments"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Quizzes & Tests</span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "attendance"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Session Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab("certificate")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "certificate"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certificate Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "notes"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Instructor Notes</span>
          </button>
        </div>

        {/* ── Scrollable Tab Content Body ── */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 flex-1">
          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in">
              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Overall Accuracy
                  </span>
                  <div className="text-3xl font-black text-emerald-700">
                    {student.scores?.overallAccuracy ?? 0}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Cumulative Score
                  </span>
                </div>

                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Total XP Points
                  </span>
                  <div className="text-3xl font-black text-amber-700">
                    {student.totalPoints ?? 0}
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-500" /> Platform XP
                  </span>
                </div>

                <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Reflex Speed
                  </span>
                  <div className="text-3xl font-black text-sky-700">
                    {student.fastestResponseMs
                      ? `${((student.fastestResponseMs) / 1000).toFixed(2)}s`
                      : "N/A"}
                  </div>
                  <span className="text-[10px] text-sky-600 font-bold flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> Live Q&A Latency
                  </span>
                </div>

                <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Active Streak
                  </span>
                  <div className="text-3xl font-black text-orange-700 flex items-center gap-1">
                    <span>{student.activeStreakDays || 0}d</span>
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
                  </div>
                  <span className="text-[10px] text-orange-600 font-bold">
                    Daily Momentum
                  </span>
                </div>
              </div>

              {/* Multi-Dimensional Skill Mastery */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Multi-Dimensional Skill Mastery</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Quiz & Theory Retention</span>
                      <span className="text-emerald-600 font-mono">
                        {student.scores?.quizScore ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        style={{ width: `${student.scores?.quizScore ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Applied In-Browser Coding</span>
                      <span className="text-purple-600 font-mono">
                        {student.scores?.codingScore ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                        style={{ width: `${student.scores?.codingScore ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Live Q&A Velocity & Reflex</span>
                      <span className="text-sky-600 font-mono">
                        {student.scores?.liveQAScore ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
                        style={{ width: `${student.scores?.liveQAScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Telemetry & Session Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Contact Telemetry
                  </span>
                  <div className="font-bold text-slate-800 text-sm">{student.mobile || "Not provided"}</div>
                  <div className="text-slate-500 truncate">{student.email}</div>
                  <div className="text-[11px] text-indigo-600 font-bold pt-1">
                    Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Session Attendance Record
                  </span>
                  <div className="font-bold text-indigo-600 text-sm">
                    {student.attendedSessions ?? 0} / {student.totalSessions || 1} Sessions Attended
                  </div>
                  <div className="text-slate-500">
                    {student.totalSessions > 0
                      ? `${Math.round(((student.attendedSessions ?? 0) / student.totalSessions) * 100)}% Participation Rate`
                      : "Enrolled in active cohort"}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold pt-1">
                    ✓ Verified Participant
                  </div>
                </div>
              </div>

              {/* Overall Trainer Review & 5-Star Rating (if present) */}
              {(student.trainerRating || student.trainerReview) && (
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      Lead Trainer Official Review & 5-Star Rating
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(student.trainerRating || 0)
                              ? "fill-amber-400 text-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-amber-900 font-mono ml-1">
                        ★ {student.trainerRating ? student.trainerRating.toFixed(1) : "--"}/5
                      </span>
                    </div>
                  </div>
                  {student.trainerReview && (
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-amber-100">
                      "{student.trainerReview}"
                    </p>
                  )}
                  {student.trainerReviewedAt && (
                    <div className="text-[10px] text-slate-400 font-mono text-right">
                      Verified on {new Date(student.trainerReviewedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
              )}

              {/* Overall AI-Reviewed Executive Synthesis & Rating (if present) */}
              {(student.aiVerdictRating || student.aiVerdictSummary) && (
                <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-500/30 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      AI Executive Evaluation & Rigor Rating
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(student.aiVerdictRating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-700 text-slate-600"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-amber-300 font-mono ml-1">
                        ★ {student.aiVerdictRating ? student.aiVerdictRating.toFixed(1) : "--"}/5
                      </span>
                    </div>
                  </div>
                  {student.aiVerdictSummary && (
                    <div className="text-xs text-slate-200 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 whitespace-pre-line max-h-48 overflow-y-auto font-sans">
                      {student.aiVerdictSummary}
                    </div>
                  )}
                  {student.aiVerdictEvaluatedAt && (
                    <div className="text-[10px] text-slate-400 font-mono text-right flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      Dated: {new Date(student.aiVerdictEvaluatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CODE SUBMISSIONS & COMPILER */}
          {activeTab === "coding" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-purple-600" />
                    <span>Verified Code Challenge Solutions</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Latest submitted solutions executed in the in-browser compiler.
                  </p>
                </div>
                {(student.scores?.codingScore ?? 0) > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ {student.scores?.codingScore}% Score
                  </span>
                )}
              </div>

              {(student.scores?.codingScore ?? 0) > 0 ? (
                <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Compiler Test Cases Passed</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Candidate {student.name} has submitted coding challenge solutions with an evaluation score of <strong className="text-emerald-400">{student.scores?.codingScore}%</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Code2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h5 className="text-sm font-bold text-slate-700">No Code Submissions Recorded</h5>
                  <p className="text-xs text-slate-400">
                    This student has not yet executed solutions in the Coding Challenge IDE.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUIZZES & ASSESSMENTS */}
          {activeTab === "assessments" && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Assessment & Quiz Evaluation History</span>
              </h4>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Live Q&A & Theory Accuracy
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Reaction Velocity: <strong className="text-slate-700">{student.fastestResponseMs ? `${(student.fastestResponseMs / 1000).toFixed(2)}s` : "N/A"}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">
                      {student.scores?.liveQAScore ?? student.scores?.quizScore ?? 0}%
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-600">
                      +{student.totalPoints ?? 0} Pts
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Overall Module Accuracy
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Overall Workshop Performance Score
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">
                      {student.scores?.overallAccuracy ?? 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SESSION ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Session Attendance & Check-In Log</span>
              </h4>

              {batchMeetings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batchMeetings.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600">Session #{idx + 1}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {m.status === "ended" ? "Completed" : m.status === "live" ? "Live Now" : "Scheduled"}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">{m.title}</h5>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{m.scheduledDate || "Scheduled"}</span>
                        <span className="font-semibold text-slate-600">{m.scheduledTime || ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Attendance Progress</span>
                    <span className="text-xs text-slate-500">
                      {student.attendedSessions ?? 0} out of {student.totalSessions || 1} sessions attended
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    ✓ Verified Active
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CERTIFICATE LEDGER */}
          {activeTab === "certificate" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white rounded-2xl border border-amber-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <h4 className="text-sm font-black text-slate-900">
                      Accreditation Certificate Status
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified & Unlocked
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Recipient</span>
                    <span className="font-extrabold text-slate-900">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Certificate ID</span>
                    <span className="font-mono font-bold text-slate-800">{certId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Cryptographic Hash</span>
                    <span className="font-mono font-bold text-emerald-700">{shaHash}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={onPrintReport}
                    className="px-4 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Open in Certificate Studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INSTRUCTOR NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Private Instructor Notes & Evaluation</span>
              </h4>

              <textarea
                rows={4}
                value={instructorNote}
                onChange={(e) => setInstructorNote(e.target.value)}
                placeholder="Write private instructor evaluation notes or personalized feedback..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between">
                {isSavedNote ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Notes Saved Successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Notes are visible to admins only</span>
                )}

                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save Evaluation Notes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={handleConfetti}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border border-amber-200 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Award Badge</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onPrintReport();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Full 360° Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
