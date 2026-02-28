from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import Profile, Course, Enrollment

User = get_user_model()

class ModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='student1', password='pass')
        self.profile = Profile.objects.get(user=self.user)

    def test_profile_created(self):
        self.assertEqual(self.profile.user.username, 'student1')
        self.assertEqual(self.profile.role, 'student')

    def test_course_str(self):
        course = Course.objects.create(title='Test', description='desc')
        self.assertEqual(str(course), 'Test')

    def test_enrollment_unique(self):
        course = Course.objects.create(title='Test2')
        Enrollment.objects.create(student=self.profile, course=course)
        with self.assertRaises(Exception):
            Enrollment.objects.create(student=self.profile, course=course)
