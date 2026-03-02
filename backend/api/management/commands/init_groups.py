from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from api.models import Profile

# define permission codes for each group
GROUP_PERMISSIONS = {
    "Course Creators": [
        "add_course",
        "change_course",
        "delete_course",
    ],
    "Grade Managers": [
        "change_quizsubmission",
        "change_assignmentsubmission",
    ],
    "Financial Viewers": [
        "view_payment",
    ],
    "User Managers": [
        "add_user",
        "change_user",
        "delete_user",
    ],
    "Content Moderators": [
        "change_quiz",
        "change_assignment",
        "delete_achievement",
    ],
    "Parents": [
        "view_enrollment",
    ],
}

class Command(BaseCommand):
    help = (
        "Create all LMS groups and optionally sync existing user group memberships. "
        "Groups are created with their default permissions."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--sync-users",
            action="store_true",
            help="After creating groups, iterate existing profiles and assign groups based on role",
        )

    def handle(self, *args, **options):
        self.stdout.write("Creating groups and assigning permissions...")
        for name, perms in GROUP_PERMISSIONS.items():
            group, created = Group.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f"  created group '{name}'")
            else:
                self.stdout.write(f"  group '{name}' already exists")
            # clear previous perms so rerunning is idempotent
            group.permissions.clear()
            for codename in perms:
                # look up any permission(s) with the given codename; some may be duplicated
                qs = Permission.objects.filter(codename=codename)
                if not qs.exists():
                    self.stdout.write(f"    permission '{codename}' not found; skipping")
                    continue
                if qs.count() > 1:
                    self.stdout.write(f"    multiple perms with codename '{codename}' found, taking first")
                perm = qs.first()
                group.permissions.add(perm)
        self.stdout.write(self.style.SUCCESS("Groups setup complete."))

        if options.get("sync_users"):
            self.stdout.write("Synchronizing existing profiles to groups...")
            from api.signals import sync_role_to_groups

            for profile in Profile.objects.select_related("user").all():
                # call the signal handler directly to avoid save hooks
                sync_role_to_groups(Profile, profile, False)
            self.stdout.write(self.style.SUCCESS("User group sync complete."))
