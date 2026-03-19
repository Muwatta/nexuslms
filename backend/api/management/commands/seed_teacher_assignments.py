# backend/api/management/commands/seed_teacher_assignments.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from api.models import SubjectAssignment
from api.models.profile import (
    SUBJECT_CHOICES,
    WESTERN_CLASSES,
    ARABIC_CLASSES,
    PROGRAMMING_CLASSES,
)
import itertools

User = get_user_model()

# ── Subject sets by stream ────────────────────────────────────────────────────

CORE_SUBJECTS = [
    "english_language", "mathematics", "civic_education",
    "digital_technologies", "citizenship_heritage",
]

JSS_SUBJECTS = [
    "english_language", "mathematics", "basic_science", "basic_technology",
    "social_studies", "civic_education", "business_studies",
    "cultural_creative_arts", "agricultural_science", "computer_studies_ict",
    "physical_health_education", "french", "religious_studies",
]

SSS_SCIENCE_SUBJECTS = CORE_SUBJECTS + [
    "biology", "chemistry", "physics", "further_mathematics",
    "geography", "computer_studies_ict",
]

SSS_ARTS_SUBJECTS = CORE_SUBJECTS + [
    "literature_in_english", "government", "nigerian_history",
    "geography", "christian_religious_studies",
]

SSS_COMMERCIAL_SUBJECTS = CORE_SUBJECTS + [
    "financial_accounting", "commerce", "economics",
    "marketing", "government",
]

SSS_GENERAL_SUBJECTS = CORE_SUBJECTS + [
    "biology", "chemistry", "economics", "government",
]

ARABIC_DEPT_SUBJECTS = [
    "arabic", "islamic_religious_studies", "english_language",
    "mathematics", "civic_education",
]

PROGRAMMING_DEPT_SUBJECTS = [
    "digital_technologies", "computer_studies_ict", "mathematics",
    "english_language", "basic_electronics",
]


def subjects_for_student(profile):
    """Return the list of subject codes this student should study."""
    dept = profile.department or "western"
    sc = profile.student_class or ""

    if dept == "arabic":
        return ARABIC_DEPT_SUBJECTS
    if dept == "programming":
        return PROGRAMMING_DEPT_SUBJECTS

    # Western department: check JSS vs SSS
    jss_codes = [c[0] for c in WESTERN_CLASSES if c[0].startswith("jss")]
    if sc in jss_codes:
        return JSS_SUBJECTS

    # SSS — use stream
    stream = profile.stream or "general"
    mapping = {
        "science":    SSS_SCIENCE_SUBJECTS,
        "arts":       SSS_ARTS_SUBJECTS,
        "commercial": SSS_COMMERCIAL_SUBJECTS,
    }
    return mapping.get(stream, SSS_GENERAL_SUBJECTS)


class Command(BaseCommand):
    help = "Auto-assign teachers to students per subject."

    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Re-assign even manually set assignments.",
        )

    def handle(self, *args, **options):
        overwrite = options["overwrite"]

        students = User.objects.filter(
            profile__role="student"
        ).select_related("profile")

        self.stdout.write(f"\nSeeding subject assignments for {students.count()} student(s)...\n")

        total_created = 0
        total_skipped = 0

        with transaction.atomic():
            for student in students:
                profile = student.profile
                dept = profile.department or "western"

                # Get teachers in same department, round-robin
                teachers = list(
                    User.objects.filter(
                        profile__role="teacher",
                        profile__department=dept,
                    ).select_related("profile")
                )

                if teachers:
                    teacher_cycle = itertools.cycle(teachers)
                else:
                    teacher_cycle = itertools.cycle([None])

                subject_list = subjects_for_student(profile)

                for subject in subject_list:
                    # Check if assignment already exists
                    existing = SubjectAssignment.objects.filter(
                        student=student,
                        subject=subject,
                    ).first()

                    if existing:
                        if overwrite or existing.is_auto_assigned:
                            # Re-assign
                            t = next(teacher_cycle)
                            existing.teacher = t
                            existing.is_auto_assigned = True
                            existing.save()
                            total_created += 1
                        else:
                            total_skipped += 1
                        continue

                    # Create new
                    t = next(teacher_cycle)
                    SubjectAssignment.objects.create(
                        student=student,
                        teacher=t,
                        subject=subject,
                        is_auto_assigned=True,
                    )
                    total_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {total_created} assignments created/updated, "
                f"{total_skipped} manual assignments preserved.\n"
                "To re-seed manually-set ones too: python manage.py seed_teacher_assignments --overwrite\n"
            )
        )