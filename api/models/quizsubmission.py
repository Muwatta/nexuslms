from django.db import models
from api.models import Quiz
from api.models import Profile
from django.utils import timezone

class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE,
        limit_choices_to={'user__role': 'student'}
    )
    score = models.FloatField()
    submitted_at = models.DateTimeField(default=timezone.now, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    def __str__(self):
        return f"{self.student.user.username} - {self.quiz.title}"
