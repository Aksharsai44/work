import React, { useState, useEffect, useRef } from "react";
import {
  LiveQuestion,
  LiveQAResponse,
  Batch,
  Student,
  UserRole,
  AppSettings,
} from "../types";
import {
  Radio,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Video,
  Play,
  Sparkles,
  Flame,
  Clock,
  Unlock,
  Lock,
  Layers,
  Award,
  ChevronRight,
  BarChart3,
  Users,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Download,
  HelpCircle,
  Vote,
  RotateCcw,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  Package,
  BookOpen,
  ArrowRight,
  Bell,
  Trash2,
  Eye,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Pin,
  FileText,
  CornerDownRight,
  SendHorizontal,
  Star,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { PRESET_QUIZ_PACKS, PresetQuizPack } from "../data/presetLiveQuizzes";
import { LiveSessionBanner } from "./LiveSessionBanner";
import { evaluateStudentOpenAnswer, getStarLabel, cleanInstructorReply } from "../utils/aiEvaluator";

interface LiveQAManagerViewProps {
  liveQuestions: LiveQuestion[];
  selectedBatch: Batch;
  userRole: UserRole;
  currentStudent?: Student;
  students: Student[];
  settings: AppSettings;
  scheduledMeetings?: import("../types").ScheduledMeeting[];
  onAddLiveQuestion: (q: LiveQuestion) => void;
  onBulkAddQuestions: (qs: LiveQuestion[]) => void;
  onUpdateLiveQuestion?: (q: LiveQuestion) => void;
  onDeleteLiveQuestion?: (qId: string) => void;
  onSubmitLiveAnswer: (questionId: string, answer: string, isCorrect?: boolean, responseTimeMs?: number) => void;
  onToggleRecordingUnlock: () => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
}

export const LiveQAManagerView: React.FC<LiveQAManagerViewProps> = ({
  liveQuestions,
  selectedBatch,
  userRole,
  currentStudent,
  students,
  settings,
  scheduledMeetings = [],
  onAddLiveQuestion,
  onBulkAddQuestions,
  onUpdateLiveQuestion,
  onDeleteLiveQuestion,
  onSubmitLiveAnswer,
  onToggleRecordingUnlock,
  onUpdateSettings,
}) => {
  const rawBatchQuestions = [...liveQuestions]
    .filter((q) => q.batchId === selectedBatch.id)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // For students, ONLY display questions that are NOT locked (isLocked !== true)
  const batchQuestions = userRole === "student"
    ? rawBatchQuestions.filter((q) => !q.isLocked)
    : rawBatchQuestions;

  const [selectedQuestion, setSelectedQuestion] = useState<LiveQuestion | null>(
    batchQuestions[0] || null
  );

  // Active filter for question bank list
  const [typeFilter, setTypeFilter] = useState<"all" | "mcq" | "poll" | "true_false" | "open" | "doubts">("all");
  const [questionSearch, setQuestionSearch] = useState("");

  // Detailed Report Modal state (when clicking on a question)
  const [inspectingQuestion, setInspectingQuestion] = useState<LiveQuestion | null>(null);
  const [reportActiveTab, setReportActiveTab] = useState<"all" | "correct" | "wrong" | "unattended" | "voted">("all");
  const [reportStudentSearch, setReportStudentSearch] = useState("");
  const [nudgedStudents, setNudgedStudents] = useState<Record<string, boolean>>({});

  // Single Question Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newType, setNewType] = useState<"mcq" | "poll" | "true_false" | "open">("mcq");
  const [newOptions, setNewOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [newCorrect, setNewCorrect] = useState("Option 1");
  const [newTimeLimit, setNewTimeLimit] = useState(30);
  const [newPoints, setNewPoints] = useState(100);
  const [newExplanation, setNewExplanation] = useState("");
  const [newIsLocked, setNewIsLocked] = useState(false);

  // Student Ask Doubt / Question Modal
  const [showAskDoubtModal, setShowAskDoubtModal] = useState(false);
  const [studentDoubtText, setStudentDoubtText] = useState("");
  const [studentDoubtCategory, setStudentDoubtCategory] = useState("General Doubt");

  // Bulk Generator / Importer Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkModalTab, setBulkModalTab] = useState<"ai" | "presets" | "csv">("ai");
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [bulkDifficulty, setBulkDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [bulkIncludeOpenQuestions, setBulkIncludeOpenQuestions] = useState(true);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [csvTextContent, setCsvTextContent] = useState("");
  const [parsedBulkCount, setParsedBulkCount] = useState<number | null>(null);

  // Student answer selection / written response maps (strictly isolated per question ID to prevent cross-question leaking)
  const [studentAnswerMap, setStudentAnswerMap] = useState<Record<string, string>>({});
  const [studentWrittenMap, setStudentWrittenMap] = useState<Record<string, string>>({});
  const [studentStoppedTimeMap, setStudentStoppedTimeMap] = useState<Record<string, number>>({});

  // Active question timer countdown
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);

  // Instructor quick response note for open questions (keyed by composite questionId_studentId)
  const [instructorNotes, setInstructorNotes] = useState<Record<string, string>>({});
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [evaluatingStudentId, setEvaluatingStudentId] = useState<string | null>(null);
  const [isEvaluatingAll, setIsEvaluatingAll] = useState(false);
  const [openReplyInputMap, setOpenReplyInputMap] = useState<Record<string, string>>({});
  const [openStarFilter, setOpenStarFilter] = useState<"all" | "5" | "4" | "3" | "1_2" | "unrated">("all");
  const [manualRatingMap, setManualRatingMap] = useState<Record<string, number>>({});
  const [reviewSavedMap, setReviewSavedMap] = useState<Record<string, boolean>>({});

  const batchStudents = students.filter((s) => s.batchId === selectedBatch.id);
  const totalBatchMembers = batchStudents.length;

  // Helper to extract effective stars (1-5) scoped per question
  const getEffectiveStars = (resp: LiveQAResponse, questionId?: string) => {
    const qId = questionId || (resp as any).questionId || selectedQuestion?.id;
    const compositeKey = qId ? `${qId}_${resp.studentId}` : resp.studentId;
    if (manualRatingMap[compositeKey] !== undefined) {
      return manualRatingMap[compositeKey];
    }
    if (manualRatingMap[resp.studentId] !== undefined) {
      return manualRatingMap[resp.studentId];
    }
    if (resp.rating !== undefined && resp.rating !== null) {
      if (resp.rating <= 5) return Math.round(resp.rating);
      return Math.min(5, Math.max(1, Math.round(resp.rating / 20)));
    }
    return 0; // Unrated
  };

  const getStarBadgeInfo = (stars?: number) => {
    if (!stars || stars === 0) return { label: "Pending Review", color: "bg-slate-100 text-slate-600 border-slate-200" };
    if (stars >= 5) return { label: "★★★★★ Strongest Rating (Exceptional)", color: "bg-amber-100 text-amber-900 border-amber-300" };
    if (stars === 4) return { label: "★★★★☆ Strong Rating (Proficient)", color: "bg-emerald-100 text-emerald-900 border-emerald-300" };
    if (stars === 3) return { label: "★★★☆☆ Solid Rating (Competent)", color: "bg-sky-100 text-sky-900 border-sky-300" };
    if (stars === 2) return { label: "★★☆☆☆ Developing Understanding", color: "bg-orange-100 text-orange-900 border-orange-300" };
    return { label: "★☆☆☆☆ Needs More Depth", color: "bg-slate-100 text-slate-700 border-slate-300" };
  };

  // Handler: Evaluate single student's written response using Gemini (with fallback)
  const handleEvaluateStudentAnswer = async (q: LiveQuestion, resp: LiveQAResponse) => {
    setEvaluatingStudentId(resp.studentId);
    try {
      const result = await evaluateStudentOpenAnswer({
        question: q.question,
        studentAnswer: resp.answer,
        sampleAnswer: q.sampleAnswer || q.explanation || q.correctAnswer,
        apiKey: settings.geminiApiKey,
      });

      const replyToSet = cleanInstructorReply(resp.instructorReply) || cleanInstructorReply(result.suggestedReply);
      const updatedResponses = q.responses.map((r) => {
        if (r.studentId === resp.studentId) {
          return {
            ...r,
            rating: result.stars,
            aiFeedback: result.feedback,
            instructorReply: replyToSet,
            reviewedAt: new Date().toISOString(),
          };
        }
        return r;
      });

      const updatedQ = { ...q, responses: updatedResponses };
      if (onUpdateLiveQuestion) {
        onUpdateLiveQuestion(updatedQ);
      }
      setSelectedQuestion(updatedQ);
      const evalKey = `${q.id}_${resp.studentId}`;
      setManualRatingMap((prev) => ({ ...prev, [evalKey]: result.stars, [resp.studentId]: result.stars }));
      setOpenReplyInputMap((prev) => ({
        ...prev,
        [evalKey]: replyToSet,
      }));

      // Direct backend API persistence
      axios.post(`/api/live-questions/${q.id}/review_response/`, {
        studentId: resp.studentId,
        rating: result.stars,
        aiFeedback: result.feedback,
        instructorReply: replyToSet,
        reviewer: "ai",
      }).catch((err) => console.error("Failed to sync AI evaluation to backend:", err));
    } catch (err) {
      console.error("AI Evaluation error:", err);
    } finally {
      setEvaluatingStudentId(null);
    }
  };

  // Handler: Evaluate all written responses in the question
  const handleEvaluateAllOpenAnswers = async (q: LiveQuestion) => {
    setIsEvaluatingAll(true);
    try {
      let currentResponses = [...q.responses];
      for (const resp of currentResponses) {
        const currentStars = getEffectiveStars(resp, q.id);
        if (currentStars === 0) {
          const result = await evaluateStudentOpenAnswer({
            question: q.question,
            studentAnswer: resp.answer,
            sampleAnswer: q.sampleAnswer || q.explanation || q.correctAnswer,
            apiKey: settings.geminiApiKey,
          });

          const replyToSet = cleanInstructorReply(resp.instructorReply) || cleanInstructorReply(result.suggestedReply);
          currentResponses = currentResponses.map((r) =>
            r.studentId === resp.studentId
              ? {
                  ...r,
                  rating: result.stars,
                  aiFeedback: result.feedback,
                  instructorReply: replyToSet,
                  reviewedAt: new Date().toISOString(),
                }
              : r
          );

          const evalKey = `${q.id}_${resp.studentId}`;
          setManualRatingMap((prev) => ({ ...prev, [evalKey]: result.stars, [resp.studentId]: result.stars }));
          setOpenReplyInputMap((prev) => ({
            ...prev,
            [evalKey]: replyToSet,
          }));

          axios.post(`/api/live-questions/${q.id}/review_response/`, {
            studentId: resp.studentId,
            rating: result.stars,
            aiFeedback: result.feedback,
            instructorReply: replyToSet,
            reviewer: "ai",
          }).catch((err) => console.error("Failed to sync bulk review to backend:", err));
        }
      }

      const updatedQ = { ...q, responses: currentResponses };
      if (onUpdateLiveQuestion) {
        onUpdateLiveQuestion(updatedQ);
      }
      setSelectedQuestion(updatedQ);
    } catch (err) {
      console.error("Bulk evaluation error:", err);
    } finally {
      setIsEvaluatingAll(false);
    }
  };

  // Handler: Save manual instructor star review & reply
  const handleSaveManualReview = (q: LiveQuestion, studentId: string, starRating: number, replyText: string) => {
    const finalStars = starRating > 0 ? starRating : 5;
    const cleanReply = cleanInstructorReply(replyText);
    const updatedResponses = q.responses.map((r) => {
      if (r.studentId === studentId) {
        return {
          ...r,
          rating: finalStars,
          instructorReply: cleanReply || cleanInstructorReply(r.instructorReply),
          reviewedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    const updatedQ = { ...q, responses: updatedResponses };
    if (onUpdateLiveQuestion) {
      onUpdateLiveQuestion(updatedQ);
    }
    setSelectedQuestion(updatedQ);
    const reviewKey = `${q.id}_${studentId}`;
    setManualRatingMap((prev) => ({ ...prev, [reviewKey]: finalStars, [studentId]: finalStars }));
    setReviewSavedMap((prev) => ({ ...prev, [reviewKey]: true, [studentId]: true }));
    setTimeout(() => {
      setReviewSavedMap((prev) => ({ ...prev, [reviewKey]: false, [studentId]: false }));
    }, 2500);

    // Direct backend API persistence
    axios.post(`/api/live-questions/${q.id}/review_response/`, {
      studentId,
      rating: finalStars,
      instructorReply: cleanReply,
      reviewer: "instructor",
    }).catch((err) => console.error("Failed to sync manual review to backend:", err));
  };

  // Sync selected question if list changes
  useEffect(() => {
    if (!selectedQuestion && batchQuestions.length > 0) {
      setSelectedQuestion(batchQuestions[0]);
    } else if (selectedQuestion) {
      if (userRole === "student" && selectedQuestion.isLocked) {
        const firstUnlocked = batchQuestions.find((q) => !q.isLocked);
        setSelectedQuestion(firstUnlocked || null);
      } else {
        const refreshed = rawBatchQuestions.find((q) => q.id === selectedQuestion.id);
        if (refreshed) {
          setSelectedQuestion(refreshed);
        } else if (batchQuestions.length > 0) {
          setSelectedQuestion(batchQuestions[0]);
        } else {
          setSelectedQuestion(null);
        }
      }
    }
  }, [batchQuestions, rawBatchQuestions, selectedQuestion, userRole]);

  // Sync inspecting question if active in modal
  useEffect(() => {
    if (inspectingQuestion) {
      const refreshed = rawBatchQuestions.find((q) => q.id === inspectingQuestion.id);
      if (refreshed) {
        setInspectingQuestion(refreshed);
      }
    }
  }, [rawBatchQuestions, inspectingQuestion]);

  // Synchronize student answer map with server responses per question
  useEffect(() => {
    if (selectedQuestion && currentStudent) {
      const existing = selectedQuestion.responses.find((r) => r.studentId === currentStudent.id);
      if (existing) {
        setStudentAnswerMap((prev) => ({ ...prev, [selectedQuestion.id]: existing.answer }));
        setStudentWrittenMap((prev) => ({ ...prev, [selectedQuestion.id]: existing.answer }));
      }
    }
  }, [selectedQuestion?.id, currentStudent?.id, selectedQuestion?.responses]);

  // Derived student response state for the currently active selectedQuestion (100% scoped to this question)
  const currentStudentResp = currentStudent && selectedQuestion
    ? selectedQuestion.responses.find((r) => r.studentId === currentStudent.id)
    : undefined;

  const currentQuestionChoice =
    (selectedQuestion ? studentAnswerMap[selectedQuestion.id] : undefined) ??
    currentStudentResp?.answer ??
    null;

  const currentQuestionWritten =
    (selectedQuestion ? studentWrittenMap[selectedQuestion.id] : undefined) ??
    currentStudentResp?.answer ??
    "";

  const studentHasAnswered = currentStudent && selectedQuestion
    ? !!currentStudentResp || !!(selectedQuestion && studentAnswerMap[selectedQuestion.id])
    : false;

  // Track question presentation time for accurate response latency
  const questionStartTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [selectedQuestion?.id]);

  // Synchronized Real-Time Timer & Countdown Calculation (Persistent Across Page Reloads & New Logins)
  useEffect(() => {
    const checkTimerSync = () => {
      if (!selectedQuestion) {
        setTimerSecondsLeft(null);
        return;
      }

      // If question is closed or locked, timer has completed (0)
      if (selectedQuestion.isClosed || selectedQuestion.isLocked) {
        setTimerSecondsLeft(0);
        return;
      }

      // If no timer limit configured, question has no countdown
      if (!selectedQuestion.timeLimitSeconds || selectedQuestion.timeLimitSeconds <= 0) {
        setTimerSecondsLeft(null);
        return;
      }

      // If student has already answered, stop active countdown immediately
      if (userRole === "student" && (studentHasAnswered || (currentStudent && selectedQuestion.responses.some((r) => r.studentId === currentStudent.id)))) {
        setTimerSecondsLeft(null);
        return;
      }

      const launchStr = selectedQuestion.launchedAt || selectedQuestion.createdAt;
      if (!launchStr) {
        setTimerSecondsLeft(null);
        return;
      }

      const launchMs = new Date(launchStr).getTime();
      if (isNaN(launchMs)) {
        setTimerSecondsLeft(null);
        return;
      }

      const expiryMs = launchMs + selectedQuestion.timeLimitSeconds * 1000;
      const diffSecs = Math.ceil((expiryMs - Date.now()) / 1000);

      if (diffSecs <= 0) {
        setTimerSecondsLeft(0);
        // If timer reached 0 and question is still marked open, automatically close it for admin
        if (!selectedQuestion.isClosed && userRole === "admin" && onUpdateLiveQuestion) {
          onUpdateLiveQuestion({ ...selectedQuestion, isClosed: true });
        }
      } else {
        setTimerSecondsLeft(diffSecs);
      }
    };

    checkTimerSync();
    const interval = setInterval(checkTimerSync, 500);
    return () => clearInterval(interval);
  }, [
    selectedQuestion?.id,
    selectedQuestion?.launchedAt,
    selectedQuestion?.createdAt,
    selectedQuestion?.timeLimitSeconds,
    selectedQuestion?.isClosed,
    selectedQuestion?.isLocked,
    selectedQuestion?.responses,
    currentStudent?.id,
    studentHasAnswered,
    userRole,
  ]);

  // Whether the current question is locked or its timer has completed
  const isTimeExpired =
    !!selectedQuestion &&
    (selectedQuestion.isClosed ||
      selectedQuestion.isLocked ||
      (!!selectedQuestion.timeLimitSeconds &&
        selectedQuestion.timeLimitSeconds > 0 &&
        timerSecondsLeft !== null &&
        timerSecondsLeft <= 0));

  // Filtered Questions
  const filteredQuestions = batchQuestions.filter((q) => {
    let matchesType = true;
    if (typeFilter === "doubts") {
      matchesType = !!q.askedByStudentId;
    } else if (typeFilter !== "all") {
      matchesType = q.type === typeFilter;
    }
    const matchesSearch = q.question.toLowerCase().includes(questionSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Student option answer submission (Blocks submission if timer expired or question locked)
  const handleStudentSubmit = (q: LiveQuestion, opt: string) => {
    const existing = q.responses.find((r) => r.studentId === currentStudent?.id);
    if (studentAnswerMap[q.id] || existing || !currentStudent || q.isClosed || q.isLocked || isTimeExpired) return;
    const isCorrect = (q.type === "mcq" || q.type === "true_false") && q.correctAnswer
      ? opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      : undefined;
    const elapsedMs = Math.max(650, Math.min(60000, Date.now() - questionStartTimeRef.current));
    const stoppedSecs = timerSecondsLeft !== null && timerSecondsLeft > 0
      ? timerSecondsLeft
      : q.timeLimitSeconds
      ? Math.max(0, q.timeLimitSeconds - Math.round(elapsedMs / 1000))
      : 0;

    setStudentStoppedTimeMap((prev) => ({ ...prev, [q.id]: stoppedSecs }));
    setStudentAnswerMap((prev) => ({ ...prev, [q.id]: opt }));
    setTimerSecondsLeft(null); // STOP timer countdown immediately upon submission
    onSubmitLiveAnswer(q.id, opt, isCorrect, elapsedMs);

    if (isCorrect || q.type === "poll" || q.type === "open") {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  // Student open text answer submission (Blocks submission if timer expired or question locked)
  const handleStudentSubmitWritten = (q: LiveQuestion) => {
    const existing = q.responses.find((r) => r.studentId === currentStudent?.id);
    const text = (studentWrittenMap[q.id] || currentQuestionWritten || "").trim();
    if (!text || studentAnswerMap[q.id] || existing || !currentStudent || q.isClosed || q.isLocked || isTimeExpired) return;
    const elapsedMs = Math.max(1200, Math.min(120000, Date.now() - questionStartTimeRef.current));
    const stoppedSecs = timerSecondsLeft !== null && timerSecondsLeft > 0
      ? timerSecondsLeft
      : q.timeLimitSeconds
      ? Math.max(0, q.timeLimitSeconds - Math.round(elapsedMs / 1000))
      : 0;

    setStudentStoppedTimeMap((prev) => ({ ...prev, [q.id]: stoppedSecs }));
    setStudentAnswerMap((prev) => ({ ...prev, [q.id]: text }));
    setTimerSecondsLeft(null); // STOP timer countdown immediately upon submission
    onSubmitLiveAnswer(q.id, text, true, elapsedMs);

    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Student Post Doubt / Live Question
  const handlePostStudentDoubt = () => {
    if (!studentDoubtText.trim() || !currentStudent) return;

    const newDoubtQ: LiveQuestion = {
      id: `doubt_${Date.now()}`,
      batchId: selectedBatch.id,
      question: studentDoubtText.trim(),
      type: "open",
      options: [],
      category: studentDoubtCategory,
      askedByStudentId: currentStudent.id,
      askedByStudentName: currentStudent.name,
      upvotes: 1,
      isActive: true,
      isClosed: false,
      createdAt: new Date().toISOString(),
      responses: [],
      points: 50,
    };

    onAddLiveQuestion(newDoubtQ);
    setSelectedQuestion(newDoubtQ);
    setShowAskDoubtModal(false);
    setStudentDoubtText("");
  };

  // Upvote Question
  const handleUpvoteQuestion = (q: LiveQuestion) => {
    if (!onUpdateLiveQuestion) return;
    const updated = { ...q, upvotes: (q.upvotes || 0) + 1 };
    onUpdateLiveQuestion(updated);
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(updated);
    }
  };

  // Instructor Answer Student Doubt
  const handleInstructorAnswerDoubt = (q: LiveQuestion, replyText: string) => {
    if (!onUpdateLiveQuestion || !replyText.trim()) return;
    const updated = {
      ...q,
      answerByInstructor: replyText.trim(),
      isAnswered: true,
    };
    onUpdateLiveQuestion(updated);
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(updated);
    }
    setReplyInputMap((prev) => ({ ...prev, [q.id]: "" }));
  };

  // Create single question handler
  const handleCreateSingleQuestion = () => {
    if (!newQuestionText.trim()) return;

    let filteredOptions: string[] = [];
    if (newType === "true_false") {
      filteredOptions = ["True", "False"];
    } else if (newType === "mcq" || newType === "poll") {
      filteredOptions = newOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    } else {
      filteredOptions = []; // Open question has no pre-set choices
    }

    const nowIso = new Date().toISOString();
    const newQ: LiveQuestion = {
      id: `live_${Date.now()}`,
      batchId: selectedBatch.id,
      question: newQuestionText.trim(),
      type: newType,
      options: filteredOptions,
      correctAnswer: (newType === "mcq" || newType === "true_false") ? newCorrect.trim() : undefined,
      timeLimitSeconds: newTimeLimit,
      points: newPoints,
      explanation: newExplanation.trim() || undefined,
      isActive: true,
      isClosed: false,
      isLocked: newIsLocked,
      launchedAt: !newIsLocked ? nowIso : undefined,
      createdAt: nowIso,
      responses: [],
    };

    onAddLiveQuestion(newQ);
    setSelectedQuestion(newQ);
    setShowAddModal(false);
    setNewQuestionText("");
    setNewExplanation("");
    setNewIsLocked(false);
  };

  // AI Bulk Generate Handler (5, 10, 15, 20 or more)
  const handleBulkGenerate = async () => {
    setIsGeneratingBulk(true);
    try {
      const openCount = bulkIncludeOpenQuestions ? Math.max(1, Math.floor(bulkCount * 0.2)) : 0;
      const res = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: bulkTopic || selectedBatch.name,
          mcqCount: Math.max(2, Math.floor(bulkCount * 0.5)),
          trueFalseCount: Math.max(1, Math.floor(bulkCount * 0.2)),
          fillBlanksCount: 0,
          pollsCount: Math.max(1, Math.floor(bulkCount * 0.1)),
          essayCount: openCount,
          codingCount: 0,
          difficulty: bulkDifficulty,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        const generatedLiveQs: LiveQuestion[] = data.questions.map((q: any, i: number) => ({
          id: `bulk_${Date.now()}_${i}`,
          batchId: selectedBatch.id,
          question: q.question,
          type: q.type === "essay" || q.type === "open" ? "open" : q.type === "poll" ? "poll" : q.type === "true_false" ? "true_false" : "mcq",
          options: q.type === "essay" || q.type === "open" ? [] : q.options || (q.type === "true_false" ? ["True", "False"] : ["Option A", "Option B", "Option C", "Option D"]),
          correctAnswer: q.correctAnswer,
          timeLimitSeconds: q.type === "open" || q.type === "essay" ? 60 : 30,
          points: q.points || 100,
          explanation: q.explanation,
          isActive: true,
          isClosed: false,
          createdAt: new Date().toISOString(),
          responses: [],
        }));

        onBulkAddQuestions(generatedLiveQs);
        if (generatedLiveQs.length > 0) {
          setSelectedQuestion(generatedLiveQs[0]);
        }
        setShowBulkModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  // Preset Quiz Pack Loader Handler
  const handleLoadPresetPack = (pack: PresetQuizPack) => {
    const loadedQuestions: LiveQuestion[] = pack.questions.map((q, i) => ({
      ...q,
      id: `preset_${Date.now()}_${i}`,
      batchId: selectedBatch.id,
      createdAt: new Date().toISOString(),
      responses: [],
    }));

    onBulkAddQuestions(loadedQuestions);
    if (loadedQuestions.length > 0) {
      setSelectedQuestion(loadedQuestions[0]);
    }
    setShowBulkModal(false);
  };

  // CSV / Delimited Text Bulk Parser
  const handleParseCsvText = (text: string) => {
    setCsvTextContent(text);
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const validLines = lines.filter((l) => l.includes("|") || l.includes(","));
    setParsedBulkCount(validLines.length);
  };

  const handleImportParsedQuestions = () => {
    if (!csvTextContent.trim()) return;
    const lines = csvTextContent.split("\n").filter((l) => l.trim().length > 0);

    const imported: LiveQuestion[] = [];
    lines.forEach((line, idx) => {
      const parts = line.includes("|")
        ? line.split("|").map((p) => p.trim())
        : line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));

      if (parts.length >= 1) {
        const questionText = parts[0];
        const isTrueFalse = parts[1]?.toLowerCase() === "true" || parts[1]?.toLowerCase() === "false";
        const isOpen = parts.length === 1 || parts[1]?.toLowerCase() === "open";

        let type: "mcq" | "poll" | "true_false" | "open" = "mcq";
        let options: string[] = [];
        let correct: string | undefined = undefined;

        if (isOpen) {
          type = "open";
          options = [];
          correct = parts[1] || undefined;
        } else if (isTrueFalse) {
          type = "true_false";
          options = ["True", "False"];
          correct = parts[1];
        } else if (parts.length >= 5) {
          type = "mcq";
          options = [parts[1], parts[2], parts[3], parts[4]].filter(Boolean);
          correct = parts[5] || parts[1];
        } else {
          type = "poll";
          options = parts.slice(1);
          correct = undefined;
        }

        imported.push({
          id: `csv_${Date.now()}_${idx}`,
          batchId: selectedBatch.id,
          question: questionText,
          type,
          options,
          correctAnswer: correct,
          timeLimitSeconds: type === "open" ? 60 : 30,
          points: 100,
          isActive: true,
          isClosed: false,
          createdAt: new Date().toISOString(),
          responses: [],
        });
      }
    });

    if (imported.length > 0) {
      onBulkAddQuestions(imported);
      setSelectedQuestion(imported[0]);
      setShowBulkModal(false);
      setCsvTextContent("");
      setParsedBulkCount(null);
    }
  };

  // Question Control Handlers: Lock / Unlock & Responses Closed
  const handleToggleQuestionLock = (q: LiveQuestion) => {
    if (!onUpdateLiveQuestion) return;
    const willUnlock = q.isLocked; // If currently locked, unlocking launches it
    const nowIso = new Date().toISOString();
    const updated: LiveQuestion = {
      ...q,
      isLocked: !q.isLocked,
      isClosed: willUnlock ? false : q.isClosed,
      launchedAt: willUnlock ? nowIso : q.launchedAt,
    };
    onUpdateLiveQuestion(updated);
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(updated);
    }
    if (inspectingQuestion?.id === q.id) {
      setInspectingQuestion(updated);
    }
  };

  const handleToggleCloseResponses = (q: LiveQuestion) => {
    if (!onUpdateLiveQuestion) return;
    const willClose = !q.isClosed;
    const nowIso = new Date().toISOString();
    const updated: LiveQuestion = {
      ...q,
      isClosed: willClose,
      launchedAt: !willClose ? nowIso : q.launchedAt,
    };
    onUpdateLiveQuestion(updated);
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(updated);
    }
    if (inspectingQuestion?.id === q.id) {
      setInspectingQuestion(updated);
    }
  };

  const handleReopenTimer = (q: LiveQuestion) => {
    if (!onUpdateLiveQuestion) return;
    const resetTime = q.timeLimitSeconds !== undefined ? q.timeLimitSeconds : 30;
    const nowIso = new Date().toISOString();
    const updated: LiveQuestion = {
      ...q,
      isClosed: false,
      isLocked: false,
      timeLimitSeconds: resetTime,
      launchedAt: nowIso,
    };
    onUpdateLiveQuestion(updated);
    setTimerSecondsLeft(resetTime);
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(updated);
    }
    if (inspectingQuestion?.id === q.id) {
      setInspectingQuestion(updated);
    }
  };

  const handleDeleteQuestion = (qId: string) => {
    if (onDeleteLiveQuestion) {
      onDeleteLiveQuestion(qId);
      if (selectedQuestion?.id === qId) {
        setSelectedQuestion(null);
      }
      if (inspectingQuestion?.id === qId) {
        setInspectingQuestion(null);
      }
    }
  };

  const handleNudgeStudent = (studentId: string) => {
    setNudgedStudents((prev) => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setNudgedStudents((prev) => ({ ...prev, [studentId]: false }));
    }, 3000);
  };

  // Helper calculations for any question report (with full poll support)
  const getQuestionMetrics = (q: LiveQuestion) => {
    const totalEnrolled = totalBatchMembers || 1;
    const answeredCount = q.responses.length;
    const attendancePct = Math.round((answeredCount / totalEnrolled) * 100);

    const isResponseCorrect = (r: LiveQAResponse) => {
      if (q.type === "poll") return null;
      if (q.type === "open") return r.isCorrect;
      if (q.correctAnswer && r.answer) {
        return r.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      }
      return r.isCorrect === true;
    };

    const correctResponses = q.responses.filter((r) => isResponseCorrect(r) === true);
    const wrongResponses = q.responses.filter((r) => isResponseCorrect(r) === false);
    const correctCount = correctResponses.length;
    const wrongCount = wrongResponses.length;
    const correctPct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const wrongPct = answeredCount > 0 ? Math.round((wrongCount / answeredCount) * 100) : 0;

    const answeredStudentIds = new Set(q.responses.map((r) => r.studentId));
    const unattendedStudents = batchStudents.filter((s) => !answeredStudentIds.has(s.id));
    const unattendedCount = unattendedStudents.length;

    const avgTimeMs =
      answeredCount > 0
        ? q.responses.reduce((sum, r) => sum + (r.responseTimeMs || 2000), 0) / answeredCount
        : 0;

    // For polls: calculate leading option with highest votes
    let leadingOption: { option: string; votes: number; pct: number } | null = null;
    if (q.type === "poll" && q.options && q.options.length > 0) {
      let maxVotes = -1;
      let topOpt = q.options[0];
      q.options.forEach((opt) => {
        const count = q.responses.filter((r) => r.answer === opt).length;
        if (count > maxVotes) {
          maxVotes = count;
          topOpt = opt;
        }
      });
      leadingOption = {
        option: topOpt,
        votes: Math.max(0, maxVotes),
        pct: answeredCount > 0 ? Math.round((Math.max(0, maxVotes) / answeredCount) * 100) : 0,
      };
    }

    return {
      totalEnrolled,
      answeredCount,
      attendancePct,
      correctCount,
      correctPct,
      wrongCount,
      wrongPct,
      unattendedCount,
      unattendedStudents,
      correctResponses,
      wrongResponses,
      leadingOption,
      avgTimeSeconds: (avgTimeMs / 1000).toFixed(2),
    };
  };

  // Export Question Telemetry CSV
  const handleExportQuestionReport = (q: LiveQuestion) => {
    const metrics = getQuestionMetrics(q);
    const isPoll = q.type === "poll";

    const headers = isPoll
      ? "Student Name,Email,Mobile,College,Voted Option,Response Time (s),Participation Status,Submitted At\n"
      : "Student Name,Email,Mobile,College,Answer / Text Submission,Is Correct,Response Time (s),Submitted At\n";

    const answeredRows = q.responses.map((r) => {
      const student = batchStudents.find((s) => s.id === r.studentId);
      const cleanAnswer = r.answer.replace(/"/g, '""');
      if (isPoll) {
        return `"${r.studentName}","${student?.email || ''}","${student?.mobile || ''}","${student?.college || ''}","${cleanAnswer}",${(r.responseTimeMs / 1000).toFixed(2)},"Voted","${r.submittedAt || ''}"`;
      }
      return `"${r.studentName}","${student?.email || ''}","${student?.mobile || ''}","${student?.college || ''}","${cleanAnswer}",${r.isCorrect ? "Correct" : r.isCorrect === false ? "Wrong" : "Submitted"},${(r.responseTimeMs / 1000).toFixed(2)},"${r.submittedAt || ''}"`;
    });

    const unattendedRows = metrics.unattendedStudents.map((s) => {
      if (isPoll) {
        return `"${s.name}","${s.email}","${s.mobile}","${s.college}","Not Voted",0,"Pending","-"`;
      }
      return `"${s.name}","${s.email}","${s.mobile}","${s.college}","Not Attended / No Response",Pending,0,"-"`;
    });

    const csvContent = headers + [...answeredRows, ...unattendedRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = isPoll ? `Live_Poll_${q.id}_Voting_Report.csv` : `Live_Question_${q.id}_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. LIVE ZOOM MEETING STREAM & CREDENTIALS BANNER                          */}
      {/* ========================================================================= */}
      {settings && settings.enableZoomSync && (
        <LiveSessionBanner
          settings={settings}
          userRole={userRole}
          batch={selectedBatch}
          scheduledMeetings={scheduledMeetings}
          onUpdateSettings={onUpdateSettings || (() => {})}
          onToggleRecordingUnlock={onToggleRecordingUnlock || (() => {})}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. LIVE Q&A TOOLBAR: QUESTIONS, POLLS, OPEN PROMPTS & STUDENT DOUBTS      */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Live Q&A, Polls, Open Questions & Doubts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create MCQ quizzes, opinion polls, true/false, open written questions, and live student doubt streams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Student "Ask a Doubt / Question" Action */}
          {userRole === "student" && (
            <button
              type="button"
              onClick={() => setShowAskDoubtModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>🙋 Ask Question / Post Doubt</span>
            </button>
          )}

          {userRole === "admin" && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add 1 Question / Poll / Open Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN LIVE Q&A WORKSPACE: LEFT LIST & RIGHT ACTIVE TELEMETRY            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: QUESTION BANK & LIST (4 COLS) - STICKY / LOCKED IN VIEW */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-4 self-start">
          {/* Filter Bar & Search */}
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions or doubts..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition shadow-xs placeholder:text-slate-400"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "mcq", label: "⚡ MCQs" },
                  { id: "poll", label: "📊 Polls" },
                  { id: "true_false", label: "⚖️ T/F" },
                  { id: "open", label: "💬 Open Qs" },
                  { id: "doubts", label: "🙋 Doubts" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    typeFilter === t.id
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black shadow-sm shadow-sky-500/25 ring-1 ring-sky-400/30 scale-100"
                      : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 font-bold hover:text-slate-900 border border-slate-200/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Scroll List */}
          <div className="space-y-2 max-h-[calc(100vh-220px)] min-h-[300px] overflow-y-auto pr-1">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">No questions found in this category</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {userRole === "admin"
                    ? "Click '+ Add 1 Question / Poll' to create live challenges."
                    : "Click '🙋 Ask Question' to post a doubt to the instructor."}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const metrics = getQuestionMetrics(q);
                const isSelected = selectedQuestion?.id === q.id;

                return (
                  <motion.div
                    key={q.id}
                    layout
                    onClick={() => setSelectedQuestion(q)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative group ${
                      isSelected
                        ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20 shadow-sm"
                        : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-sky-200"
                    }`}
                  >
                    {/* Top Row: Type & Response Badges */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            q.askedByStudentId
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : q.type === "mcq"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : q.type === "poll"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : q.type === "true_false"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <span>
                            {q.askedByStudentId
                              ? "🙋"
                              : q.type === "mcq"
                              ? "⚡"
                              : q.type === "poll"
                              ? "📊"
                              : q.type === "true_false"
                              ? "⚖️"
                              : "💬"}
                          </span>
                          <span>
                            {q.askedByStudentId
                              ? `Doubt by ${q.askedByStudentName || 'Student'}`
                              : `Q${idx + 1} • ${q.type.replace("_", " ")}`}
                          </span>
                        </span>

                        {/* Lock / Unlock Badge / Button */}
                        {userRole === "admin" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleQuestionLock(q);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                              q.isLocked
                                ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            }`}
                            title={
                              q.isLocked
                                ? "🔒 Currently Locked (Hidden from students) - Click to Unlock"
                                : "🔓 Currently Unlocked (Visible to students) - Click to Lock"
                            }
                          >
                            {q.isLocked ? (
                              <Lock className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Unlock className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{q.isLocked ? "Locked" : "Unlocked"}</span>
                          </button>
                        ) : (q.isClosed || (q.timeLimitSeconds && q.timeLimitSeconds > 0 && ((new Date(q.launchedAt || q.createdAt).getTime() + q.timeLimitSeconds * 1000) <= Date.now()))) ? (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Closed
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        )}

                        {userRole === "admin" && (
                          (q.isClosed || (q.timeLimitSeconds && q.timeLimitSeconds > 0 && ((new Date(q.launchedAt || q.createdAt).getTime() + q.timeLimitSeconds * 1000) <= Date.now()))) ? (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Closed
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )
                        )}
                      </div>

                      {/* View Report Shortcut - ONLY FOR ADMIN (EXCLUDING OPEN QUESTIONS) */}
                      {userRole === "admin" && q.type !== "open" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingQuestion(q);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                          title="Click to view detailed response report"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <h5 className="font-bold text-slate-800 text-xs line-clamp-2 mb-2 leading-snug">
                      {q.question}
                    </h5>

                    {/* Bottom Response Metrics Bar */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{metrics.answeredCount} / {metrics.totalEnrolled} {q.type === 'open' ? 'submissions' : 'votes'}</span>
                      </span>

                      {q.type === "mcq" || q.type === "true_false" ? (
                        metrics.answeredCount > 0 ? (
                          <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {metrics.correctPct}% accuracy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {metrics.attendancePct}% attended
                          </span>
                        )
                      ) : q.type === "open" ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[10px]">
                          💬 Open Text
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {metrics.attendancePct}% attended
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE INTERACTIVE CHALLENGE & LIVE TELEMETRY (8 COLS) */}
        <div className="lg:col-span-8">
          {selectedQuestion ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Question Header & Live Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {selectedQuestion.askedByStudentId ? "Live Doubt / Question" : `${selectedQuestion.type.replace("_", " ")} Challenge`}
                    </span>

                    {selectedQuestion.points && (
                      <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        +{selectedQuestion.points} Points
                      </span>
                    )}

                    {(() => {
                      const isStudentSubmitted = userRole === "student" && studentHasAnswered;

                      if (isStudentSubmitted) {
                        const rawStoppedSecs =
                          studentStoppedTimeMap[selectedQuestion.id] ??
                          currentStudentResp?.stoppedSecondsLeft ??
                          (selectedQuestion.timeLimitSeconds && currentStudentResp?.responseTimeMs
                            ? Math.max(0, selectedQuestion.timeLimitSeconds - Math.round(currentStudentResp.responseTimeMs / 1000))
                            : null);

                        const formatSecs = (s: number) =>
                          s >= 60
                            ? `${Math.floor(s / 60)}m ${s % 60 < 10 ? '0' : ''}${s % 60}s`
                            : `${s}s`;

                        return (
                          <div className="inline-flex items-center gap-2 flex-wrap">
                            {/* Stopped Countdown Timer Badge */}
                            {selectedQuestion.timeLimitSeconds && selectedQuestion.timeLimitSeconds > 0 && rawStoppedSecs !== null ? (
                              <span
                                className="text-xs font-mono font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
                                title={
                                  currentStudentResp?.responseTimeFormatted
                                    ? `Time taken: ${currentStudentResp.responseTimeFormatted} • Countdown stopped at ${formatSecs(rawStoppedSecs)} remaining`
                                    : "Countdown stopped upon your answer submission"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Stopped at {formatSecs(rawStoppedSecs)}</span>
                              </span>
                            ) : currentStudentResp?.responseTimeMs ? (
                              <span
                                className="text-xs font-mono font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
                                title="Time taken to submit answer"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Stopped in {(currentStudentResp.responseTimeMs / 1000).toFixed(1)}s</span>
                              </span>
                            ) : null}

                            {/* Submitted Badge */}
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Submitted</span>
                            </span>
                          </div>
                        );
                      }

                      if (timerSecondsLeft !== null && timerSecondsLeft > 0 && !selectedQuestion.isClosed && !selectedQuestion.isLocked) {
                        return (
                          <span className="text-xs font-mono font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-2xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {timerSecondsLeft >= 60
                                ? `${Math.floor(timerSecondsLeft / 60)}m ${timerSecondsLeft % 60 < 10 ? '0' : ''}${timerSecondsLeft % 60}s`
                                : `${timerSecondsLeft}s`}
                            </span>
                          </span>
                        );
                      }

                      if (
                        selectedQuestion.timeLimitSeconds &&
                        selectedQuestion.timeLimitSeconds > 0 &&
                        (selectedQuestion.isClosed || selectedQuestion.isLocked || timerSecondsLeft === 0)
                      ) {
                        return (
                          <span className="text-xs font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                            <Lock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Time's Up • Locked</span>
                          </span>
                        );
                      }

                      return null;
                    })()}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedQuestion.responses.length} of {totalBatchMembers} students responded
                    {selectedQuestion.askedByStudentName && ` • Asked by ${selectedQuestion.askedByStudentName}`}
                  </span>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Upvote button for student doubts */}
                  {selectedQuestion.askedByStudentId && (
                    <button
                      type="button"
                      onClick={() => handleUpvoteQuestion(selectedQuestion)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition border border-purple-200 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{selectedQuestion.upvotes || 1} Upvotes</span>
                    </button>
                  )}

                  {/* Dedicated Lock / Unlock Button for Admin */}
                  {userRole === "admin" && (
                    <button
                      type="button"
                      onClick={() => handleToggleQuestionLock(selectedQuestion)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs border ${
                        selectedQuestion.isLocked
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 ring-2 ring-rose-400/20"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20"
                      }`}
                      title={
                        selectedQuestion.isLocked
                          ? "Question is Locked (Hidden from students). Click to Unlock"
                          : "Question is Unlocked (Visible to students). Click to Lock"
                      }
                    >
                      {selectedQuestion.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>
                        {selectedQuestion.isLocked
                          ? "🔒 Locked (Hidden from Students)"
                          : "🔓 Unlocked (Live for Students)"}
                      </span>
                    </button>
                  )}

                  {/* Detailed Report Button - ONLY FOR ADMIN (EXCLUDING OPEN QUESTIONS) */}
                  {userRole === "admin" && selectedQuestion.type !== "open" && (
                    <button
                      type="button"
                      onClick={() => setInspectingQuestion(selectedQuestion)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition border border-sky-200 cursor-pointer"
                      title="Inspect student responses and accuracy breakdown"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Report</span>
                    </button>
                  )}

                  {userRole === "admin" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReopenTimer(selectedQuestion)}
                        className="p-2 text-slate-600 hover:text-sky-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                        title="Reopen 30s live timer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCloseResponses(selectedQuestion)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          selectedQuestion.isClosed
                            ? "bg-purple-50 text-purple-600 border-purple-200"
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}
                        title={
                          selectedQuestion.isClosed
                            ? "Responses Closed (Click to Reopen Submissions)"
                            : "Accepting Submissions (Click to Close)"
                        }
                      >
                        {selectedQuestion.isClosed ? <Play className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedQuestion.question}
                </h3>
              </div>

              {/* ========================================================================= */}
              {/* RENDERING BASED ON QUESTION TYPE                                          */}
              {/* ========================================================================= */}

              {/* TYPE A: OPEN-ENDED / SHORT ANSWER / WRITTEN RESPONSE QUESTION */}
              {selectedQuestion.type === "open" ? (
                <div className="space-y-5">
                  {/* Student Submission View */}
                  {userRole === "student" && (
                    <div className="space-y-4">
                      {isTimeExpired && !studentHasAnswered && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-rose-600" />
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-rose-900">
                              Time's Up • Challenge Locked
                            </div>
                            <div className="text-xs text-rose-700 font-medium">
                              The timer limit for this question has completed. Submissions are now closed and locked.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                          Type Your Answer / Solution Below:
                        </label>

                        <textarea
                          rows={4}
                          disabled={studentHasAnswered || selectedQuestion.isClosed || isTimeExpired}
                          value={currentQuestionWritten}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentWrittenMap((prev) => ({ ...prev, [selectedQuestion.id]: val }));
                          }}
                          placeholder={isTimeExpired ? "This question has ended and submissions are locked." : "Write your explanation, reasoning, or code logic here..."}
                          className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {currentQuestionWritten.length} characters • +{selectedQuestion.points || 100} points upon submission
                          </span>

                          {!studentHasAnswered ? (
                            <button
                              type="button"
                              disabled={!currentQuestionWritten.trim() || selectedQuestion.isClosed || isTimeExpired}
                              onClick={() => handleStudentSubmitWritten(selectedQuestion)}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer"
                            >
                              <SendHorizontal className="w-3.5 h-3.5" />
                              <span>Submit Answer</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Answer Submitted & Recorded!</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI & Instructor Evaluation Card for Student */}
                      {(() => {
                        const studentResp = selectedQuestion.responses.find(
                          (r) => r.studentId === currentStudent?.id
                        );
                        if (
                          !studentResp ||
                          (studentResp.rating === undefined &&
                            !cleanInstructorReply(studentResp.instructorReply))
                        ) {
                          return null;
                        }

                        const effectiveStars = getEffectiveStars(studentResp);
                        const badgeInfo = getStarBadgeInfo(effectiveStars);
                        const cleanReply = cleanInstructorReply(studentResp.instructorReply);

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-purple-50/50 rounded-2xl border border-indigo-200/90 space-y-3.5 shadow-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                                  Evaluation & Quality Rating Review
                                </span>
                              </div>
                              {effectiveStars > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-4 h-4 ${
                                          s <= effectiveStars
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-slate-200 fill-slate-100"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full font-mono font-black text-[11px] border ${badgeInfo.color}`}>
                                    {badgeInfo.label}
                                  </span>
                                </div>
                              )}
                            </div>

                            {cleanReply && (
                              <div className="p-3.5 bg-white/95 rounded-xl border border-purple-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1">
                                  <CornerDownRight className="w-3.5 h-3.5 text-purple-600" />
                                  Instructor's Official Reply & Feedback:
                                </span>
                                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                                  {cleanReply}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Instructor Live View of Student Written Submissions - ONLY FOR ADMIN */}
                  {userRole === "admin" && (
                    <div className="space-y-4">
                      {/* Submissions Header & AI Evaluation Trigger */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-sky-600" />
                            Live Student Submissions ({selectedQuestion.responses.length})
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Evaluate student answers automatically with AI or assign custom 1-5 star ratings and reviews manually.
                          </span>
                        </div>

                        {selectedQuestion.responses.length > 0 && (
                          <button
                            type="button"
                            disabled={isEvaluatingAll}
                            onClick={() => handleEvaluateAllOpenAnswers(selectedQuestion)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-60 shrink-0"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isEvaluatingAll ? "animate-spin" : ""}`} />
                            <span>{isEvaluatingAll ? "Analyzing All Submissions..." : "Evaluate All with AI"}</span>
                          </button>
                        )}
                      </div>

                      {/* Rating Breakdown & Filter Chips */}
                      {selectedQuestion.responses.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-black uppercase text-slate-400 mr-1">Filter by Rating:</span>
                          {[
                            { id: "all", label: `All (${selectedQuestion.responses.length})` },
                            { id: "5", label: `★ 5 Stars (${selectedQuestion.responses.filter((r) => getEffectiveStars(r) === 5).length})` },
                            { id: "4", label: `★ 4 Stars (${selectedQuestion.responses.filter((r) => getEffectiveStars(r) === 4).length})` },
                            { id: "3", label: `★ 3 Stars (${selectedQuestion.responses.filter((r) => getEffectiveStars(r) === 3).length})` },
                            { id: "1_2", label: `★ 1-2 Stars (${selectedQuestion.responses.filter((r) => { const s = getEffectiveStars(r); return s === 1 || s === 2; }).length})` },
                            { id: "unrated", label: `⏳ Pending Review (${selectedQuestion.responses.filter((r) => getEffectiveStars(r) === 0).length})` },
                          ].map((chip) => (
                            <button
                              key={chip.id}
                              type="button"
                              onClick={() => setOpenStarFilter(chip.id as any)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                                openStarFilter === chip.id
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Submissions List */}
                      {selectedQuestion.responses.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                          No student responses submitted yet. Responses will appear here in real-time as students type and submit.
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                          {selectedQuestion.responses
                            .filter((resp) => {
                              const s = getEffectiveStars(resp);
                              if (openStarFilter === "5") return s === 5;
                              if (openStarFilter === "4") return s === 4;
                              if (openStarFilter === "3") return s === 3;
                              if (openStarFilter === "1_2") return s === 1 || s === 2;
                              if (openStarFilter === "unrated") return s === 0;
                              return true;
                            })
                            .map((resp, rIdx) => {
                              const isEvaluatingThis = evaluatingStudentId === resp.studentId;
                              const effectiveStars = getEffectiveStars(resp, selectedQuestion.id);
                              const badgeInfo = getStarBadgeInfo(effectiveStars);
                              const evalKey = `${selectedQuestion.id}_${resp.studentId}`;
                              const currentReply =
                                openReplyInputMap[evalKey] !== undefined
                                  ? openReplyInputMap[evalKey]
                                  : openReplyInputMap[resp.studentId] !== undefined
                                  ? openReplyInputMap[resp.studentId]
                                  : cleanInstructorReply(resp.instructorReply);
                              const isSaved = reviewSavedMap[evalKey] || reviewSavedMap[resp.studentId];

                              return (
                                <div
                                  key={rIdx}
                                  className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs hover:border-slate-300 transition"
                                >
                                  {/* Student Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shadow-2xs">
                                        {resp.studentName.charAt(0)}
                                      </span>
                                      <div>
                                        <span className="font-bold text-slate-900 text-xs block">{resp.studentName}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {(resp.responseTimeMs / 1000).toFixed(1)}s reflex
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badgeInfo.color}`}>
                                        {badgeInfo.label}
                                      </span>

                                      <button
                                        type="button"
                                        disabled={isEvaluatingThis}
                                        onClick={() => handleEvaluateStudentAnswer(selectedQuestion, resp)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
                                      >
                                        <Sparkles className={`w-3 h-3 ${isEvaluatingThis ? "animate-spin" : ""}`} />
                                        <span>{isEvaluatingThis ? "Analyzing..." : "AI Evaluate"}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Student Answer Text */}
                                  <div className="text-xs text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed font-sans whitespace-pre-wrap">
                                    {resp.answer}
                                  </div>

                                  {/* Dual Review Controls: 5-Star Interactive Rating & Instructor Reply */}
                                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                                          Assign Rating:
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                              key={s}
                                              type="button"
                                              onClick={() => {
                                                setManualRatingMap((prev) => ({ ...prev, [evalKey]: s, [resp.studentId]: s }));
                                              }}
                                              className="p-1 hover:scale-125 transition focus:outline-none cursor-pointer"
                                              title={`Set ${s} Star${s > 1 ? "s" : ""}`}
                                            >
                                              <Star
                                                className={`w-4 h-4 ${
                                                  s <= effectiveStars
                                                    ? "text-amber-400 fill-amber-400 drop-shadow-2xs"
                                                    : "text-slate-200 fill-slate-100 hover:text-amber-200"
                                                }`}
                                              />
                                            </button>
                                          ))}
                                          <span className="text-xs font-black font-mono text-slate-700 ml-1.5">
                                            {effectiveStars > 0 ? `${effectiveStars} / 5 Stars` : "Click star to set"}
                                          </span>
                                        </div>
                                      </div>

                                      {isSaved && (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                          <Check className="w-3 h-3" />
                                          Review Saved & Synced!
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Write feedback/reply to student..."
                                        value={currentReply}
                                        onChange={(e) =>
                                          setOpenReplyInputMap((prev) => ({
                                            ...prev,
                                            [evalKey]: e.target.value,
                                          }))
                                        }
                                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 font-medium"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSaveManualReview(
                                            selectedQuestion,
                                            resp.studentId,
                                            effectiveStars,
                                            currentReply
                                          )
                                        }
                                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer shadow-2xs"
                                      >
                                        Save Review
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instructor Live Answer / Reply Box for Doubts */}
                  {selectedQuestion.askedByStudentId && (
                    <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                        <CornerDownRight className="w-4 h-4 text-purple-600" />
                        <span>Instructor's Live Clarification / Answer</span>
                      </div>

                      {selectedQuestion.answerByInstructor ? (
                        <div className="p-3 bg-white rounded-xl border border-purple-100 text-xs text-slate-800 font-medium">
                          {selectedQuestion.answerByInstructor}
                        </div>
                      ) : userRole === "admin" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Type instructor's answer to broadcast to batch..."
                            value={replyInputMap[selectedQuestion.id] || ""}
                            onChange={(e) =>
                              setReplyInputMap((prev) => ({
                                ...prev,
                                [selectedQuestion.id]: e.target.value,
                              }))
                            }
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInstructorAnswerDoubt(
                                selectedQuestion,
                                replyInputMap[selectedQuestion.id] || ""
                              )
                            }
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer"
                          >
                            Broadcast Reply
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-purple-600 italic">
                          Instructor is answering this question live...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* TYPE B: MULTIPLE CHOICE, POLL, OR TRUE/FALSE */
                <div className="space-y-3">
                  {isTimeExpired &&
                    userRole === "student" &&
                    !studentHasAnswered && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 shadow-xs mb-1">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider text-rose-900">
                            Time's Up • Challenge Locked
                          </div>
                          <div className="text-xs text-rose-700 font-medium">
                            The timer limit for this challenge has completed. Submissions are now closed and locked.
                          </div>
                        </div>
                      </div>
                    )}

                  {selectedQuestion.options.map((opt, oIdx) => {
                    const isChosen = currentQuestionChoice === opt;

                    const isCorrectChoice =
                      (selectedQuestion.type === "mcq" || selectedQuestion.type === "true_false") &&
                      selectedQuestion.correctAnswer &&
                      selectedQuestion.correctAnswer.trim().toLowerCase() === opt.trim().toLowerCase();

                    const optVotes = selectedQuestion.responses.filter((r) => r.answer === opt).length;
                    const totalVotes = selectedQuestion.responses.length;
                    const optPct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                    return (
                      <div key={oIdx} className="space-y-1.5">
                        <button
                          disabled={studentHasAnswered || selectedQuestion.isClosed || isTimeExpired}
                          onClick={() => handleStudentSubmit(selectedQuestion, opt)}
                          className={`w-full text-left px-4 py-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between cursor-pointer ${
                            isChosen
                              ? isCorrectChoice || selectedQuestion.type === "poll"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-sky-500 text-white border-sky-500 shadow-md"
                              : isCorrectChoice && (studentHasAnswered || userRole === "admin")
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-slate-50 hover:bg-sky-50/70 text-slate-800 border-slate-200/90"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                isChosen
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-200/80 text-slate-700"
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCorrectChoice && (studentHasAnswered || userRole === "admin") && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                ✓ Correct Answer
                              </span>
                            )}

                            {(studentHasAnswered || userRole === "admin") && (
                              <span className="text-xs font-mono font-bold">
                                {optVotes} ({optPct}%)
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Vote Percentage Progress Bar */}
                        {(studentHasAnswered || userRole === "admin") && (
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${optPct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                isCorrectChoice
                                  ? "bg-emerald-500"
                                  : isChosen
                                  ? "bg-sky-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation Note (if answered or admin) */}
              {selectedQuestion.explanation && (studentHasAnswered || userRole === "admin") && (
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs text-sky-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase tracking-wider text-sky-800 block mb-0.5">
                      Concept Insight & Explanation
                    </span>
                    <p className="leading-relaxed">{selectedQuestion.explanation}</p>
                  </div>
                </div>
              )}

              {/* Fast Response Leaderboard for Active Question - ONLY FOR ADMIN (EXCLUDING OPEN QUESTIONS) */}
              {userRole === "admin" && selectedQuestion.type !== "open" && (
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Fastest Submissions
                    </h4>

                    <button
                      type="button"
                      onClick={() => setInspectingQuestion(selectedQuestion)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Full Report ({selectedQuestion.responses.length} students)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedQuestion.responses.length === 0 ? (
                      <div className="col-span-2 p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                        Waiting for student submissions...
                      </div>
                    ) : (
                      selectedQuestion.responses
                        .sort((a, b) => a.responseTimeMs - b.responseTimeMs)
                        .slice(0, 6)
                        .map((resp, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full font-black flex items-center justify-center text-[10px] ${
                                  rIdx === 0
                                    ? "bg-amber-100 text-amber-800"
                                    : rIdx === 1
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-sky-100 text-sky-700"
                                }`}
                              >
                                #{rIdx + 1}
                              </span>
                              <span className="font-bold text-slate-800">{resp.studentName}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {resp.isCorrect !== undefined && (
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                    resp.isCorrect
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {resp.isCorrect ? "✓ Correct" : "✕ Wrong"}
                                </span>
                              )}
                              <span className="text-slate-500 font-mono text-[11px] font-bold">
                                {(resp.responseTimeMs / 1000).toFixed(2)}s
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : userRole === "student" && rawBatchQuestions.length > 0 && batchQuestions.length === 0 ? (
            <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="font-black text-slate-800 text-base">Live Questions Currently Locked</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your instructor has temporarily locked questions. As soon as a question is unlocked, it will immediately display on your screen in real time!
              </p>
            </div>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
              <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-black text-slate-700 text-sm">
                {batchQuestions.length === 0 ? "No Live Questions in this Batch" : "No Question Selected"}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {batchQuestions.length === 0
                  ? userRole === "admin"
                    ? "Click '+ Add 1 Question / Poll / Open Prompt' above to create real-time questions, polls, and True/False challenges for this batch."
                    : "Your instructor has not broadcasted questions for this batch yet. Click '🙋 Ask Question / Post Doubt' above to ask a question."
                  : "Select a question from the left bank to inspect live telemetry, real-time responses, and student accuracy."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE QUESTION REPORT & STUDENT BREAKDOWN MODAL (ADMIN ONLY)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectingQuestion && userRole === "admin" && (() => {
          const metrics = getQuestionMetrics(inspectingQuestion);
          const isPoll = inspectingQuestion.type === "poll";

          // Filter students for the report table
          let reportStudents: Array<{
            student: Student;
            response?: LiveQAResponse;
            status: "correct" | "wrong" | "unattended" | "voted";
          }> = [];

          if (isPoll) {
            if (reportActiveTab === "all" || reportActiveTab === "voted" || reportActiveTab === "correct") {
              inspectingQuestion.responses.forEach((r) => {
                const stu = batchStudents.find((s) => s.id === r.studentId);
                if (stu) reportStudents.push({ student: stu, response: r, status: "voted" });
              });
            }

            if (reportActiveTab === "all" || reportActiveTab === "unattended") {
              metrics.unattendedStudents.forEach((stu) => {
                reportStudents.push({ student: stu, status: "unattended" });
              });
            }
          } else {
            if (reportActiveTab === "all" || reportActiveTab === "correct") {
              metrics.correctResponses.forEach((r) => {
                const stu = batchStudents.find((s) => s.id === r.studentId);
                if (stu) reportStudents.push({ student: stu, response: r, status: "correct" });
              });
            }

            if (reportActiveTab === "all" || reportActiveTab === "wrong") {
              metrics.wrongResponses.forEach((r) => {
                const stu = batchStudents.find((s) => s.id === r.studentId);
                if (stu) reportStudents.push({ student: stu, response: r, status: "wrong" });
              });
            }

            if (reportActiveTab === "all" || reportActiveTab === "unattended") {
              metrics.unattendedStudents.forEach((stu) => {
                reportStudents.push({ student: stu, status: "unattended" });
              });
            }
          }

          if (reportStudentSearch.trim()) {
            reportStudents = reportStudents.filter((item) =>
              item.student.name.toLowerCase().includes(reportStudentSearch.toLowerCase()) ||
              item.student.email.toLowerCase().includes(reportStudentSearch.toLowerCase())
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5 my-6 sm:my-8 relative"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 rounded-2xl shadow-sm border border-sky-100">
                      <BarChart3 className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug">
                        {isPoll ? "Poll Turnout & Voting Analytics Report" : "Question Performance & Attendance Report"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-indigo-100">
                          {inspectingQuestion.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Batch: <strong className="text-slate-800 font-bold">{selectedBatch.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleExportQuestionReport(inspectingQuestion)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs border border-slate-200/60"
                      title="Export report to CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectingQuestion(null)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Details Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200/80 shadow-xs space-y-2.5">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-relaxed">
                    {inspectingQuestion.question}
                  </h4>

                  {!isPoll && inspectingQuestion.correctAnswer && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Reference / Correct Answer: <strong className="text-emerald-950 font-extrabold">{inspectingQuestion.correctAnswer}</strong></span>
                    </div>
                  )}

                  {isPoll && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200/80 rounded-xl text-xs font-bold">
                      <BarChart3 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>Community Opinion Poll &bull; <span className="text-sky-950 font-normal">All choices are valid survey submissions</span></span>
                    </div>
                  )}
                </div>

                {/* Summary Metric Cards */}
                {isPoll ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Votes Cast / Turnout */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider block mb-1">
                        Votes Cast / Turnout
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-sky-950">{metrics.answeredCount}</span>
                        <span className="text-xs font-bold text-sky-600">/ {metrics.totalEnrolled}</span>
                        <span className="text-[11px] font-bold text-sky-700">({metrics.attendancePct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-sky-200/60 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.attendancePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Leading Choice */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block mb-1">
                        Leading Choice
                      </span>
                      <div className="flex items-baseline gap-1 truncate">
                        <span className="text-lg sm:text-xl font-black text-indigo-950 truncate" title={metrics.leadingOption?.option || "None"}>
                          {metrics.leadingOption && metrics.leadingOption.votes > 0 ? metrics.leadingOption.option : "No votes yet"}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-indigo-700 mt-0.5">
                        {metrics.leadingOption && metrics.leadingOption.votes > 0
                          ? `${metrics.leadingOption.votes} votes (${metrics.leadingOption.pct}%)`
                          : "Awaiting responses"}
                      </div>
                      <div className="w-full h-1.5 bg-indigo-200/60 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.leadingOption?.pct || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Poll Choices */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block mb-1">
                        Poll Choices
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-950">{inspectingQuestion.options?.length || 0}</span>
                        <span className="text-xs font-bold text-purple-700">Options</span>
                      </div>
                      <div className="text-[10px] text-purple-700/90 font-bold mt-2">
                        Survey Voting Mode
                      </div>
                    </div>

                    {/* Not Voted */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block mb-1">
                        Not Voted
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-950">{metrics.unattendedCount}</span>
                        <span className="text-xs font-bold text-amber-700">Students</span>
                      </div>
                      <div className="text-[10px] text-amber-800/90 font-bold mt-1.5 flex items-center gap-1">
                        <span>Avg Speed:</span>
                        <span className="font-mono">{metrics.avgTimeSeconds}s</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Total Attended */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider block mb-1">
                        Attended / Answered
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-sky-950">{metrics.answeredCount}</span>
                        <span className="text-xs font-bold text-sky-600">/ {metrics.totalEnrolled}</span>
                        <span className="text-[11px] font-bold text-sky-700">({metrics.attendancePct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-sky-200/60 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.attendancePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Correct Answers */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block mb-1">
                        {inspectingQuestion.type === 'open' ? 'Reviewed' : 'Correct Answers'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-950">{metrics.correctCount}</span>
                        <span className="text-xs font-bold text-emerald-600">({metrics.correctPct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-emerald-200/60 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.correctPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Wrong Answers */}
                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block mb-1">
                        {inspectingQuestion.type === 'open' ? 'Needs Review' : 'Wrong Answers'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-950">{metrics.wrongCount}</span>
                        <span className="text-xs font-bold text-rose-600">({metrics.wrongPct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-rose-200/60 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.wrongPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Not Attended */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block mb-1">
                        Not Attended
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-950">{metrics.unattendedCount}</span>
                        <span className="text-xs font-bold text-amber-700">Students</span>
                      </div>
                      <div className="text-[10px] text-amber-800/90 font-bold mt-1.5 flex items-center gap-1">
                        <span>Avg Speed:</span>
                        <span className="font-mono">{metrics.avgTimeSeconds}s</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option Distribution Bars (if MCQ, True/False or Poll) */}
                {inspectingQuestion.options && inspectingQuestion.options.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      {isPoll ? "Option Vote Distribution (Live Results)" : "Option Vote Distribution"}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {inspectingQuestion.options.map((opt, i) => {
                        const votes = inspectingQuestion.responses.filter((r) => r.answer === opt).length;
                        const pct = metrics.answeredCount > 0 ? Math.round((votes / metrics.answeredCount) * 100) : 0;
                        const isCorrect = !isPoll && inspectingQuestion.correctAnswer && inspectingQuestion.correctAnswer.trim().toLowerCase() === opt.trim().toLowerCase();
                        const isLeading = isPoll && metrics.leadingOption && metrics.leadingOption.votes > 0 && metrics.leadingOption.option === opt;

                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-2xl border transition-all ${
                              isCorrect
                                ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20"
                                : isLeading
                                ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/20"
                                : "bg-slate-50/80 border-slate-200/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5 mb-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isLeading
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-bold leading-snug break-words ${
                                    isCorrect
                                      ? 'text-emerald-950 font-extrabold'
                                      : isLeading
                                      ? 'text-indigo-950 font-extrabold'
                                      : 'text-slate-800'
                                  }`}>
                                    {opt}
                                  </span>
                                  {isLeading && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200">
                                      Leading
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap ${
                                isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isLeading
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {votes} votes ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden flex">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCorrect
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    : isLeading
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                    : "bg-gradient-to-r from-sky-500 to-indigo-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filterable Student Roster Tabs */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(isPoll
                        ? [
                            { id: "all", label: `All Students (${batchStudents.length})` },
                            { id: "voted", label: `Voted (${metrics.answeredCount})` },
                            { id: "unattended", label: `Not Voted (${metrics.unattendedCount})` },
                          ]
                        : [
                            { id: "all", label: `All Students (${batchStudents.length})` },
                            { id: "correct", label: `${inspectingQuestion.type === 'open' ? 'Reviewed' : 'Correct'} (${metrics.correctCount})` },
                            { id: "wrong", label: `${inspectingQuestion.type === 'open' ? 'Needs Review' : 'Wrong'} (${metrics.wrongCount})` },
                            { id: "unattended", label: `Not Attended (${metrics.unattendedCount})` },
                          ]
                      ).map((t) => {
                        const isSelected =
                          reportActiveTab === t.id ||
                          (isPoll && t.id === "voted" && reportActiveTab === "correct") ||
                          (!isPoll && t.id === "correct" && reportActiveTab === "voted");

                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setReportActiveTab(t.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-sm font-black"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Search in student report */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={reportStudentSearch}
                        onChange={(e) => setReportStudentSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 font-medium"
                      />
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-64 overflow-y-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3.5">Student</th>
                          <th className="py-2.5 px-3.5">
                            {isPoll ? "Voted Option" : inspectingQuestion.type === "open" ? "Written Response" : "Choice / Response"}
                          </th>
                          <th className="py-2.5 px-3.5 text-center">Speed</th>
                          <th className="py-2.5 px-3.5 text-center">Status</th>
                          <th className="py-2.5 px-3.5 text-right">{isPoll ? "Participation" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {reportStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                              No students found in this filter.
                            </td>
                          </tr>
                        ) : (
                          reportStudents.map(({ student, response, status }) => (
                            <tr key={student.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      student.avatar ||
                                      `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`
                                    }
                                    alt={student.name}
                                    className="w-7 h-7 rounded-xl object-cover border border-slate-200 shadow-xs"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{student.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{student.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-3.5 max-w-xs">
                                {response ? (
                                  <span className={`font-bold text-xs break-words ${
                                    isPoll
                                      ? "text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 inline-block"
                                      : "text-slate-800"
                                  }`}>
                                    {response.answer}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">
                                    {isPoll ? "Not voted yet" : "No response submitted"}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3.5 text-center font-mono text-[11px] font-bold text-slate-600">
                                {response ? `${(response.responseTimeMs / 1000).toFixed(2)}s` : "-"}
                              </td>

                              <td className="py-2.5 px-3.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    isPoll
                                      ? status === "voted" || response
                                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                      : status === "correct"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : status === "wrong"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {isPoll
                                    ? status === "voted" || response
                                      ? "🗳️ Voted"
                                      : "⏳ Pending"
                                    : status === "correct"
                                    ? "✓ Answered"
                                    : status === "wrong"
                                    ? "✕ Wrong"
                                    : "⏳ Pending"}
                                </span>
                              </td>

                              <td className="py-2.5 px-3.5 text-right">
                                {status === "unattended" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleNudgeStudent(student.id)}
                                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer ${
                                      nudgedStudents[student.id]
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                    }`}
                                  >
                                    {nudgedStudents[student.id] ? "Pinged!" : "Nudge"}
                                  </button>
                                ) : (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
                                    isPoll
                                      ? "text-sky-700 bg-sky-50 border border-sky-100"
                                      : "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                  }`}>
                                    +{inspectingQuestion.points || (isPoll ? 50 : 100)} pts
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInspectingQuestion(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREATE 1 SINGLE QUESTION / POLL / OPEN PROMPT                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 my-6 sm:my-8 relative"
            >
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
                  onClick={() => setShowAddModal(false)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60 self-end sm:self-auto cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format / Type Selector */}
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
                        setNewType(t.id as any);
                        if (t.id === "true_false") {
                          setNewOptions(["True", "False"]);
                          setNewCorrect("True");
                        } else if (t.id === "mcq" || t.id === "poll") {
                          if (newOptions.length < 2) {
                            setNewOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
                            setNewCorrect("Option 1");
                          }
                        } else {
                          setNewOptions([]);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                        newType === t.id
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
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder={
                        newType === "open"
                          ? "e.g. Explain how an LLM agent uses function calling to interact with tools and APIs."
                          : "e.g. Which sampling parameter controls randomness in LLMs?"
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition shadow-xs leading-relaxed"
                    />
                  </div>

                  {/* Options for MCQ / Poll */}
                  {newType === "mcq" || newType === "poll" ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Options & {newType === "mcq" ? "Correct Key (Select Radio)" : "Choices"}
                        </label>
                        {newOptions.length < 6 && (
                          <button
                            type="button"
                            onClick={() => setNewOptions([...newOptions, `Option ${newOptions.length + 1}`])}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-100 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Option</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {newOptions.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                              newType === "mcq" && newCorrect === opt
                                ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30"
                                : "bg-slate-50/60 border-slate-200"
                            }`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>

                            {newType === "mcq" && (
                              <input
                                type="radio"
                                name="correct_answer"
                                checked={newCorrect === opt}
                                onChange={() => setNewCorrect(opt)}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                title="Mark as correct answer"
                              />
                            )}

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newOptions];
                                updated[idx] = e.target.value;
                                setNewOptions(updated);
                                if (newCorrect === opt) setNewCorrect(e.target.value);
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                            />

                            {newType === "mcq" && newCorrect === opt && (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md flex-shrink-0">
                                Correct
                              </span>
                            )}

                            {newOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
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
                  ) : newType === "true_false" ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Correct Answer Choice
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["True", "False"].map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => setNewCorrect(tf)}
                            className={`py-3.5 rounded-2xl border font-black text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                              newCorrect === tf
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/30"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${newCorrect === tf ? 'text-white' : 'text-slate-400'}`} />
                            <span>{tf}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white border border-indigo-100/90 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-indigo-950 block">
                              Open-Ended Conceptual & Technical Challenge
                            </span>
                            <span className="text-[10px] text-indigo-700 font-semibold">
                              Free-form student submissions • No fixed model answer required
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                          ★ 5-Star Telemetry
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Students write descriptive technical solutions, code explanations, or architectural designs. When responses arrive, the AI analyzes conceptual depth, clarity, and precision to assign a <strong>5-Star strength rating</strong> (★★★★★) with feedback, and you can also manually grade and reply.
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-indigo-800 font-medium">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Real-time live submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Automated AI & Manual dual reviews
                        </span>
                      </div>
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
                        {newTimeLimit === 0
                          ? "No Timer"
                          : newTimeLimit < 60
                          ? `${newTimeLimit}s`
                          : newTimeLimit % 60 === 0
                          ? `${Math.floor(newTimeLimit / 60)} min`
                          : `${Math.floor(newTimeLimit / 60)}m ${newTimeLimit % 60}s (${newTimeLimit}s)`}
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
                            value={Math.floor(newTimeLimit / 60) || ""}
                            onChange={(e) => {
                              const mins = Math.max(0, parseInt(e.target.value) || 0);
                              const secs = newTimeLimit % 60;
                              setNewTimeLimit(mins * 60 + secs);
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
                            value={newTimeLimit % 60 || (newTimeLimit === 0 ? "" : 0)}
                            onChange={(e) => {
                              const mins = Math.floor(newTimeLimit / 60);
                              const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                              setNewTimeLimit(mins * 60 + secs);
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
                          onClick={() => setNewTimeLimit(chip.val)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            newTimeLimit === chip.val
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
                        +{newPoints} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-4 relative">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          step={10}
                          value={newPoints}
                          onChange={(e) => setNewPoints(Math.max(0, parseInt(e.target.value) || 0))}
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
                            onClick={() => setNewPoints(p)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              newPoints === p
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
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      placeholder="Shown to students after submission to reinforce learning and explain the answer..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Lock / Unlock Initial State Toggle */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {newIsLocked ? (
                        <Lock className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      )}
                      <div>
                        <label className="text-xs font-black text-slate-800 block cursor-pointer">
                          {newIsLocked ? "Create as Locked Draft (Hidden from Students)" : "Publish Live & Visible Immediately"}
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {newIsLocked
                            ? "Students will not see this question until you click Unlock"
                            : "Question will immediately appear on all student screens"}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newIsLocked}
                      onChange={(e) => setNewIsLocked(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Quick Summary Pill / Tip */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Live Broadcast Ready</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Broadcasting triggers real-time sound effects and telemetric speed leaderboards on all connected student devices.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSingleQuestion}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:from-sky-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Launch Question Live</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. MODAL: STUDENT POST DOUBT / QUESTION TO TRAINER                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAskDoubtModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 my-6 sm:my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-600" />
                  <span>Ask a Question / Post Doubt to Trainer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAskDoubtModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Doubt Category
                </label>
                <select
                  value={studentDoubtCategory}
                  onChange={(e) => setStudentDoubtCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="General Doubt">General Concept Doubt</option>
                  <option value="Code Error">Coding / Debugging Error</option>
                  <option value="Architecture">System Architecture & APIs</option>
                  <option value="Assignment">Assignment Help</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Your Question / Doubt Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={studentDoubtText}
                  onChange={(e) => setStudentDoubtText(e.target.value)}
                  placeholder="Explain your doubt clearly. The instructor will see it in real-time and answer on stream..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskDoubtModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!studentDoubtText.trim()}
                  onClick={handlePostStudentDoubt}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer"
                >
                  Post Question to Live Stream
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. MODAL: BULK ADD QUESTIONS (10 / 20 / MORE AT A TIME)                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-6 sm:my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-sky-600 font-black text-lg">
                  <Sparkles className="w-5 h-5" />
                  <span>Bulk Add Live Questions (10, 20 or More)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3 Bulk Method Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setBulkModalTab("ai")}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    bulkModalTab === "ai"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>AI Generator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkModalTab("presets")}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    bulkModalTab === "presets"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-sky-600" />
                  <span>1-Click Preset Packs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkModalTab("csv")}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    bulkModalTab === "csv"
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                  <span>Text / CSV Paste</span>
                </button>
              </div>

              {/* TAB 1: AI GENERATOR */}
              {bulkModalTab === "ai" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Instantly generate 10, 15, or 20 customized multiple-choice, poll, true/false, and open-ended questions tuned to your workshop curriculum.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Workshop Topic / Curriculum Keyword *
                    </label>
                    <input
                      type="text"
                      value={bulkTopic}
                      onChange={(e) => setBulkTopic(e.target.value)}
                      placeholder="e.g. Autonomous AI Agents, Function Calling, System Architecture, FastAPI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Question Quantity
                      </label>
                      <select
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value={5}>5 Questions (Quick Check)</option>
                        <option value={10}>10 Questions (Standard Quiz)</option>
                        <option value={15}>15 Questions (Technical Deep-Dive)</option>
                        <option value={20}>20 Questions (Full Workshop Sprint)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={bulkDifficulty}
                        onChange={(e) => setBulkDifficulty(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="easy">Beginner / Foundational</option>
                        <option value="medium">Intermediate (Balanced)</option>
                        <option value="hard">Advanced / Architectural</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="include_open_qs"
                      checked={bulkIncludeOpenQuestions}
                      onChange={(e) => setBulkIncludeOpenQuestions(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                    />
                    <label htmlFor="include_open_qs" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Include Open-Ended / Short Answer Questions in the mix
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingBulk}
                      onClick={handleBulkGenerate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer"
                    >
                      {isGeneratingBulk ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Generating {bulkCount} Questions with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate {bulkCount} Questions Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PRESET QUIZ PACKS */}
              {bulkModalTab === "presets" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Select a ready-to-use question pack to load 10 to 20 structured questions with 1 click.
                  </p>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {PRESET_QUIZ_PACKS.map((pack) => (
                      <div
                        key={pack.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-2 bg-white rounded-xl border border-slate-100 shadow-xs flex-shrink-0">
                            {pack.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-black text-slate-900 text-sm">{pack.title}</h4>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                {pack.questionCount} Questions
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-snug">{pack.description}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadPresetPack(pack)}
                          className="px-4 py-2 bg-sky-500 group-hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex-shrink-0 cursor-pointer"
                        >
                          Load {pack.questionCount} Qs
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CSV / TEXT BULK IMPORTER */}
              {bulkModalTab === "csv" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Paste multiple questions formatted as:{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-mono text-[11px]">
                      Question | Option A | Option B | Option C | Option D | Correct Answer
                    </code>
                    {" "}or{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-mono text-[11px]">
                      Open Question Prompt | open
                    </code>
                  </p>

                  <textarea
                    rows={6}
                    value={csvTextContent}
                    onChange={(e) => handleParseCsvText(e.target.value)}
                    placeholder={`What does LLM stand for? | Large Language Model | Local Logic Machine | Language Learning Map | Lead Module | Large Language Model\nTrue or False: Agents can call APIs autonomously. | True | False | True\nExplain how vector embeddings enable semantic search. | open`}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />

                  {parsedBulkCount !== null && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Parsed {parsedBulkCount} questions ready for batch import.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!csvTextContent.trim()}
                      onClick={handleImportParsedQuestions}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      Import All Questions
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
