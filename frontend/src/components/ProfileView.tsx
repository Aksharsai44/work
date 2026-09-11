import React, { useState } from "react";
import axios from "axios";
import { UserRole, Student } from "../types";
import {
  Mail,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  Star,
  Zap,
  ShieldCheck,
  Edit3,
  Check,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Sparkles,
  Trophy,
  Flame,
  Target,
  Clock,
  User,
  Github,
  Linkedin,
  FileText,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Code2,
  BookOpen,
} from "lucide-react";
import confetti from "canvas-confetti";

interface ProfileViewProps {
  userRole: UserRole;
  currentStudent?: Student;
  onUpdateStudent?: (updatedStudent: Student) => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CyberCoder",
  "https://api.dicebear.com/7.x/bottts/svg?seed=QuantumAgent",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Mind2iHero",
  "https://api.dicebear.com/7.x/bottts/svg?seed=NovaCoder",
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  userRole,
  currentStudent,
  onUpdateStudent,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "edit" | "security">("overview");

  // Form State
  const [name, setName] = useState(currentStudent?.name || "Student");
  const [mobile, setMobile] = useState(currentStudent?.mobile || "");
  const [college, setCollege] = useState(currentStudent?.college || "");
  const [branch, setBranch] = useState(currentStudent?.branch || "");
  const [city, setCity] = useState(currentStudent?.city || "");
  const [stateValue, setStateValue] = useState(currentStudent?.state || "");
  const [bio, setBio] = useState(
    currentStudent?.bio ||
      "Passionate developer exploring autonomous AI orchestration, modern full-stack web architectures, and high-performance algorithms."
  );
  const [githubUrl, setGithubUrl] = useState(currentStudent?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(currentStudent?.linkedinUrl || "");
  const [avatar, setAvatar] = useState(
    currentStudent?.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentStudent?.name || "Student"}`
  );

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Avatar Picker Modal State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStudent) return;

    if (!name.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }

    // Password validation if updating password
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage(null);
    setPasswordError(null);

    const updatedStudent: Student = {
      ...currentStudent,
      name: name.trim(),
      mobile: mobile.trim(),
      college: college.trim(),
      branch: branch.trim(),
      city: city.trim(),
      state: stateValue.trim(),
      avatar: avatar,
      bio: bio.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      password: newPassword.trim() ? newPassword.trim() : currentStudent.password,
    };

    try {
      // Persist to Django PostgreSQL / SQLite Backend
      await axios.patch(`/api/students/${currentStudent.id}/`, {
        name: updatedStudent.name,
        mobile: updatedStudent.mobile,
        college: updatedStudent.college,
        branch: updatedStudent.branch,
        city: updatedStudent.city,
        state: updatedStudent.state,
        avatar: updatedStudent.avatar,
        password: updatedStudent.password,
      });

      if (onUpdateStudent) {
        onUpdateStudent(updatedStudent);
      }

      setSaveSuccessMsg("Profile details updated successfully!");
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch {
        // ignore
      }

      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsEditing(false);
        setActiveSubTab("overview");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
      }, 1800);
    } catch (err) {
      console.warn("Backend update error, saving locally:", err);
      if (onUpdateStudent) {
        onUpdateStudent(updatedStudent);
      }
      setSaveSuccessMsg("Profile saved locally!");
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsEditing(false);
        setActiveSubTab("overview");
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const studentRank =
    (currentStudent?.totalPoints || 0) > 400
      ? "Level 5 • Grandmaster Prodigy"
      : (currentStudent?.totalPoints || 0) > 250
      ? "Level 4 • Senior Code Artisan"
      : (currentStudent?.totalPoints || 0) > 100
      ? "Level 3 • Core Full Stack Explorer"
      : "Level 2 • Apprentice Builder";

  return (
    <div className="space-y-6 pb-14 animate-in fade-in duration-300">
      {/* ── Top Header Banner ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 font-bold">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{userRole === "admin" ? "Master Instructor Profile" : "My Student Profile & Dossier"}</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {userRole === "admin" ? "Super Admin" : "Verified Learner"}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal credentials, customize avatar, inspect skill telemetry, and update contact information.
          </p>
        </div>

        {userRole === "student" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setActiveSubTab("overview");
                } else {
                  setIsEditing(true);
                  setActiveSubTab("edit");
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer ${
                isEditing
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 shadow-sky-500/20"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "View Dossier" : "Edit Profile"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ── Main Profile Container ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cover Hero Banner */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/30 backdrop-blur-md text-white text-[11px] font-mono font-bold rounded-full border border-white/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {userRole === "admin" ? "Platform Administrator" : currentStudent?.batchName || "AI Bootcamp"}
            </span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-end -mt-16 sm:-mt-20 relative z-10 mb-6 text-center sm:text-left">
            {/* Interactive Avatar with Edit Trigger */}
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center ring-4 ring-indigo-500/20">
                {userRole === "admin" ? (
                  <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-4xl sm:text-5xl">
                    AD
                  </div>
                ) : (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover bg-slate-50 transition duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {userRole === "student" && (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-1 right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg border-2 border-white transition transform hover:scale-110 cursor-pointer"
                  title="Change Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Basic Info & Titles */}
            <div className="flex-1 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1.5">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {userRole === "admin" ? "Super Administrator" : name}
                </h3>
                <span className="px-3 py-1 bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 text-xs font-black uppercase rounded-xl border border-indigo-100/80 inline-block self-center sm:self-auto">
                  {userRole === "admin" ? "Master Instructor" : studentRank}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {userRole === "admin" ? "admin@mind2i.edu" : currentStudent?.email}
                </span>
                {currentStudent?.college && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {currentStudent.college}
                  </span>
                )}
                {currentStudent?.city && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {currentStudent.city}
                    {currentStudent.state ? `, ${currentStudent.state}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          {userRole === "student" && (
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
              <button
                onClick={() => {
                  setActiveSubTab("overview");
                  setIsEditing(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "overview" && !isEditing
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Performance & Dossier</span>
              </button>

              <button
                onClick={() => {
                  setActiveSubTab("edit");
                  setIsEditing(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "edit" || isEditing
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile Info</span>
              </button>

              <button
                onClick={() => {
                  setActiveSubTab("security");
                  setIsEditing(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "security"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Account Security & Password</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & STATS TELEMETRY (VIEW MODE)             */}
          {/* ========================================================= */}
          {activeSubTab === "overview" && !isEditing && (
            <div className="space-y-6 animate-in fade-in">
              {/* 4 Highlight Metric Cards */}
              {userRole === "student" && currentStudent && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">
                        Total XP Points
                      </span>
                      <Award className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {currentStudent.totalPoints || 0}{" "}
                      <span className="text-xs text-indigo-600 font-bold">XP</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Reflex + Coding + Quizzes
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/70 rounded-2xl border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                        Active Streak
                      </span>
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {currentStudent.activeStreakDays || 0}{" "}
                      <span className="text-xs text-orange-500 font-bold">Days</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Daily workshop engagement
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 rounded-2xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                        Overall Accuracy
                      </span>
                      <Target className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {currentStudent.scores?.overallAccuracy || 94.2}%
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Across all cohort challenges
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-sky-50/70 to-blue-50/70 rounded-2xl border border-sky-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-sky-700 uppercase tracking-wider">
                        Fastest Reflex
                      </span>
                      <Clock className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {currentStudent.fastestResponseMs || 240}{" "}
                      <span className="text-xs text-sky-600 font-bold">ms</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Live Q&A buzzer reflex speed
                    </span>
                  </div>
                </div>
              )}

              {/* Bio / Summary Quote */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  About Me / Developer Bio
                </span>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  "{bio}"
                </p>
                {(githubUrl || linkedinUrl) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/60">
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
                      >
                        <Github className="w-3.5 h-3.5" /> GitHub Profile
                      </a>
                    )}
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Dossier Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Academic & Cohort Details */}
                <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    Academic & Cohort Information
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Enrolled Batch</span>
                      <span className="font-bold text-slate-900">
                        {currentStudent?.batchName || "AI Automation"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">College / Institution</span>
                      <span className="font-bold text-slate-900">
                        {currentStudent?.college || "Mind2i Institute of Technology"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Department / Branch</span>
                      <span className="font-bold text-slate-900">
                        {currentStudent?.branch || "Computer Science & Engineering"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Account Status</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {currentStudent?.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Earned Badges Showcase */}
                <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Award className="w-4 h-4 text-amber-500" />
                    Earned Workshop Badges & Achievements
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                        ⚡
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          Speed Reflex
                        </span>
                        <span className="text-[10px] text-slate-400">Top 10% reaction</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        💻
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          Code Master
                        </span>
                        <span className="text-[10px] text-slate-400">100% tests passed</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                        🔥
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          Streak Warrior
                        </span>
                        <span className="text-[10px] text-slate-400">Active every day</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        📜
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          Cert Verified
                        </span>
                        <span className="text-[10px] text-slate-400">Cryptographic hash</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EDIT PROFILE FORM                                  */}
          {/* ========================================================= */}
          {(activeSubTab === "edit" || isEditing) && activeSubTab !== "security" && (
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+1 (555) 012-3456"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    College / University Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. MIT / Stanford / IIT"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department / Branch
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science, AI & ML, ECE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco / Bangalore"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Province</label>
                  <input
                    type="text"
                    value={stateValue}
                    onChange={(e) => setStateValue(e.target.value)}
                    placeholder="e.g. California / Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Bio & Social Portfolios */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Developer Bio & Aspiration
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your instructors and peers about your tech interests and goals..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      GitHub Profile URL
                    </label>
                    <div className="relative">
                      <Github className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/yourhandle"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourhandle"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setActiveSubTab("overview");
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ACCOUNT SECURITY & PASSWORD                        */}
          {/* ========================================================= */}
          {activeSubTab === "security" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md animate-in fade-in">
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900">
                <span className="font-extrabold block mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Account Credential Management
                </span>
                <span>Update your password used to log into the Mind2i Learning Platform.</span>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setActiveSubTab("overview");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* AVATAR PICKER MODAL                                       */}
      {/* ========================================================= */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Choose Your Student Avatar
              </h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              {PRESET_AVATARS.map((avUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setAvatar(avUrl);
                    setShowAvatarPicker(false);
                  }}
                  className={`p-2 rounded-2xl border-2 transition cursor-pointer flex items-center justify-center aspect-square ${
                    avatar === avUrl
                      ? "border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <img src={avUrl} alt={`Avatar ${i}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
