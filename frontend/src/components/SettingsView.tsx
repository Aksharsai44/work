import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { AppSettings, AdminUser, Batch, ScheduledMeeting } from "../types";
import {
  Settings,
  Shield,
  Sliders,
  Video,
  Key,
  Users,
  Check,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Code2,
  BookOpen,
  Award,
  BarChart3,
  Trophy,
  Zap,
  Radio,
  UserCheck,
  GraduationCap,
  ExternalLink,
  Copy,
  Calendar,
  Clock,
  Film,
  Globe,
  Play,
  X,
  Layers,
  PlusCircle,
  Star,
} from "lucide-react";

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  batches?: Batch[];
  selectedBatch?: Batch;
  scheduledMeetings?: ScheduledMeeting[];
  onCreateScheduledMeeting?: (meeting: Partial<ScheduledMeeting>) => void;
  onUpdateScheduledMeeting?: (meeting: ScheduledMeeting) => void;
  onDeleteScheduledMeeting?: (meetingId: string) => void;
  onSetLiveMeeting?: (meeting: ScheduledMeeting) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  batches = [],
  selectedBatch,
  scheduledMeetings = [],
  onCreateScheduledMeeting,
  onUpdateScheduledMeeting,
  onDeleteScheduledMeeting,
  onSetLiveMeeting,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>(settings.adminUsers || []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  const [studentPasswordInput, setStudentPasswordInput] = useState<string>(
    settings.defaultStudentPassword || "student123"
  );
  const isPasswordFocusedRef = useRef<boolean>(false);
  const studentPasswordInputRef = useRef<string>(settings.defaultStudentPassword || "student123");
  studentPasswordInputRef.current = studentPasswordInput;
  const isDirtyPasswordRef = useRef<boolean>(false);
  const [passwordSaved, setPasswordSaved] = useState<boolean>(false);

  // Google Gemini API Configuration State
  const [apiKeyInput, setApiKeyInput] = useState<string>(
    settings.geminiApiKey || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<"idle" | "valid" | "fallback">("idle");
  const [keySavedSuccess, setKeySavedSuccess] = useState(false);

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyTestStatus("fallback");
      return;
    }
    setIsTestingKey(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeyInput.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      if (res.ok) {
        setKeyTestStatus("valid");
      } else {
        setKeyTestStatus("fallback");
      }
    } catch {
      setKeyTestStatus("fallback");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    const updated = {
      ...localSettings,
      geminiApiKey: apiKeyInput.trim(),
      apiKeySet: !!apiKeyInput.trim(),
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    try {
      await axios.post("/api/settings/", {
        id: "global",
        ...updated,
      });
      setKeySavedSuccess(true);
      setTimeout(() => setKeySavedSuccess(false), 2500);
    } catch (e) {
      setKeySavedSuccess(true);
      setTimeout(() => setKeySavedSuccess(false), 2500);
    }
  };

  // Add / Edit Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminRole, setAdminRole] = useState<"super_admin" | "instructor" | "ta">("instructor");
  const [assignedBatches, setAssignedBatches] = useState<string[]>(["all"]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  // Multi-Meeting Schedule State
  const [activeMeetingBatchId, setActiveMeetingBatchId] = useState<string>(
    selectedBatch?.id || (batches.length > 0 ? batches[0].id : "")
  );
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingBatchId, setMeetingBatchId] = useState<string>(
    selectedBatch?.id || (batches.length > 0 ? batches[0].id : "")
  );
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingInstructor, setMeetingInstructor] = useState("");
  const [meetingDate, setMeetingDate] = useState("Today");
  const [meetingTime, setMeetingTime] = useState("10:00 AM - 01:00 PM");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPasscode, setMeetingPasscode] = useState("");
  const [meetingStatus, setMeetingStatus] = useState<"scheduled" | "live" | "ended">("scheduled");
  const [meetingRecordingUrl, setMeetingRecordingUrl] = useState("");
  const [meetingIsPublished, setMeetingIsPublished] = useState(true);
  const [meetingModalError, setMeetingModalError] = useState<string | null>(null);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  useEffect(() => {
    if (selectedBatch?.id) {
      setActiveMeetingBatchId(selectedBatch.id);
      setMeetingBatchId(selectedBatch.id);
    }
  }, [selectedBatch?.id]);

  const currentBatchMeetings = (scheduledMeetings || []).filter(
    (m) =>
      !activeMeetingBatchId ||
      activeMeetingBatchId === "all" ||
      m.batchId === activeMeetingBatchId ||
      (m as any).batch === activeMeetingBatchId
  );

  const handleOpenAddMeetingModal = () => {
    setEditingMeetingId(null);
    const defaultBatch =
      activeMeetingBatchId && activeMeetingBatchId !== "all"
        ? activeMeetingBatchId
        : selectedBatch?.id || (batches.length > 0 ? batches[0].id : "");
    setMeetingBatchId(defaultBatch);
    setMeetingTitle("");
    setMeetingAgenda("");
    setMeetingInstructor(localSettings.zoomConfig?.instructorName || "");
    setMeetingDate("Today");
    setMeetingTime("10:00 AM - 01:00 PM");
    setMeetingLink(localSettings.zoomConfig?.meetingLink || "");
    setMeetingId(localSettings.zoomConfig?.meetingId || "");
    setMeetingPasscode(localSettings.zoomConfig?.passcode || "");
    setMeetingStatus("scheduled");
    setMeetingRecordingUrl("");
    setMeetingIsPublished(true);
    setMeetingModalError(null);
    setShowMeetingModal(true);
  };

  const handleOpenEditMeetingModal = (meet: ScheduledMeeting) => {
    setEditingMeetingId(meet.id);
    setMeetingBatchId(meet.batchId || (meet as any).batch || activeMeetingBatchId || (batches[0]?.id || ""));
    setMeetingTitle(meet.title);
    setMeetingAgenda(meet.agenda || "");
    setMeetingInstructor(meet.instructorName || localSettings.zoomConfig?.instructorName || "");
    setMeetingDate(meet.scheduledDate || "Today");
    setMeetingTime(meet.scheduledTime || "10:00 AM - 01:00 PM");
    setMeetingLink(meet.meetingLink || "");
    setMeetingId(meet.meetingId || "");
    setMeetingPasscode(meet.passcode || "");
    setMeetingStatus(meet.status || "scheduled");
    setMeetingRecordingUrl(meet.recordingUrl || "");
    setMeetingIsPublished(meet.isPublished !== false);
    setMeetingModalError(null);
    setShowMeetingModal(true);
  };

  const handleSaveMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      setMeetingModalError("Please provide a meeting topic / title.");
      return;
    }

    setIsSavingMeeting(true);
    setMeetingModalError(null);

    const targetBatchId =
      meetingBatchId ||
      (activeMeetingBatchId && activeMeetingBatchId !== "all" ? activeMeetingBatchId : selectedBatch?.id || (batches[0]?.id || ""));

    const payload: Partial<ScheduledMeeting> = {
      id: editingMeetingId || `meet_${Date.now()}`,
      batchId: targetBatchId,
      title: meetingTitle.trim(),
      agenda: meetingAgenda.trim(),
      instructorName: meetingInstructor.trim(),
      scheduledDate: meetingDate.trim(),
      scheduledTime: meetingTime.trim(),
      meetingLink: meetingLink.trim(),
      meetingId: meetingId.trim(),
      passcode: meetingPasscode.trim(),
      status: meetingStatus,
      recordingUrl: meetingRecordingUrl.trim(),
      isPublished: meetingIsPublished,
      isRecordingUnlocked: true,
      orderIndex: editingMeetingId
        ? (scheduledMeetings.find((m) => m.id === editingMeetingId)?.orderIndex || 1)
        : currentBatchMeetings.length + 1,
    };

    try {
      if (editingMeetingId && onUpdateScheduledMeeting) {
        onUpdateScheduledMeeting(payload as ScheduledMeeting);
      } else if (onCreateScheduledMeeting) {
        onCreateScheduledMeeting(payload);
      } else {
        await axios.post("/api/scheduled-meetings/", {
          ...payload,
          batch: payload.batchId,
        });
      }
      setShowMeetingModal(false);
    } catch (err: any) {
      console.error("Failed to save scheduled meeting:", err);
      setMeetingModalError("Failed to save scheduled meeting. Please try again.");
    } finally {
      setIsSavingMeeting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. REAL-TIME BACKEND FETCH & SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  const fetchSettingsAndAdmins = async () => {
    try {
      // Fetch Settings
      const settingsRes = await axios.get("/api/settings/");
      if (Array.isArray(settingsRes.data) && settingsRes.data.length > 0) {
        const backendSettings = settingsRes.data[0];
        const merged: AppSettings = {
          enableCodingIDE: backendSettings.enableCodingIDE ?? true,
          enableQuiz: backendSettings.enableQuiz ?? true,
          enableLearnHub: backendSettings.enableLearnHub ?? true,
          enableCertificate: backendSettings.enableCertificate ?? true,
          enableMyReport: backendSettings.enableMyReport ?? true,
          enableLiveQA: backendSettings.enableLiveQA ?? true,
          enableLeaderboard: backendSettings.enableLeaderboard ?? true,
          enablePeerReview: backendSettings.enablePeerReview ?? false,
          enableTelemetryAnalytics: backendSettings.enableTelemetryAnalytics ?? true,
          enableZoomSync: backendSettings.enableZoomSync ?? true,
          enableStudentReviews: backendSettings.enableStudentReviews ?? true,
          apiKeySet: true,
          defaultStudentPassword: backendSettings.defaultStudentPassword || "student123",
          zoomConfig: backendSettings.zoomConfig || localSettings.zoomConfig,
          adminUsers: localSettings.adminUsers,
        };
        setLocalSettings(merged);
        onUpdateSettings(merged);
        if (!isPasswordFocusedRef.current && !isDirtyPasswordRef.current) {
          setStudentPasswordInput(backendSettings.defaultStudentPassword || "student123");
        }
      }

      // Fetch Admins
      const adminsRes = await axios.get("/api/admin-users/");
      if (Array.isArray(adminsRes.data) && adminsRes.data.length > 0) {
        setAdminUsersList(adminsRes.data);
      }

      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err) {
      console.warn("Using local settings state:", err);
    }
  };

  const handleSaveDefaultPassword = async (newVal?: string) => {
    const val = (newVal !== undefined ? newVal : studentPasswordInputRef.current).trim();
    if (!val) return;
    isDirtyPasswordRef.current = false;
    isPasswordFocusedRef.current = false;
    const updated = {
      ...localSettings,
      defaultStudentPassword: val,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    try {
      await axios.post("/api/settings/", {
        id: "global",
        ...updated,
      });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err) {
      console.warn("Could not save default password to backend:", err);
    }
  };

  useEffect(() => {
    fetchSettingsAndAdmins();
    const interval = setInterval(fetchSettingsAndAdmins, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await fetchSettingsAndAdmins();
    setTimeout(() => setIsSyncing(false), 600);
  };

  // ---------------------------------------------------------------------------
  // 2. FEATURE TOGGLE & PERSISTENCE
  // ---------------------------------------------------------------------------
  const handleToggle = async (key: keyof AppSettings) => {
    const updated = {
      ...localSettings,
      [key]: !localSettings[key],
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);

    try {
      await axios.post("/api/settings/", {
        id: "global",
        ...updated,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.warn("Could not persist setting toggle to backend:", err);
    }
  };

  const handleSaveAll = async () => {
    try {
      await axios.post("/api/settings/", {
        id: "global",
        ...localSettings,
      });
      onUpdateSettings(localSettings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Save settings error:", err);
      onUpdateSettings(localSettings);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. ADMIN & INSTRUCTOR CRUD OPERATIONS
  // ---------------------------------------------------------------------------
  const handleOpenAddModal = () => {
    setEditingAdminId(null);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminRole("instructor");
    setAssignedBatches(batches.length > 0 ? [batches[0].id] : ["all"]);
    setModalError(null);
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminPassword(admin.password || "");
    setAdminRole(admin.role);
    setAssignedBatches(admin.assignedBatches && admin.assignedBatches.length > 0 ? admin.assignedBatches : ["all"]);
    setModalError(null);
    setShowAdminModal(true);
  };

  const handleToggleBatchAssignment = (batchId: string) => {
    if (batchId === "all") {
      setAssignedBatches(["all"]);
      return;
    }

    let next = assignedBatches.filter((b) => b !== "all");
    if (next.includes(batchId)) {
      next = next.filter((b) => b !== batchId);
      if (next.length === 0) next = ["all"];
    } else {
      next.push(batchId);
    }
    setAssignedBatches(next);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      setModalError("Please provide both name and email.");
      return;
    }
    if (!editingAdminId && !adminPassword.trim()) {
      setModalError("Please provide an authentication password for this admin.");
      return;
    }

    setIsSavingAdmin(true);
    setModalError(null);

    const payload: Partial<AdminUser> = {
      id: editingAdminId || `adm_${Date.now()}`,
      name: adminName.trim(),
      email: adminEmail.trim(),
      password: adminPassword.trim() || "mind2i@admin",
      role: adminRole,
      assignedBatches: assignedBatches,
      permissions: ["all"],
      isActive: true,
    };

    try {
      if (editingAdminId) {
        await axios.put(`/api/admin-users/${editingAdminId}/`, payload);
      } else {
        await axios.post("/api/admin-users/", payload);
      }

      await fetchSettingsAndAdmins();
      setShowAdminModal(false);
    } catch (err: any) {
      if (err.response?.data?.email) {
        setModalError("An account with this email already exists.");
      } else {
        setModalError("Failed to save admin user. Please try again.");
      }
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (adminUsersList.length <= 1) {
      alert("At least one admin user must remain.");
      return;
    }
    if (!confirm("Are you sure you want to remove this administrator / instructor?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin-users/${id}/`);
      setAdminUsersList((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setAdminUsersList((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleToggleAdminStatus = async (admin: AdminUser) => {
    const updatedStatus = !admin.isActive;
    try {
      await axios.patch(`/api/admin-users/${admin.id}/`, {
        isActive: updatedStatus,
      });
      setAdminUsersList((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: updatedStatus } : a))
      );
    } catch (err) {
      setAdminUsersList((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: updatedStatus } : a))
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Bar ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>System Configuration & Feature Toggles</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Settings Stream
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage real-time module flags, instructor access with assigned batches, and default credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Force Real-Time Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? "Saved to Database!" : "Save All Settings"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. EXPANDED MODULE FEATURE TOGGLES GRID                    */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 1. EXPANDED MODULE FEATURE TOGGLES GRID (8 MODULES)        */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              Module Feature Toggles (Real-Time Synchronized)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last synced: {lastSyncTime}</span>
        </div>

        {/* 8 Symmetrical Feature Toggle Cards in a 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1. Coding IDE Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableCodingIDE")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableCodingIDE ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                In-Browser Coding IDE
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Allow students to execute Python & JavaScript code directly.
              </p>
            </div>
          </div>

          {/* 2. Learn Hub Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-sky-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableLearnHub")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableLearnHub ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Learn Hub Concept Engine
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Interactive hover badges, concept guides, and tag challenges.
              </p>
            </div>
          </div>

          {/* 3. Live Q&A Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableLiveQA")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableLiveQA ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Live Q&A Reflex Buzzer
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Push real-time rapid fire questions during live cohort sessions.
              </p>
            </div>
          </div>

          {/* 4. Certificate Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableCertificate")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableCertificate ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Student Certificate Issuance
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Expose verifiable tamper-proof certificates to students.
              </p>
            </div>
          </div>

          {/* 5. My Report Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableMyReport")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableMyReport ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Student 360° Telemetry Report
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Allow students to view detailed score cards and download PDF dossiers.
              </p>
            </div>
          </div>

          {/* 6. Leaderboard Toggle */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableLeaderboard")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableLeaderboard !== false ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Batch Leaderboard & Podium
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Real-time cohort accuracy standings and XP leaderboard.
              </p>
            </div>
          </div>

          {/* 7. Peer Code Review */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enablePeerReview")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enablePeerReview ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Peer Review & Collaboration
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Enable peer evaluation and collaborative coding inspection.
              </p>
            </div>
          </div>

          {/* 8. Telemetry Stream */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-sky-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <button
                onClick={() => handleToggle("enableTelemetryAnalytics")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
              >
                {localSettings.enableTelemetryAnalytics !== false ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Real-Time Telemetry Stream
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Broadcast live event submissions and latency telemetry.
              </p>
            </div>
          </div>

          {/* 9. Overall Student Reviews & Ratings */}
          <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <button
                onClick={() => handleToggle("enableStudentReviews")}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer flex-shrink-0 transition"
                title="Toggle Student Overall Reviews & 5-Star Ratings"
              >
                {localSettings.enableStudentReviews !== false ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Student Overall Reviews & Ratings
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Enable 5-star ratings and written reviews in the roster table and executive reports.
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Full-Width Default Student Password Provisioning Card */}
        <div className="mt-4 p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 rounded-2xl border border-indigo-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Default Student Enrollment Password
                </h4>
                {passwordSaved && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Saved to Database
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically assigned to new student accounts created via instructor roster addition or bulk CSV import.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentPasswordInput}
                onFocus={() => {
                  isPasswordFocusedRef.current = true;
                }}
                onChange={(e) => {
                  isPasswordFocusedRef.current = true;
                  isDirtyPasswordRef.current = true;
                  setStudentPasswordInput(e.target.value);
                }}
                onBlur={() => {
                  isPasswordFocusedRef.current = false;
                  handleSaveDefaultPassword();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveDefaultPassword();
                  }
                }}
                placeholder="mind2i@2026"
                className="w-48 sm:w-56 pl-8 pr-3.5 py-2 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSaveDefaultPassword()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              {passwordSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. GOOGLE GEMINI AI CONFIGURATION & RESILIENT FALLBACK    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Google Gemini AI Engine & Intelligent Fallback Configuration
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Powers automated student open-text evaluation, answer rating, and diagnostic feedback in Live Q&A and reports.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {keyTestStatus === "valid" || (localSettings.geminiApiKey && keyTestStatus === "idle") ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gemini API Active</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Smart Semantic Fallback Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Resilient Fallback Notice */}
        <div className="p-4 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-sky-100/90 text-xs text-slate-700 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-indigo-950 uppercase tracking-wider block">
              Auto-Failover Resilience Architecture
            </span>
            <p className="leading-relaxed">
              If your Google Gemini API key is missing, token-exhausted, or rate-limited (HTTP 429), the platform <strong>automatically switches without interruption</strong> to our local Semantic Heuristic Engine to analyze, rate, and formulate replies to student responses.
            </p>
          </div>
        </div>

        {/* API Key Input Form */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            Google AI Studio (Gemini) API Key
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full flex-1">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setKeyTestStatus("idle");
                }}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              disabled={isTestingKey}
              onClick={handleTestApiKey}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isTestingKey ? "Testing..." : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveApiKey}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {keySavedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{keySavedSuccess ? "API Key Saved!" : "Save Key"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Don't have a key? Get one free at Google AI Studio.</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 underline"
            >
              <span>Get Free Gemini Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ADMIN & INSTRUCTOR USER ACCOUNTS WITH ASSIGNED BATCHES   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Admin & Instructor User Accounts ({adminUsersList.length})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage instructors, set passwords, and assign specific batches for customized dashboard access.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Admin / Instructor</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 pl-4">Admin / Instructor</th>
                <th className="py-3.5 px-3">Role</th>
                <th className="py-3.5 px-3">Assigned Batches</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {adminUsersList.map((admin) => {
                const isSuper = admin.role === "super_admin";
                const assigned = admin.assignedBatches || ["all"];
                const isAllBatches = assigned.includes("all");

                return (
                  <tr key={admin.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block capitalize">
                            {admin.name}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {admin.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 font-extrabold text-[10px] uppercase rounded-full border ${
                          isSuper
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : admin.role === "instructor"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {admin.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {isAllBatches ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>All Batches</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assigned.map((bId) => {
                            const bObj = batches.find(
                              (b) =>
                                b.id === bId ||
                                b.name.toLowerCase().replace(/\s+/g, "_") === bId.toLowerCase() ||
                                b.name.toLowerCase() === bId.toLowerCase()
                            );
                            return (
                              <span
                                key={bId}
                                className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100"
                              >
                                {bObj ? bObj.name : bId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleAdminStatus(admin)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                          admin.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}
                      >
                        {admin.isActive !== false ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MULTI-MEETING & SCHEDULED ZOOM SESSIONS MANAGER        */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Scheduled Zoom Meetings & Masterclass Sessions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Schedule multiple meetings/sessions for your batches. Release links to students, broadcast live calls, and attach recordings.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Batch Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeMeetingBatchId}
                onChange={(e) => setActiveMeetingBatchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMeetingModal}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Meeting</span>
            </button>
          </div>
        </div>

        {/* Scheduled Meetings List */}
        {currentBatchMeetings.length === 0 ? (
          <div className="p-6 sm:p-7 bg-gradient-to-br from-sky-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-sky-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm shadow-sky-500/30">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Add Live Zoom Call Link for{" "}
                    <span className="text-indigo-600">
                      {batches.find((b) => b.id === activeMeetingBatchId)?.name || "Selected Batch"}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Enter your Zoom meeting URL below. Once saved, students in this batch will see the link and can join the call with 1 click.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddMeetingModal}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Full Scheduler Modal</span>
              </button>
            </div>

            {/* Quick Inline Add Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMeetingSubmit(e);
              }}
              className="space-y-4 pt-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Zoom Meeting Link / URL *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://zoom.us/j/84920491928?pwd=..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    <Video className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Call Status
                  </label>
                  <select
                    value={meetingStatus}
                    onChange={(e) => setMeetingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                  >
                    <option value="live">🔴 Live Now (Active Broadcast)</option>
                    <option value="scheduled">⏳ Upcoming Scheduled</option>
                    <option value="ended">🎬 Ended / Recorded</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Session Topic / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Session 1: Autonomous AI Agents"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Today"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="10:00 AM - 01:00 PM"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Meeting ID & Passcode
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="ID: 849 2049 1928"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Pass: MIND2I2026"
                      value={meetingPasscode}
                      onChange={(e) => setMeetingPasscode(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingMeeting}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMeeting ? "Saving..." : "Save Call Link & Publish to Students"}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentBatchMeetings.map((meet, index) => {
              const isLive = meet.status === "live";
              const isEnded = meet.status === "ended";
              const batchName = batches.find((b) => b.id === meet.batchId)?.name || meet.batchName || "Batch Workshop";

              return (
                <div
                  key={meet.id}
                  className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
                    isLive
                      ? "bg-rose-50/40 border-rose-200 shadow-md ring-2 ring-rose-500/20"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2.5 min-w-0 flex-1">
                      {/* Top Header info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-black uppercase tracking-wider">
                          Session #{meet.orderIndex || index + 1}
                        </span>
                        
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {batchName}
                        </span>

                        {/* Status Badge */}
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span>LIVE NOW</span>
                          </span>
                        ) : isEnded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            🎬 Ended / Recorded
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ Scheduled
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{meet.title}</span>
                      </h4>

                      {meet.agenda && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          <span className="font-bold text-slate-700">Agenda:</span> {meet.agenda}
                        </p>
                      )}

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meet.scheduledDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meet.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{meet.instructorName || "MINDA2 Instructor"}</span>
                        </div>
                        {meet.meetingId && (
                          <div className="font-mono text-[11px] text-slate-500">
                            ID: <span className="font-bold text-slate-700">{meet.meetingId}</span>
                            {meet.passcode && (
                              <span> • Pass: <span className="font-bold text-slate-700">{meet.passcode}</span></span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Zoom Link Display Box */}
                      {meet.meetingLink ? (
                        <div className="mt-2 p-2.5 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="p-1 bg-sky-100 text-sky-700 rounded-lg flex-shrink-0">
                              <Video className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Zoom Call Link
                              </span>
                              <a
                                href={meet.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-sky-600 hover:text-sky-800 font-mono font-medium underline truncate block max-w-xs sm:max-w-md"
                              >
                                {meet.meetingLink}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                            <a
                              href={meet.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(meet.meetingLink);
                                alert("Copied Zoom link to clipboard!");
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                              title="Copy Link"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>No Zoom call link assigned yet. Click Edit to add link.</span>
                        </div>
                      )}

                      {/* Recording URL if present */}
                      {meet.recordingUrl && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <Film className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs font-bold text-emerald-700">Recording URL:</span>
                          <a
                            href={meet.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-mono underline truncate max-w-xs"
                          >
                            {meet.recordingUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Go Live / Status toggle */}
                      {!isLive && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSetLiveMeeting) {
                              onSetLiveMeeting(meet);
                            } else if (onUpdateScheduledMeeting) {
                              onUpdateScheduledMeeting({ ...meet, status: "live" });
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>Go Live Now</span>
                        </button>
                      )}

                      {isLive && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateScheduledMeeting) {
                              onUpdateScheduledMeeting({ ...meet, status: "ended" });
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>End Call</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMeetingModal(meet)}
                          className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                          title="Edit Meeting"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete session: "${meet.title}"?`)) {
                              if (onDeleteScheduledMeeting) {
                                onDeleteScheduledMeeting(meet.id);
                              } else {
                                axios.delete(`/api/scheduled-meetings/${meet.id}/`);
                              }
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. ADD / EDIT ADMIN & INSTRUCTOR MODAL WITH BATCH ASSIGN   */}
      {/* ========================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {editingAdminId ? "Edit Admin / Instructor" : "Add Admin / Instructor"}
                </h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="space-y-4 pt-3 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Maya Patel"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email ID (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="maya.patel@mind2i.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingAdminId}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={editingAdminId ? "Leave blank to keep unchanged" : "••••••••"}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Password used by instructor to log into the Mind2i dashboard.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Role & Privileges
                </label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="instructor">Instructor (Course & Assignment Management)</option>
                  <option value="super_admin">Super Admin (All Privileges & Global Access)</option>
                  <option value="ta">Teaching Assistant (TA - Live Q&A & Support)</option>
                </select>
              </div>

              {/* Assigned Batches Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Assigned Batches
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleBatchAssignment("all")}
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition ${
                      assignedBatches.includes("all")
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {assignedBatches.includes("all") ? "✓ All Batches Assigned" : "Assign All Batches"}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {batches.map((b) => {
                    const isChecked =
                      assignedBatches.includes("all") || assignedBatches.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-xs ${
                          isChecked ? "bg-white border border-indigo-200 shadow-2xs" : "hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBatchAssignment(b.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{b.name}</span>
                            <span className="text-[10px] text-slate-400">{b.college}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {b.type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdmin}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingAdmin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAdminId ? "Update Admin" : "Save Admin User"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. ADD / EDIT SCHEDULED MEETING MODAL                      */}
      {/* ========================================================= */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {editingMeetingId ? "Edit Scheduled Meeting" : "Schedule New Meeting / Session"}
                </h3>
              </div>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {meetingModalError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{meetingModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMeetingSubmit} className="space-y-4 pt-3 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Batch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={meetingBatchId}
                  onChange={(e) => setMeetingBatchId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.college || b.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Session Topic / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Day 1: Generative AI & Autonomous Agent Architecture"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Agenda / Learning Objectives
                </label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="e.g. Prompt engineering, ReAct loops, tool calling APIs, live coding exercises..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="text"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    placeholder="e.g. Today, Tomorrow, Day 2, 2026-08-28"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 01:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instructor / Host Name(s)
                </label>
                <input
                  type="text"
                  value={meetingInstructor}
                  onChange={(e) => setMeetingInstructor(e.target.value)}
                  placeholder="e.g. Dr. Vikram Aditya & Akshar Sai"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Zoom Meeting Join Link / URL *</span>
                  {meetingLink && (
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:text-sky-800 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <span>Test Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/84920491928?pwd=..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Meeting ID
                  </label>
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="849 2049 1928"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passcode
                  </label>
                  <input
                    type="text"
                    value={meetingPasscode}
                    onChange={(e) => setMeetingPasscode(e.target.value)}
                    placeholder="MIND2I2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={meetingStatus}
                    onChange={(e) => setMeetingStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="scheduled">⏳ Scheduled</option>
                    <option value="live">🔴 Live Now</option>
                    <option value="ended">🎬 Ended / Recorded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recording Video URL (Optional)
                </label>
                <input
                  type="url"
                  value={meetingRecordingUrl}
                  onChange={(e) => setMeetingRecordingUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or MP4 link"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Release & Publish to Students</span>
                  <span className="text-[11px] text-sky-700">Students in this batch will see this meeting on their dashboard.</span>
                </div>
                <input
                  type="checkbox"
                  checked={meetingIsPublished}
                  onChange={(e) => setMeetingIsPublished(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeeting}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingMeeting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingMeetingId ? "Update Meeting" : "Save Scheduled Meeting"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
