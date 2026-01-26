from django.db import models
from api.models import User
from django.utils import timezone

class Profile(models.Model):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    ]

    CLASS_CHOICES = [
        ("JSS1", "JSS 1"),
        ("JSS2", "JSS 2"),
        ("JSS3", "JSS 3"),
        ("SS1", "SS 1"),
        ("SS2", "SS 2"),
        ("SS3", "SS 3"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_class = models.CharField(max_length=10, choices=CLASS_CHOICES, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.user.username} ({self.role})"