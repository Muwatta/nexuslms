from django.db import models
from api.models import Profile
from api.models import Course
from django.utils import timezone

class Enrollment(models.Model):
    student = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE,
        limit_choices_to={'user__role': 'student'}
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(default=timezone.now, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    class Meta:
        unique_together = ("student", "course")

    def __str__(self):
        return f"{self.student.user.username} -> {self.course.title}"
