from rest_framework import serializers
import time
from .models import (
    Batch, Student, Score, LearnHubModule, LearnHubStudentProgress,
    LiveQuestion, LiveQAResponse, Assignment, AssignmentSubmission,
    CertificateTemplate, AdminUser, AppSettingsModel, ScheduledMeeting
)

class BatchSerializer(serializers.ModelSerializer):
    studentCount = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = '__all__'

    def get_studentCount(self, obj):
        return obj.students.count()

class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['quizScore', 'codingScore', 'liveQAScore', 'assignmentScore', 'overallAccuracy']

class StudentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    scores = ScoreSerializer(required=False)
    batchName = serializers.CharField(source='batch.name', read_only=True)
    batchId = serializers.CharField(source='batch.id', read_only=True, required=False, allow_null=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)
    averageResponseMs = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'id': {'validators': []},
        }

    def get_averageResponseMs(self, obj):
        from django.db.models import Avg
        avg_val = obj.live_responses.filter(responseTimeMs__gt=0).aggregate(Avg('responseTimeMs'))['responseTimeMs__avg']
        if avg_val:
            return round(avg_val)
        return obj.fastestResponseMs or 0

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        score_obj = getattr(instance, 'scores', None)
        if score_obj:
            ret['scores'] = {
                'quizScore': round(score_obj.quizScore or 0.0, 1),
                'codingScore': round(score_obj.codingScore or 0.0, 1),
                'liveQAScore': round(score_obj.liveQAScore or 0.0, 1),
                'assignmentScore': round(score_obj.assignmentScore or 0.0, 1),
                'overallAccuracy': round(score_obj.overallAccuracy or 0.0, 1)
            }
        else:
            ret['scores'] = {
                'quizScore': 0.0,
                'codingScore': 0.0,
                'liveQAScore': 0.0,
                'assignmentScore': 0.0,
                'overallAccuracy': 0.0
            }
        ret['fastestResponseMs'] = instance.fastestResponseMs or 0
        return ret

    def create(self, validated_data):
        scores_data = validated_data.pop('scores', None)
        student_id = validated_data.pop('id', None) or self.initial_data.get('id') or f"stu_{int(time.time()*1000)}"
        email = validated_data.get('email')
        
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                validated_data['batch'] = Batch.objects.create(
                    id=batch_id,
                    name=self.initial_data.get('batchName', 'Registered Batch'),
                    type='workshop',
                    durationLabel='1 Day',
                    college=self.initial_data.get('college', 'University'),
                    startDate='2026-08-22',
                    endDate='2026-08-23',
                    status='active',
                    registrationCode=f"M2I-{str(batch_id)[-4:]}"
                )

        student, created = Student.objects.update_or_create(
            email=email,
            defaults={
                'id': student_id,
                **validated_data
            }
        )
        
        if scores_data:
            Score.objects.update_or_create(student=student, defaults=scores_data)
        else:
            Score.objects.get_or_create(student=student)
            
        return student

    def update(self, instance, validated_data):
        scores_data = validated_data.pop('scores', None)
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass

        # Update student fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update nested scores
        if scores_data and hasattr(instance, 'scores'):
            for attr, value in scores_data.items():
                setattr(instance.scores, attr, value)
            instance.scores.save()
            
        return instance


class LearnHubStudentProgressSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source='student.id', read_only=True)
    moduleId = serializers.CharField(source='module.id', read_only=True)
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=False, allow_null=True)
    module = serializers.PrimaryKeyRelatedField(queryset=LearnHubModule.objects.all(), required=False, allow_null=True)

    class Meta:
        model = LearnHubStudentProgress
        fields = '__all__'

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'studentId' in data_copy and 'student' not in data_copy:
            data_copy['student'] = data_copy['studentId']
        if 'moduleId' in data_copy and 'module' not in data_copy:
            data_copy['module'] = data_copy['moduleId']
        return super().to_internal_value(data_copy)

    def create(self, validated_data):
        student_id = self.initial_data.get('studentId') or self.initial_data.get('student')
        module_id = self.initial_data.get('moduleId') or self.initial_data.get('module')
        if student_id and 'student' not in validated_data:
            try:
                validated_data['student'] = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                pass
        if module_id and 'module' not in validated_data:
            try:
                validated_data['module'] = LearnHubModule.objects.get(id=module_id)
            except LearnHubModule.DoesNotExist:
                pass
        
        student_obj = validated_data.get('student')
        module_obj = validated_data.get('module')

        if student_obj and module_obj:
            existing = LearnHubStudentProgress.objects.filter(
                student=student_obj,
                module=module_obj
            ).first()

            completed_slides = validated_data.get('completedSlides', [])
            mastered_tags = validated_data.get('masteredTags', [])
            quiz_scores = validated_data.get('quizScores', {})

            if existing:
                # Merge completedSlides
                old_slides = set(existing.completedSlides or [])
                old_slides.update(completed_slides)
                merged_slides = sorted(list(old_slides))

                # Merge masteredTags
                old_tags = set(existing.masteredTags or [])
                old_tags.update(mastered_tags)
                merged_tags = list(old_tags)

                # Merge quizScores
                merged_quiz = dict(existing.quizScores or {})
                if isinstance(quiz_scores, dict):
                    merged_quiz.update(quiz_scores)

                existing.completedSlides = merged_slides
                existing.masteredTags = merged_tags
                existing.quizScores = merged_quiz
                existing.save()
                return existing
            else:
                instance = LearnHubStudentProgress.objects.create(
                    student=student_obj,
                    module=module_obj,
                    completedSlides=completed_slides,
                    masteredTags=mastered_tags,
                    quizScores=quiz_scores,
                )
                return instance
        return super().create(validated_data)


class LearnHubModuleSerializer(serializers.ModelSerializer):
    batchId = serializers.CharField(source='batch.id', read_only=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)
    studentProgress = LearnHubStudentProgressSerializer(source='student_progress', many=True, read_only=True)

    class Meta:
        model = LearnHubModule
        fields = '__all__'

    def create(self, validated_data):
        # Support batchId passed in request data
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        return super().create(validated_data)

    def update(self, instance, validated_data):
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        return super().update(instance, validated_data)


class LiveQAResponseSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source='student.id', read_only=True)
    questionId = serializers.CharField(source='question.id', read_only=True)
    stoppedSecondsLeft = serializers.SerializerMethodField()
    responseTimeFormatted = serializers.SerializerMethodField()

    class Meta:
        model = LiveQAResponse
        fields = [
            'id', 'questionId', 'studentId', 'studentName', 'avatar', 'answer',
            'isCorrect', 'responseTimeMs', 'stoppedSecondsLeft', 'responseTimeFormatted',
            'submittedAt', 'rating', 'aiFeedback', 'instructorReply', 'reviewer', 'reviewedAt'
        ]

    def get_stoppedSecondsLeft(self, obj):
        if obj.question and obj.question.timeLimitSeconds:
            used_secs = round(obj.responseTimeMs / 1000)
            return max(0, obj.question.timeLimitSeconds - used_secs)
        return None

    def get_responseTimeFormatted(self, obj):
        if obj.responseTimeMs:
            secs = round(obj.responseTimeMs / 1000, 1)
            if secs >= 60:
                mins = int(secs // 60)
                rem = round(secs % 60, 1)
                return f"{mins}m {rem}s"
            return f"{secs}s"
        return None


class LiveQuestionSerializer(serializers.ModelSerializer):
    batchId = serializers.CharField(source='batch.id', read_only=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)
    responses = LiveQAResponseSerializer(many=True, read_only=True)
    askedByStudentId = serializers.CharField(source='askedByStudent.id', read_only=True, required=False, allow_null=True)
    timeLimitMinutes = serializers.SerializerMethodField()
    timeLimitFormatted = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    secondsRemaining = serializers.SerializerMethodField()

    class Meta:
        model = LiveQuestion
        fields = '__all__'

    def get_timeLimitMinutes(self, obj):
        return obj.timeLimitMinutes

    def get_timeLimitFormatted(self, obj):
        return obj.timeLimitFormatted

    def get_isExpired(self, obj):
        return obj.isExpired

    def get_secondsRemaining(self, obj):
        return obj.secondsRemaining

    def create(self, validated_data):
        from django.utils import timezone
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        
        student_id = self.initial_data.get('askedByStudentId') or self.initial_data.get('askedByStudent')
        if student_id and 'askedByStudent' not in validated_data:
            try:
                validated_data['askedByStudent'] = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                pass

        # If launched immediately (not locked), set launchedAt timestamp
        if not validated_data.get('isLocked', False) and not validated_data.get('launchedAt'):
            validated_data['launchedAt'] = timezone.now()

        # Support both minutes and seconds or direct timeLimitSeconds
        time_limit_mins = self.initial_data.get('timeLimitMinutes')
        time_limit_secs = self.initial_data.get('timeLimitSeconds')
        if time_limit_mins is not None and time_limit_secs is not None:
            try:
                validated_data['timeLimitSeconds'] = int(time_limit_mins) * 60 + int(time_limit_secs)
            except (ValueError, TypeError):
                pass
        elif time_limit_mins is not None and time_limit_secs is None:
            try:
                validated_data['timeLimitSeconds'] = int(time_limit_mins) * 60
            except (ValueError, TypeError):
                pass

        return super().create(validated_data)

    def update(self, instance, validated_data):
        from django.utils import timezone
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass

        # If question is reopened or unlocked, reset launchedAt to now
        if validated_data.get('isClosed') is False and instance.isClosed:
            validated_data['launchedAt'] = timezone.now()
        elif validated_data.get('isLocked') is False and instance.isLocked:
            validated_data['launchedAt'] = timezone.now()

        # Support updating with minutes and seconds
        time_limit_mins = self.initial_data.get('timeLimitMinutes')
        time_limit_secs = self.initial_data.get('timeLimitSeconds')
        if time_limit_mins is not None and time_limit_secs is not None:
            try:
                validated_data['timeLimitSeconds'] = int(time_limit_mins) * 60 + int(time_limit_secs)
            except (ValueError, TypeError):
                pass
        elif time_limit_mins is not None and time_limit_secs is None:
            try:
                validated_data['timeLimitSeconds'] = int(time_limit_mins) * 60
            except (ValueError, TypeError):
                pass

        responses_data = self.initial_data.get('responses')
        if responses_data and isinstance(responses_data, list):
            for r_data in responses_data:
                sid = r_data.get('studentId') or r_data.get('student')
                if sid:
                    try:
                        resp_obj = LiveQAResponse.objects.get(question=instance, student_id=sid)
                        if 'rating' in r_data:
                            resp_obj.rating = r_data['rating']
                        if 'aiFeedback' in r_data:
                            resp_obj.aiFeedback = r_data['aiFeedback']
                        if 'instructorReply' in r_data:
                            resp_obj.instructorReply = r_data['instructorReply']
                        if 'reviewer' in r_data:
                            resp_obj.reviewer = r_data['reviewer']
                        if 'reviewedAt' in r_data and r_data['reviewedAt']:
                            resp_obj.reviewedAt = r_data['reviewedAt']
                        resp_obj.save()
                    except LiveQAResponse.DoesNotExist:
                        pass

        return super().update(instance, validated_data)


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignmentId = serializers.CharField(source='assignment.id', read_only=True)
    studentId = serializers.CharField(source='student.id', read_only=True)
    assignment = serializers.PrimaryKeyRelatedField(queryset=Assignment.objects.all(), required=False, allow_null=True)
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=False, allow_null=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'assignmentId' in data_copy and 'assignment' not in data_copy:
            data_copy['assignment'] = data_copy['assignmentId']
        if 'studentId' in data_copy and 'student' not in data_copy:
            data_copy['student'] = data_copy['studentId']
        return super().to_internal_value(data_copy)

    def create(self, validated_data):
        assignment_obj = validated_data.get('assignment')
        student_obj = validated_data.get('student')
        
        if assignment_obj and student_obj:
            sub_id = validated_data.get('id') or f"sub_{assignment_obj.id}_{student_obj.id}"
            instance, _ = AssignmentSubmission.objects.update_or_create(
                assignment=assignment_obj,
                student=student_obj,
                defaults={
                    'id': sub_id,
                    'studentName': validated_data.get('studentName') or student_obj.name,
                    'status': validated_data.get('status', 'submitted'),
                    'timeLeftSeconds': validated_data.get('timeLeftSeconds', 0),
                    'answers': validated_data.get('answers', {}),
                    'codeSubmissions': validated_data.get('codeSubmissions', {}),
                    'questionScores': validated_data.get('questionScores', {}),
                    'score': validated_data.get('score', 0),
                    'maxScore': validated_data.get('maxScore', 0),
                    'feedback': validated_data.get('feedback', ''),
                    'autoGraded': validated_data.get('autoGraded', True),
                }
            )
            return instance

        return super().create(validated_data)


class AssignmentSerializer(serializers.ModelSerializer):
    batchId = serializers.CharField(source='batch.id', read_only=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)
    submissionsCount = serializers.SerializerMethodField()
    submissions = AssignmentSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = '__all__'

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'batchId' in data_copy and 'batch' not in data_copy:
            data_copy['batch'] = data_copy['batchId']
        return super().to_internal_value(data_copy)

    def get_submissionsCount(self, obj):
        return obj.submissions.count()

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class CertificateTemplateSerializer(serializers.ModelSerializer):
    batchId = serializers.CharField(source='batch.id', read_only=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)

    class Meta:
        model = CertificateTemplate
        fields = '__all__'

    def create(self, validated_data):
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        template_id = self.initial_data.get('id') or f"cert_{batch_id}"
        
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        
        validated_data['id'] = template_id
        
        # Use update_or_create to prevent duplicates per batch
        if 'batch' in validated_data and validated_data['batch']:
            instance, _ = CertificateTemplate.objects.update_or_create(
                batch=validated_data['batch'],
                defaults={
                    'id': template_id,
                    'title': validated_data.get('title', 'CERTIFICATE OF EXCELLENCE'),
                    'subtitle': validated_data.get('subtitle', 'MIND2I ARTIFICIAL INTELLIGENCE INSTITUTE'),
                    'issuerName': validated_data.get('issuerName', 'MIND2I ARTIFICIAL INTELLIGENCE INSTITUTE'),
                    'signatories': validated_data.get('signatories', []),
                    'descriptionText': validated_data.get('descriptionText', ''),
                    'isUnlocked': validated_data.get('isUnlocked', True),
                    'templateStyle': validated_data.get('templateStyle', 'modern'),
                }
            )
            return instance
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        return super().update(instance, validated_data)


class AdminUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = AdminUser
        fields = '__all__'
        extra_kwargs = {
            'id': {'validators': []},
        }

    def create(self, validated_data):
        user_id = validated_data.pop('id', None) or self.initial_data.get('id') or f"adm_{int(time.time()*1000)}"
        email = validated_data.get('email')
        
        instance, _ = AdminUser.objects.update_or_create(
            email=email,
            defaults={
                'id': user_id,
                **validated_data
            }
        )
        return instance


class AppSettingsSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, default="global")
    batchId = serializers.CharField(source='batch.id', read_only=True, required=False, allow_null=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)

    class Meta:
        model = AppSettingsModel
        fields = '__all__'
        extra_kwargs = {
            'id': {'validators': []},
        }

    def create(self, validated_data):
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        setting_id = validated_data.pop('id', None) or self.initial_data.get('id') or (f"batch_{batch_id}" if batch_id else "global")
        
        if batch_id and 'batch' not in validated_data:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass

        instance, _ = AppSettingsModel.objects.update_or_create(
            id=setting_id,
            defaults=validated_data
        )
        return instance

    def update(self, instance, validated_data):
        batch_id = self.initial_data.get('batchId') or self.initial_data.get('batch')
        if batch_id:
            try:
                validated_data['batch'] = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                pass
        return super().update(instance, validated_data)


class ScheduledMeetingSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    batchId = serializers.CharField(source='batch.id', read_only=True, required=False, allow_null=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ScheduledMeeting
        fields = '__all__'
        extra_kwargs = {
            'id': {'validators': []},
        }

    def create(self, validated_data):
        meet_id = validated_data.pop('id', None) or self.initial_data.get('id') or f"meet_{int(time.time()*1000)}"
        batch_val = validated_data.get('batch') or self.initial_data.get('batch') or self.initial_data.get('batchId')
        
        if batch_val and not isinstance(batch_val, Batch):
            try:
                validated_data['batch'] = Batch.objects.get(id=str(batch_val))
            except Exception:
                pass

        instance, _ = ScheduledMeeting.objects.update_or_create(
            id=meet_id,
            defaults=validated_data
        )
        return instance

    def update(self, instance, validated_data):
        batch_val = validated_data.get('batch') or self.initial_data.get('batch') or self.initial_data.get('batchId')
        if batch_val and not isinstance(batch_val, Batch):
            try:
                validated_data['batch'] = Batch.objects.get(id=str(batch_val))
            except Exception:
                pass
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.batch:
            data['batchId'] = instance.batch.id
            data['batchName'] = instance.batch.name
        else:
            data['batchId'] = None
            data['batchName'] = "All Batches"
        return data







