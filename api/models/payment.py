from django.db import models
from api.models import Profile, Course
from django.utils import timezone

class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("successful", "Successful"),
        ("failed", "Failed"),
    ]

    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},  # use field in Profile, not User
        related_name="payments"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        unique_together = ("student", "course", "reference")
        ordering = ["-created_at"]  # latest payments first

    def __str__(self):
        course_title = self.course.title if self.course else "N/A"
        return f"{self.student.user.username} - {course_title} - {self.amount}"
