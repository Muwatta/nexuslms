# backend/api/management/commands/seed_western_courses.py

from django.core.management.base import BaseCommand
from django.db import transaction

# Subject lists per level

JSS_SUBJECTS = [
    ("english_language",          "English Language"),
    ("mathematics",               "Mathematics"),
    ("basic_science",             "Basic Science"),
    ("basic_technology",          "Basic Technology"),
    ("social_studies",            "Social Studies"),
    ("civic_education",           "Civic Education"),
    ("cultural_creative_arts",    "Cultural and Creative Arts"),
    ("physical_health_education", "Physical and Health Education"),
    ("computer_studies_ict",      "Computer Studies / ICT"),
    ("religious_studies",         "Religious Studies"),
    ("agricultural_science",      "Agricultural Science"),
    ("home_management",           "Home Management"),
    ("business_studies",          "Business Studies"),
    ("french",                    "French"),
    ("arabic",                    "Arabic"),
    ("yoruba",                    "Yoruba"),
]

SSS_CORE = [
    ("english_language",     "English Language"),
    ("mathematics",          "Mathematics"),
    ("civic_education",      "Civic Education"),
    ("digital_technologies", "Digital Technologies / Computer Studies"),
    ("entrepreneurship",     "Trade / Entrepreneurship"),
]

SSS_SCIENCE_EXTRA = [
    ("biology",              "Biology"),
    ("chemistry",            "Chemistry"),
    ("physics",              "Physics"),
    ("further_mathematics",  "Further Mathematics"),
    ("agricultural_science", "Agricultural Science"),
    ("geography",            "Geography"),
    ("technical_drawing",    "Technical Drawing"),
    ("food_nutrition",       "Food and Nutrition"),
    ("health_education",     "Health Education"),
]

SSS_ARTS_EXTRA = [
    ("literature_in_english",       "Literature in English"),
    ("government",                  "Government"),
    ("nigerian_history",            "Nigerian History"),
    ("christian_religious_studies", "Christian Religious Studies"),
    ("islamic_religious_studies",   "Islamic Religious Studies"),
    ("visual_arts",                 "Visual Arts"),
    ("music",                       "Music"),
    ("french",                      "French"),
    ("geography",                   "Geography"),
    ("catering_craft",              "Catering Craft"),
    ("home_management",             "Home Management"),
]

SSS_COMMERCIAL_EXTRA = [
    ("financial_accounting", "Financial Accounting"),
    ("commerce",             "Commerce"),
    ("economics",            "Economics"),
    ("marketing",            "Marketing"),
    ("government",           "Government"),
    ("geography",            "Geography"),
    ("business_studies",     "Business Studies"),
]

# ── Class → subjects + label 

CLASS_MAP = {
    "jss1": ("JSS 1", JSS_SUBJECTS),
    "jss2": ("JSS 2", JSS_SUBJECTS),
    "jss3": ("JSS 3", JSS_SUBJECTS),
    "sss1_sci":  ("SSS 1 Science",       SSS_CORE + SSS_SCIENCE_EXTRA),
    "sss1_arts": ("SSS 1 Arts",          SSS_CORE + SSS_ARTS_EXTRA),
    "sss1_com":  ("SSS 1 Commercial",    SSS_CORE + SSS_COMMERCIAL_EXTRA),
    "sss2_sci":  ("SSS 2 Science",       SSS_CORE + SSS_SCIENCE_EXTRA),
    "sss2_arts": ("SSS 2 Arts",          SSS_CORE + SSS_ARTS_EXTRA),
    "sss2_com":  ("SSS 2 Commercial",    SSS_CORE + SSS_COMMERCIAL_EXTRA),
    "sss3_sci":  ("SSS 3 Science",       SSS_CORE + SSS_SCIENCE_EXTRA),
    "sss3_arts": ("SSS 3 Arts",          SSS_CORE + SSS_ARTS_EXTRA),
    "sss3_com":  ("SSS 3 Commercial",    SSS_CORE + SSS_COMMERCIAL_EXTRA),
}


class Command(BaseCommand):
    help = "Seed western school courses (base classes only — no A/B/C sections)"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--class", dest="only_class", default=None,
                            help="Only seed a specific class e.g. --class jss1")

    def handle(self, *args, **options):
        from api.models import Course

        dry_run    = options["dry_run"]
        only_class = options["only_class"]

        self.stdout.write(self.style.WARNING(
            f"{'[DRY RUN] ' if dry_run else ''}Seeding western courses..."
        ))

        total_created = total_skipped = 0
        classes = {only_class: CLASS_MAP[only_class]}.items() if only_class else CLASS_MAP.items()

        for student_class, (label, subjects) in classes:
            created = skipped = 0
            for code, name in subjects:
                title = f"{name} — {label}"
                if Course.objects.filter(department="western", student_class=student_class, title=title).exists():
                    skipped += 1
                else:
                    if not dry_run:
                        with transaction.atomic():
                            Course.objects.create(
                                title=title,
                                description=f"{name} | {label} | Western Education",
                                department="western",
                                student_class=student_class,
                                is_active=True,
                            )
                    created += 1

            self.stdout.write(f"  {label}: +{created} created, {skipped} already exist")
            total_created += created
            total_skipped += skipped

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry_run else ''}Done. "
            f"{total_created} created, {total_skipped} already existed."
        ))