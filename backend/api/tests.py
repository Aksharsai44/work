from django.test import TestCase
from rest_framework.test import APIClient
from api.models import Batch, Student, LiveQuestion, LiveQAResponse
import datetime

class LiveQARespondTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.batch = Batch.objects.create(
            id="batch_test_1",
            name="Test Batch",
            type="workshop",
            durationLabel="3 Days",
            college="Test Engineering College",
            startDate=datetime.date.today(),
            endDate=datetime.date.today() + datetime.timedelta(days=3),
            status="active"
        )
        self.student1 = Student.objects.create(
            id="std_1",
            name="Alex Student",
            email="alex@test.com",
            mobile="9876543210",
            batch=self.batch,
            totalPoints=0
        )
        self.student2 = Student.objects.create(
            id="std_2",
            name="Bob Student",
            email="bob@test.com",
            mobile="9876543211",
            batch=self.batch,
            totalPoints=0
        )
        self.question = LiveQuestion.objects.create(
            id="q_test_1",
            batch=self.batch,
            question="What is automation will be do?",
            type="mcq",
            options=["gen ai", "ai agent", "agent ai"],
            correctAnswer="ai agent",
            points=25,
            timeLimitSeconds=120,
            isClosed=False
        )

    def test_correct_answer_evaluation(self):
        # Test submitting answer with extra spaces or case variation
        resp = self.client.post(
            f"/api/live-questions/{self.question.id}/respond/",
            {"studentId": self.student1.id, "answer": "  ai agent  ", "responseTimeMs": 1500},
            format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.student1.refresh_from_db()
        self.assertEqual(self.student1.totalPoints, 25)
        
        response_obj = LiveQAResponse.objects.get(question=self.question, student=self.student1)
        self.assertTrue(response_obj.isCorrect)

    def test_auto_close_when_all_batch_students_respond(self):
        # 1st student responds -> question stays open (1 of 2 responded)
        self.client.post(
            f"/api/live-questions/{self.question.id}/respond/",
            {"studentId": self.student1.id, "answer": "ai agent", "responseTimeMs": 2000},
            format="json"
        )
        self.question.refresh_from_db()
        self.assertFalse(self.question.isClosed)

        # 2nd student responds -> all enrolled batch students (2 of 2) have responded, question automatically closes!
        self.client.post(
            f"/api/live-questions/{self.question.id}/respond/",
            {"studentId": self.student2.id, "answer": "gen ai", "responseTimeMs": 3000},
            format="json"
        )
        self.question.refresh_from_db()
        self.assertTrue(self.question.isClosed)
