from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from .core import TimeStampedModel

class Profile(TimeStampedModel):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
        ("parent", "Parent"),
        ("school_admin", "School Admin"),
        ("super_admin", "Super Admin"),
    ]

    INSTRUCTOR_TYPE_CHOICES = [
        ("subject", "Subject Instructor"),
        ("class", "Class Instructor"),
    ]

    DEPARTMENT_CHOICES = [
        ("western", "Western School"),
        ("arabic", "Arabic School"),
        ("programming", "Programming"),
    ]

    WESTERN_CLASSES = [
        ("JSS1", "JSS 1"), ("JSS2", "JSS 2"), ("JSS3", "JSS 3"),
        ("SS1", "SS 1"), ("SS2", "SS 2"), ("SS3", "SS 3"),
    ]
    
    ARABIC_CLASSES = [
        ("ibtidaahi", "Ibtidaahi"),
        ("idaady", "Idaady"),
        ("thanawy", "Thanawy"),
    ]
    
    PROGRAMMING_CLASSES = [
        ("web_dev", "Web Dev"),
        ("ai_ml", "AI & ML"),
        ("ai_automation", "AI Automation"),
        ("scratch", "Scratch"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default="western")
    student_class = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    instructor_type = models.CharField(max_length=20, choices=INSTRUCTOR_TYPE_CHOICES, null=True, blank=True)
    
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(blank=True)
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    
    # Soft delete fields
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_profiles'
    )

    class Meta:
        indexes = [
            models.Index(fields=['role', 'is_archived']),
            models.Index(fields=['department', 'student_class']),
            models.Index(fields=['role', 'instructor_type']),
        ]

    def clean(self):
        if self.role != "instructor" and self.instructor_type:
            raise ValidationError({"instructor_type": "Only valid for instructors"})
        if self.role != "student" and self.student_class:
            raise ValidationError({"student_class": "Only valid for students"})
        if self.student_class and self.department:
            valid = [c[0] for c in self.get_classes_for_department(self.department)]
            if self.student_class not in valid:
                raise ValidationError({"student_class": f"Invalid class for {self.department}"})

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Generate sequential student ID
        if self.role == "student" and not self.student_id and not self.is_archived:
            from .studentidsequence import StudentIDSequence
            year = timezone.now().year % 100
            self.student_id = StudentIDSequence.get_next_id(year)
        
        super().save(*args, **kwargs)

    def archive(self, by_user=None):
        """Soft delete with audit trail"""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.archived_by = by_user
        self.save()
        
        # Log the action
        from .auditlog import AuditLog
        AuditLog.objects.create(
            user=by_user,
            action='archive',
            model_name='Profile',
            object_id=str(self.pk),
            old_values={'is_archived': False},
            new_values={'is_archived': True}
        )

    def restore(self, by_user=None):
        """Restore archived profile"""
        self.is_archived = False
        self.archived_at = None
        self.archived_by = None
        self.save()
        
        from .auditlog import AuditLog
        AuditLog.objects.create(
            user=by_user,
            action='restore',
            model_name='Profile',
            object_id=str(self.pk)
        )

    @classmethod
    def get_classes_for_department(cls, department):
        mapping = {
            "western": cls.WESTERN_CLASSES,
            "arabic": cls.ARABIC_CLASSES,
            "programming": cls.PROGRAMMING_CLASSES,
        }
        return mapping.get(department, [])

    def __str__(self):
        try:
            username = self.user.username
        except Exception:
            username = "<no user>"
        sid = f"[{self.student_id}] " if self.student_id else ""
        archive_flag = " [ARCHIVED]" if self.is_archived else ""
        return f"{sid}{username} ({self.role}){archive_flag}"