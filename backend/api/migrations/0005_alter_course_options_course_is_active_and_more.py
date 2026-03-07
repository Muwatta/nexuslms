
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_course_options_course_department_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='course',
            options={'ordering': ['department', 'student_class', 'title']},
        ),
        migrations.AddField(
            model_name='course',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name='course',
            name='student_class',
            field=models.CharField(blank=True, db_index=True, help_text='Specific class for this course (e.g., JSS1, Web-Dev, Ibtidaahi)', max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='course',
            name='department',
            field=models.CharField(choices=[('western', 'Western School'), ('arabic', 'Arabic School'), ('programming', 'Programming')], db_index=True, default='western', max_length=20),
        ),
        migrations.AlterField(
            model_name='course',
            name='instructor',
            field=models.ForeignKey(blank=True, limit_choices_to={'role': 'instructor'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='courses', to='api.profile'),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['department', 'student_class', 'is_active'], name='api_course_departm_2005dd_idx'),
        ),
    ]
