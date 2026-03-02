from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_assignmentsubmission_file_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('student', 'Student'),
                    ('teacher', 'Teacher'),
                    ('instructor', 'Instructor'),
                    ('admin', 'Admin'),
                    ('parent', 'Parent'),
                    ('school_admin', 'School Admin'),
                    ('super_admin', 'Super Admin'),
                ],
                default='student',
            ),
        ),
        migrations.AlterField(
            model_name='profile',
            name='role',
            field=models.CharField(
                max_length=10,
                choices=[
                    ('student', 'Student'),
                    ('teacher', 'Teacher'),
                    ('instructor', 'Instructor'),
                    ('admin', 'Admin'),
                    ('parent', 'Parent'),
                    ('school_admin', 'School Admin'),
                    ('super_admin', 'Super Admin'),
                ],
                default='student',
            ),
        ),
    ]
