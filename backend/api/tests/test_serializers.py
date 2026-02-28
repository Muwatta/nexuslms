from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import Profile, Course
from api.serializers import ProfileSerializer, CourseSerializer

User = get_user_model()

class SerializerTests(TestCase):
    def test_profile_serializer(self):
        user = User.objects.create_user(username='u1', password='p')
        profile = Profile.objects.get(user=user)
        data = ProfileSerializer(profile).data
        self.assertEqual(data['user'], user.id)
        self.assertEqual(data['role'], 'student')

    def test_course_serializer(self):
        course = Course.objects.create(title='C1', description='d')
        data = CourseSerializer(course).data
        self.assertEqual(data['title'], 'C1')
