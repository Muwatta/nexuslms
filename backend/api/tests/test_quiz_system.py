from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from api.models import Profile, Course, Quiz, Question, QuizSubmission

User = get_user_model()

class QuizSystemTests(APITestCase):
    def setUp(self):
        # create teacher and student
        self.teacher = User.objects.create_user(username='teach', password='pass')
        try:
            self.teacher.profile.role = 'instructor'
            self.teacher.profile.save()
        except Exception:
            self.teacher.role = 'instructor'
            self.teacher.save()
        self.student = User.objects.create_user(username='stud', password='pass')
        self.student.profile.role = 'student'; self.student.profile.save()
        self.course = Course.objects.create(title='QuizCourse')
        self.quiz = Quiz.objects.create(course=self.course, title='SimpleQuiz')
        Question.objects.create(quiz=self.quiz, text='1+1=?', choices=['1','2','3'], correct_index=1)
        Question.objects.create(quiz=self.quiz, text='Capital of FR?', choices=['Paris','Berlin'], correct_index=0)

    def authenticate(self, username, password):
        # simple wrapper around JWT login; primarily for debugging but tests
        # will mostly use force_authenticate for reliability.
        resp = self.client.post('/api/token/', {'username': username, 'password': password})
        token = resp.data.get('access')
        if token:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return resp

    def test_teacher_can_create_question(self):
        # bypass authentication complexity
        self.client.force_authenticate(user=self.teacher)
        data = {'quiz': self.quiz.id, 'text': 'New Q', 'choices': ['a','b'], 'correct_index':0}
        resp = self.client.post('/api/questions/', data, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Question.objects.filter(quiz=self.quiz).count(), 3)

    def test_student_submission_auto_grade(self):
        self.client.force_authenticate(user=self.student)
        # gather question ids
        qs = list(self.quiz.questions.all())
        answers = {str(qs[0].id): 1, str(qs[1].id): 0}
        resp = self.client.post(
            '/api/quiz-submissions/',
            {'quiz': self.quiz.id, 'student': self.student.profile.id, 'answers': answers},
            format='json'
        )
        self.assertEqual(resp.status_code, 201)
        submission = QuizSubmission.objects.get(id=resp.data['id'])
        self.assertEqual(submission.score, 2.0)  # two correct each 1 mark
        self.assertIsNotNone(submission.started_at)

    def test_non_teacher_cannot_add_question(self):
        self.client.force_authenticate(user=self.student)
        resp = self.client.post('/api/questions/', {'quiz': self.quiz.id, 'text': 'Fail', 'choices': [], 'correct_index':0}, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_quiz_duration_and_ordering(self):
        # update quiz to have duration and add ordered questions
        self.quiz.duration = 15
        self.quiz.save()
        # add a third question with explicit order 5
        q3 = Question.objects.create(quiz=self.quiz, order=5, text='Third', choices=['x','y'], correct_index=0)
        # change first two orders
        q1, q2 = list(self.quiz.questions.all()[:2])
        q1.order = 10; q1.save()
        q2.order = 1; q2.save()
        # fetch quiz via API and ensure ordering and duration preserved
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.get(f'/api/quizzes/{self.quiz.id}/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['duration'], 15)
        # questions should come back sorted by order (1,5,10)
        orders = [q['order'] for q in data['questions']]
        self.assertEqual(orders, sorted(orders))
