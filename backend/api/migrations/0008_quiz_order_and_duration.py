from django.db import migrations, models


def set_default_order(apps, schema_editor):
    Question = apps.get_model('api', 'Question')
    for q in Question.objects.all():
        if q.order is None:
            q.order = 0
            q.save(update_fields=['order'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_add_parent_and_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='quiz',
            name='duration',
            field=models.PositiveIntegerField(blank=True, help_text='Time allowed for quiz in minutes (optional)', null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='order',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(set_default_order, reverse_code=migrations.RunPython.noop),
        migrations.AlterModelOptions(
            name='question',
            options={'ordering': ['order', 'id']},
        ),
    ]
