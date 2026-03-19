"""
Migration: Add term and add/drop tracking to Enrollment.

Apply with:
    python manage.py migrate api 0002_enrollment_term_tracking

(Rename to match your actual last migration number, e.g. 0005_... )
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    # ── Update this to match your actual latest migration filename ─────────
    dependencies = [
        ('api', '0005_alter_course_options_course_is_active_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='enrollment',
            name='term',
            field=models.CharField(
                max_length=20,
                default='First Term',
                choices=[
                    ('First Term',  'First Term'),
                    ('Second Term', 'Second Term'),
                    ('Third Term',  'Third Term'),
                ],
                help_text='School term this enrollment belongs to',
            ),
        ),
        migrations.AddField(
            model_name='enrollment',
            name='add_drop_count',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='Number of add/drop operations used this term (max 2)',
            ),
        ),
        migrations.AddField(
            model_name='enrollment',
            name='drop_history',
            field=models.JSONField(
                default=list,
                blank=True,
                help_text='Log of add/drop events: [{action, course_id, course_title, timestamp}]',
            ),
        ),
        # Relax the unique constraint to include term
        migrations.RemoveConstraint(
            model_name='enrollment',
            name='unique_enrollment_per_year',
        ),
        migrations.AddConstraint(
            model_name='enrollment',
            constraint=models.UniqueConstraint(
                fields=['student', 'course', 'academic_year', 'term'],
                name='unique_enrollment_per_year_term',
            ),
        ),
    ]