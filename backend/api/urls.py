from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BatchViewSet, StudentViewSet, login_view, health_check_view,
    LearnHubModuleViewSet, LearnHubStudentProgressViewSet,
    LiveQuestionViewSet, learnhub_file_upload_view,
    AssignmentViewSet, AssignmentSubmissionViewSet,
    CertificateTemplateViewSet, AdminUserViewSet, AppSettingsViewSet,
    ScheduledMeetingViewSet
)

router = DefaultRouter()
router.register(r'batches', BatchViewSet)
router.register(r'students', StudentViewSet)
router.register(r'learnhub-modules', LearnHubModuleViewSet)
router.register(r'learnhub-progress', LearnHubStudentProgressViewSet)
router.register(r'live-questions', LiveQuestionViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'assignment-submissions', AssignmentSubmissionViewSet)
router.register(r'certificate-templates', CertificateTemplateViewSet)
router.register(r'admin-users', AdminUserViewSet)
router.register(r'settings', AppSettingsViewSet)
router.register(r'scheduled-meetings', ScheduledMeetingViewSet)

urlpatterns = [
    path('health/', health_check_view, name='health'),
    path('health', health_check_view, name='health_no_slash'),
    path('login/', login_view, name='login'),
    path('login', login_view, name='login_no_slash'),
    path('learnhub/upload/', learnhub_file_upload_view, name='learnhub_file_upload'),
    path('', include(router.urls)),
]

