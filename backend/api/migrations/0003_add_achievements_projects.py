"""placeholder migration to keep numbering sequential

This migration was lost during edits; it doesn't need to alter tables.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_alter_enrollment_options_and_more"),
    ]

    operations = []
