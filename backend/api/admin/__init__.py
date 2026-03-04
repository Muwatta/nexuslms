"""
API Admin Configuration

Modular admin interface organized by concern:
- users.py: User, Profile, Group management
- academic.py: Course, Enrollment
- assessment.py: Quiz, QuizSubmission, Assignment, AssignmentSubmission
- gamification.py: Achievement, Project, Milestone
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from .users import CustomGroupAdmin, CustomUserAdmin

User = get_user_model()

# Register Group and User admins
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)

try:
    admin.site.unregister(User)
except Exception:
    pass

admin.site.register(User, CustomUserAdmin)

# Import remaining admins (auto-registers via @admin.register decorators)
from . import academic, assessment, gamification

__all__ = [
    'CustomGroupAdmin',
    'CustomUserAdmin',
]
