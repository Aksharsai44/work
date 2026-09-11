import {
  Batch,
  Student,
  LearnHubModule,
  Assignment,
  LiveQuestion,
  CertificateTemplate,
  AppSettings,
  ScheduledMeeting,
} from "../types";

export const emptyBatch: Batch = {
  id: "",
  name: "",
  type: "workshop",
  durationLabel: "",
  college: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  status: "upcoming",
  studentCount: 0,
  description: "",
  registrationCode: "",
};

export const emptyStudent: Student = {
  id: "",
  name: "Student",
  email: "",
  mobile: "",
  batchId: "",
  batchName: "",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Student",
  college: "",
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
};

export const emptyLearnHubModule: LearnHubModule = {
  id: "",
  batchId: "",
  badge: "MODULE GUIDE",
  title: "New Module",
  subtitle: "Module description and objectives.",
  createdAt: new Date().toISOString(),
  isPublished: true,
  slides: [],
  paragraphs: [],
  bottomTags: [],
};

export const initialBatches: Batch[] = [];

export const initialStudents: Student[] = [];

export const initialLearnHubModule: LearnHubModule = emptyLearnHubModule;

export const initialLearnHubModules: LearnHubModule[] = [];

export const initialAssignments: Assignment[] = [];

export const initialLiveQuestions: LiveQuestion[] = [];

export const initialCertificateTemplate: CertificateTemplate = {
  id: "cert-default",
  batchId: "",
  title: "CERTIFICATE OF COMPLETION",
  subtitle: "MIND2I ARTIFICIAL INTELLIGENCE INSTITUTE",
  issuerName: "MIND2I Learning Initiative",
  signatories: [
    { id: "sig1", name: "Program Director", title: "Lead Instructor" },
  ],
  descriptionText:
    "has successfully demonstrated mastery and completed all hands-on technical modules in {{batch}}",
  isUnlocked: true,
  templateStyle: "modern",
};

export const initialSettings: AppSettings = {
  enableCodingIDE: true,
  enableQuiz: true,
  enableLearnHub: true,
  enableCertificate: true,
  enableMyReport: true,
  enableLiveQA: true,
  enableZoomSync: true,
  enableStudentReviews: true,
  apiKeySet: true,
  defaultStudentPassword: "Password@123",
  zoomConfig: {
    topic: "",
    agenda: "",
    instructorName: "",
    meetingId: "",
    meetingLink: "",
    passcode: "",
    scheduledDate: "",
    scheduledTime: "",
    status: "scheduled",
    recordingUrl: "",
    isRecordingUnlocked: false,
  },
  adminUsers: [],
};

export const initialScheduledMeetings: ScheduledMeeting[] = [];
