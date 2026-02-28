from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_add_paystack_response'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='bio',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='profile',
            name='department',
            field=models.CharField(
                choices=[
                    ('western', 'Western School'),
                    ('arabic', 'Arabic School'),
                    ('programming', 'Programming'),
                ],
                default='western',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='profile',
            name='parent_email',
            field=models.EmailField(blank=True, default='', max_length=254),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='profile',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='profile',
            name='student_class',
            field=models.CharField(
                blank=True,
                choices=[
                    ('B1', 'Basic 1'),
                    ('B2', 'Basic 2'),
                    ('B3', 'Basic 3'),
                    ('B4', 'Basic 4'),
                    ('B5', 'Basic 5'),
                    ('JSS1', 'JSS 1'),
                    ('JSS2', 'JSS 2'),
                    ('JSS3', 'JSS 3'),
                    ('SS1', 'SS 1'),
                    ('SS2', 'SS 2'),
                    ('SS3', 'SS 3'),
                    ('idaady', 'Idaady'),
                    ('thanawi', 'Thanawi'),
                ],
                max_length=10,
                null=True,
            ),
        ),
        migrations.CreateModel(
            name='Achievement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('achievement_type', models.CharField(
                    choices=[
                        ('certificate', 'Certificate'),
                        ('badge', 'Badge'),
                        ('award', 'Award'),
                    ],
                    max_length=20,
                )),
                ('date_earned', models.DateTimeField(default=django.utils.timezone.now)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.course')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='achievements', to='api.profile')),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('start_date', models.DateField()),
                ('end_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[
                        ('active', 'Active'),
                        ('completed', 'Completed'),
                        ('archived', 'Archived'),
                    ],
                    default='active',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='projects', to='api.course')),
            ],
        ),
        migrations.CreateModel(
            name='Milestone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('related_to', models.CharField(
                    choices=[
                        ('enrollment', 'Enrollment'),
                        ('assignment', 'Assignment'),
                        ('quiz', 'Quiz'),
                        ('project', 'Project'),
                    ],
                    default='enrollment',
                    max_length=50,
                )),
                ('progress_percentage', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='milestones', to='api.course')),
            ],
        ),
    ]
