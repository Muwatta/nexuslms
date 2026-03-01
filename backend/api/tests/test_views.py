from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import (
    Profile,
    Course,
    Enrollment,
    QuizSubmission,
    Quiz,
    Question,
)


User = get_user_model()


class ViewTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@test.com",
            password="adminpass123"
        )

        self.admin_profile = Profile.objects.get(user=self.admin)
        self.admin_profile.role = "instructor"
        self.admin_profile.save()

        self.authenticate_user(self.admin)
        self.course_url = reverse("courses-list")

    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

    def switch_user(self, user):
        self.authenticate_user(user)

    def create_student(self, username):
        user = User.objects.create_user(
            username=username,
            email=f"{username}@test.com",
            password="studentpass123"
        )
        profile = Profile.objects.get(user=user)
        profile.role = "student"
        profile.save()
        return user, profile

    def test_create_course(self):
        resp = self.client.post(
            self.course_url,
            {
                "title": "View Course",
                "description": "x",
                "instructor": self.admin_profile.id,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Course.objects.count(), 1)

    def test_payment_student_restriction(self):
        student_user, student_profile = self.create_student("s1")

        payment_url = reverse("payments-list")
        data = {
            "student": student_profile.id,
            "amount": "50.00",
            "reference": "ref123",
        }

        resp = self.client.post(payment_url, data, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_payment_initialization_response(self):
        from api import views

        original_init = views.payment.initialize_transaction

        def fake_init(amount, email, reference=None, callback_url=None):
            return {
                "data": {
                    "authorization_url": "https://paystack.test/checkout"
                }
            }

        views.payment.initialize_transaction = fake_init

        student_user, student_profile = self.create_student("s2")

        payment_url = reverse("payments-list")
        data = {
            "student": student_profile.id,
            "amount": "75.00",
            "reference": "ref456",
        }

        resp = self.client.post(payment_url, data, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertIn("paystack_response", resp.data)
        self.assertIn(
            "authorization_url",
            resp.data["paystack_response"]["data"],
        )

        views.payment.initialize_transaction = original_init

    def test_course_analytics(self):
        course = Course.objects.create(
            title="A",
            instructor=self.admin_profile,
        )

        _, student_profile = self.create_student("stu")

        Enrollment.objects.create(
            student=student_profile,
            course=course,
            status="active",
        )

        analytics_url = reverse("course_analytics", args=[course.id])
        resp = self.client.get(analytics_url)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total_enrollments"], 1)
        self.assertIn("average_quiz_score", resp.data)

    def test_student_analytics(self):
        course = Course.objects.create(
            title="B",
            instructor=self.admin_profile,
        )

        _, student_profile = self.create_student("stu2")

        Enrollment.objects.create(
            student=student_profile,
            course=course,
            status="active",
        )

        quiz_obj = Quiz.objects.create(title="Q1", course=course)
        QuizSubmission.objects.create(
            quiz=quiz_obj,
            student=student_profile,
            score=80,
        )

        url = reverse("student_analytics", args=[student_profile.id])
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total_quiz_submissions"], 1)
        self.assertIn("enrolled_courses", resp.data)

    def test_registration(self):
        url = reverse("register")
        data = {
            "username": "newuser",
            "password": "newuserpass123",
            "email": "newuser@test.com",
        }

        resp = self.client.post(url, data, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            User.objects.filter(username="newuser").exists()
        )

    def test_ai_endpoint(self):
        url = reverse("ai")
        resp = self.client.post(
            url,
            {"prompt": "Hello AI"},
            format="json",
        )

        self.assertEqual(resp.status_code, 200)
        self.assertIn("AI echo", resp.data["response"])

    def test_quiz_submission_publish_and_pdf(self):
        course = Course.objects.create(
            title="TestCourse",
            instructor=self.admin_profile,
        )

        student_user, student_profile = self.create_student("stu3")

        quiz_obj = Quiz.objects.create(
            title="Q2",
            course=course,
        )

        question = Question.objects.create(
            quiz=quiz_obj,
            text="Test Q",
            choices=["A", "B", "C", "D"],
            correct_index=0,
            marks=70,
        )

        self.switch_user(student_user)

        submission_url = reverse("quiz-submissions-list")

        resp = self.client.post(
            submission_url,
            {
                "quiz": quiz_obj.id,
                "answers": [
                    {
                        "question_id": question.id,
                        "selected_option": "A",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["score"], 70)

        sub_id = resp.data["id"]

        pdf_url = reverse("quiz-submissions-pdf", args=[sub_id])
        resp = self.client.get(pdf_url)
        self.assertEqual(resp.status_code, 403)

        publish_url = reverse("quiz-submissions-publish", args=[sub_id])

        resp = self.client.post(publish_url)
        self.assertEqual(resp.status_code, 403)

        self.switch_user(self.admin)

        resp = self.client.post(publish_url)
        self.assertEqual(resp.status_code, 200)

        resp = self.client.get(pdf_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp["Content-Type"], "application/pdf")