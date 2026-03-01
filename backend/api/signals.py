# api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models.profile import Profile  # import directly, not from __init__
from .models.assignment import Assignment

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

# notify students when a new assignment is added
@receiver(post_save, sender=Assignment)
def announce_new_assignment(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if not channel_layer:
            # channels not configured (e.g. during simple test runs)
            return
        message = {
            "type": "notification",
            "message": f"New assignment posted: {instance.title}",
        }
        # broadcast to all users (in real app, we might target course participants)
        async_to_sync(channel_layer.group_send)(
            "notifications_all", message
        )
