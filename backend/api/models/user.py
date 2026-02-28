from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    # override default ManyToMany fields to avoid clashes with auth.User
    groups = models.ManyToManyField(
        Group,
        related_name="api_user_set",  # unique reverse name
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="api_user_permissions_set",  # unique reverse name
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
