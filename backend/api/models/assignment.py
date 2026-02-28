from django.db import models
from django.utils import timezone

class Assignment(models.Model):
    course = models.ForeignKey(
        'api.Course',
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    title = models.CharField(max_length=200)
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)  # <--- add this

    def __str__(self):
        return f"{self.title} ({self.course})"
