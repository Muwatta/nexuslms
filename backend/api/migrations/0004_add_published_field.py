"""Add published field to AssignmentSubmission (recreated)

This migration ensures the published boolean exists before questions
mig.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_add_achievements_projects"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignmentsubmission",
            name="published",
            field=models.BooleanField(default=False),
        ),
    ]
