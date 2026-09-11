import React, { useState } from "react";
import { AppSettings, UserRole, SessionSummary, SessionChapter } from "../types";
import {
  Video,
  Play,
  Square,
  Calendar,
  Clock,
  Lock,
  Unlock,
  FileText,
  Sparkles,
  Share2,
  ExternalLink,
  Check,
  X,
  ChevronRight,
  Download,
  BookOpen,
  Users,
  Edit3,
  CheckCircle2,
  ListChecks,
  Tag,
  RotateCcw,
  Film,
  Award,
  Layers,
  Copy,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface LiveSessionBannerProps {
  settings: AppSettings;
  userRole: UserRole;
  batch?: import("../types").Batch;
  scheduledMeetings?: import("../types").ScheduledMeeting[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateScheduledMeeting?: (meeting: import("../types").ScheduledMeeting) => void;
  onToggleRecordingUnlock: () => void;
  onEndCall?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const LiveSessionBanner: React.FC<LiveSessionBannerProps> = ({
  settings,
  userRole,
  batch,
  scheduledMeetings = [],
  onUpdateSettings,
  onUpdateScheduledMeeting,
  onToggleRecordingUnlock,
  onNavigateTab,
}) => {
  // Find active live or next scheduled meeting from multi-meeting list for this batch
  const batchMeetings = (scheduledMeetings || []).filter((m) => {
    if (!m) return false;
    if (!batch?.id) return true;
    return (
      m.batchId === batch.id ||
      (m as any).batch === batch.id ||
      m.batchId === "all"
    );
  });
  const activeLiveMeeting = batchMeetings.find((m) => m.status === "live");
  const nextScheduledMeeting = batchMeetings.find((m) => m.status === "scheduled");
  const primaryMeeting = activeLiveMeeting || nextScheduledMeeting || batchMeetings[0];

  const zoomConfig = primaryMeeting
    ? {
        topic: primaryMeeting.title,
        agenda: primaryMeeting.agenda || "",
        instructorName: primaryMeeting.instructorName || "",
        meetingId: primaryMeeting.meetingId || "",
        meetingLink: primaryMeeting.meetingLink || "",
        passcode: primaryMeeting.passcode || "",
        scheduledDate: primaryMeeting.scheduledDate || "",
        scheduledTime: primaryMeeting.scheduledTime || "",
        status: primaryMeeting.status,
        recordingUrl: primaryMeeting.recordingUrl || "",
        isRecordingUnlocked: primaryMeeting.isRecordingUnlocked ?? true,
        summary: primaryMeeting.summary || settings.zoomConfig?.summary,
      }
    : (batch && batch.zoomConfig && batch.zoomConfig.meetingLink) 
    ? batch.zoomConfig 
    : settings.zoomConfig;
  const status = zoomConfig?.status || "live";

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"video" | "summary" | "chapters" | "action_items">("video");
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit / Schedule Form State
  const [editTopic, setEditTopic] = useState(zoomConfig?.topic || "");
  const [editAgenda, setEditAgenda] = useState(zoomConfig?.agenda || "");
  const [editInstructor, setEditInstructor] = useState(zoomConfig?.instructorName || "");
  const [editMeetingId, setEditMeetingId] = useState(zoomConfig?.meetingId || "");
  const [editMeetingLink, setEditMeetingLink] = useState(zoomConfig?.meetingLink || "");
  const [editPasscode, setEditPasscode] = useState(zoomConfig?.passcode || "");
  const [editScheduledDate, setEditScheduledDate] = useState(zoomConfig?.scheduledDate || "Today");
  const [editScheduledTime, setEditScheduledTime] = useState(zoomConfig?.scheduledTime || "");
  const [editStatus, setEditStatus] = useState<"scheduled" | "live" | "ended">(status);
  const [editRecordingUrl, setEditRecordingUrl] = useState(zoomConfig?.recordingUrl || "");

  // Sync state whenever zoomConfig prop updates from backend
  React.useEffect(() => {
    if (zoomConfig) {
      setEditTopic(zoomConfig.topic || "");
      setEditAgenda(zoomConfig.agenda || "");
      setEditInstructor(zoomConfig.instructorName || "");
      setEditMeetingId(zoomConfig.meetingId || "");
      setEditMeetingLink(zoomConfig.meetingLink || "");
      setEditPasscode(zoomConfig.passcode || "");
      setEditScheduledDate(zoomConfig.scheduledDate || "Today");
      setEditScheduledTime(zoomConfig.scheduledTime || "");
      setEditStatus(zoomConfig.status || "live");
      setEditRecordingUrl(zoomConfig.recordingUrl || "");
    }
  }, [zoomConfig]);

  // End Call Form State (recording + summary)
  const [endRecordingUrl, setEndRecordingUrl] = useState(
    zoomConfig.recordingUrl || ""
  );
  const [endDuration, setEndDuration] = useState(zoomConfig.summary?.duration || "2h 45m");
  const [endOverview, setEndOverview] = useState(
    zoomConfig.summary?.overview ||
      "Comprehensive deep-dive into LLM reasoning capabilities, function calling architectures, prompt optimization, vector memory retrieval, and error recovery workflows."
  );
  const [endHighlights, setEndHighlights] = useState<string[]>(
    zoomConfig.summary?.keyHighlights || [
      "Demystified autonomous agent loops: Observe -> Orient -> Decide -> Act.",
      "Live coding demo connecting Gemini 3.7 Flash tool calling schemas to external APIs.",
      "Conducted interactive classroom polling on multi-agent safety and token budget strategies.",
    ]
  );
  const [endNewHighlight, setEndNewHighlight] = useState("");
  const [endActionItems, setEndActionItems] = useState<string[]>(
    zoomConfig.summary?.actionItems || [
      "Complete Assignment #1 (Agent Function Calling & IDE test cases).",
      "Review the Interactive Learn Hub slide deck on Multi-Agent architectural patterns.",
    ]
  );
  const [endNewActionItem, setEndNewActionItem] = useState("");

  // Copy link handler
  const handleCopyMeetingInfo = () => {
    const text = `Join Workshop: ${zoomConfig.topic}\nLink: ${zoomConfig.meetingLink}\nMeeting ID: ${zoomConfig.meetingId}\nPasscode: ${zoomConfig.passcode}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Start Call Handler (Admin goes live)
  const handleStartCall = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      zoomConfig: {
        ...settings.zoomConfig,
        status: "live",
      },
    };
    onUpdateSettings(updatedSettings);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Save Schedule Call
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryMeeting && onUpdateScheduledMeeting) {
      onUpdateScheduledMeeting({
        ...primaryMeeting,
        title: editTopic,
        agenda: editAgenda,
        instructorName: editInstructor,
        meetingId: editMeetingId,
        meetingLink: editMeetingLink,
        passcode: editPasscode,
        scheduledDate: editScheduledDate,
        scheduledTime: editScheduledTime,
        status: editStatus,
        recordingUrl: editRecordingUrl,
      });
    }

    const updatedSettings: AppSettings = {
      ...settings,
      zoomConfig: {
        ...settings.zoomConfig,
        topic: editTopic,
        agenda: editAgenda,
        instructorName: editInstructor,
        meetingId: editMeetingId,
        meetingLink: editMeetingLink,
        passcode: editPasscode,
        scheduledDate: editScheduledDate,
        scheduledTime: editScheduledTime,
        status: editStatus,
        recordingUrl: editRecordingUrl,
      },
    };
    onUpdateSettings(updatedSettings);
    setShowScheduleModal(false);
  };

  // End Call & Publish Recording
  const handleConfirmEndCall = () => {
    const finalRecordingUrl = endRecordingUrl.trim() || zoomConfig.recordingUrl || "";

    if (primaryMeeting && onUpdateScheduledMeeting) {
      onUpdateScheduledMeeting({
        ...primaryMeeting,
        status: "ended",
        recordingUrl: finalRecordingUrl,
        isRecordingUnlocked: true,
      });
    }

    const updatedSettings: AppSettings = {
      ...settings,
      zoomConfig: {
        ...settings.zoomConfig,
        status: "ended",
        recordingUrl: finalRecordingUrl,
        isRecordingUnlocked: true,
        topic: zoomConfig.topic,
        agenda: zoomConfig.agenda,
        instructorName: zoomConfig.instructorName,
        meetingId: zoomConfig.meetingId,
        meetingLink: zoomConfig.meetingLink,
        passcode: zoomConfig.passcode,
        scheduledDate: zoomConfig.scheduledDate,
        scheduledTime: zoomConfig.scheduledTime,
      },
    };

    onUpdateSettings(updatedSettings);
    setShowEndCallModal(false);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Re-open / Schedule Next Call
  const handleScheduleNextCall = () => {
    setEditTopic("Live AI Masterclass: Capstone Project Reviews & Swarm Architectures");
    setEditAgenda("Reviewing student project submissions, advanced debugging, and capstone evaluations.");
    setEditScheduledDate("Tomorrow");
    setEditScheduledTime("Tomorrow at 10:00 AM - 01:00 PM");
    setEditStatus("scheduled");
    setShowScheduleModal(true);
  };

  const summaryData = zoomConfig.summary;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MAIN LIVE / SCHEDULED / ENDED SESSION HERO CARD                       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-sky-900/40 relative overflow-hidden">
        {/* Background Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Header Bar: Status Pill on Left, Credentials on Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
            {/* Left Status Badge */}
            <div className="flex items-center gap-2">
              {status === "live" ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  Live Workshop Session
                </span>
              ) : status === "scheduled" ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Upcoming Scheduled Call
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Session Concluded • Recording Ready
                </span>
              )}
            </div>

            {/* Right Badges & Quick Copy */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-xl border border-slate-700/80 font-mono flex items-center gap-1.5">
                <span className="text-slate-500">ID:</span>
                <strong className="text-sky-300 font-semibold">{zoomConfig.meetingId}</strong>
              </span>

              {zoomConfig.passcode && (
                <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-xl border border-slate-700/80 font-mono flex items-center gap-1.5">
                  <span className="text-slate-500">Passcode:</span>
                  <strong className="text-sky-300 font-semibold">{zoomConfig.passcode}</strong>
                </span>
              )}

              <button
                type="button"
                onClick={handleCopyMeetingInfo}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer font-medium text-xs"
                title="Copy Meeting Invite Link & Details"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>Copy Invite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Grid: Content on Left (8 Cols), Actions on Right (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-2.5">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                {zoomConfig.topic}
              </h3>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {zoomConfig.agenda ||
                  "Live hands-on workshop covering system prompt design, autonomous agent loops, tool calling, vector memory, and student coding exercises."}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>{zoomConfig.scheduledTime}</span>
                </div>

                {zoomConfig.instructorName && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Instructor: <strong className="text-white font-medium">{zoomConfig.instructorName}</strong></span>
                  </div>
                )}

                {status === "ended" && summaryData?.duration && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 font-semibold">
                    <Film className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Duration: {summaryData.duration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Panel */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 justify-center">
              {/* Primary Call-to-Action */}
              {status === "live" ? (
                <a
                  href={zoomConfig.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-500/25 transition cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Stream</span>
                </a>
              ) : status === "scheduled" ? (
                userRole === "admin" ? (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Call / Go Live</span>
                  </button>
                ) : (
                  <a
                    href={zoomConfig.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-500/25 transition"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Waiting Room</span>
                  </a>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalTab("video");
                    setShowRecordingModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-500/25 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Recording</span>
                </button>
              )}

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {zoomConfig.meetingLink && (
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Live Masterclass: ${zoomConfig.topic}\nHost: ${zoomConfig.instructorName}\nDate/Time: ${zoomConfig.scheduledDate} at ${zoomConfig.scheduledTime}\nJoin Link: ${zoomConfig.meetingLink}\nMeeting ID: ${zoomConfig.meetingId || "N/A"}\nPasscode: ${zoomConfig.passcode || "N/A"}`;
                      navigator.clipboard.writeText(text);
                      alert("Copied meeting invitation to clipboard!");
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                    title="Copy Meeting Invite"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="truncate">Copy Invite</span>
                  </button>
                )}

                {userRole === "admin" && status === "live" && (
                  <button
                    type="button"
                    onClick={() => setShowEndCallModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer"
                    title="End live call and publish recording"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400 flex-shrink-0" />
                    <span className="truncate">End Call</span>
                  </button>
                )}

                {userRole === "admin" && status !== "live" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTopic(zoomConfig.topic);
                      setEditAgenda(zoomConfig.agenda || "");
                      setEditMeetingId(zoomConfig.meetingId);
                      setEditMeetingLink(zoomConfig.meetingLink);
                      setEditPasscode(zoomConfig.passcode);
                      setEditScheduledTime(zoomConfig.scheduledTime);
                      setEditStatus(status);
                      setShowScheduleModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="truncate">{status === "ended" ? "Schedule Next" : "Edit Call"}</span>
                  </button>
                )}

                {userRole === "admin" && (
                  <button
                    type="button"
                    onClick={onToggleRecordingUnlock}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      zoomConfig.isRecordingUnlocked
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                    title={zoomConfig.isRecordingUnlocked ? "Students can access recording" : "Recording locked from students"}
                  >
                    {zoomConfig.isRecordingUnlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">Unlocked</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Locked</span>
                      </>
                    )}
                  </button>
                )}

                {userRole === "admin" && status === "live" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTopic(zoomConfig.topic);
                      setEditAgenda(zoomConfig.agenda || "");
                      setEditMeetingId(zoomConfig.meetingId);
                      setEditMeetingLink(zoomConfig.meetingLink);
                      setEditPasscode(zoomConfig.passcode);
                      setEditScheduledTime(zoomConfig.scheduledTime);
                      setEditStatus(status);
                      setShowScheduleModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="truncate">Edit Call</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODAL: RECORDING PLAYER & AI SUMMARY NOTES VIEWER                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRecordingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                      {zoomConfig.topic}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {summaryData?.duration || "2h 45m"} • Recorded Session & AI Summary
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecordingModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
                {[
                  { id: "video", label: "🎥 Video Recording", icon: Play },
                  { id: "chapters", label: "⏱️ Chapters Timeline", icon: Clock },
                  { id: "action_items", label: "📋 Action Items", icon: ListChecks },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveModalTab(t.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeModalTab === t.id
                        ? "bg-white text-sky-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: VIDEO RECORDING EMBED */}
              {activeModalTab === "video" && (
                <div className="space-y-4">
                  {zoomConfig.recordingUrl ? (
                    <>
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-inner border border-slate-800 flex items-center justify-center">
                        <video
                          controls
                          autoPlay={false}
                          className="w-full h-full object-contain"
                          src={zoomConfig.recordingUrl}
                          poster="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Direct Recording Stream Link:</span>
                          <a
                            href={zoomConfig.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:underline font-mono truncate max-w-xs sm:max-w-md inline-flex items-center gap-1"
                          >
                            <span>{zoomConfig.recordingUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <a
                          href={zoomConfig.recordingUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Download Video</span>
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">No Video Recording Available</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        A recording link has not been added for this session yet. Instructors can provide a recording URL upon ending the session.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CHAPTERS & TOPIC TIMELINES */}
              {activeModalTab === "chapters" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Jump through timestamped lecture segments to review specific topics and live demos.
                  </p>

                  <div className="space-y-2.5">
                    {(summaryData?.chapters || [
                      { time: "00:00", title: "Session Welcome & Agentic Paradigm", description: "Introduction to agent architectures." },
                      { time: "18:30", title: "System Prompts & Boundary Engineering", description: "Structuring few-shot rules." },
                      { time: "45:15", title: "Tool Calling & External API Integrations", description: "Writing JSON function definitions." },
                      { time: "01:15:00", title: "Vector Memory & RAG Retrieval Pipelines", description: "Semantic search indexing." },
                      { time: "01:48:20", title: "Live Coding Walkthrough & Student Q&A", description: "Step-by-step coding in the IDE." },
                    ]).map((chapter, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 transition flex items-start justify-between gap-4"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                              {chapter.time}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {chapter.title}
                            </h5>
                          </div>
                          <p className="text-xs text-slate-500 pl-0.5">{chapter.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveModalTab("video")}
                          className="px-3 py-1.5 bg-white hover:bg-sky-500 hover:text-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition flex-shrink-0 cursor-pointer"
                        >
                          Jump to Video →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ACTION ITEMS & STUDENT TASKS */}
              {activeModalTab === "action_items" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                    <span className="font-black uppercase tracking-wider block mb-1">
                      Post-Session Checklist for Batch Students
                    </span>
                    Please ensure all action items are completed prior to the next scheduled assessment check.
                  </div>

                  <div className="space-y-2">
                    {(summaryData?.actionItems || []).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-800"
                      >
                        <div className="w-5 h-5 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400 font-medium">
                  Attendance: {summaryData?.attendanceCount || 48} enrolled students • Engagement: {summaryData?.avgEngagementScore || 95}%
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecordingModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. MODAL: END LIVE CALL & PUBLISH RECORDING / SUMMARY                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEndCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-black text-lg">
                  <Square className="w-5 h-5 fill-rose-600" />
                  <span>End Live Workshop Call & Publish Summary</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEndCallModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Ending the call will update the session status to <strong>Ended</strong> and immediately make the video recording and AI summary notes available to batch students.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Video Recording URL *
                </label>
                <input
                  type="url"
                  required
                  value={endRecordingUrl}
                  onChange={(e) => setEndRecordingUrl(e.target.value)}
                  placeholder="https://... (Zoom cloud recording, YouTube, Vimeo, or MP4 link)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recorded Duration
                </label>
                <input
                  type="text"
                  value={endDuration}
                  onChange={(e) => setEndDuration(e.target.value)}
                  placeholder="e.g. 2h 45m"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Executive Summary Overview
                </label>
                <textarea
                  rows={3}
                  value={endOverview}
                  onChange={(e) => setEndOverview(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Highlights list */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Key Takeaways ({endHighlights.length})
                </label>
                <div className="space-y-1.5 mb-2">
                  {endHighlights.map((hl, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl text-xs">
                      <span className="truncate">{hl}</span>
                      <button
                        type="button"
                        onClick={() => setEndHighlights(endHighlights.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add key highlight point..."
                    value={endNewHighlight}
                    onChange={(e) => setEndNewHighlight(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    disabled={!endNewHighlight.trim()}
                    onClick={() => {
                      if (endNewHighlight.trim()) {
                        setEndHighlights([...endHighlights, endNewHighlight.trim()]);
                        setEndNewHighlight("");
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndCallModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndCall}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  End Call & Publish Recording
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. MODAL: SCHEDULE / EDIT LIVE CALL                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sky-600 font-black text-lg">
                  <Calendar className="w-5 h-5" />
                  <span>Schedule / Configure Live Call</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-3.5">
                {/* Status Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Call Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "scheduled", label: "⏳ Scheduled" },
                      { id: "live", label: "🔴 Live Now" },
                      { id: "ended", label: "🎬 Ended" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setEditStatus(s.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          editStatus === s.id
                            ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Meeting Topic / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="e.g. Live AI Masterclass: Autonomous Multi-Agent Systems"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Session Agenda / Key Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={editAgenda}
                    onChange={(e) => setEditAgenda(e.target.value)}
                    placeholder="Topics and hands-on modules covered..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="text"
                      value={editScheduledDate}
                      onChange={(e) => setEditScheduledDate(e.target.value)}
                      placeholder="e.g. Today / Tomorrow / 2026-08-20"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      value={editScheduledTime}
                      onChange={(e) => setEditScheduledTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 01:00 PM"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instructor Name(s)
                  </label>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    placeholder="Dr. Vikram Aditya & Akshar Sai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Meeting URL / Join Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={editMeetingLink}
                    onChange={(e) => setEditMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={editMeetingId}
                      onChange={(e) => setEditMeetingId(e.target.value)}
                      placeholder="849 2049 1928"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Passcode
                    </label>
                    <input
                      type="text"
                      value={editPasscode}
                      onChange={(e) => setEditPasscode(e.target.value)}
                      placeholder="MIND2I2026"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Save & Update Session
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
