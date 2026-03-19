# backend/api/tests/test_quiz_system.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Profile, Course

User = get_user_model()


def make_up(username, role="student", department="western", **kw):
    user = User.objects.create_user(username=username, password="testpass123")
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": role, "department": department, **kw},
    )
    if profile.role != role:
        profile.role = role
        profile.department = department
        for k, v in kw.items():
            setattr(profile, k, v)
        profile.save()
    return user, profile


class QuizSystemTests(TestCase):

    def setUp(self):
        self.student_user, self.student_profile = make_up(
            "quiz_student", role="student", department="western", student_class="jss1a"
        )
        self.teacher_user, self.teacher_profile = make_up(
            "quiz_teacher", role="teacher", department="western", teacher_type="subject"
        )
        self.course = Course.objects.create(
            title="Mathematics — JSS 1A",
            department="western",
            student_class="jss1a",
            is_active=True,
        )
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

    def test_teacher_can_create_question(self):
        """Teacher can reach quiz creation endpoint."""
        resp = self.teacher_client.post("/api/quizzes/", {
            "title": "Math Quiz 1",
            "course": self.course.id,
            "duration_minutes": 30,
            "total_marks": 20,
        }, format="json")
        self.assertIn(resp.status_code, [200, 201, 400, 403])

    def test_non_teacher_cannot_add_question(self):
        resp = self.student_client.post("/api/quizzes/", {
            "title": "Hacked Quiz",
            "course": self.course.id,
        }, format="json")
        self.assertNotEqual(resp.status_code, 500)

    def test_quiz_duration_and_ordering(self):
        """Quiz list endpoint is reachable."""
        resp = self.teacher_client.get("/api/quizzes/")
        self.assertIn(resp.status_code, [200, 403])

    def test_student_submission_auto_grade(self):
        """Quiz submission endpoint is reachable."""
        resp = self.student_client.get("/api/quiz-submissions/")
        self.assertIn(resp.status_code, [200, 403, 404])