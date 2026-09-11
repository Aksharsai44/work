import React, { useState, useEffect, useRef } from "react";
import {
  Student,
  Batch,
  Assignment,
  LiveQuestion,
  AppSettings,
  ScheduledMeeting,
} from "../types";
import {
  BookOpen,
  Code2,
  Radio,
  Video,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sparkles,
  Zap,
  Users,
  Check,
  Timer,
  Lock,
  SendHorizontal,
  MessageSquare,
  Calendar,
  ExternalLink,
  Film,
  Copy,
  Layers,
  Star,
} from "lucide-react";
import confetti from "canvas-confetti";
import { LiveSessionBanner } from "./LiveSessionBanner";
import { cleanInstructorReply } from "../utils/aiEvaluator";

interface StudentDashboardViewProps {
  currentStudent: Student;
  selectedBatch: Batch;
  assignments: Assignment[];
  liveQuestions: LiveQuestion[];
  settings: AppSettings;
  scheduledMeetings?: ScheduledMeeting[];
  onNavigateTab: (tabId: string) => void;
  onSubmitLiveAnswer?: (questionId: string, answer: string, isCorrect?: boolean, responseTimeMs?: number) => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onUpdateScheduledMeeting?: (meeting: ScheduledMeeting) => void;
  onToggleRecordingUnlock?: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  currentStudent,
  selectedBatch,
  assignments,
  liveQuestions,
  settings,
  scheduledMeetings = [],
  onNavigateTab,
  onSubmitLiveAnswer,
  onUpdateSettings,
  onUpdateScheduledMeeting,
  onToggleRecordingUnlock,
}) => {
  const safeBatch: Batch = selectedBatch && selectedBatch.id ? selectedBatch : {
    id: selectedBatch?.id || "",
    name: selectedBatch?.name || "Workshop Cohort",
    type: selectedBatch?.type || "workshop",
    durationLabel: selectedBatch?.durationLabel || "Active Cohort",
    college: selectedBatch?.college || "Institute",
    startDate: selectedBatch?.startDate || "2026-08-22",
    endDate: selectedBatch?.endDate || "2026-08-23",
    status: selectedBatch?.status || "active",
  };

  const safeStudent: Student = currentStudent && currentStudent.id ? currentStudent : {
    id: currentStudent?.id || "stu_default",
    name: currentStudent?.name || "Student",
    email: currentStudent?.email || "",
    mobile: currentStudent?.mobile || "",
    college: currentStudent?.college || safeBatch.college || "Institute",
    batchId: currentStudent?.batchId || safeBatch.id || "",
    batchName: currentStudent?.batchName || safeBatch.name || "",
    avatar: currentStudent?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentStudent?.name || "Student")}`,
    enrolledAt: currentStudent?.enrolledAt || new Date().toISOString(),
    status: "active",
    activeStreakDays: currentStudent?.activeStreakDays ?? 0,
    totalPoints: currentStudent?.totalPoints ?? 0,
    attendedSessions: currentStudent?.attendedSessions ?? 0,
    totalSessions: currentStudent?.totalSessions ?? 0,
    fastestResponseMs: currentStudent?.fastestResponseMs ?? 0,
    scores: {
      overallAccuracy: currentStudent?.scores?.overallAccuracy ?? 0,
      quizScore: currentStudent?.scores?.quizScore ?? 0,
      codingScore: currentStudent?.scores?.codingScore ?? 0,
      liveQAScore: currentStudent?.scores?.liveQAScore ?? 0,
      assignmentScore: currentStudent?.scores?.assignmentScore ?? 0,
    },
  };

  const batchAssignments = (assignments || []).filter((a) => a && a.batchId === safeBatch.id && !a.isLocked);
  const allBatchQuestions = (liveQuestions || []).filter((q) => q && q.batchId === safeBatch.id && !q.isLocked);
  const effectivePolls = allBatchQuestions;

  // Local student response maps per question
  const [studentVoteMap, setStudentVoteMap] = useState<Record<string, string>>({});
  const [writtenAnswerMap, setWrittenAnswerMap] = useState<Record<string, string>>({});
  const [studentStoppedTimeMap, setStudentStoppedTimeMap] = useState<Record<string, number>>({});
  const questionRenderTimeRef = useRef<Record<string, number>>({});

  // Real-time ticking clock (500ms sync) for synchronized countdown timers
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const getQuestionTimeStatus = (q: LiveQuestion) => {
    if (q.isClosed || q.isLocked) {
      return { isExpired: true, secondsLeft: 0, hasLimit: !!(q.timeLimitSeconds && q.timeLimitSeconds > 0) };
    }
    if (!q.timeLimitSeconds || q.timeLimitSeconds <= 0) {
      return { isExpired: false, secondsLeft: null, hasLimit: false };
    }
    const launchStr = q.launchedAt || q.createdAt;
    if (!launchStr) {
      return { isExpired: false, secondsLeft: q.timeLimitSeconds, hasLimit: true };
    }
    const launchMs = new Date(launchStr).getTime();
    if (isNaN(launchMs)) {
      return { isExpired: false, secondsLeft: q.timeLimitSeconds, hasLimit: true };
    }
    const expiryMs = launchMs + q.timeLimitSeconds * 1000;
    const diffSecs = Math.ceil((expiryMs - currentTimeMs) / 1000);
    if (diffSecs <= 0) {
      return { isExpired: true, secondsLeft: 0, hasLimit: true };
    }
    return { isExpired: false, secondsLeft: diffSecs, hasLimit: true };
  };

  useEffect(() => {
    const now = Date.now();
    allBatchQuestions.forEach((q) => {
      if (!questionRenderTimeRef.current[q.id]) {
        questionRenderTimeRef.current[q.id] = now;
      }
    });
  }, [allBatchQuestions]);

  const handleCastVote = (poll: LiveQuestion, option: string) => {
    const existing = poll.responses?.find((r) => r.studentId === safeStudent.id);
    if (studentVoteMap[poll.id] || existing) return;

    const timeStatus = getQuestionTimeStatus(poll);
    if (timeStatus.isExpired) return;

    const isCorrect = (poll.type === "mcq" || poll.type === "true_false") && poll.correctAnswer
      ? option.trim().toLowerCase() === poll.correctAnswer.trim().toLowerCase()
      : undefined;
    const startTime = questionRenderTimeRef.current[poll.id] || (Date.now() - 1500);
    const elapsedMs = Math.max(800, Math.min(45000, Date.now() - startTime));
    const stoppedSecs = timeStatus.secondsLeft !== null && timeStatus.secondsLeft > 0
      ? timeStatus.secondsLeft
      : poll.timeLimitSeconds
      ? Math.max(0, poll.timeLimitSeconds - Math.round(elapsedMs / 1000))
      : 0;

    setStudentStoppedTimeMap((prev) => ({ ...prev, [poll.id]: stoppedSecs }));
    setStudentVoteMap((prev) => ({ ...prev, [poll.id]: option }));

    if (onSubmitLiveAnswer) {
      onSubmitLiveAnswer(poll.id, option, isCorrect, elapsedMs);
    }

    if (isCorrect || poll.type === "poll") {
      try {
        confetti({ particleCount: 50, spread: 65, origin: { y: 0.65 } });
      } catch {
        // ignore
      }
    }
  };

  const handleCastWrittenAnswer = (poll: LiveQuestion) => {
    const existing = poll.responses?.find((r) => r.studentId === safeStudent.id);
    const typedText = (writtenAnswerMap[poll.id] || "").trim();
    if (!typedText || studentVoteMap[poll.id] || existing) return;

    const timeStatus = getQuestionTimeStatus(poll);
    if (timeStatus.isExpired) return;

    const startTime = questionRenderTimeRef.current[poll.id] || (Date.now() - 2500);
    const elapsedMs = Math.max(1200, Math.min(60000, Date.now() - startTime));
    const stoppedSecs = timeStatus.secondsLeft !== null && timeStatus.secondsLeft > 0
      ? timeStatus.secondsLeft
      : poll.timeLimitSeconds
      ? Math.max(0, poll.timeLimitSeconds - Math.round(elapsedMs / 1000))
      : 0;

    setStudentStoppedTimeMap((prev) => ({ ...prev, [poll.id]: stoppedSecs }));
    setStudentVoteMap((prev) => ({ ...prev, [poll.id]: typedText }));

    if (onSubmitLiveAnswer) {
      onSubmitLiveAnswer(poll.id, typedText, undefined, elapsedMs);
    }

    try {
      confetti({ particleCount: 60, spread: 75, origin: { y: 0.65 } });
    } catch {
      // ignore
    }
  };

  const calculateOptionStats = (poll: LiveQuestion, opt: string) => {
    const responses = poll.responses || [];
    const userVote = studentVoteMap[poll.id] || responses.find((r) => r.studentId === safeStudent.id)?.answer;
    const isLocalNewVote = userVote === opt && !responses.some((r) => r.studentId === safeStudent.id);

    let count = responses.filter((r) => r.answer === opt).length;
    if (isLocalNewVote) {
      count += 1;
    }
    const total = responses.length + (userVote && !responses.some((r) => r.studentId === safeStudent.id) ? 1 : 0);
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { count, percent, total };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-sky-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold uppercase tracking-wider">
                {safeBatch.type} • {safeBatch.durationLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {safeStudent.activeStreakDays} Day Streak!
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Welcome back, {safeStudent.name ? safeStudent.name.split(" ")[0] : "Student"}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              You are currently enrolled in <strong>{safeBatch.name}</strong> at{" "}
              {safeStudent.college || safeBatch.college}. Your overall accuracy is at{" "}
              <strong>{safeStudent.scores?.overallAccuracy ?? 0}%</strong>.
            </p>
          </div>

          {/* Quick Stats Pill Cards */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-sky-200 block">Total Points</span>
              <span className="text-xl font-black text-white">{safeStudent.totalPoints ?? 0}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-sky-200 block">Accuracy</span>
              <span className="text-xl font-black text-emerald-400">
                {safeStudent.scores?.overallAccuracy ?? 0}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-sky-200 block">Attendance</span>
              <span className="text-xl font-black text-amber-300">
                {safeStudent.attendedSessions}/{safeStudent.totalSessions || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTANT POLLS & LIVE CLASS PARTICIPATION WIDGET (ALL QUESTIONS ONE BY ONE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-7 space-y-6">
        {/* Header with Live Badge and Total Questions Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  Live Instant Q&A
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {effectivePolls.length} Question{effectivePolls.length === 1 ? "" : "s"} & Poll{effectivePolls.length === 1 ? "" : "s"}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Instant Classroom Voting & Live Responses
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("live_qa")}
            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Open All Q&A & Doubts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* All Questions Stacked Vertically One by One */}
        {effectivePolls.length > 0 ? (
          <div className="space-y-6">
            {effectivePolls.map((poll, qIdx) => {
              const existingResponse = poll.responses?.find((r) => r.studentId === safeStudent.id);
              const studentChoice = studentVoteMap[poll.id] || existingResponse?.answer || null;
              const hasAnswered = !!studentChoice;
              const timeStatus = getQuestionTimeStatus(poll);
              const isExpired = timeStatus.isExpired;
              const secondsLeft = timeStatus.secondsLeft;

              return (
                <div
                  key={poll.id}
                  className="space-y-4 bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80 transition-all hover:border-slate-300 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        Q{qIdx + 1}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {poll.type === "poll"
                          ? "📊 Live Poll"
                          : poll.type === "true_false"
                          ? "⚖️ True / False"
                          : poll.type === "open"
                          ? "💬 Open Written Question"
                          : "⚡ MCQ Challenge"}
                      </span>
                      {poll.points && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          +{poll.points} Points
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Real-Time Countdown Timer Badge (Active ticker when student has NOT yet answered) */}
                      {!hasAnswered && timeStatus.hasLimit && (
                        secondsLeft !== null && secondsLeft > 0 && !isExpired ? (
                          <span
                            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs border transition-all ${
                              secondsLeft <= 10
                                ? "bg-rose-100 text-rose-700 border-rose-300 animate-bounce"
                                : secondsLeft <= 25
                                ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }`}
                            title={`Time limit: ${poll.timeLimitSeconds}s`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {secondsLeft >= 60
                                ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60 < 10 ? "0" : ""}${secondsLeft % 60}s`
                                : `${secondsLeft}s left`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                            <Lock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Time's Up • Locked</span>
                          </span>
                        )
                      )}

                      {/* When Student HAS answered: Display Stopped Timer Badge and Submitted Badge */}
                      {hasAnswered && (() => {
                        const rawStoppedSecs =
                          studentStoppedTimeMap[poll.id] ??
                          existingResponse?.stoppedSecondsLeft ??
                          (poll.timeLimitSeconds && existingResponse?.responseTimeMs
                            ? Math.max(0, poll.timeLimitSeconds - Math.round(existingResponse.responseTimeMs / 1000))
                            : null);

                        const formatSecs = (s: number) =>
                          s >= 60
                            ? `${Math.floor(s / 60)}m ${s % 60 < 10 ? "0" : ""}${s % 60}s`
                            : `${s}s`;

                        return (
                          <>
                            {poll.timeLimitSeconds && poll.timeLimitSeconds > 0 && rawStoppedSecs !== null ? (
                              <span
                                className="text-xs font-mono font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
                                title={
                                  existingResponse?.responseTimeFormatted
                                    ? `Response speed: ${existingResponse.responseTimeFormatted} • Timer stopped at ${formatSecs(rawStoppedSecs)} remaining`
                                    : "Countdown stopped upon your answer submission"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Stopped at {formatSecs(rawStoppedSecs)}</span>
                              </span>
                            ) : existingResponse?.responseTimeMs ? (
                              <span
                                className="text-xs font-mono font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
                                title="Time taken to submit answer"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Stopped in {(existingResponse.responseTimeMs / 1000).toFixed(1)}s</span>
                              </span>
                            ) : null}

                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Submitted</span>
                            </span>
                          </>
                        );
                      })()}

                      {/* Not answered and expired */}
                      {!hasAnswered && isExpired && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Closed</span>
                        </span>
                      )}

                      {/* Not answered and still active */}
                      {!hasAnswered && !isExpired && (
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          <span>Ready to Answer</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Animated Countdown Progress Bar for Active Time Limits */}
                  {timeStatus.hasLimit && poll.timeLimitSeconds && !hasAnswered && !isExpired && (
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (secondsLeft ?? 0) <= 10
                            ? "bg-gradient-to-r from-rose-500 to-red-600"
                            : (secondsLeft ?? 0) <= 25
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-sky-500 to-indigo-600"
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, (((secondsLeft ?? 0) / poll.timeLimitSeconds) * 100)))}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Question Title */}
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {poll.question}
                  </h4>

                  {/* If OPEN QUESTION: Render text input and submit */}
                  {poll.type === "open" ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        rows={3}
                        disabled={hasAnswered || isExpired}
                        value={studentChoice || writtenAnswerMap[poll.id] || ""}
                        onChange={(e) =>
                          setWrittenAnswerMap((prev) => ({
                            ...prev,
                            [poll.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          isExpired
                            ? "Time has expired for this question. Submissions are locked."
                            : "Type your explanation or response here..."
                        }
                        className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          +{(poll.points || 100)} points awarded upon submission
                        </span>

                        {!hasAnswered ? (
                          isExpired ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                              <Lock className="w-4 h-4" />
                              <span>Time expired • Responses locked</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={!(writtenAnswerMap[poll.id] || "").trim()}
                              onClick={() => handleCastWrittenAnswer(poll)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              <SendHorizontal className="w-3.5 h-3.5" />
                              <span>Submit Written Answer</span>
                            </button>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Answer Recorded & Submitted!</span>
                          </div>
                        )}
                      </div>

                      {/* Evaluation & Feedback Display */}
                      {existingResponse && (existingResponse.rating !== undefined || cleanInstructorReply(existingResponse.instructorReply)) && (
                        <div className="mt-3 p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-indigo-50 pb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Assessment & Review Result</span>
                            </span>
                            {existingResponse.rating !== undefined && (() => {
                              const rawRating = Number(existingResponse.rating) || 0;
                              const stars = rawRating > 5 ? Math.max(1, Math.min(5, Math.round(rawRating / 20))) : Math.max(1, Math.min(5, Math.round(rawRating)));
                              const starLabels: Record<number, string> = {
                                5: "Strongest Formulation",
                                4: "Solid Reasoning & Depth",
                                3: "Competent Response",
                                2: "Developing Understanding",
                                1: "Needs Conceptual Detail",
                              };
                              return (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center text-amber-500">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                                    {stars} / 5 Stars • {starLabels[stars] || "Reviewed"}
                                  </span>
                                  {existingResponse.reviewer === "instructor" && (
                                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                      👨‍🏫 Instructor Reviewed
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {cleanInstructorReply(existingResponse.instructorReply) && (
                            <div className="text-xs text-indigo-900 space-y-1">
                              <span className="font-bold text-indigo-800 block text-[11px] uppercase tracking-wide">
                                👨‍🏫 Instructor Feedback & Remarks:
                              </span>
                              <p className="p-2.5 bg-indigo-50/70 rounded-lg text-indigo-950 font-medium leading-relaxed border border-indigo-100">
                                {cleanInstructorReply(existingResponse.instructorReply)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* If MCQ / POLL / TRUE_FALSE: Render Options */
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(poll.options || []).map((opt, oIdx) => {
                          const isSelected = studentChoice === opt;
                          const stats = calculateOptionStats(poll, opt);
                          const isCorrectOpt =
                            (poll.type === "mcq" || poll.type === "true_false") &&
                            poll.correctAnswer &&
                            poll.correctAnswer.trim().toLowerCase() === opt.trim().toLowerCase();
                          const isWrongOpt =
                            isSelected &&
                            (poll.type === "mcq" || poll.type === "true_false") &&
                            !isCorrectOpt;

                          let buttonStyle = "bg-white hover:bg-sky-50/70 text-slate-700 border-slate-200";

                          if (hasAnswered) {
                            if (isSelected && (isCorrectOpt || poll.type === "poll")) {
                              buttonStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs";
                            } else if (isWrongOpt) {
                              buttonStyle = "bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs";
                            } else if (isCorrectOpt) {
                              buttonStyle = "bg-emerald-50/70 border-emerald-300 text-emerald-900";
                            } else {
                              buttonStyle = "bg-white text-slate-500 border-slate-200 opacity-75";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={hasAnswered || isExpired}
                              onClick={() => handleCastVote(poll, opt)}
                              className={`relative overflow-hidden text-left p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[76px] ${
                                isExpired && !hasAnswered
                                  ? "cursor-not-allowed opacity-60 bg-slate-100/70 border-slate-200 text-slate-400"
                                  : "cursor-pointer"
                              } ${buttonStyle}`}
                            >
                              {/* Background Progress Bar when Voted */}
                              {hasAnswered && (
                                <div
                                  className={`absolute inset-0 transition-all duration-700 opacity-20 ${
                                    isCorrectOpt || poll.type === "poll"
                                      ? "bg-emerald-500"
                                      : isWrongOpt
                                      ? "bg-rose-500"
                                      : "bg-sky-400"
                                  }`}
                                  style={{ width: `${stats.percent}%` }}
                                />
                              )}

                              <div className="relative z-10 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="text-xs sm:text-sm font-semibold">{opt}</span>
                                </div>

                                {hasAnswered && (
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isSelected && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-600 text-white">
                                        Your Choice
                                      </span>
                                    )}
                                    <span className="font-mono text-xs font-black text-slate-700">
                                      {stats.percent}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {hasAnswered && (
                                <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 font-mono">
                                  <span>{stats.count} student(s)</span>
                                  {(poll.type === "mcq" || poll.type === "true_false") && isCorrectOpt && (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Correct Answer
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Locked alert if student did not answer before timer ran out */}
                      {isExpired && !hasAnswered && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
                          <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>
                            <strong>Time's up!</strong> The timer for this question has expired ({poll.timeLimitSeconds}s). Voting is now locked.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post-Vote Confirmation Banner */}
                  {hasAnswered && (
                    <div className="p-3.5 bg-sky-50/80 rounded-xl border border-sky-200 flex items-center gap-2 text-xs text-sky-950 animate-in fade-in">
                      <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>
                        <strong>Submission recorded for Question #{qIdx + 1}!</strong> You earned +{poll.points || 100} participation points.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Radio className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm mb-1">No Active Live Questions</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When your instructor broadcasts an instant poll, quiz, or live question for this batch, it will appear here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Live Zoom Webinar / Masterclass Session Banner */}
      {settings.enableZoomSync !== false && (
        <LiveSessionBanner
          settings={settings}
          userRole="student"
          batch={safeBatch}
          scheduledMeetings={scheduledMeetings}
          onUpdateSettings={onUpdateSettings || (() => {})}
          onUpdateScheduledMeeting={onUpdateScheduledMeeting}
          onToggleRecordingUnlock={onToggleRecordingUnlock || (() => {})}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 📅 Released Batch Class Schedule & Multi-Meeting Sessions */}
      {settings.enableZoomSync !== false && (
        (() => {
          const batchMatches = (m: ScheduledMeeting) => {
            if (!m) return false;
            const targetBatchId = selectedBatch?.id || currentStudent?.batchId;
            const targetBatchName = selectedBatch?.name || currentStudent?.batchName;
            if (!targetBatchId) return true;
            return (
              m.batchId === targetBatchId ||
              (m as any).batch === targetBatchId ||
              m.batchId === selectedBatch?.id ||
              (m as any).batch === selectedBatch?.id ||
              m.batchId === currentStudent?.batchId ||
              (m as any).batch === currentStudent?.batchId ||
              (targetBatchName && m.batchName && targetBatchName.trim().toLowerCase() === m.batchName.trim().toLowerCase()) ||
              m.batchId === "all"
            );
          };

          const releasedMeetings = scheduledMeetings.filter(
            (m) => batchMatches(m) && m.isPublished !== false
          );

          return (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      <span>Batch Schedule & Live Sessions</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {releasedMeetings.length} Sessions
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Access your upcoming live Zoom classes, meeting credentials, and past recorded lectures.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Live Now
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Upcoming
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Recorded
                  </span>
                </div>
              </div>

              {/* Session Cards */}
              {releasedMeetings.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No released sessions for this batch yet. Stay tuned as your instructor schedules new modules.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {releasedMeetings.map((meet, index) => {
                    const isLive = meet.status === "live";
                    const isEnded = meet.status === "ended";

                    return (
                      <div
                        key={meet.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                          isLive
                            ? "bg-rose-50/50 border-rose-200 shadow-md ring-2 ring-rose-500/20"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-100/70 text-indigo-700">
                            Session #{meet.orderIndex || index + 1}
                          </span>

                          {isLive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              <span>LIVE NOW</span>
                            </span>
                          ) : isEnded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                              🎬 Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ⏳ Scheduled
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                            {meet.title}
                          </h4>
                          {meet.agenda && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {meet.agenda}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">{meet.scheduledDate}</span>
                            <span className="text-slate-300">•</span>
                            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{meet.scheduledTime}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Host: <strong className="text-slate-700">{meet.instructorName || "MINDA2 Team"}</strong></span>
                            {meet.passcode && (
                              <span className="font-mono text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded">
                                Pass: {meet.passcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {isLive && meet.meetingLink ? (
                          <a
                            href={meet.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            <span>🚀 Join Live Class</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : isEnded && meet.recordingUrl ? (
                          <a
                            href={meet.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Watch Recording</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2">
                            {meet.meetingLink && (
                              <a
                                href={meet.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>Join Waiting Room</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const text = `Workshop Session: ${meet.title}\nDate/Time: ${meet.scheduledDate} at ${meet.scheduledTime}\nJoin Link: ${meet.meetingLink}\nMeeting ID: ${meet.meetingId}\nPasscode: ${meet.passcode}`;
                                navigator.clipboard.writeText(text);
                                alert("Copied meeting details to clipboard!");
                              }}
                              className="p-2 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl transition cursor-pointer"
                              title="Copy Invite"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
          );
        })()
      )}

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Learn Hub Interactive Module */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Learn Hub</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore highlighted core concepts, hover definitions, interactive micro-quizzes, and AI summary flashcards.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("learn_hub")}
            className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition flex items-center justify-between px-4 cursor-pointer"
          >
            <span>Open Learn Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Coding & Quizzes Assignment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Assignments & IDE</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Solve {batchAssignments.length} assigned challenge(s) with our navigator, white-theme IDE, and test cases.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("assignments")}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center justify-between px-4 cursor-pointer"
          >
            <span>Start Assessments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Live Q&A & Speed Telemetry */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Live Interactive Q&A</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Participate in rapid-fire classroom polls, submit written answers in real-time, and view AI feedback.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("live_qa")}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-between px-4 cursor-pointer"
          >
            <span>Enter Live Stream</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4. Executive Evaluation Report */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/80 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Official</span>
            </div>
            <h3 className="font-black text-white text-base">Executive Evaluation Report</h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Official 10-domain performance dossier with circular scorecard, domain matrix, and 1-click PDF download.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("reports")}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black transition flex items-center justify-between px-4 shadow-sm cursor-pointer"
          >
            <span>View Full Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
