from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Profile, Course, Enrollment, Assignment, AssignmentSubmission
import io

User = get_user_model()

class UploadAndPermissionTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin2', password='admin')
        self.teacher = User.objects.create_user(username='teacher1', password='tpass')
        try:
            self.teacher.profile.role = 'teacher'
            self.teacher.profile.save()
        except Exception:
            try:
                self.teacher.role = 'teacher'
                self.teacher.save()
            except Exception:
                pass

        self.course = Course.objects.create(title='CSV Course')
        self.assign = Assignment.objects.create(course=self.course, title='CSVAssign', deadline='2030-01-01T00:00Z')
        self.students = []
        for u in ['s_a', 's_b']:
            user = User.objects.create_user(username=u, password='p')
            profile = Profile.objects.get(user=user)
            Enrollment.objects.create(student=profile, course=self.course)
            self.students.append((user, profile))

    def login_user(self, user):
        self.client.force_authenticate(user=user)

    def test_teacher_can_download_and_upload_template(self):
        self.login_user(self.teacher)
        download_url = f'/api/assignments/{self.assign.id}/download_template/'
        resp = self.client.get(download_url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('text/csv', resp['Content-Type'])

        csv_lines = ['student_username,student_id,student_name,grade']
        for u,p in self.students:
            csv_lines.append(f'{u.username},{p.id},"{u.username}",80')
        csv_data = '\n'.join(csv_lines).encode('utf-8')
        f = SimpleUploadedFile('results.csv', csv_data, content_type='text/csv')
        upload_url = f'/api/assignments/{self.assign.id}/upload_results/'
        resp = self.client.post(upload_url, {'file': f})
        self.assertIn(resp.status_code, (200,201))
        self.assertIn('created', resp.json())

    def test_student_cannot_upload_results(self):
        student_user, profile = self.students[0]
        self.authenticate(student_user.username, 'p')
        upload_url = f'/api/assignments/{self.assign.id}/upload_results/'
        csv_data = b'student_username,student_id,student_name,grade\n'
        f = SimpleUploadedFile('r.csv', csv_data, content_type='text/csv')
        resp = self.client.post(upload_url, {'file': f})
        self.assertEqual(resp.status_code, 403)

    def test_assignment_submission_pdf_validation(self):
        student_user, student_profile = self.students[0]
        self.login_user(student_user)
        url = '/api/assignment-submissions/'
        bad_file = SimpleUploadedFile('work.txt', b'not a pdf', content_type='text/plain')
        data = {'assignment': self.assign.id, 'student': student_profile.id, 'file': bad_file}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('file', resp.json())

    def test_only_admin_can_delete_profile(self):
        victim = User.objects.create_user(username='victim', password='p')
        try:
            victim.profile.role = 'instructor'
            victim.profile.save()
        except Exception:
            victim.role = 'instructor'
            victim.save()

        self.login_user(self.teacher)
        profile_obj = Profile.objects.get(user=victim)
        url = f'/api/profiles/{profile_obj.id}/'
        resp = self.client.delete(url)
        self.assertIn(resp.status_code, (403, 404))

        self.client.logout()
        self.login_user(self.admin)
        resp = self.client.delete(url)
        self.assertIn(resp.status_code, (204, 200))
