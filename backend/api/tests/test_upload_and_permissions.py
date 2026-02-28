from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Profile, Course, Enrollment, Assignment, AssignmentSubmission
import io

User = get_user_model()

class UploadAndPermissionTests(APITestCase):
    def setUp(self):
        # create admin
        self.admin = User.objects.create_superuser(username='admin2', password='admin')
        # create teacher
        self.teacher = User.objects.create_user(username='teacher1', password='tpass')
        # set role on profile if exists
        try:
            self.teacher.profile.role = 'teacher'
            self.teacher.profile.save()
        except Exception:
            try:
                self.teacher.role = 'teacher'
                self.teacher.save()
            except Exception:
                pass

        # create student users and enroll
        self.course = Course.objects.create(title='CSV Course')
        self.assign = Assignment.objects.create(course=self.course, title='CSVAssign', deadline='2030-01-01T00:00Z')
        self.students = []
        for u in ['s_a', 's_b']:
            user = User.objects.create_user(username=u, password='p')
            profile = Profile.objects.get(user=user)
            Enrollment.objects.create(student=profile, course=self.course)
            self.students.append((user, profile))

    def authenticate(self, username, password):
        """Obtain a JWT for the given user and set authorization header."""
        url = reverse('token_obtain_pair') if 'token_obtain_pair' in self.client.get('/api/').data else '/api/token/'
        resp = self.client.post('/api/token/', {'username': username, 'password': password})
        # fallback if endpoint not detected
        if resp.status_code != 200 and 'access' not in resp.data:
            # Try using legacy token endpoint
            resp = self.client.post('/api/token/', {'username': username, 'password': password})
        token = resp.data.get('access')
        if token:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return resp

    def test_teacher_can_download_and_upload_template(self):
        # authenticate as teacher using JWT
        self.authenticate('teacher1', 'tpass')
        download_url = f'/api/assignments/{self.assign.id}/download_template/'
        resp = self.client.get(download_url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('text/csv', resp['Content-Type'])

        # prepare CSV to upload
        csv_lines = ['student_username,student_id,student_name,grade']
        for u,p in self.students:
            csv_lines.append(f'{u.username},{p.id},"{u.username}",80')
        csv_data = '\n'.join(csv_lines).encode('utf-8')
        f = SimpleUploadedFile('results.csv', csv_data, content_type='text/csv')
        upload_url = f'/api/assignments/{self.assign.id}/upload_results/'
        resp = self.client.post(upload_url, {'file': f})
        # expect success (JSON summary)
        self.assertIn(resp.status_code, (200,201))
        self.assertIn('created', resp.json())

    def test_student_cannot_upload_results(self):
        student_user, profile = self.students[0]
        # authenticate as student
        self.authenticate(student_user.username, 'p')
        upload_url = f'/api/assignments/{self.assign.id}/upload_results/'
        csv_data = b'student_username,student_id,student_name,grade\n'
        f = SimpleUploadedFile('r.csv', csv_data, content_type='text/csv')
        resp = self.client.post(upload_url, {'file': f})
        self.assertEqual(resp.status_code, 403)

    def test_only_admin_can_delete_profile(self):
        # create a teacher to be deleted
        victim = User.objects.create_user(username='victim', password='p')
        try:
            victim.profile.role = 'instructor'
            victim.profile.save()
        except Exception:
            victim.role = 'instructor'
            victim.save()

        # login as teacher (not admin) and attempt delete
        # re-authenticate as teacher
        self.authenticate('teacher1', 'tpass')
        profile_obj = Profile.objects.get(user=victim)
        url = f'/api/profiles/{profile_obj.id}/'
        resp = self.client.delete(url)
        # should be forbidden for non-admin; we allow 404 if the object is hidden
        self.assertIn(resp.status_code, (403, 404))

        # admin can delete; authenticate with JWT as well
        self.client.logout()
        self.authenticate('admin2', 'admin')
        resp = self.client.delete(url)
        self.assertIn(resp.status_code, (204, 200))
