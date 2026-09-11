import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Batch, Student, UserRole } from "../types";
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Zap,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Download,
  Eye,
  Crown,
  Star,
  Activity,
  Code2,
  CheckCheck,
  ShieldCheck,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";

interface LeaderboardViewProps {
  selectedBatch: Batch;
  students: Student[];
  userRole: UserRole;
  currentStudent?: Student;
  onViewStudent?: (student: Student) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  selectedBatch,
  students,
  userRole,
  currentStudent,
  onViewStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<
    "overall" | "speed" | "coding" | "streak"
  >("overall");

  const [liveStudentsList, setLiveStudentsList] = useState<Student[]>(students);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [recentOvertakeTicker, setRecentOvertakeTicker] = useState<string>(
    "⚡ Real-time standings active • Rankings updated live on each assignment & Q&A completion"
  );

  // ---------------------------------------------------------------------------
  // 1. REAL-TIME FAST POLLING FROM BACKEND
  // ---------------------------------------------------------------------------
  const fetchLiveLeaderboardData = async () => {
    try {
      const res = await axios.get(
        `/api/students/?batch=${selectedBatch.id}`
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Map backend schema to Student type
        const backendStudents: Student[] = res.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          mobile: s.mobile || "",
          batchId: s.batch || selectedBatch.id,
          batchName: s.batchName || selectedBatch.name,
          college: s.college || selectedBatch.college,
          avatar: s.avatar,
          totalPoints: s.totalPoints || 0,
          activeStreakDays: s.activeStreakDays || 0,
          fastestResponseMs: s.fastestResponseMs ?? 0,
          attendedSessions: s.attendedSessions || 1,
          totalSessions: s.totalSessions || 4,
          enrolledAt: s.enrolledAt || new Date().toISOString(),
          status: s.status || "active",
          scores: {
            quizScore: s.scores?.quizScore ?? 0,
            codingScore: s.scores?.codingScore ?? 0,
            liveQAScore: s.scores?.liveQAScore ?? 0,
            assignmentScore: s.scores?.assignmentScore ?? 0,
            overallAccuracy: s.scores?.overallAccuracy ?? 0,
          },
        }));

        setLiveStudentsList(backendStudents);
        setLastSyncTime(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    } catch (err) {
      // Graceful fallback to props students
      setLiveStudentsList(students);
    }
  };

  // Initial load and fast polling every 3.5 seconds
  useEffect(() => {
    fetchLiveLeaderboardData();
    const interval = setInterval(() => {
      fetchLiveLeaderboardData();
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedBatch.id]);

  // Sync with prop updates
  useEffect(() => {
    if (students.length > 0) {
      setLiveStudentsList(students);
    }
  }, [students]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await fetchLiveLeaderboardData();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const handleCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#f59e0b", "#fbbf24", "#6366f1", "#10b981", "#ec4899"],
      });
    } catch {}
  };

  // ---------------------------------------------------------------------------
  // 2. FILTERING & SORTING LOGIC
  // ---------------------------------------------------------------------------
  const batchStudents = useMemo(() => {
    const raw =
      liveStudentsList.filter((s) => s.batchId === selectedBatch.id).length > 0
        ? liveStudentsList.filter((s) => s.batchId === selectedBatch.id)
        : students.filter((s) => s.batchId === selectedBatch.id);

    return [...raw].sort((a, b) => {
      if (activeLeaderboardTab === "speed") {
        const speedA = a.fastestResponseMs || 9999;
        const speedB = b.fastestResponseMs || 9999;
        return speedA - speedB;
      }
      if (activeLeaderboardTab === "coding") {
        if ((b.scores?.codingScore ?? 0) !== (a.scores?.codingScore ?? 0))
          return (b.scores?.codingScore ?? 0) - (a.scores?.codingScore ?? 0);
        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      }
      if (activeLeaderboardTab === "streak") {
        if (b.activeStreakDays !== a.activeStreakDays)
          return b.activeStreakDays - a.activeStreakDays;
        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      }
      // Overall default: points -> accuracy -> fastest response
      if ((b.totalPoints ?? 0) !== (a.totalPoints ?? 0)) return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      if ((b.scores?.overallAccuracy ?? 0) !== (a.scores?.overallAccuracy ?? 0))
        return (b.scores?.overallAccuracy ?? 0) - (a.scores?.overallAccuracy ?? 0);
      return (a.fastestResponseMs || 9999) - (b.fastestResponseMs || 9999);
    });
  }, [liveStudentsList, students, selectedBatch.id, activeLeaderboardTab]);

  const filteredStudents = useMemo(() => {
    return batchStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.college || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [batchStudents, searchQuery]);

  // Top 3 Podium Students
  const rank1 = batchStudents[0];
  const rank2 = batchStudents[1];
  const rank3 = batchStudents[2];

  const handleExportCsv = () => {
    const headers =
      "Rank,Student Name,College,Email,Total Points,Accuracy,Quiz Score,Coding Score,Speed (s),Streak\n";
    const rows = batchStudents
      .map(
        (s, idx) =>
          `"${idx + 1}","${s.name}","${s.college}","${s.email}",${s.totalPoints ?? 0},${s.scores?.overallAccuracy ?? 0}%,${s.scores?.quizScore ?? 0}%,${s.scores?.codingScore ?? 0}%,${((s.fastestResponseMs || 0) / 1000).toFixed(2)}s,${s.activeStreakDays ?? 0}d`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Leaderboard_${selectedBatch.name.replace(/\s+/g, "_")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Controls ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Batch Leaderboard & Hall of Fame</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time Stream
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time rankings based on quiz accuracy, code test passes, and rapid response speed for{" "}
            <strong className="text-slate-800">{selectedBatch.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Force Real-Time Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={handleCelebrationConfetti}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebrate Podium</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-400 w-40 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs Bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveLeaderboardTab("overall")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeLeaderboardTab === "overall"
                ? "bg-white text-indigo-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Overall XP & Accuracy</span>
          </button>

          <button
            onClick={() => setActiveLeaderboardTab("speed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeLeaderboardTab === "speed"
                ? "bg-white text-indigo-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-sky-500" />
            <span>Speed Reflex Kings</span>
          </button>

          <button
            onClick={() => setActiveLeaderboardTab("coding")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeLeaderboardTab === "coding"
                ? "bg-white text-indigo-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Coding Masters</span>
          </button>

          <button
            onClick={() => setActiveLeaderboardTab("streak")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeLeaderboardTab === "streak"
                ? "bg-white text-indigo-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Streak Heroes</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Last synced: {lastSyncTime}
        </span>
      </div>

      {/* ========================================================= */}
      {/* 1. ULTRA-MODERN 3D PODIUM DISPLAY WITH RICH ANIMATIONS     */}
      {/* ========================================================= */}
      {batchStudents.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end pt-4">
          {/* ── #2 Rank (Silver Pedestal - Left) ── */}
          {rank2 && (
            <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 rounded-3xl border-2 border-slate-300/80 p-6 text-center shadow-lg relative transform md:translate-y-4 hover:-translate-y-1 transition duration-300 order-2 md:order-1 overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400" />

              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-white">
                🥈 #2
              </div>

              <div className="relative inline-block mx-auto mb-2.5">
                <img
                  src={
                    rank2.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${rank2.name}`
                  }
                  alt={rank2.name}
                  className="w-18 h-18 rounded-2xl mx-auto border-2 border-slate-300 object-cover shadow-md group-hover:scale-105 transition"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-700 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                  SILVER
                </div>
              </div>

              <h4 className="font-extrabold text-slate-900 text-base capitalize truncate">
                {rank2.name}
              </h4>
              <p className="text-xs text-slate-400 mb-3 truncate">{rank2.college}</p>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-around text-xs shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Points
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {rank2.totalPoints} pts
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Accuracy
                  </span>
                  <span className="font-black text-indigo-600 text-sm">
                    {rank2.scores?.overallAccuracy ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── #1 Rank (Gold 3D Elevated Pedestal - Center) ── */}
          {rank1 && (
            <div className="bg-gradient-to-b from-amber-500/15 via-amber-50/60 to-white rounded-3xl border-2 border-amber-400 p-7 text-center shadow-[0_15px_40px_rgba(245,158,11,0.25)] relative transform -translate-y-2 hover:-translate-y-4 transition duration-300 order-1 md:order-2 overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />

              {/* Floating Crown Badge */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-white animate-bounce">
                👑
              </div>

              <div className="relative inline-block mx-auto mb-2">
                <img
                  src={
                    rank1.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${rank1.name}`
                  }
                  alt={rank1.name}
                  className="w-22 h-22 rounded-3xl mx-auto border-4 border-amber-300 object-cover shadow-xl group-hover:scale-105 transition ring-4 ring-amber-400/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-white shadow-xs">
                  🏆 #1 CHAMPION
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 inline-block mb-1 shadow-xs">
                  ★ Batch Champion ★
                </span>
                <h4 className="font-black text-slate-900 text-xl capitalize tracking-tight truncate">
                  {rank1.name}
                </h4>
                <p className="text-xs text-slate-400 mb-4 truncate">{rank1.college}</p>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-amber-100/90 to-yellow-50 rounded-2xl border border-amber-300/80 flex items-center justify-around text-xs shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">
                    Points
                  </span>
                  <span className="font-black text-amber-950 text-base font-mono">
                    {rank1.totalPoints}
                  </span>
                </div>
                <div className="w-px h-7 bg-amber-300" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">
                    Accuracy
                  </span>
                  <span className="font-black text-amber-950 text-base font-mono">
                    {rank1.scores?.overallAccuracy ?? 0}%
                  </span>
                </div>
                <div className="w-px h-7 bg-amber-300" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">
                    Streak
                  </span>
                  <span className="font-black text-amber-950 text-base flex items-center justify-center gap-0.5">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
                    {rank1.activeStreakDays}d
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── #3 Rank (Bronze Pedestal - Right) ── */}
          {rank3 && (
            <div className="bg-gradient-to-b from-amber-900/5 via-white to-amber-900/10 rounded-3xl border-2 border-amber-700/40 p-6 text-center shadow-lg relative transform md:translate-y-6 hover:-translate-y-1 transition duration-300 order-3 overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-800" />

              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-white">
                🥉 #3
              </div>

              <div className="relative inline-block mx-auto mb-2.5">
                <img
                  src={
                    rank3.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${rank3.name}`
                  }
                  alt={rank3.name}
                  className="w-18 h-18 rounded-2xl mx-auto border-2 border-amber-700/40 object-cover shadow-md group-hover:scale-105 transition"
                />
                <div className="absolute -bottom-1 -right-1 bg-amber-800 text-amber-100 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                  BRONZE
                </div>
              </div>

              <h4 className="font-extrabold text-slate-900 text-base capitalize truncate">
                {rank3.name}
              </h4>
              <p className="text-xs text-slate-400 mb-3 truncate">{rank3.college}</p>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-around text-xs shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Points
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {rank3.totalPoints} pts
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Accuracy
                  </span>
                  <span className="font-black text-indigo-600 text-sm">
                    {rank3.scores?.overallAccuracy ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FULL STANDINGS TABLE WITH RICH ROW MICRO-ANIMATIONS     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Full Batch Standings ({batchStudents.length} Students)</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Click on any student or the 👁 Report button to open their Executive Evaluation Report (Sample Reference)
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 pl-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-3">Student & College</th>
                <th className="py-3.5 px-3">Quiz / Coding</th>
                <th className="py-3.5 px-3">Reaction Velocity</th>
                <th className="py-3.5 px-3">Accuracy</th>
                <th className="py-3.5 px-3">Streak</th>
                <th className="py-3.5 px-3 text-right">Total Score</th>
                <th className="py-3.5 pr-4 text-center">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, index) => {
                  const isCurrent = currentStudent?.id === stu.id;
                  return (
                    <tr
                      key={stu.id}
                      onClick={() => onViewStudent && onViewStudent(stu)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer group ${
                        isCurrent ? "bg-indigo-50/80 font-semibold" : ""
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 pl-4 text-center font-black">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-900 shadow-xs text-xs font-black">
                            🥇 #1
                          </span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 shadow-xs text-xs font-black">
                            🥈 #2
                          </span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 shadow-xs text-xs font-black">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">#{index + 1}</span>
                        )}
                      </td>

                      {/* Student Name & Avatar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                stu.avatar ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${stu.name}`
                              }
                              alt={stu.name}
                              className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-xs group-hover:scale-105 transition"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block truncate capitalize">
                                {stu.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-indigo-700 bg-indigo-100 font-extrabold px-1.5 py-0.2 rounded-md">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {stu.college}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quiz / Coding Chips */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-100">
                            {stu.scores?.quizScore ?? 0}% Q
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold text-[11px] border border-purple-100">
                            {stu.scores?.codingScore ?? 0}% C
                          </span>
                        </div>
                      </td>

                      {/* Reaction Speed */}
                      <td className="py-3.5 px-3 font-mono text-xs font-bold">
                        {stu.fastestResponseMs && stu.fastestResponseMs > 0 ? (
                          <span className="text-amber-600 font-extrabold flex items-center gap-1">
                            ⚡ {((stu.fastestResponseMs) / 1000).toFixed(2)}s
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            ⚡ 2.50s
                          </span>
                        )}
                      </td>

                      {/* Accuracy Bar */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1 w-24">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-emerald-600">{stu.scores?.overallAccuracy ?? 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${stu.scores?.overallAccuracy ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{stu.activeStreakDays}d</span>
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-black text-indigo-700 text-sm font-mono">
                          {stu.totalPoints} pts
                        </span>
                      </td>

                      {/* Action / Executive Report */}
                      <td className="py-3.5 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onViewStudent && onViewStudent(stu)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow-xs border border-indigo-200/60"
                          title="Open Executive Evaluation Report (Sample Reference) in Full Screen"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
