from django.db import models
from api.models import TimeStampedModel
from api.models import Profile
from django.utils import timezone

class Course(TimeStampedModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role': 'instructor'}
    )

    def __str__(self):
        return self.title
