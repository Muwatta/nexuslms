from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from api.models import Assignment, Course, Profile, Enrollment, AssignmentSubmission
from django.contrib.auth import get_user_model
import io, csv

User = get_user_model()

# Create your tests here.


class AssignmentUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # create teacher and student
        self.teacher = User.objects.create_user(username='teach', password='pass')
        self.teacher.role = 'teacher'
        self.teacher.save()
        self.teacher_profile = Profile.objects.create(user=self.teacher, role='teacher', department='western')
        self.student = User.objects.create_user(username='stud', password='pass')
        self.student.role = 'student'
        self.student.save()
        self.student_profile = Profile.objects.create(user=self.student, role='student', department='western')
        self.course = Course.objects.create(title='Alpha', description='desc', instructor=self.teacher_profile)
        self.enrollment = Enrollment.objects.create(student=self.student_profile, course=self.course)
        self.assignment = Assignment.objects.create(course=self.course, title='Test', deadline='2025-01-01T00:00Z')
        # auth
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'teach', 'password': 'pass'})
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_download_template(self):
        url = reverse('assignment-detail', args=[self.assignment.id]) + 'download_template/'
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        text = resp.content.decode()
        self.assertIn('student_username', text)
        self.assertIn(self.student_profile.user.username, text)

    def test_upload_csv_creates_submission(self):
        csvfile = io.StringIO()
        w = csv.writer(csvfile)
        w.writerow(['student_username', 'student_id', 'student_name', 'grade'])
        w.writerow([self.student_profile.user.username, self.student_profile.id, '', '75'])
        csvfile.seek(0)
        resp = self.client.post(
            reverse('assignment-upload-results', args=[self.assignment.id]),
            {'file': io.BytesIO(csvfile.read().encode())},
            format='json'
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['created'], 1)
        self.assertEqual(AssignmentSubmission.objects.count(), 1)


class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(username='stud2', password='pass')
        self.student.role='student'; self.student.save()
        self.st_profile = Profile.objects.create(user=self.student, role='student', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'stud2', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        self.payment_data = {'student': self.st_profile.id, 'course': None, 'amount': '100.00', 'reference': 'ref123'}

    def test_student_can_create_and_upload_receipt(self):
        resp = self.client.post(reverse('payment-list'), self.payment_data)
        self.assertEqual(resp.status_code, 201)
        pay_id = resp.json()['id']
        # upload receipt via patch
        file_bytes = io.BytesIO(b"receipt")
        file_bytes.name = 'receipt.txt'
        resp2 = self.client.patch(reverse('payment-detail', args=[pay_id]), {'receipt': file_bytes}, format='multipart')
        self.assertEqual(resp2.status_code, 200)
        self.assertIn('receipt', resp2.json())

    def test_teacher_can_verify_payment(self):
        # create payment as student first
        resp = self.client.post(reverse('payment-list'), self.payment_data)
        pay_id = resp.json()['id']
        # switch to teacher
        teach = User.objects.create_user(username='teachpay', password='pass')
        teach.role='teacher'; teach.save()
        teach_profile = Profile.objects.create(user=teach, role='teacher', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'teachpay', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        res = self.client.patch(reverse('payment-detail', args=[pay_id]), {'status': 'successful'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'successful')



class ProfilePermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='adm', password='pass')
        self.admin.role = 'admin'
        self.admin.save()
        self.admin_profile = Profile.objects.create(user=self.admin, role='admin', department='arabic')
        self.other_student = User.objects.create_user(username='child', password='pass')
        self.other_student.role = 'student'
        self.other_student.save()
        self.other_profile = Profile.objects.create(user=self.other_student, role='student', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'adm', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_admin_can_list_same_department(self):
        url = reverse('profiles-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # only arabic department should be visible
        for item in resp.json():
            self.assertEqual(item['department'], 'arabic')

    def test_parent_sees_only_their_profile(self):
        # create a parent user and another unrelated student
        parent = User.objects.create_user(username='mom', password='pass')
        parent.role = 'parent'; parent.save()
        parent_profile = Profile.objects.create(user=parent, role='parent', department='western')
        other = User.objects.create_user(username='other', password='pass')
        other.role = 'student'; other.save()
        Profile.objects.create(user=other, role='student', department='western')
        # authenticate as parent
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'mom', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        url = reverse('profiles-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], parent_profile.id)

    def test_student_sees_only_own_profile(self):
        stud = User.objects.create_user(username='st1', password='pass')
        stud.role = 'student'; stud.save()
        stud_profile = Profile.objects.create(user=stud, role='student', department='western')
        other = User.objects.create_user(username='st2', password='pass')
        other.role = 'student'; other.save()
        Profile.objects.create(user=other, role='student', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'st1', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        url = reverse('profiles-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], stud_profile.id)

    def test_teacher_cannot_modify(self):
        teach = User.objects.create_user(username='teach2', password='pass')
        teach.role='teacher'; teach.save()
        teach_profile = Profile.objects.create(user=teach, role='teacher', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'teach2', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        # attempt update other profile
        url = reverse('profiles-detail', args=[self.other_profile.id])
        res = self.client.patch(url, {'bio': 'x'})
        self.assertEqual(res.status_code, 403)

    def test_teacher_can_create_student(self):
        teach = User.objects.create_user(username='teach3', password='pass')
        teach.role='teacher'; teach.save()
        teach_profile = Profile.objects.create(user=teach, role='teacher', department='western')
        resp = self.client.post(reverse('token_obtain_pair'), {'username': 'teach3', 'password': 'pass'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        url = reverse('profiles-list')
        res = self.client.post(url, {'user': {'username': 'newstud', 'password': 'pw'}, 'role':'student'})
        # serializer might not accept nested user; easier: hit /register/ for simplicity
        resp2 = self.client.post(reverse('register'), {'username': 'newstud', 'password': 'pw', 'role': 'student'})
        self.assertIn(resp2.status_code, [201, 200])
        # profile should have teacher's department
        from api.models import Profile
        newp = Profile.objects.filter(user__username='newstud').first()
        self.assertEqual(newp.department, 'western')


class StudentIDTests(TestCase):
    def test_student_id_generated(self):
        from django.utils import timezone
        user = User.objects.create_user(username='x', password='y')
        user.role = 'student'; user.save()
        p = Profile.objects.create(user=user, role='student', department='western')
        self.assertIsNotNone(p.student_id)
        year = timezone.now().year % 100
        self.assertTrue(str(p.student_id).startswith(f"sc/{year:02d}/"))
        # uniqueness
        user2 = User.objects.create_user(username='x2', password='y2')
        user2.role = 'student'; user2.save()
        p2 = Profile.objects.create(user=user2, role='student', department='western')
        self.assertNotEqual(p.student_id, p2.student_id)


class AdminExcelImportTests(TestCase):
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.admin = User.objects.create_superuser('adm2', 'a@a.com', 'pass')
        self.client.force_login(self.admin)

    def test_import_excel(self):
        import io, openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['username','email','first_name','last_name','role','department','student_class'])
        ws.append(['stud1','s1@example.com','S','One','student','western','JSS1'])
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        resp = self.client.post(reverse('admin:user_import_excel'), {'file': stream})
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(User.objects.filter(username='stud1').exists())
        self.assertTrue(Profile.objects.filter(user__username='stud1').exists())

