from django.db import models
from api.models import Profile
from django.utils import timezone

class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'user__role': 'instructor'}
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return self.title
