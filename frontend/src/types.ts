export type UserRole = "admin" | "student";

export type EventType = "workshop" | "bootcamp";

export interface Batch {
  id: string;
  name: string;
  type: EventType;
  durationLabel: string; // e.g. "3 Hours (1 Day)", "3 Days Intensive"
  college: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  studentCount: number;
  description: string;
  registrationCode: string;
  isLocked?: boolean;
  zoomLink?: string;
  zoomConfig?: {
    topic: string;
    agenda?: string;
    instructorName?: string;
    meetingId: string;
    meetingLink: string;
    passcode: string;
    scheduledTime: string;
    scheduledDate?: string;
    status: "scheduled" | "live" | "ended";
    recordingUrl: string;
    isRecordingUnlocked: boolean;
    summary?: SessionSummary;
  };
}

export interface Student {
  id: string;
  collegeRegNo?: string; // College Registration Number / Roll Number
  name: string;
  email: string;
  mobile: string;
  batchId: string;
  batchName: string;
  avatar?: string;
  college?: string;
  branch?: string;
  city?: string;
  state?: string;
  password?: string;
  enrolledAt: string;
  status: "active" | "completed" | "inactive";
  scores: {
    quizScore: number;
    codingScore: number;
    liveQAScore: number;
    assignmentScore: number;
    overallAccuracy: number; // percentage
  };
  totalPoints: number;
  activeStreakDays: number;
  fastestResponseMs: number;
  averageResponseMs?: number;
  attendedSessions: number;
  totalSessions: number;
  notes?: string;
  trainerRating?: number; // 1 to 5 stars
  trainerReview?: string; // written review text
  trainerReviewedAt?: string;
  aiVerdictSummary?: string; // Holistic 10-milestone AI evaluation summary
  aiVerdictRating?: number; // 1 to 5 stars overall AI rating
  aiVerdictEvaluatedAt?: string; // ISO timestamp of evaluation
  aiVerdictStrengths?: string[];
  aiVerdictImprovements?: string[];
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export type TagQuestionType = "mcq" | "true_false" | "poll" | "short_answer";

export interface LearnHubTagQuestion {
  id?: string;
  type?: TagQuestionType; // default to "mcq"
  question: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  correct?: "A" | "B" | "C" | "D" | "True" | "False" | string;
  explanation?: string;
  pollOptions?: string[];
  pollVotes?: number[];
  sampleAnswer?: string;
}

export interface LearnHubTag {
  id: string;
  term: string;
  cssClass: "llm" | "api" | "nexos" | "crewai" | "tag1" | "tag2" | "tag3" | string;
  icon: string;
  type: string;
  definition: string;
  questions: LearnHubTagQuestion[];
}

export interface LearnHubParagraph {
  textBefore: string;
  highlight?: LearnHubTag;
  textAfter: string;
}

export interface BottomTag {
  tag: string;
  title: string;
  icon: string;
  cssClass: string;
  definition: string;
  questionsCount: number;
}

export interface LearnHubSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  badge?: string;
  paragraphs: LearnHubParagraph[];
  bottomTags?: BottomTag[];
  notes?: string;
  tagsLocked?: boolean;
}

export interface LearnHubSourceFile {
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  slideCount?: number;
  previewUrl?: string;
}

export interface LearnHubStudentProgressItem {
  id: string;
  studentId: string;
  moduleId: string;
  completedSlides: number[];
  masteredTags: string[];
  quizScores: Record<string, any>;
  lastAccessedAt?: string;
}

export interface LearnHubModule {
  id: string;
  batchId: string;
  badge: string;
  title: string;
  subtitle: string;
  sourceFile?: LearnHubSourceFile; // Legacy single file
  sourceFiles?: LearnHubSourceFile[]; // New multi-file support
  slides?: LearnHubSlide[];
  paragraphs: LearnHubParagraph[];
  bottomTags: BottomTag[];
  isPublished: boolean;
  createdAt: string;
  studentProgress?: LearnHubStudentProgressItem[];
}

export type QuestionType = "mcq" | "true_false" | "fill_blank" | "poll" | "essay" | "coding";

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export type SupportedLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "c"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "dart"
  | "scala"
  | "sql"
  | "bash"
  | "r"
  | string;

export interface AssignmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  title?: string;
  description?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  language?: SupportedLanguage;
  starterCode?: string;
  starterCodes?: Record<string, string>;
  solutionCode?: string;
  testCases?: TestCase[];
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: Record<string, string>; // questionId -> answer
  codeSubmissions?: Record<string, { code: string; testResults?: any[] }>;
  score: number;
  maxScore: number;
  feedback?: string;
  autoGraded: boolean;
}

export interface Assignment {
  id: string;
  batchId: string;
  title: string;
  description: string;
  type: "quiz" | "coding" | "mixed" | "poll_survey";
  durationMinutes: number;
  totalPoints: number;
  isPublished: boolean;
  isLocked?: boolean;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  deadline: string;
  questions: AssignmentQuestion[];
  submissions?: StudentSubmission[];
  submissionsCount?: number;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  avatar?: string;
  status: "present" | "absent" | "late" | "excused" | "unmarked";
  timestamp?: string;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  batchId: string;
  batchName?: string;
  title: string;
  date: string;
  fromTime: string;
  toTime: string;
  status: "scheduled" | "in_progress" | "completed";
  records: AttendanceRecord[];
  createdAt?: string;
  notes?: string;
}

export interface LiveQAResponse {
  studentId: string;
  studentName: string;
  avatar?: string;
  answer: string;
  timestamp: number;
  responseTimeMs: number;
  stoppedSecondsLeft?: number;
  responseTimeFormatted?: string;
  isCorrect?: boolean;
  submittedAt?: string;
  rating?: number;
  aiFeedback?: string;
  instructorReply?: string;
  reviewedAt?: string;
}

export interface LiveQuestion {
  id: string;
  batchId: string;
  question: string;
  type: "mcq" | "poll" | "true_false" | "open";
  options: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  isActive: boolean;
  isClosed: boolean;
  isLocked?: boolean;
  createdAt: string;
  responses: LiveQAResponse[];
  timeLimitSeconds?: number;
  timeLimitMinutes?: number;
  timeLimitFormatted?: string;
  launchedAt?: string;
  isExpired?: boolean;
  secondsRemaining?: number;
  points?: number;
  explanation?: string;
  category?: string;
  quizTitle?: string;
  askedByStudentId?: string;
  askedByStudentName?: string;
  upvotes?: number;
  answerByInstructor?: string;
  isAnswered?: boolean;
}

export interface CertificateTemplate {
  id: string;
  batchId: string;
  title: string;
  subtitle: string;
  issuerName: string;
  signatories: { id: string; name: string; title: string }[];
  descriptionText: string;
  isUnlocked: boolean;
  templateStyle?: "modern" | "classic" | "cyber";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "super_admin" | "instructor" | "ta";
  assignedBatches?: string[];
  permissions: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionChapter {
  time: string; // e.g. "00:00", "15:20"
  title: string;
  description: string;
}

export interface SessionSummary {
  title: string;
  duration: string;
  overview: string;
  keyHighlights: string[];
  keyConcepts?: string[];
  actionItems: string[];
  chapters?: SessionChapter[];
  attendanceCount?: number;
  avgEngagementScore?: number;
}

export interface LiveSession {
  id: string;
  batchId: string;
  topic: string;
  agenda?: string;
  instructorName?: string;
  meetingId: string;
  meetingLink: string;
  passcode: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "scheduled" | "live" | "ended";
  recordingUrl: string;
  isRecordingUnlocked: boolean;
  summary?: SessionSummary;
  createdAt: string;
}

export interface ScheduledMeeting {
  id: string;
  batchId?: string;
  batchName?: string;
  title: string;
  agenda?: string;
  instructorName?: string;
  scheduledDate: string;
  scheduledTime: string;
  meetingLink: string;
  meetingId?: string;
  passcode?: string;
  status: "scheduled" | "live" | "ended";
  recordingUrl?: string;
  isRecordingUnlocked?: boolean;
  isPublished?: boolean;
  orderIndex?: number;
  summary?: SessionSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  enableCodingIDE: boolean;
  enableQuiz: boolean;
  enableLearnHub: boolean;
  enableCertificate: boolean;
  enableMyReport: boolean;
  enableLiveQA: boolean;
  enableLeaderboard?: boolean;
  enablePeerReview?: boolean;
  enableTelemetryAnalytics?: boolean;
  enableZoomSync: boolean;
  enableStudentReviews?: boolean;
  apiKeySet: boolean;
  geminiApiKey?: string;
  enableAttendanceModule?: boolean;
  zoomConfig: {
    topic: string;
    agenda?: string;
    instructorName?: string;
    meetingId: string;
    meetingLink: string;
    passcode: string;
    scheduledTime: string;
    scheduledDate?: string;
    status: "scheduled" | "live" | "ended";
    recordingUrl: string;
    isRecordingUnlocked: boolean;
    summary?: SessionSummary;
  };
  adminUsers: AdminUser[];
  defaultStudentPassword?: string;
}
