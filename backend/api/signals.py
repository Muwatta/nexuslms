from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .models.profile import Profile
from .models.assignment import Assignment

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

User = get_user_model()

# Map roles to Django Groups for permission management
ROLE_GROUP_MAP = {
    "student": [],
    "teacher": ["Course Creators", "Grade Managers", "Content Moderators"],
    "instructor": ["Course Creators", "Grade Managers", "Content Moderators"],
    "admin": ["Course Creators", "Grade Managers", "Content Moderators", "User Managers"],
    "school_admin": ["Course Creators", "Grade Managers", "Financial Viewers", "User Managers"],
    "super_admin": ["Course Creators", "Grade Managers", "Financial Viewers", "User Managers"],
    "parent": ["Parents"],
}

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    # Ensure every User has a Profile. Use get_or_create so existing users
    # without profiles (e.g. imported or created before this signal) get one.
    Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

@receiver(post_save, sender=Profile)
def sync_role_to_groups(sender, instance, created, **kwargs):
    """Auto-assign Django groups based on profile role"""
    if not instance.user:
        return
    
    user = instance.user
    role = instance.role
    
    user.groups.clear()
    group_names = ROLE_GROUP_MAP.get(role, [])
    
    for name in group_names:
        group, _ = Group.objects.get_or_create(name=name)
        user.groups.add(group)

@receiver(post_save, sender=Assignment)
def announce_new_assignment(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        message = {
            "type": "notification",
            "message": f"New assignment posted: {instance.title}",
        }
        async_to_sync(channel_layer.group_send)(
            "notifications_all", message
        )