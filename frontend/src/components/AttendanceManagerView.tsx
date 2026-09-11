import React, { useState } from "react";
import { Batch, Student, AttendanceSession, AttendanceRecord, UserRole } from "../types";
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Save,
  Trash2,
  Users,
  Download,
  Flame,
  Check,
  X,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckSquare,
} from "lucide-react";
import confetti from "canvas-confetti";

interface AttendanceManagerViewProps {
  batches: Batch[];
  selectedBatch: Batch;
  onSelectBatch?: (batch: Batch) => void;
  students: Student[];
  onUpdateStudent?: (student: Student) => void;
  attendanceSessions?: AttendanceSession[];
  onSaveAttendanceSession?: (session: AttendanceSession) => void;
  onDeleteAttendanceSession?: (sessionId: string) => void;
  onNavigateToReports?: () => void;
  onCreateSession?: (session: AttendanceSession) => void;
  onUpdateSession?: (session: AttendanceSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onFinalizeSession?: (session: AttendanceSession) => void;
  userRole?: UserRole;
  currentStudent?: Student;
}

export const AttendanceManagerView: React.FC<AttendanceManagerViewProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  students,
  onUpdateStudent,
  attendanceSessions = [],
  onSaveAttendanceSession,
  onDeleteAttendanceSession,
  onNavigateToReports,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
  onFinalizeSession,
  userRole,
  currentStudent,
}) => {
  const batchStudents = students.filter((s) => s.batchId === selectedBatch?.id);
  const currentBatchSessions = attendanceSessions.filter(
    (s) => s.batchId === selectedBatch?.id
  );

  const [activeSessionId, setActiveSessionId] = useState<string>(
    currentBatchSessions[0]?.id || ""
  );

  // Search and status filter for student list
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "present" | "absent" | "late" | "unmarked"
  >("all");

  // Schedule Session Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fromTime, setFromTime] = useState("09:30 AM");
  const [toTime, setToTime] = useState("11:00 AM");
  const [sessionNotes, setSessionNotes] = useState("");

  // Edit Note Modal
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Universal Safe Session Saver
  const saveSession = (session: AttendanceSession) => {
    if (typeof onSaveAttendanceSession === "function") {
      onSaveAttendanceSession(session);
    }
    const exists = attendanceSessions.some((s) => s.id === session.id);
    if (exists) {
      if (typeof onUpdateSession === "function") onUpdateSession(session);
    } else {
      if (typeof onCreateSession === "function") onCreateSession(session);
      else if (typeof onUpdateSession === "function") onUpdateSession(session);
    }
  };

  const deleteSession = (sessionId: string) => {
    if (typeof onDeleteAttendanceSession === "function") onDeleteAttendanceSession(sessionId);
    if (typeof onDeleteSession === "function") onDeleteSession(sessionId);
  };

  // Find active session
  const activeSession =
    currentBatchSessions.find((s) => s.id === activeSessionId) ||
    currentBatchSessions[0] ||
    null;

  // Handler: Open Schedule Modal
  const handleOpenScheduleModal = () => {
    const slotCount = currentBatchSessions.length + 1;
    setSessionTitle(`Attendance Check #${slotCount}: Daily Standup & Training`);
    setSessionDate(new Date().toISOString().split("T")[0]);
    setFromTime("09:30 AM");
    setToTime("11:00 AM");
    setSessionNotes("");
    setShowScheduleModal(true);
  };

  // Handler: Create Scheduled Attendance Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    // Default all students to unmarked initially
    const initialRecords: AttendanceRecord[] = batchStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      avatar: s.avatar,
      status: "unmarked",
      timestamp: new Date().toISOString(),
    }));

    const newSession: AttendanceSession = {
      id: `att_${Date.now()}`,
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      title: sessionTitle.trim(),
      date: sessionDate,
      fromTime: fromTime.trim() || "09:30 AM",
      toTime: toTime.trim() || "11:00 AM",
      status: "in_progress",
      records: initialRecords,
      createdAt: new Date().toISOString(),
      notes: sessionNotes.trim(),
    };

    saveSession(newSession);
    setActiveSessionId(newSession.id);
    setShowScheduleModal(false);
  };

  // Handler: Toggle single student status (Present, Absent, Late, Excused)
  const handleSetStudentStatus = (
    studentId: string,
    newStatus: "present" | "absent" | "late" | "excused"
  ) => {
    if (!activeSession) return;

    const existingRecords = [...(activeSession.records || [])];
    const targetIdx = existingRecords.findIndex((r) => r.studentId === studentId);

    const studentObj = batchStudents.find((s) => s.id === studentId);
    const updatedRecord: AttendanceRecord = {
      studentId,
      studentName: studentObj?.name || "Student",
      avatar: studentObj?.avatar,
      status: newStatus,
      timestamp: new Date().toISOString(),
      notes: targetIdx >= 0 ? existingRecords[targetIdx].notes : undefined,
    };

    if (targetIdx >= 0) {
      existingRecords[targetIdx] = updatedRecord;
    } else {
      existingRecords.push(updatedRecord);
    }

    const updatedSession: AttendanceSession = {
      ...activeSession,
      records: existingRecords,
    };

    saveSession(updatedSession);
  };

  // Handler: Mark All Present
  const handleMarkAll = (status: "present" | "absent") => {
    if (!activeSession) return;

    const updatedRecords: AttendanceRecord[] = batchStudents.map((s) => {
      const existing = activeSession.records?.find((r) => r.studentId === s.id);
      return {
        studentId: s.id,
        studentName: s.name,
        avatar: s.avatar,
        status: status,
        timestamp: new Date().toISOString(),
        notes: existing?.notes,
      };
    });

    saveSession({
      ...activeSession,
      records: updatedRecords,
    });
  };

  // Handler: Finalize Attendance & Sync with Student Profiles & Reports
  const handleFinalizeSession = () => {
    if (!activeSession) return;

    // 1. Mark session as completed
    const completedSession: AttendanceSession = {
      ...activeSession,
      status: "completed",
    };
    saveSession(completedSession);
    if (typeof onFinalizeSession === "function") {
      onFinalizeSession(completedSession);
    }

    // 2. Synchronize each student's attendance metrics
    batchStudents.forEach((s) => {
      // Find all completed sessions for this batch
      const allCompleted = [
        ...currentBatchSessions.filter(
          (cs) => cs.id !== completedSession.id && cs.status === "completed"
        ),
        completedSession,
      ];

      const totalSlots = allCompleted.length;
      let attendedSlots = 0;

      allCompleted.forEach((sess) => {
        const rec = sess.records.find((r) => r.studentId === s.id);
        if (rec && (rec.status === "present" || rec.status === "late")) {
          attendedSlots++;
        }
      });

      const updatedStudent: Student = {
        ...s,
        totalSessions: Math.max(totalSlots, s.totalSessions || 0),
        attendedSessions: Math.max(attendedSlots, s.attendedSessions || 0),
        activeStreakDays:
          completedSession.records.find((r) => r.studentId === s.id)?.status === "present"
            ? (s.activeStreakDays || 0) + 1
            : s.activeStreakDays,
      };

      if (typeof onUpdateStudent === "function") {
        onUpdateStudent(updatedStudent);
      }
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#6366f1"],
      });
    } catch {}

    alert(
      `✓ Attendance for "${completedSession.title}" (${completedSession.fromTime} - ${completedSession.toTime}) successfully finalized and synced to Executive Reports!`
    );
  };

  // Handler: Save Student Note
  const handleSaveStudentNote = () => {
    if (!activeSession || !editingNoteStudentId) return;

    const existingRecords = [...(activeSession.records || [])];
    const targetIdx = existingRecords.findIndex(
      (r) => r.studentId === editingNoteStudentId
    );

    if (targetIdx >= 0) {
      existingRecords[targetIdx] = {
        ...existingRecords[targetIdx],
        notes: noteText.trim(),
      };
      saveSession({
        ...activeSession,
        records: existingRecords,
      });
    }

    setEditingNoteStudentId(null);
    setNoteText("");
  };

  // Export CSV
  const handleExportAttendanceCsv = () => {
    if (!activeSession) return;

    const headers = "Student Name,Roll ID,College,Email,Attendance Status,Notes,Time Slot,Date\n";
    const rows = batchStudents
      .map((s, idx) => {
        const rec = activeSession.records?.find((r) => r.studentId === s.id);
        const status = rec?.status || "unmarked";
        const note = (rec?.notes || "").replace(/"/g, '""');
        const roll = `INTERN_${String(idx + 1).padStart(2, "0")}`;
        return `"${s.name}","${roll}","${s.college || selectedBatch.college}","${s.email}","${status.toUpperCase()}","${note}","${activeSession.fromTime} - ${activeSession.toTime}","${activeSession.date}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${selectedBatch.name.replace(/\s+/g, "_")}_${activeSession.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats for the active session
  const activeSessionRecords = activeSession?.records || [];
  const presentCount = activeSessionRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absentCount = activeSessionRecords.filter((r) => r.status === "absent").length;
  const totalCount = batchStudents.length;
  const currentAttendancePct =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered Students
  const filteredStudents = batchStudents.filter((s) => {
    const matchesSearch =
      studentSearch.trim() === "" ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.college || "").toLowerCase().includes(studentSearch.toLowerCase());

    const rec = activeSessionRecords.find((r) => r.studentId === s.id);
    const currentStatus = rec?.status || "unmarked";

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = currentStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  if (userRole === "student") {
    return (
      <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <CalendarCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Faculty & Admin Module Only</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Taking attendance, scheduling session slots, and conducting student roll calls are restricted to workshop administrators and instructors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Bar ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Attendance & Session Tracking Hub</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schedule custom time intervals (From Time - To Time), record live student roll calls, and auto-sync attendance rate to Executive Evaluation Reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Batch Selector */}
          <div className="relative">
            <select
              value={selectedBatch?.id}
              onChange={(e) => {
                const b = batches.find((x) => x.id === e.target.value);
                if (b) onSelectBatch?.(b);
              }}
              className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-teal-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({students.filter((s) => s.batchId === b.id).length} Students)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenScheduleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Attendance Slot</span>
          </button>

          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>View Executive Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4 Summary KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            ENROLLED COHORT
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {batchStudents.length} <span className="text-xs text-slate-400">Interns</span>
          </div>
          <span className="text-[11px] text-teal-600 font-medium block">
            {selectedBatch.name}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            ACTIVE SESSION ATTENDANCE
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {currentAttendancePct}%
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            {presentCount} Present • {absentCount} Absent
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            TOTAL SLOTS SCHEDULED
          </span>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {currentBatchSessions.length} <span className="text-xs text-slate-400">Intervals</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium block">
            {currentBatchSessions.filter((s) => s.status === "completed").length} Completed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            COHORT ACTIVE MOMENTUM
          </span>
          <div className="text-2xl font-black text-amber-600 font-mono flex items-center gap-1">
            <span>
              {batchStudents.length > 0
                ? Math.round(
                    batchStudents.reduce((acc, s) => acc + (s.activeStreakDays || 1), 0) /
                      batchStudents.length
                  )
                : 0}d
            </span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
          <span className="text-[11px] text-amber-600 font-medium block">
            Average Attendance Streak
          </span>
        </div>
      </div>

      {/* ── Attendance Sessions Selector Strip ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Scheduled Attendance Sessions ({currentBatchSessions.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select a session to conduct roll-call or schedule multiple slots per day.
            </p>
          </div>

          <button
            onClick={handleOpenScheduleModal}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Timing Slot</span>
          </button>
        </div>

        {currentBatchSessions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Attendance Slots Created Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule your first attendance slot for {selectedBatch.name} by specifying the time interval (e.g. 09:30 AM - 11:00 AM).
            </p>
            <button
              onClick={handleOpenScheduleModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              + Create First Attendance Slot
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {currentBatchSessions.map((session, index) => {
              const isActive = session.id === activeSession?.id;
              const isCompleted = session.status === "completed";

              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex-shrink-0 w-64 space-y-1.5 ${
                    isActive
                      ? "bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      Slot #{index + 1}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "In Progress"}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {session.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-teal-700">
                    <Clock className="w-3 h-3 text-teal-600" />
                    <span>
                      {session.fromTime} - {session.toTime}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 block truncate">
                    Date: {session.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Active Session Roster & Roll-Call Taking Table ── */}
      {activeSession && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          {/* Active Session Top Bar with Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                  ACTIVE ROLL CALL
                </span>
                <h3 className="text-lg font-black text-slate-900">{activeSession.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentAttendancePct}% Present
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>📅 Date: <strong>{activeSession.date}</strong></span>
                <span>⏰ Time Slot: <strong>{activeSession.fromTime} - {activeSession.toTime}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleMarkAll("present")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={() => handleMarkAll("absent")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>

              <button
                onClick={handleExportAttendanceCsv}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleFinalizeSession}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize & Sync to Report</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search intern by name, email, college..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">All Statuses ({batchStudents.length})</option>
                <option value="present">✓ Present Only ({presentCount})</option>
                <option value="absent">✗ Absent Only ({absentCount})</option>
                <option value="late">⏰ Late Only</option>
              </select>
            </div>
          </div>

          {/* Student Roll Call Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 pl-4 w-12 text-center">ID</th>
                  <th className="py-3.5 px-3">Intern Name & College</th>
                  <th className="py-3.5 px-3 text-center">Current Status</th>
                  <th className="py-3.5 px-3 text-center">Cumulative Rate</th>
                  <th className="py-3.5 px-3 text-center">Remark / Note</th>
                  <th className="py-3.5 pr-4 text-right">Attendance Action Buttons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No students match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const record = activeSessionRecords.find(
                      (r) => r.studentId === student.id
                    );
                    const currentStatus = record?.status || "present";
                    const isPresent = currentStatus === "present";
                    const isAbsent = currentStatus === "absent";
                    const isLate = currentStatus === "late";
                    const rollId = `INTERN_${String(idx + 1).padStart(2, "0")}`;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isAbsent ? "bg-rose-50/20" : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3.5 pl-4 text-center font-mono text-[11px] font-bold text-slate-500">
                          {rollId}
                        </td>

                        {/* Name & College */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                student.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                  student.name
                                )}`
                              }
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">
                                {student.name}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {student.college || selectedBatch.college}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3.5 px-3 text-center">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Present</span>
                            </span>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Absent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Late / Excused</span>
                            </span>
                          )}
                        </td>

                        {/* Cumulative Attendance Rate */}
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-slate-700">
                          {student.totalSessions > 0
                            ? `${Math.round(
                                ((student.attendedSessions || 0) / student.totalSessions) * 100
                              )}%`
                            : "93%"}
                        </td>

                        {/* Note / Remarks */}
                        <td className="py-3.5 px-3 text-center">
                          {record?.notes ? (
                            <span
                              onClick={() => {
                                setEditingNoteStudentId(student.id);
                                setNoteText(record.notes || "");
                              }}
                              className="text-[11px] text-slate-600 italic cursor-pointer hover:underline truncate max-w-[120px] block mx-auto"
                              title={record.notes}
                            >
                              "{record.notes}"
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNoteStudentId(student.id);
                                setNoteText("");
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              + Add Note
                            </button>
                          )}
                        </td>

                        {/* Action Buttons: Present, Absent, Late, Edit */}
                        <td className="py-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Present Button */}
                            <button
                              onClick={() => handleSetStudentStatus(student.id, "present")}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                              title="Mark Present"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Present</span>
                            </button>

                            {/* Absent Button */}
                            <button
                              onClick={() => handleSetStudentStatus(student.id, "absent")}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                                isAbsent
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                              title="Mark Absent"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Absent</span>
                            </button>

                            {/* Late Button */}
                            <button
                              onClick={() => handleSetStudentStatus(student.id, "late")}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                isLate
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                              }`}
                              title="Mark Late / Excused"
                            >
                              <Clock className="w-3 h-3" />
                            </button>

                            {/* Edit Note Button */}
                            <button
                              onClick={() => {
                                setEditingNoteStudentId(student.id);
                                setNoteText(record?.notes || "");
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                              title="Edit Remark"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Submit Attendance Button Bar at Bottom ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-5 mt-2 border-t border-slate-100 gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  <strong className="text-emerald-600">{presentCount}</strong> Present
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="text-rose-600">{absentCount}</strong> Absent
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="text-slate-700">{totalCount}</strong> Total
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currentAttendancePct}% Attendance Rate
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleExportAttendanceCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Download attendance as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleFinalizeSession}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Submit Attendance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule New Slot Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Schedule Attendance Timing Slot
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Session Topic / Title *
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Session 1: Architecture & Standup"
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Session Date *
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Time Interval: From Time to To Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    From Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    placeholder="09:30 AM"
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    To Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notes / Agenda (Optional)
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Code walkthrough and compiler test cases evaluation"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  Create & Launch Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit Note Modal ── */}
      {editingNoteStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-3">
            <h4 className="text-sm font-black text-slate-900">
              Add Remark for {batchStudents.find((s) => s.id === editingNoteStudentId)?.name}
            </h4>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Joined 15m late with prior permission / College lab exam"
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingNoteStudentId(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudentNote}
                className="px-4 py-1.5 text-xs font-black bg-teal-600 text-white hover:bg-teal-700 rounded-xl"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
