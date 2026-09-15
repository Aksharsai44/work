from django.db import models
import uuid

class Batch(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50) # 'workshop' | 'bootcamp'
    durationLabel = models.CharField(max_length=100)
    college = models.CharField(max_length=255)
    startDate = models.DateField()
    endDate = models.DateField()
    status = models.CharField(max_length=50) # 'upcoming' | 'active' | 'completed'
    description = models.TextField(blank=True, null=True)
    registrationCode = models.CharField(max_length=50, blank=True, null=True)
    zoomLink = models.CharField(max_length=500, blank=True, null=True)
    zoomConfig = models.JSONField(default=dict, blank=True, null=True)
    isLocked = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class Student(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    collegeRegNo = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    mobile = models.CharField(max_length=20)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='students')
    avatar = models.URLField(blank=True, null=True)
    college = models.CharField(max_length=255, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    enrolledAt = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="active") # "active" | "completed" | "inactive"
    
    totalPoints = models.IntegerField(default=0)
    activeStreakDays = models.IntegerField(default=0)
    fastestResponseMs = models.IntegerField(default=0)
    attendedSessions = models.IntegerField(default=0)
    totalSessions = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    trainerRating = models.FloatField(default=0.0, blank=True, null=True)
    trainerReview = models.TextField(blank=True, null=True)
    trainerReviewedAt = models.DateTimeField(blank=True, null=True)
    aiVerdictSummary = models.TextField(blank=True, null=True)
    aiVerdictRating = models.FloatField(default=0.0, blank=True, null=True)
    aiVerdictEvaluatedAt = models.DateTimeField(blank=True, null=True)
    aiVerdictStrengths = models.JSONField(default=list, blank=True)
    aiVerdictImprovements = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

class Score(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='scores')
    quizScore = models.FloatField(default=0)
    codingScore = models.FloatField(default=0)
    liveQAScore = models.FloatField(default=0)
    assignmentScore = models.FloatField(default=0)
    overallAccuracy = models.FloatField(default=0)
    
    def __str__(self):
        return f"{self.student.name} Scores"


class LearnHubModule(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='learnhub_modules', null=True, blank=True)
    badge = models.CharField(max_length=100, default="INTERACTIVE AI GUIDE")
    title = models.CharField(max_length=255)
    subtitle = models.TextField(blank=True, default="")
    sourceFile = models.JSONField(default=dict, blank=True, null=True)
    sourceFiles = models.JSONField(default=list, blank=True)
    slides = models.JSONField(default=list, blank=True)
    paragraphs = models.JSONField(default=list, blank=True)
    bottomTags = models.JSONField(default=list, blank=True)
    isPublished = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.batch.name if self.batch else 'Global'})"


class LearnHubStudentProgress(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='learnhub_progress')
    module = models.ForeignKey(LearnHubModule, on_delete=models.CASCADE, related_name='student_progress')
    completedSlides = models.JSONField(default=list, blank=True)
    masteredTags = models.JSONField(default=list, blank=True)
    quizScores = models.JSONField(default=dict, blank=True)
    lastAccessedAt = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'module')

    def __str__(self):
        return f"{self.student.name} - {self.module.title}"


class LiveQuestion(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='live_questions')
    question = models.TextField()
    type = models.CharField(max_length=50, default='mcq')  # 'mcq' | 'poll' | 'true_false' | 'open'
    options = models.JSONField(default=list, blank=True)
    correctAnswer = models.TextField(blank=True, null=True)
    isActive = models.BooleanField(default=True)
    isClosed = models.BooleanField(default=False)
    isLocked = models.BooleanField(default=False)
    timeLimitSeconds = models.IntegerField(default=30)
    points = models.IntegerField(default=100)
    explanation = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    quizTitle = models.CharField(max_length=255, blank=True, null=True)
    
    # For student doubts / questions asked by students in live chat
    askedByStudent = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='asked_questions')
    askedByStudentName = models.CharField(max_length=255, blank=True, null=True)
    upvotes = models.IntegerField(default=0)
    upvotedStudentIds = models.JSONField(default=list, blank=True)
    answerByInstructor = models.TextField(blank=True, null=True)
    isAnswered = models.BooleanField(default=False)
    
    launchedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-createdAt']

    @property
    def timeLimitMinutes(self):
        if not self.timeLimitSeconds:
            return 0
        return self.timeLimitSeconds // 60

    @property
    def timeLimitFormatted(self):
        secs = self.timeLimitSeconds or 0
        if secs == 0:
            return "No Timer"
        if secs < 60:
            return f"{secs}s"
        mins = secs // 60
        rem = secs % 60
        if rem == 0:
            return f"{mins} min"
        return f"{mins}m {rem}s"

    @property
    def isExpired(self):
        if self.isClosed:
            return True
        if self.timeLimitSeconds and self.timeLimitSeconds > 0:
            import datetime
            from django.utils import timezone
            start = self.launchedAt or self.createdAt
            if start:
                expiry = start + datetime.timedelta(seconds=self.timeLimitSeconds)
                return timezone.now() > expiry
        return False

    @property
    def secondsRemaining(self):
        if self.isClosed:
            return 0
        if self.timeLimitSeconds and self.timeLimitSeconds > 0:
            import datetime
            from django.utils import timezone
            start = self.launchedAt or self.createdAt
            if start:
                expiry = start + datetime.timedelta(seconds=self.timeLimitSeconds)
                diff = (expiry - timezone.now()).total_seconds()
                return max(0, int(diff))
        return None

    def __str__(self):
        return f"{self.question[:50]} ({self.batch.name if self.batch else 'No Batch'})"


class LiveQAResponse(models.Model):
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey(LiveQuestion, on_delete=models.CASCADE, related_name='responses')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='live_responses')
    studentName = models.CharField(max_length=255)
    avatar = models.URLField(blank=True, null=True)
    answer = models.TextField()
    isCorrect = models.BooleanField(null=True, blank=True)
    responseTimeMs = models.IntegerField(default=0)
    submittedAt = models.DateTimeField(auto_now_add=True)
    rating = models.FloatField(null=True, blank=True)  # 1.0 to 5.0 (star-based rating)
    aiFeedback = models.TextField(blank=True, null=True)
    instructorReply = models.TextField(blank=True, null=True)
    reviewer = models.CharField(max_length=50, default='none', blank=True, null=True)  # 'ai' | 'instructor' | 'both'
    reviewedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('question', 'student')
        ordering = ['submittedAt']

    def __str__(self):
        return f"{self.studentName} -> {self.question.id} ({self.answer})"


class Assignment(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    type = models.CharField(max_length=50, default="mixed") # 'quiz' | 'coding' | 'mixed' | 'poll_survey'
    durationMinutes = models.IntegerField(default=30)
    totalPoints = models.IntegerField(default=100)
    isPublished = models.BooleanField(default=True)
    isLocked = models.BooleanField(default=False)
    startDate = models.CharField(max_length=50, blank=True, default="")
    startTime = models.CharField(max_length=50, blank=True, default="")
    endDate = models.CharField(max_length=50, blank=True, default="")
    endTime = models.CharField(max_length=50, blank=True, default="")
    deadline = models.DateTimeField(null=True, blank=True)
    questions = models.JSONField(default=list, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-createdAt']

    def __str__(self):
        return f"{self.title} ({self.batch.name if self.batch else 'No Batch'})"


class AssignmentSubmission(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignment_submissions')
    studentName = models.CharField(max_length=255)
    submittedAt = models.DateTimeField(auto_now=True)
    startedAt = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default="submitted") # 'in_progress' | 'submitted' | 'graded'
    timeLeftSeconds = models.IntegerField(default=0)
    answers = models.JSONField(default=dict, blank=True) # questionId -> answer
    codeSubmissions = models.JSONField(default=dict, blank=True) # questionId -> { code, testResults, language }
    questionScores = models.JSONField(default=dict, blank=True) # questionId -> { earned, max, isCorrect }
    score = models.FloatField(default=0)
    maxScore = models.FloatField(default=0)
    feedback = models.TextField(blank=True, null=True)
    autoGraded = models.BooleanField(default=True)

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['-submittedAt']

    def __str__(self):
        return f"{self.studentName} -> {self.assignment.title} ({self.score}/{self.maxScore})"


class CertificateTemplate(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='certificate_templates')
    title = models.CharField(max_length=255, default="CERTIFICATE OF EXCELLENCE")
    subtitle = models.CharField(max_length=255, default="MIND2I ARTIFICIAL INTELLIGENCE INSTITUTE")
    issuerName = models.CharField(max_length=255, default="MIND2I ARTIFICIAL INTELLIGENCE INSTITUTE")
    signatories = models.JSONField(default=list, blank=True)
    descriptionText = models.TextField(blank=True, default="")
    isUnlocked = models.BooleanField(default=True)
    templateStyle = models.CharField(max_length=50, default="modern")
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updatedAt']

    def __str__(self):
        return f"{self.title} ({self.batch.name if self.batch else 'Global'})"


class AdminUser(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255, default="mind2i@admin")
    role = models.CharField(max_length=50, default="instructor") # 'super_admin' | 'instructor' | 'ta'
    assignedBatches = models.JSONField(default=list, blank=True) # list of batch IDs e.g. ["b1", "b2"]
    permissions = models.JSONField(default=list, blank=True) # ["all"] or specific tabs
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-createdAt']

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.email}"


class AppSettingsModel(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default="global")
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='feature_settings', null=True, blank=True)
    enableCodingIDE = models.BooleanField(default=True)
    enableQuiz = models.BooleanField(default=True)
    enableLearnHub = models.BooleanField(default=True)
    enableCertificate = models.BooleanField(default=True)
    enableMyReport = models.BooleanField(default=True)
    enableLiveQA = models.BooleanField(default=True)
    enableLeaderboard = models.BooleanField(default=True)
    enablePeerReview = models.BooleanField(default=False)
    enableTelemetryAnalytics = models.BooleanField(default=True)
    enableZoomSync = models.BooleanField(default=True)
    enableStudentReviews = models.BooleanField(default=True)
    defaultStudentPassword = models.CharField(max_length=255, default="student123")
    zoomConfig = models.JSONField(default=dict, blank=True)
    updatedAt = models.DateTimeField(auto_now=True)

class ScheduledMeeting(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='scheduled_meetings', null=True, blank=True)
    title = models.CharField(max_length=255)
    agenda = models.TextField(blank=True, default="")
    instructorName = models.CharField(max_length=255, blank=True, default="")
    scheduledDate = models.CharField(max_length=100, blank=True, default="Today")
    scheduledTime = models.CharField(max_length=100, blank=True, default="10:00 AM - 01:00 PM")
    meetingLink = models.CharField(max_length=500, blank=True, default="")
    meetingId = models.CharField(max_length=100, blank=True, default="")
    passcode = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(max_length=50, default="scheduled") # 'scheduled' | 'live' | 'ended'
    recordingUrl = models.CharField(max_length=500, blank=True, default="")
    isRecordingUnlocked = models.BooleanField(default=True)
    isPublished = models.BooleanField(default=True)
    orderIndex = models.IntegerField(default=0)
    summary = models.JSONField(default=dict, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['orderIndex', 'createdAt']

    def __str__(self):
        return f"{self.title} ({self.status}) - {self.batch.name if self.batch else 'Global'}"




