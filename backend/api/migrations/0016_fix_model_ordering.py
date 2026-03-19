# backend/api/migrations/XXXX_fix_model_ordering.py

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="assignment",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Assignment",
                "verbose_name_plural": "Assignments",
            },
        ),
        migrations.AlterModelOptions(
            name="assignmentsubmission",
            options={
                "ordering": ["-submitted_at"],
                "verbose_name": "Assignment Submission",
                "verbose_name_plural": "Assignment Submissions",
            },
        ),
        migrations.AlterModelOptions(
            name="quiz",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Quiz",
                "verbose_name_plural": "Quizzes",
            },
        ),
        migrations.AlterModelOptions(
            name="quizsubmission",
            options={
                "ordering": ["-submitted_at"],
                "verbose_name": "Quiz Submission",
                "verbose_name_plural": "Quiz Submissions",
            },
        ),
        migrations.AlterModelOptions(
            name="feepayment",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Fee Payment",
                "verbose_name_plural": "Fee Payments",
            },
        ),
    ]