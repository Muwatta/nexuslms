from django.db import migrations


ROLE_GROUP_MAP = {
    "student": [],
    "teacher": ["Course Creators", "Grade Managers", "Content Moderators"],
    "instructor": ["Course Creators", "Grade Managers", "Content Moderators"],
    "admin": ["Course Creators", "Grade Managers", "Content Moderators", "User Managers"],
    "school_admin": ["Course Creators", "Grade Managers", "Financial Viewers", "User Managers"],
    "super_admin": ["Course Creators", "Grade Managers", "Financial Viewers", "User Managers"],
    "parent": ["Parents"],
}


def sync_existing_profiles(apps, schema_editor):
    """Populate Django groups for all existing profiles based on their role."""
    Profile = apps.get_model("api", "Profile")
    Group = apps.get_model("auth", "Group")

    for profile in Profile.objects.select_related("user").all():
        user = profile.user
        # clear old groups first (safe to rerun)
        user.groups.clear()
        for name in ROLE_GROUP_MAP.get(profile.role, []):
            group, _ = Group.objects.get_or_create(name=name)
            user.groups.add(group)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0010_alter_profile_role"),
    ]

    operations = [
        migrations.RunPython(sync_existing_profiles, reverse_code=migrations.RunPython.noop),
    ]
