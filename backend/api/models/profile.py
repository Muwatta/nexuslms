from django.db import models
from django.conf import settings
from django.utils import timezone

class Profile(models.Model):
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

    # Department-specific class choices
    WESTERN_CLASSES = [
        ("JSS1", "JSS 1"),
        ("JSS2", "JSS 2"),
        ("JSS3", "JSS 3"),
        ("SS1", "SS 1"),
        ("SS2", "SS 2"),
        ("SS3", "SS 3"),
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
    
    CLASS_CHOICES = WESTERN_CLASSES + ARABIC_CLASSES + PROGRAMMING_CLASSES

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
        max_length=20,
        choices=CLASS_CHOICES,
        null=True,
        blank=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    instructor_type = models.CharField(
        max_length=20,
        choices=INSTRUCTOR_TYPE_CHOICES,
        null=True,
        blank=True,
        help_text="Only applicable if role is instructor"
    )
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(blank=True)
    student_id = models.CharField(max_length=20, unique=True, blank=True, null=True,
                                  help_text="Automatically generated unique student identifier")
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    @classmethod
    def get_classes_for_department(cls, department):
        """Return class choices for a specific department."""
        if department == "western":
            return cls.WESTERN_CLASSES
        elif department == "arabic":
            return cls.ARABIC_CLASSES
        elif department == "programming":
            return cls.PROGRAMMING_CLASSES
        return cls.CLASS_CHOICES

    def __str__(self):
        # user may have been deleted or not yet assigned; avoid RelatedObjectDoesNotExist
        try:
            username = self.user.username
        except Exception:
            username = "<no user>"
        sid = f" [{self.student_id}]" if self.student_id else ""
        return f"{username}{sid} ({self.role}) - {self.get_department_display()}"

    def save(self, *args, **kwargs):
        # generate student_id upon first save for students
        if self.role == "student" and not self.student_id:
            self.student_id = self._generate_student_id()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_student_id(cls):
        import random
        # format: sc/<two-digit-year>/<four-digit-random>
        year = timezone.now().year % 100
        while True:
            num = f"{random.randint(0, 9999):04d}"
            candidate = f"sc/{year}/{num}"
            if not cls.objects.filter(student_id=candidate).exists():
                return candidate
