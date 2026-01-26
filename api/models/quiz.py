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


