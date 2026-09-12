import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  UserRole,
  Batch,
  Student,
  Assignment,
  LearnHubModule,
  LiveQuestion,
  AppSettings,
  CertificateTemplate,
  ScheduledMeeting,
  AttendanceSession,
} from "./types";
import {
  initialBatches,
  initialStudents,
  initialAssignments,
  initialLearnHubModules,
  initialSettings,
  initialCertificateTemplate,
  initialScheduledMeetings,
  emptyBatch,
  emptyStudent,
} from "./data/initialData";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { BatchManagementView } from "./components/BatchManagementView";
import { AttendanceManagerView } from "./components/AttendanceManagerView";
import { LearnHubInteractive } from "./components/LearnHubInteractive";
import { AssignmentManagerView } from "./components/AssignmentManagerView";
import { LiveQAManagerView } from "./components/LiveQAManagerView";
import { ReportsAnalyticsView } from "./components/ReportsAnalyticsView";
import { LeaderboardView } from "./components/LeaderboardView";
import { CertificateManagerView } from "./components/CertificateManagerView";
import { SettingsView } from "./components/SettingsView";
import LandingView from "./components/LandingView";
import LoginModal from "./components/LoginModal";
import { StudentDashboardView } from "./components/StudentDashboardView";
import { StudentDetailModal } from "./components/StudentDetailModal";
import { ExecutiveEvaluationReport } from "./components/ExecutiveEvaluationReport";
import { BatchRegistrationModal } from "./components/BatchRegistrationModal";
import { Minda2Logo } from "./components/Minda2Logo";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  Code2,
  Radio,
  BarChart3,
  Trophy,
  Award,
  Settings,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronDown,
  LogOut,
  Bell,
  Menu,
  X,
  Flame,
  Search,
  Lock,
  Library,
  ExternalLink,
  Video,
} from "lucide-react";
import { ResourcesView } from "./components/ResourcesView";
import { ProfileView } from "./components/ProfileView";
import { motion, AnimatePresence } from "motion/react";

const getInitialAuthSession = () => {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, userRole: "admin" as UserRole, loggedInUser: null, selectedBatchId: null, currentStudentId: null };
  }
  try {
    const saved = localStorage.getItem("mind2i_auth_session");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.isAuthenticated) {
        return {
          isAuthenticated: true,
          userRole: (parsed.userRole || "admin") as UserRole,
          loggedInUser: parsed.loggedInUser || null,
          selectedBatchId: parsed.selectedBatchId || null,
          currentStudentId: parsed.currentStudentId || null,
        };
      }
    }
  } catch (e) {
    console.error("Error reading saved session:", e);
  }
  return { isAuthenticated: false, userRole: "admin" as UserRole, loggedInUser: null, selectedBatchId: null, currentStudentId: null };
};

const getInitialActiveTab = (): string => {
  if (typeof window === "undefined") return "dashboard";
  try {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash) {
      if (hash.startsWith("tab=")) {
        return hash.replace("tab=", "").split("&")[0];
      }
      if (!hash.includes("=") && hash !== "") {
        return hash.split("?")[0];
      }
    }
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam) return tabParam;

    const savedTab = localStorage.getItem("mind2i_active_tab");
    if (savedTab) return savedTab;
  } catch (e) {
    console.error("Error reading initial active tab:", e);
  }
  return "dashboard";
};

export default function App() {
  const initialSession = getInitialAuthSession();

  // Global State
  const [userRole, setUserRole] = useState<UserRole>(initialSession.userRole);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [selectedBatch, setSelectedBatch] = useState<Batch>(emptyBatch);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [currentStudent, setCurrentStudent] = useState<Student>(emptyStudent);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [learnHubModules, setLearnHubModules] = useState<LearnHubModule[]>(initialLearnHubModules);
  const [liveQuestions, setLiveQuestions] = useState<LiveQuestion[]>([]);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>(initialScheduledMeetings);
  const [certificateTemplate, setCertificateTemplate] = useState<CertificateTemplate>(
    initialCertificateTemplate
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    try {
      const saved = localStorage.getItem("mind2i_attendance_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mind2i_attendance_sessions", JSON.stringify(attendanceSessions));
    } catch (e) {
      console.error("Failed to persist attendance sessions:", e);
    }
  }, [attendanceSessions]);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession.isAuthenticated);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(initialSession.loggedInUser);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Persist session to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const sessionData = {
        isAuthenticated: true,
        userRole,
        loggedInUser,
        selectedBatchId: selectedBatch?.id || null,
        currentStudentId: currentStudent?.id || null,
      };
      localStorage.setItem("mind2i_auth_session", JSON.stringify(sessionData));
    } else {
      localStorage.removeItem("mind2i_auth_session");
    }
  }, [isAuthenticated, userRole, loggedInUser, selectedBatch?.id, currentStudent?.id]);

  // Persist activeTab to localStorage and URL hash
  useEffect(() => {
    if (isAuthenticated && activeTab) {
      localStorage.setItem("mind2i_active_tab", activeTab);
      if (typeof window !== "undefined") {
        const currentHash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
        if (currentHash !== activeTab && !window.location.search.includes("batch=")) {
          window.history.replaceState(null, "", `#${activeTab}`);
        }
      }
    }
  }, [activeTab, isAuthenticated]);

  // Guard: Restrict student navigation to allowed student tabs only (redirect to dashboard otherwise)
  useEffect(() => {
    if (userRole === "student") {
      const allowedStudentTabs = [
        "dashboard",
        "learn_hub",
        "assignments",
        "live_qa",
        "reports",
        "leaderboard",
        "resources",
        "certificate",
        "profile",
      ];
      if (!allowedStudentTabs.includes(activeTab)) {
        setActiveTab("dashboard");
      }
    }
  }, [userRole, activeTab]);

  // Sync with browser back/forward and URL hash
  useEffect(() => {
    const handleHashOrPopState = () => {
      const tab = getInitialActiveTab();
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    };
    window.addEventListener("hashchange", handleHashOrPopState);
    window.addEventListener("popstate", handleHashOrPopState);
    return () => {
      window.removeEventListener("hashchange", handleHashOrPopState);
      window.removeEventListener("popstate", handleHashOrPopState);
    };
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modals
  const [inspectedStudent, setInspectedStudent] = useState<Student | null>(null);
  const [registrationBatchId, setRegistrationBatchId] = useState<string | null>(null);

  // Listen for registration query / hash in URL
  useEffect(() => {
    const parseRegistrationBatch = () => {
      if (typeof window === "undefined") return;
      const search = window.location.search;
      const hash = window.location.hash;
      
      let batchId: string | null = null;
      if (search && search.includes("batch=")) {
        const params = new URLSearchParams(search);
        batchId = params.get("batch");
      } else if (hash && hash.includes("batch=")) {
        const hashQuery = hash.includes("?") ? hash.split("?")[1] : hash.replace(/^#/, "");
        const params = new URLSearchParams(hashQuery);
        batchId = params.get("batch");
      }
      
      if (batchId) {
        setRegistrationBatchId(batchId);
      }
    };
    parseRegistrationBatch();
    window.addEventListener("hashchange", parseRegistrationBatch);
    window.addEventListener("popstate", parseRegistrationBatch);
    return () => {
      window.removeEventListener("hashchange", parseRegistrationBatch);
      window.removeEventListener("popstate", parseRegistrationBatch);
    };
  }, []);

  // Guarantee registration batch is loaded directly by ID from backend
  useEffect(() => {
    if (!registrationBatchId) return;

    axios.get(`/api/batches/${registrationBatchId}/`)
      .then((res) => {
        if (res.data && res.data.id) {
          const specificBatch: Batch = res.data;
          setSelectedBatch(specificBatch);
          setBatches((prev) => {
            if (prev.some((b) => b.id === specificBatch.id)) {
              return prev.map((b) => (b.id === specificBatch.id ? specificBatch : b));
            }
            return [specificBatch, ...prev];
          });
        }
      })
      .catch((err) => console.error("Error fetching specific registration batch:", err));
  }, [registrationBatchId]);

  // -------------------------------------------------------------
  // Real-Time Students Telemetry Fetcher & Synchronizer
  // -------------------------------------------------------------
  const fetchStudents = useCallback((batchId?: string) => {
    const targetBatch = batchId || selectedBatch?.id;
    const url = targetBatch ? `/api/students/?batch=${targetBatch}` : '/api/students/';
    axios.get(url)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const apiStudents = res.data.map((s: any) => ({
            ...s,
            batchId: s.batch || s.batchId || targetBatch,
            scores: s.scores || {
              quizScore: 0,
              codingScore: 0,
              liveQAScore: 0,
              assignmentScore: 0,
              overallAccuracy: 0.0,
            },
            totalPoints: s.totalPoints ?? 0,
            activeStreakDays: s.activeStreakDays ?? 0,
            fastestResponseMs: s.fastestResponseMs ?? 0,
            attendedSessions: s.attendedSessions ?? 0,
            totalSessions: s.totalSessions ?? 0,
          }));
          setStudents(apiStudents);

          const savedSession = getInitialAuthSession();
          const savedEmail = savedSession.loggedInUser?.email;
          const savedStuId = savedSession.currentStudentId;

          setCurrentStudent((prev) => {
            const currentEmail = loggedInUser?.email || savedEmail;
            const currentStuId = prev?.id && prev.id !== "empty_student" ? prev.id : savedStuId;

            // If currentStudent is not yet populated or is empty
            if (!prev || !prev.id || prev.id === "empty_student") {
              const matched = apiStudents.find(
                (s: Student) =>
                  (currentEmail && s.email && s.email.toLowerCase().trim() === currentEmail.toLowerCase().trim()) ||
                  (currentStuId && s.id === currentStuId)
              );
              return matched || (apiStudents.length > 0 ? apiStudents[0] : prev);
            }

            // Otherwise update current student with server telemetry
            const updated = apiStudents.find(
              (s: Student) =>
                s.id === prev.id ||
                (currentEmail && s.email && s.email.toLowerCase().trim() === currentEmail.toLowerCase().trim())
            );
            return updated ? { ...prev, ...updated } : prev;
          });
        }
      })
      .catch(err => console.error("API Fetch Error (Students):", err));
  }, [selectedBatch?.id]);

  // Proactive background wake-up ping for sleeping/cold-start backends
  useEffect(() => {
    axios.get('/api/health').catch(() => {});
  }, []);

  // Fetch real data from Django backend
  useEffect(() => {
    axios.get('/api/batches/')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setBatches(res.data);

          let hashBatchId = registrationBatchId;
          if (!hashBatchId && typeof window !== "undefined") {
            const hash = window.location.hash;
            const search = window.location.search;
            if (search && search.includes("batch=")) {
              const params = new URLSearchParams(search);
              hashBatchId = params.get("batch");
            } else if (hash && hash.includes("batch=")) {
              const hashQuery = hash.includes("?") ? hash.split("?")[1] : hash.replace(/^#/, "");
              const params = new URLSearchParams(hashQuery);
              hashBatchId = params.get("batch");
            }
          }

          const savedSession = getInitialAuthSession();
          const targetBatchId = hashBatchId || savedSession.selectedBatchId;

          if (targetBatchId) {
            const matched = res.data.find((b: Batch) => b.id === targetBatchId);
            if (matched) {
              setSelectedBatch(matched);
              if (hashBatchId) setRegistrationBatchId(hashBatchId);
            } else if (res.data.length > 0) {
              setSelectedBatch(res.data[0]);
            }
          } else if (res.data.length > 0) {
            setSelectedBatch(res.data[0]);
          }
        }
      })
      .catch(err => console.error("API Fetch Error (Batches):", err));

    fetchStudents();

    // Fetch LearnHub Modules from Backend
    axios.get('/api/learnhub-modules/')
      .then(res => {
        if (Array.isArray(res.data)) {
          const apiModules: LearnHubModule[] = res.data.map((m: any) => ({
            ...m,
            batchId: m.batch || m.batchId,
            studentProgress: (m.studentProgress || []).map((p: any) => ({
              ...p,
              studentId: p.student || p.studentId,
              moduleId: p.module || p.moduleId,
            })),
          }));
          setLearnHubModules(apiModules);
        }
      })
      .catch(err => console.error("API Fetch Error (LearnHub Modules):", err));
  }, []);

  // -------------------------------------------------------------
  // Real-Time Live Q&A & Telemetry Sync with Backend
  // -------------------------------------------------------------
  useEffect(() => {
    if (!selectedBatch?.id) return;

    const fetchLiveQuestions = () => {
      axios.get(`/api/live-questions/?batchId=${selectedBatch.id}`)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const apiQuestions: LiveQuestion[] = res.data.map((q: any) => ({
              ...q,
              batchId: q.batch || q.batchId,
              responses: (q.responses || []).map((r: any) => ({
                ...r,
                timestamp: r.submittedAt ? new Date(r.submittedAt).getTime() : Date.now(),
              })),
            }));
            setLiveQuestions(apiQuestions);
          } else if (Array.isArray(res.data)) {
            setLiveQuestions([]);
          }
        })
        .catch((err) => console.error("API Fetch Error (Live Questions):", err));
    };

    fetchLiveQuestions();
    fetchStudents(selectedBatch.id);

    // Fast polling every 3 seconds for live student telemetry & real-time dashboard sync
    const interval = setInterval(() => {
      fetchLiveQuestions();
      fetchStudents(selectedBatch.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedBatch?.id, fetchStudents]);

  // -------------------------------------------------------------
  // Real-Time Assignments Sync with Backend
  // -------------------------------------------------------------
  useEffect(() => {
    if (!selectedBatch?.id) return;

    const fetchAssignments = () => {
      axios
        .get(`/api/assignments/?batchId=${selectedBatch.id}`)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const apiAssignments: Assignment[] = res.data.map((a: any) => ({
              ...a,
              batchId: a.batch || a.batchId,
              submissions: (a.submissions || []).map((s: any) => ({
                ...s,
                assignmentId: s.assignment || s.assignmentId,
                studentId: s.student || s.studentId,
              })),
            }));
            setAssignments(apiAssignments);
          } else if (Array.isArray(res.data)) {
            setAssignments([]);
          }
        })
        .catch((err) => console.error("API Fetch Error (Assignments):", err));
    };

    fetchAssignments();

    // Fast polling every 3 seconds for assignments real-time sync
    const interval = setInterval(fetchAssignments, 3000);
    return () => clearInterval(interval);
  }, [selectedBatch?.id]);

  // -------------------------------------------------------------
  // Real-Time LearnHub Modules & Student Progress Sync with Backend
  // -------------------------------------------------------------
  useEffect(() => {
    if (!selectedBatch?.id) return;

    const fetchLearnHub = () => {
      axios
        .get(`/api/learnhub-modules/?batchId=${selectedBatch.id}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            const apiModules: LearnHubModule[] = res.data.map((m: any) => ({
              ...m,
              batchId: m.batch || m.batchId,
              studentProgress: (m.studentProgress || []).map((p: any) => ({
                ...p,
                studentId: p.student || p.studentId,
                moduleId: p.module || p.moduleId,
              })),
            }));
            setLearnHubModules(apiModules);
          }
        })
        .catch((err) => console.error("API Fetch Error (LearnHub Modules):", err));
    };

    fetchLearnHub();
    const interval = setInterval(fetchLearnHub, 3000);
    return () => clearInterval(interval);
  }, [selectedBatch?.id]);

  // -------------------------------------------------------------
  // Real-Time Settings & Zoom Configuration Sync with Backend
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchSettings = () => {
      axios
        .get("/api/settings/")
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const backendSettings = res.data[0];
            setSettings((prev) => ({
              ...prev,
              enableCodingIDE: backendSettings.enableCodingIDE ?? prev.enableCodingIDE,
              enableQuiz: backendSettings.enableQuiz ?? prev.enableQuiz,
              enableLearnHub: backendSettings.enableLearnHub ?? prev.enableLearnHub,
              enableCertificate: backendSettings.enableCertificate ?? prev.enableCertificate,
              enableMyReport: backendSettings.enableMyReport ?? prev.enableMyReport,
              enableLiveQA: backendSettings.enableLiveQA ?? prev.enableLiveQA,
              enableLeaderboard: backendSettings.enableLeaderboard ?? prev.enableLeaderboard,
              enablePeerReview: backendSettings.enablePeerReview ?? prev.enablePeerReview,
              enableTelemetryAnalytics: backendSettings.enableTelemetryAnalytics ?? prev.enableTelemetryAnalytics,
              enableZoomSync: backendSettings.enableZoomSync ?? prev.enableZoomSync,
              defaultStudentPassword: backendSettings.defaultStudentPassword || prev.defaultStudentPassword,
              zoomConfig: backendSettings.zoomConfig || prev.zoomConfig,
            }));
          }
        })
        .catch((err) => console.warn("Settings fetch error:", err));
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 4000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // Real-Time Scheduled Meetings Cross-Tab & Backend Sync
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Instant 0ms cross-tab broadcast synchronization
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("mind2i_zoom_sync");
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "MEETINGS_UPDATED" && Array.isArray(event.data.meetings)) {
          setScheduledMeetings(event.data.meetings);
        }
        if (event.data && event.data.type === "SETTINGS_UPDATED" && event.data.settings) {
          setSettings(event.data.settings);
        }
      };
    } catch {
      // BroadcastChannel fallback
    }

    // 2. Fast 2000ms background polling for multi-device synchronization
    const fetchScheduledMeetings = () => {
      axios
        .get("/api/scheduled-meetings/")
        .then((res) => {
          if (Array.isArray(res.data)) {
            const apiMeetings: ScheduledMeeting[] = res.data.map((m: any) => ({
              ...m,
              batchId: m.batchId || m.batch,
            }));
            
            if (apiMeetings.length > 0) {
              setScheduledMeetings(apiMeetings);
            }
          }
        })
        .catch((err) => console.warn("Scheduled meetings fetch error:", err));
    };

    fetchScheduledMeetings();
    const interval = setInterval(fetchScheduledMeetings, 2000);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, []);

  // Update current student if batch changes in student view
  useEffect(() => {
    if (!selectedBatch) return;
    const matching = students.find((s) => s.batchId === selectedBatch.id);
    if (matching) {
      setCurrentStudent(matching);
    } else {
      // Clean default student for newly created batch with 0 fake score bleed
      setCurrentStudent({
        id: `guest_${selectedBatch.id}`,
        name: "Enrolled Student",
        email: "",
        mobile: "",
        batchId: selectedBatch.id,
        batchName: selectedBatch.name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedBatch.name)}`,
        college: selectedBatch.college,
        enrolledAt: new Date().toISOString(),
        status: "active",
        scores: {
          quizScore: 0,
          codingScore: 0,
          liveQAScore: 0,
          assignmentScore: 0,
          overallAccuracy: 0,
        },
        totalPoints: 0,
        activeStreakDays: 0,
        fastestResponseMs: 0,
        attendedSessions: 0,
        totalSessions: 0,
      });
    }
  }, [selectedBatch?.id, students, userRole]);

  // Handlers
  const handleAddStudent = (newStudent: Partial<Student>) => {
    const targetBatch = (newStudent.batchId ? batches.find((b) => b.id === newStudent.batchId) : null) || selectedBatch;
    const targetBatchId = newStudent.batchId || targetBatch?.id || "batch_default";
    const targetBatchName = newStudent.batchName || targetBatch?.name || "General Batch";
    const targetCollege = newStudent.college || targetBatch?.college || "College / Institution";

    const fullStudent: Student = {
      id: newStudent.id || `stu_${Date.now()}`,
      name: newStudent.name || "New Student",
      email: newStudent.email || `student_${Date.now()}@mind2i.edu`,
      mobile: newStudent.mobile || "",
      college: targetCollege,
      branch: newStudent.branch || "",
      city: newStudent.city || "",
      state: newStudent.state || "",
      password: newStudent.password || settings?.defaultStudentPassword || "student123",
      batchId: targetBatchId,
      batchName: targetBatchName,
      avatar: newStudent.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newStudent.name || "Student")}`,
      status: newStudent.status || "active",
      enrolledAt: newStudent.enrolledAt || new Date().toISOString(),
      scores: newStudent.scores || {
        quizScore: 0,
        codingScore: 0,
        liveQAScore: 0,
        assignmentScore: 0,
        overallAccuracy: 0.0,
      },
      totalPoints: newStudent.totalPoints || 0,
      activeStreakDays: 0,
      fastestResponseMs: 0,
      attendedSessions: 0,
      totalSessions: 0,
    };
    setStudents((prev) => [fullStudent, ...prev.filter((s) => s.email !== fullStudent.email)]);

    // Update batch studentCount
    setBatches((prev) =>
      prev.map((b) =>
        b.id === fullStudent.batchId ? { ...b, studentCount: (b.studentCount || 0) + 1 } : b
      )
    );

    // Persist to Backend
    const payload = {
      ...fullStudent,
      batch: fullStudent.batchId,
      batchId: fullStudent.batchId,
    };
    axios.post('/api/students/', payload)
      .catch(err => console.error("Failed to save student to API:", err));
  };

  const handleBulkAddStudents = (newStudents: Partial<Student>[]) => {
    const fullList: Student[] = newStudents.map((s, idx) => ({
      id: `stu_bulk_${Date.now()}_${idx}`,
      name: s.name || `Student ${idx + 1}`,
      email: s.email || `student${idx + 1}@mind2i.edu`,
      mobile: s.mobile || "",
      college: s.college || selectedBatch.college,
      batchId: s.batchId || selectedBatch.id,
      batchName: s.batchName || selectedBatch.name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.name || idx.toString())}`,
      status: "active",
      enrolledAt: new Date().toISOString(),
      scores: s.scores || {
        quizScore: 0,
        codingScore: 0,
        liveQAScore: 0,
        assignmentScore: 0,
        overallAccuracy: 0.0,
      },
      totalPoints: 0,
      activeStreakDays: 0,
      fastestResponseMs: 0,
      attendedSessions: 0,
      totalSessions: 0,
    }));
    setStudents((prev) => [...fullList, ...prev]);

    // Persist all to Backend
    fullList.forEach(student => {
      const payload = {
        ...student,
        batch: student.batchId,
      };
      axios.post('/api/students/', payload)
        .catch(err => console.error("Failed to save bulk student to API:", err));
    });
  };

  const handleEditStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    const payload = {
      ...updatedStudent,
      batch: updatedStudent.batchId,
    };
    axios.put(`/api/students/${updatedStudent.id}/`, payload)
      .catch(err => console.error("Failed to update student:", err));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    axios.delete(`/api/students/${studentId}/`)
      .catch(err => console.error("Failed to delete student:", err));
  };

  // Batch Management Handlers (Add, Update, Delete)
  const handleCreateBatch = (newBatchData: Partial<Batch>, cloneFromBatchId?: string, cloneAssignmentsBatchId?: string): Batch => {
    const newBatch: Batch = {
      id: `batch_${Date.now()}`,
      name: newBatchData.name || "New Batch",
      type: newBatchData.type || "workshop",
      durationLabel: newBatchData.durationLabel || "1 Day Intensive",
      college: newBatchData.college || "Tech Institute",
      startDate: newBatchData.startDate || new Date().toISOString().split("T")[0],
      endDate: newBatchData.endDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      status: newBatchData.status || "active",
      studentCount: 0,
      description:
        newBatchData.description ||
        "Interactive hands-on session focusing on state-of-the-art AI tooling and development.",
      registrationCode:
        newBatchData.registrationCode || `M2I-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    if (cloneFromBatchId) {
      // Find all modules belonging to the old batch (or global modules if no batchId)
      const modulesToClone = learnHubModules.filter(
        (m) => !m.batchId || m.batchId === cloneFromBatchId
      );
      
      const clonedModules: LearnHubModule[] = modulesToClone.map((mod) => ({
        ...mod,
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: newBatch.id,
        // Deep copy slides if they exist so we don't mutate the original
        slides: mod.slides ? mod.slides.map(s => ({ ...s, id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) : undefined
      }));

      setLearnHubModules((prev) => [...prev, ...clonedModules]);
    }

    if (cloneAssignmentsBatchId) {
      const assignmentsToClone = assignments.filter(
        (a) => !a.batchId || a.batchId === cloneAssignmentsBatchId
      );

      const clonedAssignments: Assignment[] = assignmentsToClone.map((asg) => ({
        ...asg,
        id: `asg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: newBatch.id,
        questions: asg.questions ? asg.questions.map(q => ({ ...q, id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) : []
      }));

      setAssignments((prev) => [...clonedAssignments, ...prev]);

      clonedAssignments.forEach((asg) => {
        axios
          .post("/api/assignments/", {
            ...asg,
            batch: asg.batchId,
            batchId: asg.batchId,
          })
          .catch((err) => console.error("Failed to persist cloned assignment:", err));
      });
    }

    setBatches((prev) => [newBatch, ...prev]);
    setSelectedBatch(newBatch);

    // Persist to Backend
    axios.post('/api/batches/', newBatch)
      .catch(err => console.error("Failed to save batch to API:", err));

    return newBatch;
  };

  const handleUpdateBatch = (updatedBatch: Batch, cloneFromBatchId?: string, cloneAssignmentsBatchId?: string) => {
    if (cloneFromBatchId) {
      // Find all modules belonging to the old batch (or global modules if no batchId)
      const modulesToClone = learnHubModules.filter(
        (m) => !m.batchId || m.batchId === cloneFromBatchId
      );
      
      const clonedModules: LearnHubModule[] = modulesToClone.map((mod) => ({
        ...mod,
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: updatedBatch.id,
        // Deep copy slides if they exist so we don't mutate the original
        slides: mod.slides ? mod.slides.map(s => ({ ...s, id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) : undefined
      }));

      setLearnHubModules((prev) => [...prev, ...clonedModules]);
    }

    if (cloneAssignmentsBatchId) {
      const assignmentsToClone = assignments.filter(
        (a) => !a.batchId || a.batchId === cloneAssignmentsBatchId
      );

      const clonedAssignments: Assignment[] = assignmentsToClone.map((asg) => ({
        ...asg,
        id: `asg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: updatedBatch.id,
        questions: asg.questions ? asg.questions.map(q => ({ ...q, id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) : []
      }));

      setAssignments((prev) => [...clonedAssignments, ...prev]);

      clonedAssignments.forEach((asg) => {
        axios
          .post("/api/assignments/", {
            ...asg,
            batch: asg.batchId,
            batchId: asg.batchId,
          })
          .catch((err) => console.error("Failed to persist cloned assignment:", err));
      });
    }

    setBatches((prev) =>
      prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
    );
    if (selectedBatch.id === updatedBatch.id) {
      setSelectedBatch(updatedBatch);
    }

    axios.put(`/api/batches/${updatedBatch.id}/`, updatedBatch)
      .catch(err => console.error("Failed to update batch:", err));
    setStudents((prev) =>
      prev.map((s) =>
        s.batchId === updatedBatch.id ? { ...s, batchName: updatedBatch.name, college: updatedBatch.college } : s
      )
    );
  };

  const handleUpdateStudentProfile = (updatedStudent: Student) => {
    setCurrentStudent(updatedStudent);
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    if (loggedInUser && loggedInUser.email === updatedStudent.email) {
      setLoggedInUser({
        ...loggedInUser,
        name: updatedStudent.name,
      });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    const remaining = batches.filter((b) => b.id !== batchId);
    setBatches(remaining);
    if (selectedBatch.id === batchId && remaining.length > 0) {
      setSelectedBatch(remaining[0]);
    }

    axios.delete(`/api/batches/${batchId}/`)
      .catch(err => console.error("Failed to delete batch:", err));
  };

  const handleCreateInstantPoll = (q: {
    question: string;
    options: string[];
    correctAnswer?: string;
    type: "mcq" | "poll" | "true_false" | "open";
    timeLimitSeconds?: number;
    points?: number;
    explanation?: string;
  }) => {
    const nowIso = new Date().toISOString();
    const newLiveQ: LiveQuestion = {
      id: `live_${Date.now()}`,
      batchId: selectedBatch.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timeLimitSeconds: q.timeLimitSeconds || 30,
      points: q.points || 100,
      explanation: q.explanation,
      isActive: true,
      isClosed: false,
      isLocked: false,
      launchedAt: nowIso,
      createdAt: nowIso,
      responses: [],
    };
    setLiveQuestions((prev) => [newLiveQ, ...prev]);

    axios.post('/api/live-questions/', {
      ...newLiveQ,
      batch: selectedBatch.id,
      batchId: selectedBatch.id,
    }).catch(err => console.error("Failed to create live question:", err));
  };

  const handleAddLiveQuestion = (q: LiveQuestion) => {
    const nowIso = new Date().toISOString();
    const preparedQ: LiveQuestion = {
      ...q,
      launchedAt: !q.isLocked ? (q.launchedAt || nowIso) : undefined,
      createdAt: q.createdAt || nowIso,
    };
    setLiveQuestions((prev) => [preparedQ, ...prev]);
    axios.post('/api/live-questions/', {
      ...preparedQ,
      batch: preparedQ.batchId || selectedBatch.id,
      batchId: preparedQ.batchId || selectedBatch.id,
    }).catch(err => console.error("Failed to create live question:", err));
  };

  const handleBulkAddQuestions = (qs: LiveQuestion[]) => {
    const nowIso = new Date().toISOString();
    const preparedQs = qs.map(q => ({
      ...q,
      launchedAt: !q.isLocked ? (q.launchedAt || nowIso) : undefined,
      createdAt: q.createdAt || nowIso,
    }));
    setLiveQuestions((prev) => [...preparedQs, ...prev]);
    axios.post('/api/live-questions/bulk_create/', {
      batchId: selectedBatch.id,
      questions: preparedQs,
    }).catch(err => console.error("Failed to bulk create live questions:", err));
  };

  const handleSubmitLiveAnswer = (
    questionId: string,
    answer: string,
    isCorrect?: boolean,
    responseTimeMs?: number
  ) => {
    const responseTime = responseTimeMs || 1800 + Math.floor(Math.random() * 1200);

    if (responseTime > 0 && (!currentStudent.fastestResponseMs || responseTime < currentStudent.fastestResponseMs)) {
      setCurrentStudent((prev) => ({ ...prev, fastestResponseMs: responseTime }));
      setStudents((prev) => prev.map((s) => s.id === currentStudent.id ? { ...s, fastestResponseMs: responseTime } : s));
    }

    setLiveQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const exists = q.responses.some((r) => r.studentId === currentStudent.id);
        if (exists) return q;

        const resolvedCorrect =
          q.type === "poll"
            ? undefined
            : q.correctAnswer
            ? q.correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
            : isCorrect;

        return {
          ...q,
          responses: [
            ...q.responses,
            {
              studentId: currentStudent.id,
              studentName: currentStudent.name,
              avatar: currentStudent.avatar,
              answer,
              isCorrect: resolvedCorrect,
              responseTimeMs: responseTime,
              submittedAt: new Date().toISOString(),
              timestamp: Date.now(),
            },
          ],
        };
      })
    );

    const questionObj = liveQuestions.find((q) => q.id === questionId);
    const resolvedCorrect =
      questionObj?.type === "poll"
        ? undefined
        : questionObj?.correctAnswer
        ? questionObj.correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
        : isCorrect;

    axios.post(`/api/live-questions/${questionId}/respond/`, {
      studentId: currentStudent.id,
      answer,
      isCorrect: resolvedCorrect,
      responseTimeMs: responseTime,
    }).then(res => {
      if (res.data) {
        setLiveQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...res.data, batchId: res.data.batch || res.data.batchId } : q))
        );
      }
      // Instantly refresh live telemetry & standings across all views
      fetchStudents(selectedBatch?.id);
    }).catch(err => console.error("Failed to submit live answer:", err));
  };

  const handleUpdateLiveQuestion = (updatedQ: LiveQuestion) => {
    setLiveQuestions((prev) =>
      prev.map((q) => (q.id === updatedQ.id ? updatedQ : q))
    );

    axios.patch(`/api/live-questions/${updatedQ.id}/`, {
      ...updatedQ,
      batch: updatedQ.batchId || selectedBatch.id,
    }).catch(err => console.error("Failed to update live question:", err));
  };

  const handleDeleteLiveQuestion = (qId: string) => {
    setLiveQuestions((prev) => prev.filter((q) => q.id !== qId));

    axios.delete(`/api/live-questions/${qId}/`)
      .catch(err => console.error("Failed to delete live question:", err));
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    axios
      .post("/api/settings/", {
        id: "global",
        ...newSettings,
      })
      .catch((err) => console.error("Failed to save settings to backend:", err));
  };

  const handleToggleRecordingUnlock = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      zoomConfig: {
        ...settings.zoomConfig,
        isRecordingUnlocked: !settings.zoomConfig.isRecordingUnlocked,
      },
    };
    handleUpdateSettings(updatedSettings);
  };

  // -------------------------------------------------------------
  // Scheduled Meetings Handlers (N-Meetings per Batch)
  // -------------------------------------------------------------
  const broadcastMeetingsUpdate = (meetings: ScheduledMeeting[]) => {
    try {
      const channel = new BroadcastChannel("mind2i_zoom_sync");
      channel.postMessage({ type: "MEETINGS_UPDATED", meetings });
      channel.close();
    } catch {}
  };

  const handleCreateScheduledMeeting = async (meeting: Partial<ScheduledMeeting>) => {
    const newMeet: ScheduledMeeting = {
      id: meeting.id || `meet_${Date.now()}`,
      batchId: meeting.batchId || selectedBatch?.id || "",
      title: meeting.title || "Scheduled Workshop Session",
      agenda: meeting.agenda || "",
      instructorName: meeting.instructorName || settings?.zoomConfig?.instructorName || "",
      scheduledDate: meeting.scheduledDate || "Today",
      scheduledTime: meeting.scheduledTime || "10:00 AM - 01:00 PM",
      meetingLink: meeting.meetingLink || "",
      meetingId: meeting.meetingId || "",
      passcode: meeting.passcode || "",
      status: meeting.status || "scheduled",
      recordingUrl: meeting.recordingUrl || "",
      isPublished: meeting.isPublished !== false,
      isRecordingUnlocked: true,
      orderIndex: meeting.orderIndex || scheduledMeetings.length + 1,
      createdAt: new Date().toISOString(),
    };

    const nextMeetings = [...scheduledMeetings, newMeet];
    setScheduledMeetings(nextMeetings);
    broadcastMeetingsUpdate(nextMeetings);

    if (newMeet.status === "live" || newMeet.batchId === selectedBatch?.id) {
      const updatedZoom = {
        ...settings.zoomConfig,
        topic: newMeet.title,
        agenda: newMeet.agenda,
        instructorName: newMeet.instructorName || settings?.zoomConfig?.instructorName || "",
        meetingLink: newMeet.meetingLink,
        meetingId: newMeet.meetingId || "",
        passcode: newMeet.passcode || "",
        status: newMeet.status as any,
        scheduledDate: newMeet.scheduledDate,
        scheduledTime: newMeet.scheduledTime,
      };
      handleUpdateSettings({
        ...settings,
        zoomConfig: updatedZoom,
      });
    }

    try {
      const res = await axios.post("/api/scheduled-meetings/", {
        ...newMeet,
        batch: newMeet.batchId,
      });
      if (res.data && res.data.id) {
        const synced = nextMeetings.map((m) =>
          m.id === newMeet.id
            ? { ...res.data, batchId: res.data.batchId || res.data.batch }
            : m
        );
        setScheduledMeetings(synced);
        broadcastMeetingsUpdate(synced);
      }
    } catch (err) {
      console.error("Failed to create scheduled meeting on backend:", err);
    }
  };

  const handleUpdateScheduledMeeting = async (updatedMeet: ScheduledMeeting) => {
    const nextMeetings = scheduledMeetings.map((m) =>
      m.id === updatedMeet.id ? updatedMeet : m
    );
    setScheduledMeetings(nextMeetings);
    broadcastMeetingsUpdate(nextMeetings);

    if (updatedMeet.status === "live" || updatedMeet.batchId === selectedBatch?.id) {
      const updatedZoom = {
        ...settings.zoomConfig,
        topic: updatedMeet.title,
        agenda: updatedMeet.agenda,
        instructorName: updatedMeet.instructorName || settings?.zoomConfig?.instructorName || "",
        meetingLink: updatedMeet.meetingLink,
        meetingId: updatedMeet.meetingId || "",
        passcode: updatedMeet.passcode || "",
        status: updatedMeet.status as any,
        scheduledDate: updatedMeet.scheduledDate,
        scheduledTime: updatedMeet.scheduledTime,
      };
      handleUpdateSettings({
        ...settings,
        zoomConfig: updatedZoom,
      });
    }

    try {
      const res = await axios.put(`/api/scheduled-meetings/${updatedMeet.id}/`, {
        ...updatedMeet,
        batch: updatedMeet.batchId,
      });
      if (res.data && res.data.id) {
        const synced = nextMeetings.map((m) =>
          m.id === updatedMeet.id
            ? { ...res.data, batchId: res.data.batchId || res.data.batch }
            : m
        );
        setScheduledMeetings(synced);
        broadcastMeetingsUpdate(synced);
      }
    } catch (err) {
      console.error("Failed to update scheduled meeting on backend:", err);
    }
  };

  const handleDeleteScheduledMeeting = async (meetingId: string) => {
    const nextMeetings = scheduledMeetings.filter((m) => m.id !== meetingId);
    setScheduledMeetings(nextMeetings);
    broadcastMeetingsUpdate(nextMeetings);

    try {
      await axios.delete(`/api/scheduled-meetings/${meetingId}/`);
    } catch (err) {
      console.error("Failed to delete scheduled meeting on backend:", err);
    }
  };

  const handleSetLiveMeeting = (meeting: ScheduledMeeting) => {
    const nextMeetings = scheduledMeetings.map((m) => {
      if (m.id === meeting.id) {
        return { ...m, status: "live" as const };
      }
      if (m.batchId === meeting.batchId && m.status === "live") {
        return { ...m, status: "scheduled" as const };
      }
      return m;
    });

    setScheduledMeetings(nextMeetings);
    broadcastMeetingsUpdate(nextMeetings);

    const updatedZoom = {
      ...settings.zoomConfig,
      topic: meeting.title,
      agenda: meeting.agenda,
      instructorName: meeting.instructorName || settings?.zoomConfig?.instructorName || "",
      meetingLink: meeting.meetingLink,
      meetingId: meeting.meetingId || "",
      passcode: meeting.passcode || "",
      status: "live" as const,
      scheduledDate: meeting.scheduledDate,
      scheduledTime: meeting.scheduledTime,
    };
    handleUpdateSettings({
      ...settings,
      zoomConfig: updatedZoom,
    });

    axios
      .post(`/api/scheduled-meetings/${meeting.id}/set_live/`)
      .catch(() => {
        axios.put(`/api/scheduled-meetings/${meeting.id}/`, {
          ...meeting,
          status: "live",
          batch: meeting.batchId,
        });
      });
  };

  // -------------------------------------------------------------
  // Assignment Backend Synchronization Handlers
  // -------------------------------------------------------------
  const handleCreateAssignment = (newAsg: Assignment) => {
    setAssignments((prev) => [newAsg, ...prev]);

    const payload = {
      ...newAsg,
      batch: newAsg.batchId || selectedBatch.id,
      batchId: newAsg.batchId || selectedBatch.id,
    };
    axios
      .post("/api/assignments/", payload)
      .catch((err) => console.error("Failed to save assignment to backend:", err));
  };

  const handleUpdateAssignment = (updatedAsg: Assignment) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === updatedAsg.id ? updatedAsg : a))
    );

    const payload = {
      ...updatedAsg,
      batch: updatedAsg.batchId || selectedBatch.id,
      batchId: updatedAsg.batchId || selectedBatch.id,
    };
    axios
      .put(`/api/assignments/${updatedAsg.id}/`, payload)
      .catch((err) => console.error("Failed to update assignment on backend:", err));
  };

  const handleDeleteAssignment = (asgId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== asgId));

    axios
      .delete(`/api/assignments/${asgId}/`)
      .catch((err) => console.error("Failed to delete assignment from backend:", err));
  };

  // LearnHub Backend Synchronization Handlers
  const handleUpdateLearnHubModules = (updatedList: LearnHubModule[]) => {
    setLearnHubModules(updatedList);
    updatedList.forEach((mod) => {
      const payload = {
        ...mod,
        batch: mod.batchId || selectedBatch.id,
      };
      axios.put(`/api/learnhub-modules/${mod.id}/`, payload)
        .catch(() => {
          axios.post('/api/learnhub-modules/', payload)
            .catch(err => console.error("Failed to persist LearnHub module:", err));
        });
    });
  };

  const handleUpdateSingleModule = (updatedModule: LearnHubModule) => {
    setLearnHubModules((prev) => {
      const exists = prev.some((m) => m.id === updatedModule.id);
      if (exists) {
        return prev.map((m) => (m.id === updatedModule.id ? updatedModule : m));
      }
      return [...prev, updatedModule];
    });

    const payload = {
      ...updatedModule,
      batch: updatedModule.batchId || selectedBatch.id,
    };
    axios.put(`/api/learnhub-modules/${updatedModule.id}/`, payload)
      .catch(() => {
        axios.post('/api/learnhub-modules/', payload)
          .catch(err => console.error("Failed to save single module to PostgreSQL:", err));
      });
  };

  const handleDeleteLearnHubModule = (moduleId: string) => {
    setLearnHubModules((prev) => prev.filter((m) => m.id !== moduleId));
    axios.delete(`/api/learnhub-modules/${moduleId}/`)
      .catch(err => console.error("Failed to delete module from PostgreSQL:", err));
  };

  // Attendance Synchronization Handlers
  const handleCreateAttendanceSession = (session: AttendanceSession) => {
    setAttendanceSessions((prev) => [session, ...prev]);
  };

  const handleUpdateAttendanceSession = (updatedSession: AttendanceSession) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const handleDeleteAttendanceSession = (sessionId: string) => {
    setAttendanceSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleFinalizeAttendanceSession = (session: AttendanceSession) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...session, status: "completed" as const } : s))
    );

    // Sync to students: update attendedSessions and totalSessions
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        const studentRecord = session.records.find((r) => r.studentId === student.id);
        if (!studentRecord) return student;

        const isPresent = studentRecord.status === "present" || studentRecord.status === "late";
        const currentTotal = student.totalSessions || 0;
        const currentAttended = student.attendedSessions || 0;

        return {
          ...student,
          totalSessions: currentTotal + 1,
          attendedSessions: isPresent ? currentAttended + 1 : currentAttended,
        };
      })
    );
  };

  // Nav Items for Admin vs Student
  const adminNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "batch", label: "Batch", icon: Users },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "learn_hub", label: "Learn Hub", icon: BookOpen },
    { id: "assignments", label: "Assignment", icon: Code2 },
    { id: "live_qa", label: "Live Q&A", icon: Radio },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "resources", label: "Resources", icon: Library },
    { id: "certificate", label: "Certificate", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "profile", label: "My Profile", icon: User },
  ];

  const studentNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(settings.enableLearnHub
      ? [{ id: "learn_hub", label: "Learn Hub", icon: BookOpen }]
      : []),
    ...(settings.enableCodingIDE
      ? [{ id: "assignments", label: "Assignment", icon: Code2 }]
      : []),
    ...(settings.enableLiveQA
      ? [{ id: "live_qa", label: "Live Q&A", icon: Radio }]
      : []),
    ...(settings.enableMyReport
      ? [{ id: "reports", label: "My Report", icon: BarChart3 }]
      : []),
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "resources", label: "Resources", icon: Library },
    ...(settings.enableCertificate
      ? [{ id: "certificate", label: "My Certificate", icon: Award }]
      : []),
    { id: "profile", label: "My Profile", icon: User },
  ];

  const currentNavItems = userRole === "admin" ? adminNavItems : studentNavItems;
  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser(null);
    setUserRole("student");
    setActiveTab("dashboard");
    localStorage.removeItem("mind2i_auth_session");
    localStorage.removeItem("mind2i_active_tab");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + "#dashboard");
    }
  };

  // Render Landing Page if not authenticated
  if (!isAuthenticated) {
    const regBatch = registrationBatchId
      ? batches.find((b) => b.id === registrationBatchId) || selectedBatch
      : null;

    return (
      <>
        <LandingView onLoginClick={() => setShowLoginModal(true)} />
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={(role, user) => {
              setIsAuthenticated(true);
              setUserRole(role);
              setLoggedInUser(user);
              setShowLoginModal(false);

              // Always force landing directly on Dashboard whenever logging in
              setActiveTab("dashboard");
              localStorage.setItem("mind2i_active_tab", "dashboard");
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", "#dashboard");
              }
              
              if (role === "student" && user) {
                // Case-insensitive email or ID lookup from existing students state
                const userEmail = (user.email || "").toLowerCase().trim();
                const stu = students.find(
                  (s) => (s.email && s.email.toLowerCase().trim() === userEmail) || (user.id && s.id === user.id)
                );

                const studentBatchId = user.batch || user.batchId || stu?.batchId;
                const fullStudent: Student = {
                  ...emptyStudent,
                  ...(stu || {}),
                  ...user,
                  id: user.id || stu?.id || `stu_${Date.now()}`,
                  name: user.name || stu?.name || "Student",
                  email: user.email || stu?.email || "",
                  mobile: user.mobile || stu?.mobile || "",
                  college: user.college || stu?.college || "Institute",
                  branch: user.branch || stu?.branch || "",
                  batchId: studentBatchId || "",
                  batchName: user.batchName || stu?.batchName || "",
                  scores: user.scores || stu?.scores || {
                    quizScore: 0,
                    codingScore: 0,
                    liveQAScore: 0,
                    assignmentScore: 0,
                    overallAccuracy: 0.0,
                  },
                  totalPoints: user.totalPoints ?? stu?.totalPoints ?? 0,
                  activeStreakDays: user.activeStreakDays ?? stu?.activeStreakDays ?? 1,
                  fastestResponseMs: user.fastestResponseMs ?? stu?.fastestResponseMs ?? 0,
                  attendedSessions: user.attendedSessions ?? stu?.attendedSessions ?? 0,
                  totalSessions: user.totalSessions ?? stu?.totalSessions ?? 0,
                };

                setCurrentStudent(fullStudent);

                // Select the matching batch and immediately fetch students for this batch
                const matchedBatch = batches.find((x) => x.id === studentBatchId) || (batches.length > 0 ? batches[0] : null);
                if (matchedBatch) {
                  setSelectedBatch(matchedBatch);
                  fetchStudents(matchedBatch.id);
                }
              } else if (role === "admin" && user) {
                // If it's an admin/instructor with specific assigned batches
                const assigned = user.assignedBatches || [];
                if (assigned.length > 0 && !assigned.includes("all")) {
                  const firstAssigned = batches.find((x) => assigned.includes(x.id));
                  if (firstAssigned) setSelectedBatch(firstAssigned);
                }
              }
            }}
          />
        )}

        {registrationBatchId && regBatch && (
          <BatchRegistrationModal
            key={regBatch.id}
            batch={regBatch}
            existingStudents={students}
            onRegisterStudent={(newStu) => {
              handleAddStudent(newStu);
              const targetBatch = batches.find((b) => b.id === newStu.batchId) || regBatch;
              if (targetBatch) setSelectedBatch(targetBatch);
            }}
            onAutoLogin={(newStu) => {
              const fullStu: Student = {
                id: newStu.id || `stu_${Date.now()}`,
                name: newStu.name || "Student",
                email: newStu.email || "",
                mobile: newStu.mobile || "",
                college: newStu.college || regBatch.college,
                branch: newStu.branch || "",
                city: newStu.city || "",
                state: newStu.state || "",
                batchId: regBatch.id,
                batchName: regBatch.name,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newStu.name || "Student")}`,
                status: "active",
                enrolledAt: new Date().toISOString(),
                scores: {
                  quizScore: 0,
                  codingScore: 0,
                  liveQAScore: 0,
                  assignmentScore: 0,
                  overallAccuracy: 0.0,
                },
                totalPoints: 0,
                activeStreakDays: 1,
                fastestResponseMs: 0,
                attendedSessions: 0,
                totalSessions: 0,
              };
              setIsAuthenticated(true);
              setUserRole("student");
              setLoggedInUser({
                name: fullStu.name,
                email: fullStu.email,
                role: "student",
              });
              setCurrentStudent(fullStu);
              setSelectedBatch(regBatch);
              setRegistrationBatchId(null);
              setActiveTab("dashboard");
              localStorage.setItem("mind2i_active_tab", "dashboard");
              window.history.replaceState({}, document.title, window.location.pathname + "#dashboard");
              window.location.hash = "#dashboard";
            }}
            onClose={() => {
              setRegistrationBatchId(null);
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.hash = "";
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* ========================================================= */}
      {/* TOPBAR NAVIGATION — Premium glassmorphic header            */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 flex items-center justify-between shadow-lg shadow-slate-200/20">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500"></div>
        
        {/* Left: Brand Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Minda2Logo size="md" showTagline={true} />
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 border border-sky-100">
                {selectedBatch.type}
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-4 relative" ref={profileMenuRef}>
          <button 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {loggedInUser?.name?.charAt(0)?.toUpperCase() || "U"}
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <div className="text-sm font-black text-slate-800 truncate">{loggedInUser?.name || "User"}</div>
                  <div className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500 uppercase tracking-wider mt-0.5">{userRole}</div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN LAYOUT: SIDEBAR + CONTENT VIEW                       */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Compact & Sleek) */}
        <aside className="hidden lg:flex w-60 xl:w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 p-3.5 xl:p-4 flex-col justify-between overflow-y-auto flex-shrink-0 transition-all duration-200">
          <div className="space-y-4">
            {/* Sidebar Navigation Links */}
            <nav className="space-y-1">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2.5 pb-2 flex items-center justify-between">
                <span>{userRole === "admin" ? "Management Modules" : "Learning Portal"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50"></span>
              </div>

              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isLockedCert = item.id === "certificate" && !certificateTemplate.isUnlocked && userRole === "student";

                return (
                  <button
                    key={item.id}
                    disabled={isLockedCert}
                    onClick={() => {
                      if (!isLockedCert) setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left group ${
                      isLockedCert
                        ? "text-slate-400 opacity-70 cursor-not-allowed bg-slate-50/50"
                        : isActive
                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 font-black cursor-pointer"
                        : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-sky-50/50 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive && !isLockedCert ? "text-white" : "text-slate-400 group-hover:text-sky-500"}`} />
                      <span className="tracking-tight truncate">{item.label}</span>
                    </div>
                    {isLockedCert && <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="pt-3 text-center space-y-2 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            </div>
            <span className="text-[11px] font-black text-slate-600 block tracking-tight">
              MINDA2 Engine v2.6.0
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block truncate">
              {selectedBatch.college}
            </span>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex"
            >
              <div className="w-80 bg-white h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <Minda2Logo size="md" showTagline={false} />
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <nav className="space-y-1.5">
                    {currentNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const isLockedCert = item.id === "certificate" && !certificateTemplate.isUnlocked && userRole === "student";

                      return (
                        <button
                          key={item.id}
                          disabled={isLockedCert}
                          onClick={() => {
                            if (!isLockedCert) {
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition text-left ${
                            isLockedCert
                              ? "text-slate-400 opacity-70 cursor-not-allowed bg-slate-50/50"
                              : isActive
                              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black shadow-md shadow-sky-500/25"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive && !isLockedCert ? "text-white" : "text-slate-400"}`} />
                            <span className="tracking-tight">{item.label}</span>
                          </div>
                          {isLockedCert && <Lock className="w-4 h-4 text-slate-400" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-4">
                  <div className="text-center text-xs text-slate-400 font-semibold border-t border-slate-100 pt-4">
                    MINDA2 • IMAGINATION TO INNOVATION
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area — subtle pattern background */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'}}>
          {/* Subtle dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Global Live Stream Floating Notification for Students across ALL tabs */}
            {userRole === "student" && settings.enableZoomSync && (
              (() => {
                const batchMeetings = scheduledMeetings.filter((m) => m.batchId === selectedBatch.id);
                const activeLive = batchMeetings.find((m) => m.status === "live");
                const currentLiveConfig = activeLive
                  ? {
                      topic: activeLive.title,
                      instructorName: activeLive.instructorName,
                      passcode: activeLive.passcode,
                      meetingLink: activeLive.meetingLink,
                    }
                  : settings.zoomConfig?.status === "live" && settings.zoomConfig?.meetingLink
                  ? settings.zoomConfig
                  : null;

                if (!currentLiveConfig || !currentLiveConfig.meetingLink) return null;

                return (
                  <div className="mb-6 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-rose-500/20 border border-rose-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                            🔴 LIVE WORKSHOP NOW
                          </span>
                          <span className="text-xs font-black truncate">{currentLiveConfig.topic}</span>
                        </div>
                        <p className="text-[11px] text-white/90 truncate mt-0.5">
                          Host: {currentLiveConfig.instructorName || "MINDA2 Team"} • Passcode: {currentLiveConfig.passcode || "None"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                      <a
                        href={currentLiveConfig.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-rose-600 rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Zoom Stream</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })()
            )}

            {/* VIEW 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <>
                {userRole === "admin" ? (
                  <AdminDashboardView
                    batches={batches}
                    selectedBatch={selectedBatch}
                    onSelectBatch={setSelectedBatch}
                    students={students}
                    liveQuestions={liveQuestions}
                    assignments={assignments}
                    settings={settings}
                    scheduledMeetings={scheduledMeetings}
                    onUpdateSettings={handleUpdateSettings}
                    onToggleRecordingUnlock={handleToggleRecordingUnlock}
                    onNavigateTab={setActiveTab}
                    onCreateInstantPoll={handleCreateInstantPoll}
                    onViewStudent={(s) => setInspectedStudent(s)}
                  />
                ) : (
                  <StudentDashboardView
                    currentStudent={currentStudent}
                    selectedBatch={selectedBatch}
                    assignments={assignments}
                    liveQuestions={liveQuestions}
                    settings={settings}
                    scheduledMeetings={scheduledMeetings}
                    onNavigateTab={setActiveTab}
                    onSubmitLiveAnswer={handleSubmitLiveAnswer}
                    onUpdateSettings={handleUpdateSettings}
                    onUpdateScheduledMeeting={handleUpdateScheduledMeeting}
                    onToggleRecordingUnlock={handleToggleRecordingUnlock}
                  />
                )}
              </>
            )}

            {/* VIEW 2: BATCH MANAGEMENT */}
            {activeTab === "batch" && userRole === "admin" && (
              <BatchManagementView
                batches={batches}
                selectedBatch={selectedBatch}
                settings={settings}
                onSelectBatch={setSelectedBatch}
                onCreateBatch={handleCreateBatch}
                onUpdateBatch={handleUpdateBatch}
                onDeleteBatch={handleDeleteBatch}
                students={students}
                onAddStudent={handleAddStudent}
                onBulkAddStudents={handleBulkAddStudents}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onViewStudentDetails={(s) => setInspectedStudent(s)}
                onOpenSelfRegisterPortal={(batchId) => {
                  setRegistrationBatchId(batchId);
                  const target = batches.find((b) => b.id === batchId);
                  if (target) setSelectedBatch(target);
                  window.location.hash = `#register?batch=${batchId}`;
                }}
              />
            )}

            {/* VIEW 2B: ATTENDANCE MANAGEMENT (ADMIN ONLY) */}
            {activeTab === "attendance" && userRole === "admin" && (
              <AttendanceManagerView
                batches={batches}
                selectedBatch={selectedBatch}
                onSelectBatch={setSelectedBatch}
                students={students}
                onUpdateStudent={handleEditStudent}
                attendanceSessions={attendanceSessions}
                onSaveAttendanceSession={handleUpdateAttendanceSession}
                onCreateSession={handleCreateAttendanceSession}
                onUpdateSession={handleUpdateAttendanceSession}
                onDeleteAttendanceSession={handleDeleteAttendanceSession}
                onDeleteSession={handleDeleteAttendanceSession}
                onFinalizeSession={handleFinalizeAttendanceSession}
                onNavigateToReports={() => setActiveTab("reports")}
                userRole={userRole}
                currentStudent={currentStudent}
              />
            )}

            {/* VIEW 3: LEARN HUB */}
            {activeTab === "learn_hub" && (
              <LearnHubInteractive
                modules={learnHubModules}
                selectedBatch={selectedBatch}
                userRole={userRole}
                currentStudent={currentStudent}
                students={students}
                onUpdateModules={handleUpdateLearnHubModules}
                onUpdateModule={handleUpdateSingleModule}
              />
            )}

            {/* VIEW 4: ASSIGNMENTS & IN-BROWSER IDE */}
            {activeTab === "assignments" && (
              <AssignmentManagerView
                assignments={assignments}
                selectedBatch={selectedBatch}
                userRole={userRole}
                currentStudent={currentStudent}
                students={students}
                onCreateAssignment={handleCreateAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onSubmissionComplete={() => fetchStudents(selectedBatch?.id)}
              />
            )}

            {/* VIEW 5: LIVE Q&A */}
            {activeTab === "live_qa" && (
              <LiveQAManagerView
                liveQuestions={liveQuestions}
                selectedBatch={selectedBatch}
                userRole={userRole}
                currentStudent={currentStudent}
                students={students}
                settings={settings}
                scheduledMeetings={scheduledMeetings}
                onAddLiveQuestion={handleAddLiveQuestion}
                onBulkAddQuestions={handleBulkAddQuestions}
                onUpdateLiveQuestion={handleUpdateLiveQuestion}
                onDeleteLiveQuestion={handleDeleteLiveQuestion}
                onSubmitLiveAnswer={handleSubmitLiveAnswer}
                onToggleRecordingUnlock={handleToggleRecordingUnlock}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {/* VIEW 6: REPORTS & ANALYTICS */}
            {activeTab === "reports" && (
              <ReportsAnalyticsView
                batches={batches}
                selectedBatch={selectedBatch}
                students={students}
                attendanceSessions={attendanceSessions}
                liveQuestions={liveQuestions}
                assignments={assignments}
                learnHubModules={learnHubModules}
                settings={settings}
                userRole={userRole}
                currentStudent={currentStudent}
                onViewStudent={(s) => setInspectedStudent(s)}
                onUpdateStudent={handleEditStudent}
              />
            )}

            {/* VIEW 7: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <LeaderboardView
                selectedBatch={selectedBatch}
                students={students}
                userRole={userRole}
                currentStudent={currentStudent}
                onViewStudent={(s) => setInspectedStudent(s)}
              />
            )}

            {/* VIEW 7B: RESOURCES */}
            {activeTab === "resources" && (
              <ResourcesView
                modules={learnHubModules}
                batch={selectedBatch}
                scheduledMeetings={scheduledMeetings}
              />
            )}

            {/* VIEW 8: CERTIFICATE */}
            {activeTab === "certificate" && (
              <CertificateManagerView
                certificateTemplate={certificateTemplate}
                selectedBatch={selectedBatch}
                userRole={userRole}
                currentStudent={currentStudent}
                students={students}
                onUpdateCertificateTemplate={setCertificateTemplate}
              />
            )}

            {/* VIEW 9: SETTINGS */}
            {activeTab === "settings" && userRole === "admin" && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                batches={batches}
                selectedBatch={selectedBatch}
                scheduledMeetings={scheduledMeetings}
                onCreateScheduledMeeting={handleCreateScheduledMeeting}
                onUpdateScheduledMeeting={handleUpdateScheduledMeeting}
                onDeleteScheduledMeeting={handleDeleteScheduledMeeting}
                onSetLiveMeeting={handleSetLiveMeeting}
              />
            )}

            {/* VIEW 11: PROFILE */}
            {activeTab === "profile" && (
              <ProfileView
                userRole={userRole}
                currentStudent={currentStudent}
                onUpdateStudent={handleUpdateStudentProfile}
              />
            )}

            {/* FALLBACK VIEW: Always render Dashboard if activeTab is not recognized or unauthorized */}
            {!["dashboard", "learn_hub", "assignments", "live_qa", "reports", "leaderboard", "resources", "certificate", "profile", ...(userRole === "admin" ? ["batch", "attendance", "settings"] : [])].includes(activeTab) && (
              userRole === "admin" ? (
                <AdminDashboardView
                  batches={batches}
                  selectedBatch={selectedBatch}
                  onSelectBatch={setSelectedBatch}
                  students={students}
                  liveQuestions={liveQuestions}
                  assignments={assignments}
                  settings={settings}
                  scheduledMeetings={scheduledMeetings}
                  onUpdateSettings={handleUpdateSettings}
                  onToggleRecordingUnlock={handleToggleRecordingUnlock}
                  onNavigateTab={setActiveTab}
                  onCreateInstantPoll={handleCreateInstantPoll}
                  onViewStudent={(s) => setInspectedStudent(s)}
                />
              ) : (
                <StudentDashboardView
                  currentStudent={currentStudent}
                  selectedBatch={selectedBatch}
                  assignments={assignments}
                  liveQuestions={liveQuestions}
                  settings={settings}
                  scheduledMeetings={scheduledMeetings}
                  onNavigateTab={setActiveTab}
                  onSubmitLiveAnswer={handleSubmitLiveAnswer}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdateScheduledMeeting={handleUpdateScheduledMeeting}
                  onToggleRecordingUnlock={handleToggleRecordingUnlock}
                />
              )
            )}

          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: FULL SCREEN EXECUTIVE EVALUATION REPORT (SAMPLE REFERENCE) */}
      {/* ========================================================= */}
      {inspectedStudent && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-6 flex justify-center">
          <ExecutiveEvaluationReport
            student={inspectedStudent}
            batch={batches.find((b) => b.id === inspectedStudent.batchId) || selectedBatch}
            students={students.filter((s) => s.batchId === inspectedStudent.batchId)}
            attendanceSessions={attendanceSessions}
            liveQuestions={liveQuestions}
            assignments={assignments}
            learnHubModules={learnHubModules}
            settings={settings}
            isFullScreenDefault={true}
            onSelectStudent={(s) => setInspectedStudent(s)}
            onUpdateStudent={(s) => {
              setInspectedStudent(s);
              handleEditStudent(s);
            }}
            onClose={() => setInspectedStudent(null)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: BATCH REGISTRATION MODAL */}
      {/* ========================================================= */}
      {registrationBatchId && (() => {
        const regBatch = batches.find((b) => b.id === registrationBatchId) || (selectedBatch?.id === registrationBatchId ? selectedBatch : null);
        if (!regBatch) return null;
        return (
          <BatchRegistrationModal
            key={regBatch.id}
            batch={regBatch}
            existingStudents={students}
            onRegisterStudent={(newStu) => {
              handleAddStudent(newStu);
              setRegistrationBatchId(null);
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.hash = "";
            }}
            onAutoLogin={(newStu) => {
              const targetBatch = batches.find((b) => b.id === newStu.batchId) || regBatch;
              if (targetBatch) setSelectedBatch(targetBatch);
              setRegistrationBatchId(null);
              setActiveTab("dashboard");
              localStorage.setItem("mind2i_active_tab", "dashboard");
              window.history.replaceState({}, document.title, window.location.pathname + "#dashboard");
              window.location.hash = "#dashboard";
            }}
            onClose={() => {
              setRegistrationBatchId(null);
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.hash = "";
            }}
          />
        );
      })()}
    </div>
  );
}
