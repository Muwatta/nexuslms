from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from api.models import Profile, Course, Enrollment, QuizSubmission

User = get_user_model()

class ViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin', password='admin')
        self.client.login(username='admin', password='admin')
        self.course_url = reverse('courses-list')

    def test_create_course(self):
        resp = self.client.post(self.course_url, {'title': 'View Course', 'description': 'x'})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Course.objects.count(), 1)

    def test_payment_student_restriction(self):
        # admin can create a payment for any student
        student_user = User.objects.create_user(username='s1', password='p')
        student_profile = Profile.objects.get(user=student_user)
        payment_url = reverse('payments-list')
        data = {
            'student': student_profile.id,
            'course': None,
            'amount': '50.00',
            'reference': 'ref123',
        }
        resp = self.client.post(payment_url, data)
        self.assertEqual(resp.status_code, 201)

    def test_payment_initialization_response(self):
        # monkeypatch paystack client to return known structure
        from api import views
        original_init = views.initialize_transaction

        def fake_init(amount, email, reference=None, callback_url=None):
            return {'data': {'authorization_url': 'https://paystack.test/checkout'}}

        views.initialize_transaction = fake_init

        student_user = User.objects.create_user(username='s2', password='p')
        student_profile = Profile.objects.get(user=student_user)
        payment_url = reverse('payments-list')
        data = {
            'student': student_profile.id,
            'course': None,
            'amount': '75.00',
            'reference': 'ref456',
        }
        resp = self.client.post(payment_url, data)
        self.assertEqual(resp.status_code, 201)
        self.assertIn('paystack_response', resp.data)
        self.assertIn('authorization_url', resp.data['paystack_response']['data'])

        views.initialize_transaction = original_init

    def test_course_analytics(self):
        # create course and enrollments
        course = Course.objects.create(title='A')
        student_user = User.objects.create_user(username='stu', password='p')
        student_profile = Profile.objects.get(user=student_user)
        Enrollment.objects.create(student=student_profile, course=course)
        analytics_url = reverse('course_analytics', args=[course.id])
        resp = self.client.get(analytics_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total_enrollments'], 1)
        # new fields added
        self.assertIn('average_quiz_score', resp.data)

    def test_student_analytics(self):
        course = Course.objects.create(title='B')
        student_user = User.objects.create_user(username='stu2', password='p')
        student_profile = Profile.objects.get(user=student_user)
        Enrollment.objects.create(student=student_profile, course=course)
        # create dummy quiz for submission
        from api.models import Quiz
        quiz_obj = Quiz.objects.create(title='Q1', course=course)
        QuizSubmission.objects.create(quiz=quiz_obj, student=student_profile, score=80)
        url = reverse('student_analytics', args=[student_profile.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total_quiz_submissions'], 1)
        self.assertIn('enrolled_courses', resp.data)

    def test_registration(self):
        url = reverse('register')
        data = {'username': 'newuser', 'password': 'pw', 'role': 'student'}
        resp = self.client.post(url, data)
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(User.objects.filter(username='newuser').exists())
