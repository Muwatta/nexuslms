from django.db import models
from api.models import Assignment, Profile
from django.utils import timezone

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE,
        limit_choices_to={'user__role': 'student'}
    )
    file = models.FileField(upload_to="assignment_submissions/")
    submitted_at = models.DateTimeField(default=timezone.now, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)  # <-- fixed
    grade = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.assignment.title}"
