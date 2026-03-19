# backend/api/migrations/XXXX_teacher_roles_and_subjects.py


from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),   # ← update to your latest migration
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Add teacher_type to Profile
        migrations.AddField(
            model_name="profile",
            name="teacher_type",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("class",   "Class Teacher"),
                    ("subject", "Subject Teacher"),
                ],
                blank=True,
                null=True,
                help_text="Only relevant when role=teacher.",
            ),
        ),

        # 2. Add stream to Profile
        migrations.AddField(
            model_name="profile",
            name="stream",
            field=models.CharField(
                max_length=15,
                choices=[
                    ("science",     "Science"),
                    ("arts",        "Arts / Humanities"),
                    ("commercial",  "Commercial / Business"),
                    ("technical",   "Technical / Vocational"),
                    ("general",     "General"),
                ],
                blank=True,
                null=True,
                help_text="Science / Arts / Commercial stream (SSS students only).",
            ),
        ),

        # 3. Create SubjectAssignment table
        migrations.CreateModel(
            name="SubjectAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("subject", models.CharField(
                    max_length=50,
                    db_index=True,
                    choices=[
                        ("english_language",           "English Language"),
                        ("mathematics",                "Mathematics"),
                        ("civic_education",            "Civic Education"),
                        ("digital_technologies",       "Digital Technologies / Computer Studies"),
                        ("citizenship_heritage",       "Citizenship and Heritage Studies"),
                        ("entrepreneurship",           "Trade / Entrepreneurship Subject"),
                        ("biology",                    "Biology"),
                        ("chemistry",                  "Chemistry"),
                        ("physics",                    "Physics"),
                        ("further_mathematics",        "Further Mathematics"),
                        ("agricultural_science",       "Agricultural Science"),
                        ("geography",                  "Geography"),
                        ("technical_drawing",          "Technical Drawing"),
                        ("food_nutrition",             "Food and Nutrition"),
                        ("health_education",           "Health Education"),
                        ("physical_health_education",  "Physical and Health Education"),
                        ("literature_in_english",      "Literature in English"),
                        ("government",                 "Government"),
                        ("nigerian_history",           "Nigerian History"),
                        ("christian_religious_studies","Christian Religious Studies (CRS)"),
                        ("islamic_religious_studies",  "Islamic Religious Studies (IRS)"),
                        ("visual_arts",                "Visual Arts (Fine Arts)"),
                        ("music",                      "Music"),
                        ("french",                     "French"),
                        ("arabic",                     "Arabic"),
                        ("hausa",                      "Hausa"),
                        ("igbo",                       "Igbo"),
                        ("yoruba",                     "Yoruba"),
                        ("home_management",            "Home Management"),
                        ("catering_craft",             "Catering Craft"),
                        ("financial_accounting",       "Financial Accounting"),
                        ("commerce",                   "Commerce"),
                        ("economics",                  "Economics"),
                        ("marketing",                  "Marketing"),
                        ("business_studies",           "Business Studies"),
                        ("basic_electronics",          "Basic Electronics"),
                        ("basic_electricity",          "Basic Electricity"),
                        ("metalwork",                  "Metalwork"),
                        ("woodwork",                   "Woodwork"),
                        ("building_construction",      "Building Construction"),
                        ("auto_mechanics",             "Auto Mechanics"),
                        ("welding_fabrication",        "Welding and Fabrication"),
                        ("computer_studies_ict",       "Computer Studies / ICT"),
                        ("solar_installation",         "Solar Panel Installation"),
                        ("fashion_design",             "Fashion Design and Garment Making"),
                        ("livestock_farming",          "Livestock Farming"),
                        ("beauty_cosmetology",         "Beauty and Cosmetology"),
                        ("computer_hardware_repairs",  "Computer Hardware / GSM Repairs"),
                        ("horticulture",               "Horticulture and Crop Production"),
                        ("basic_science",              "Basic Science"),
                        ("basic_technology",           "Basic Technology"),
                        ("social_studies",             "Social Studies"),
                        ("cultural_creative_arts",     "Cultural and Creative Arts"),
                        ("religious_studies",          "Religious Studies (General)"),
                    ],
                )),
                ("is_auto_assigned", models.BooleanField(default=True)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
                ("updated_at",  models.DateTimeField(auto_now=True)),
                ("student", models.ForeignKey(
                    to=settings.AUTH_USER_MODEL,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="subject_assignments",
                    limit_choices_to={"profile__role": "student"},
                )),
                ("teacher", models.ForeignKey(
                    to=settings.AUTH_USER_MODEL,
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    blank=True,
                    related_name="teaching_assignments",
                    limit_choices_to={"profile__role": "teacher"},
                )),
            ],
            options={
                "verbose_name": "Subject Assignment",
                "verbose_name_plural": "Subject Assignments",
                "ordering": ["student", "subject"],
            },
        ),

        # Unique constraint: one teacher per student per subject
        migrations.AlterUniqueTogether(
            name="subjectassignment",
            unique_together={("student", "subject")},
        ),
    ]