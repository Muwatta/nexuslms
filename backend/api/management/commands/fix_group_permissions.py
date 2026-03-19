# backend/api/management/commands/fix_group_permissions.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission


def get_perms(*codenames):
    result = []
    for codename in codenames:
        try:
            result.append(Permission.objects.get(codename=codename))
        except Permission.DoesNotExist:
            print(f"  WARNING: Permission not found: {codename}")
    return result


GROUP_PERMISSIONS = {
    "Students": [
        "view_profile", "change_profile",
        "view_course",
        "view_enrollment", "add_enrollment",
        "view_assignment",
        "add_assignmentsubmission", "change_assignmentsubmission", "view_assignmentsubmission",
        "view_quiz", "view_question",
        "add_quizsubmission", "view_quizsubmission",
        "view_achievement",
        "view_project", "view_milestone",
        "view_feepayment",
        "add_chatmessage", "change_chatmessage", "view_chatmessage",
        "view_practicequestion",
        "view_subjectassignment",   # students can see their own teacher assignments
    ],
    "Teachers": [                   # was: "Instructors"
        "view_profile",
        "view_course", "add_course", "change_course",
        "view_enrollment",
        "view_assignment", "add_assignment", "change_assignment",
        "view_assignmentsubmission", "change_assignmentsubmission",
        "view_quiz", "add_quiz", "change_quiz",
        "view_question", "add_question", "change_question",
        "view_quizsubmission", "change_quizsubmission",
        "view_achievement", "add_achievement",
        "view_project", "add_project", "change_project",
        "view_milestone", "add_milestone", "change_milestone",
        "add_chatmessage", "view_chatmessage",
        "view_practicequestion", "add_practicequestion", "change_practicequestion",
        "view_subjectassignment",   # teachers can see their own teaching assignments
    ],
    "Non-Teaching Staff": [         # new
        "view_profile",
        "view_course",
        "view_enrollment",
        "view_assignment",
        "view_feepayment",
        "add_chatmessage", "view_chatmessage",
    ],
    "Grade Managers": [
        "view_profile", "view_course", "view_enrollment",
        "view_assignment", "view_assignmentsubmission", "change_assignmentsubmission",
        "view_quiz", "view_question", "view_quizsubmission", "change_quizsubmission",
        "view_achievement", "add_achievement", "change_achievement",
    ],
    "Course Creators": [
        "view_profile",
        "view_course", "add_course", "change_course", "delete_course",
        "view_enrollment",
        "view_assignment", "add_assignment", "change_assignment", "delete_assignment",
        "view_quiz", "add_quiz", "change_quiz", "delete_quiz",
        "view_question", "add_question", "change_question", "delete_question",
        "view_milestone", "add_milestone", "change_milestone",
        "view_project", "add_project", "change_project",
        "view_practicequestion", "add_practicequestion", "change_practicequestion", "delete_practicequestion",
    ],
    "Content Moderators": [
        "view_profile", "view_course", "view_assignment", "view_quiz",
        "view_chatmessage", "change_chatmessage", "delete_chatmessage",
        "view_practicequestion",
    ],
    "User Managers": [
        "view_profile", "add_profile", "change_profile",
        "view_enrollment", "add_enrollment", "change_enrollment", "delete_enrollment",
        "view_course", "view_chatmessage",
        "view_subjectassignment", "add_subjectassignment",
        "change_subjectassignment", "delete_subjectassignment",
    ],
    "Financial Viewers": [
        "view_feepayment", "view_profile", "view_enrollment",
    ],
    "Visitors": [                   # new
        "view_course",
    ],
}

# Rename old groups to new names (one-time migration)
RENAME_GROUPS = {
    "Instructors": "Teachers",
}


class Command(BaseCommand):
    help = "Reset all group permissions to the correct RBAC configuration."

    def handle(self, *args, **options):
        self.stdout.write("\nFixing group permissions...\n")

        # Rename any old groups
        for old_name, new_name in RENAME_GROUPS.items():
            try:
                g = Group.objects.get(name=old_name)
                g.name = new_name
                g.save()
                self.stdout.write(f"  Renamed group: '{old_name}' → '{new_name}'")
            except Group.DoesNotExist:
                pass

        for group_name, codenames in GROUP_PERMISSIONS.items():
            group, created = Group.objects.get_or_create(name=group_name)
            perms = get_perms(*codenames)
            group.permissions.set(perms)
            action = "Created" if created else "Updated"
            self.stdout.write(f"  OK {action} '{group_name}': {len(perms)} permissions")

        self.stdout.write("\nDone. All group permissions fixed.\n")