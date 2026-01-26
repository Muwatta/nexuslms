from django.db import models
from api.models import Profile
from api.models import Course
from django.utils import timezone

class Payment(models.Model):
    student = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        limit_choices_to={'user__role': 'student'}
    )
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.student.user.username} - {self.course.title} - {self.amount}"
