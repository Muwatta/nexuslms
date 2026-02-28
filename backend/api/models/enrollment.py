from django.db import models
from api.models import Profile, Course
from django.utils import timezone

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]
    
    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},  # Fixed: role is on Profile
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    enrolled_at = models.DateTimeField(default=timezone.now, editable=False)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_enrollment'
            )
        ]
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.user.username} -> {self.course.title} ({self.status})"