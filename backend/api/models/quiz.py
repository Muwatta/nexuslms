from django.db import models
from api.models import Course
from django.utils import timezone

class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    total_marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.title} ({self.course.title})"


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    text = models.TextField()
    # store choice list and correct answer index for simplicity
    choices = models.JSONField(default=list)  # e.g. ["A","B","C","D"]
    correct_index = models.PositiveIntegerField(default=0)
    marks = models.FloatField(default=1.0)

    def __str__(self):
        return f"Question {self.id} for {self.quiz.title}"


