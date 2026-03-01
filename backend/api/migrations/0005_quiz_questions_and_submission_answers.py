"""Create Question model and add answers field to QuizSubmission."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_add_published_field"),
    ]

    operations = [
        migrations.CreateModel(
            name="Question",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("choices", models.JSONField(default=list)),
                ("correct_index", models.PositiveIntegerField(default=0)),
                ("marks", models.FloatField(default=1.0)),
                (
                    "quiz",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="questions",
                        to="api.quiz",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="quizsubmission",
            name="answers",
            field=models.JSONField(default=dict),
        ),
        migrations.AlterField(
            model_name="quizsubmission",
            name="score",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
