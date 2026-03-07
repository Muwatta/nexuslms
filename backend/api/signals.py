from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from .models.profile import Profile
from .models.assignment import Assignment
from .models.enrollment import Enrollment
from .models.course import Course

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


@receiver(post_save, sender=Profile)
def auto_enroll_student(sender, instance, created, **kwargs):
    """
    Auto-enroll new students in their department's active courses.
    Only runs when:
    - Profile is newly created
    - Role is 'student'
    - Profile is not archived
    - Department is set
    """
    # Only process newly created students
    if not created or instance.role != 'student' or instance.is_archived:
        return
    
    # Only auto-enroll if student has a department
    if not instance.department:
        return
    
    # Skip if student already has enrollments (prevents duplicate enrollment on profile updates)
    if Enrollment.objects.filter(student=instance).exists():
        return
    
    current_year = timezone.now().year
    academic_year = f"{current_year}/{current_year + 1}"
    
    # Build query for active courses in this department
    course_filters = {
        'department': instance.department,
        'is_active': True
    }
    
    # If student has a specific class, filter courses by it
    # (courses with no student_class are open to all classes in department)
    if instance.student_class:
        from django.db.models import Q
        course_filters['student_class__in'] = [instance.student_class, None, '']
    
    courses = Course.objects.filter(**course_filters)
    
    enrollments_created = 0
    for course in courses:
        _, created = Enrollment.objects.get_or_create(
            student=instance,
            course=course,
            academic_year=academic_year,
            defaults={
                'status': 'active',
                'enrolled_at': timezone.now()
            }
        )
        if created:
            enrollments_created += 1
    
    if enrollments_created > 0:
        print(f"[AUTO-ENROLL] {instance.user.username} enrolled in {enrollments_created} courses")


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