from django.db import models
from django.conf import settings
from django.utils import timezone

class Profile(models.Model):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    ]

    DEPARTMENT_CHOICES = [
        ("western", "Western School"),
        ("arabic", "Arabic School"),
        ("programming", "Programming"),
    ]

    CLASS_CHOICES = [
        ("B1", "Basic 1"),
        ("B2", "Basic 2"),
        ("B3", "Basic 3"),
        ("B4", "Basic 4"),
        ("B5", "Basic 5"),
        ("JSS1", "JSS 1"),
        ("JSS2", "JSS 2"),
        ("JSS3", "JSS 3"),
        ("SS1", "SS 1"),
        ("SS2", "SS 2"),
        ("SS3", "SS 3"),
        ("idaady", "Idaady"),
        ("thanawi", "Thanawi"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    department = models.CharField(
        max_length=20,
        choices=DEPARTMENT_CHOICES,
        default="western"
    )
    student_class = models.CharField(
        max_length=10,
        choices=CLASS_CHOICES,
        null=True,
        blank=True
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.user.username} ({self.role}) - {self.get_department_display()}"
