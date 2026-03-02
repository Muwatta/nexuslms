from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_quiz_order_and_duration'),
    ]

    operations = [
        migrations.AddField(
            model_name='quizsubmission',
            name='started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
