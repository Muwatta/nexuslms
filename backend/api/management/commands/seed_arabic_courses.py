# backend/api/management/commands/seed_arabic_courses.py
# ─────────────────────────────────────────────────────────────────────────────
# Seed all Arabic/Islamic school courses
# Primary (ibtidaai_1–6), Junior Secondary (mutawassit_1–3),
# Senior Secondary (thanawi_1–3)
# ─────────────────────────────────────────────────────────────────────────────

from django.core.management.base import BaseCommand
from django.db import transaction

# ── Subject lists ─────────────────────────────────────────────────────────────

PRIMARY_SUBJECTS = [
    # Islamic & Arabic
    ("quran_karim",         "القرآن الكريم"),
    ("tajweed",             "التجويد"),
    ("tafseer_basic",       "التفسير"),
    ("hadeeth",             "الحديث"),
    ("fiqh",                "الفقه"),
    ("aqeedah",             "العقيدة"),
    ("seerah",              "السيرة النبوية"),
    ("akhlaq",              "الأخلاق الإسلامية"),
    ("arabic_language",     "اللغة العربية"),
    ("imla",                "الإملاء"),
    ("qiraa",               "القراءة"),
    ("ta3beer",             "التعبير"),
    ("khatt_arabi",         "الخط العربي"),
    # General
    ("mathematics",         "الرياضيات"),
    ("science",             "العلوم"),
    ("social_studies",      "الدراسات الاجتماعية"),
    ("english_language",    "اللغة الإنجليزية"),
    ("computer_ict",        "الحاسوب / تقنية المعلومات"),
    ("physical_education",  "التربية البدنية"),
]

JUNIOR_SUBJECTS = [
    # Islamic Studies
    ("quran_karim",         "القرآن الكريم"),
    ("tajweed",             "التجويد"),
    ("tafseer",             "التفسير"),
    ("hadeeth",             "الحديث"),
    ("mustalah_hadeeth",    "مصطلح الحديث"),
    ("fiqh",                "الفقه"),
    ("aqeedah",             "العقيدة"),
    ("seerah",              "السيرة النبوية"),
    # Arabic Language
    ("nahw",                "النحو"),
    ("sarf",                "الصرف"),
    ("balagha_basic",       "البلاغة"),
    ("adab_arabi",          "الأدب العربي"),
    ("mutala3a",            "المطالعة"),
    ("ta3beer",             "التعبير"),
    ("imla",                "الإملاء"),
    # General
    ("mathematics",         "الرياضيات"),
    ("science",             "العلوم"),
    ("geography",           "الجغرافيا"),
    ("history",             "التاريخ"),
    ("english_language",    "اللغة الإنجليزية"),
    ("computer_ict",        "الحاسوب"),
    ("physical_education",  "التربية البدنية"),
]

SENIOR_SUBJECTS = [
    # Advanced Islamic Studies
    ("quran_karim",         "القرآن الكريم"),
    ("tafseer_adv",         "التفسير"),
    ("hadeeth_adv",         "الحديث"),
    ("mustalah_hadeeth",    "مصطلح الحديث"),
    ("fiqh_adv",            "الفقه"),
    ("usool_fiqh",          "أصول الفقه"),
    ("aqeedah_adv",         "العقيدة"),
    ("dawah_culture",       "الدعوة والثقافة الإسلامية"),
    # Advanced Arabic Language
    ("nahw_adv",            "النحو"),
    ("sarf_adv",            "الصرف"),
    ("balagha_adv",         "البلاغة"),
    ("adab_arabi_adv",      "الأدب العربي"),
    ("nusoos",              "النصوص"),
    ("insha_ta3beer",       "الإنشاء والتعبير"),
    # Modern Academic (common)
    ("english_language",    "اللغة الإنجليزية"),
    ("mathematics",         "الرياضيات"),
    ("computer_ict",        "الحاسوب"),
    ("physical_education",  "التربية البدنية"),
    # Science track extras
    ("physics",             "الفيزياء"),
    ("chemistry",           "الكيمياء"),
    ("biology",             "الأحياء"),
    # Arts track extras
    ("history",             "التاريخ"),
    ("geography",           "الجغرافيا"),
    ("economics",           "الاقتصاد"),
    ("government",          "الحكومة"),
]

# ── Class → subjects + label ──────────────────────────────────────────────────

CLASS_MAP = {
    # Primary
    "ibtidaai_1": ("الصف الأول الابتدائي",   PRIMARY_SUBJECTS),
    "ibtidaai_2": ("الصف الثاني الابتدائي",  PRIMARY_SUBJECTS),
    "ibtidaai_3": ("الصف الثالث الابتدائي",  PRIMARY_SUBJECTS),
    "ibtidaai_4": ("الصف الرابع الابتدائي",  PRIMARY_SUBJECTS),
    "ibtidaai_5": ("الصف الخامس الابتدائي",  PRIMARY_SUBJECTS),
    "ibtidaai_6": ("الصف السادس الابتدائي",  PRIMARY_SUBJECTS),
    # Junior Secondary
    "mutawassit_1": ("الصف الأول المتوسط",   JUNIOR_SUBJECTS),
    "mutawassit_2": ("الصف الثاني المتوسط",  JUNIOR_SUBJECTS),
    "mutawassit_3": ("الصف الثالث المتوسط",  JUNIOR_SUBJECTS),
    # Senior Secondary
    "thanawi_1": ("الصف الأول الثانوي",      SENIOR_SUBJECTS),
    "thanawi_2": ("الصف الثاني الثانوي",     SENIOR_SUBJECTS),
    "thanawi_3": ("الصف الثالث الثانوي",     SENIOR_SUBJECTS),
}


class Command(BaseCommand):
    help = "Seed all Arabic/Islamic school courses"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        from api.models import Course

        dry_run = options["dry_run"]
        self.stdout.write(self.style.WARNING(
            f"{'[DRY RUN] ' if dry_run else ''}Seeding Arabic school courses..."
        ))

        total_created = 0
        total_skipped = 0

        for student_class, (class_label, subjects) in CLASS_MAP.items():
            created = skipped = 0
            for subject_code, subject_name in subjects:
                title = f"{subject_name} — {class_label}"
                exists = Course.objects.filter(
                    department="arabic",
                    student_class=student_class,
                    title=title,
                ).exists()
                if exists:
                    skipped += 1
                else:
                    if not dry_run:
                        with transaction.atomic():
                            Course.objects.create(
                                title=title,
                                description=(
                                    f"{subject_name} — {class_label} "
                                    f"| Arabic/Islamic Studies Department"
                                ),
                                department="arabic",
                                student_class=student_class,
                                is_active=True,
                            )
                    created += 1

            self.stdout.write(
                f"  {class_label}: +{created} created, {skipped} already exist"
            )
            total_created += created
            total_skipped += skipped

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry_run else ''}Done. "
            f"{total_created} courses created, {total_skipped} already existed."
        ))