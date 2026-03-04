from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import (
    Profile, Course, Enrollment, Quiz, QuizSubmission,
    Assignment, AssignmentSubmission, Achievement, Project, Milestone
)
from .signals import sync_role_to_groups  # used in admin action

User = get_user_model()


# INLINE: Edit profile directly on user page - BEST for 500-2000 students
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile Details"
    fields = (
        "role",
        "department", 
        "student_class",
        "phone",
        "parent_email",
        "bio",
    )
    list_filter = ("role", "department")


# Unregister default User admin
admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "get_role",
        "get_department",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = (
        "is_staff",
        "is_active",
        "profile__role",      # Filter by role
        "profile__department",  # Filter by department
    )
    search_fields = (
        "username",
        "email", 
        "first_name",
        "last_name",
        "profile__phone",  # Search by phone too
    )
    inlines = [ProfileInline]  # KEY: Edit role without leaving page

    # admin action for manually re-syncing groups from profile role
    actions = ["sync_groups_from_role"]

    def sync_groups_from_role(self, request, queryset):
        """Loop through selected users and re-run the signal handler."""
        for user in queryset:
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                continue
            sync_role_to_groups(Profile, profile, False)
        self.message_user(request, "Groups synchronized for selected users.")
    sync_groups_from_role.short_description = "Sync groups from profile role"
    
    # Optimize query to avoid N+1 problem
    def get_queryset(self, request):
        # include groups so list display doesn't need extra queries
        return super().get_queryset(request).select_related('profile').prefetch_related('groups')
    
    # Human-readable role (shows "Instructor" not "instructor")
    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except Profile.DoesNotExist:
            return "-"
    get_role.short_description = "Role"
    get_role.admin_order_field = "profile__role"
    
    # Show department in list too
    def get_department(self, obj):
        try:
            return obj.profile.get_department_display()
        except Profile.DoesNotExist:
            return "-"
    get_department.short_description = "Department"
    get_department.admin_order_field = "profile__department"
    
    # Display user's groups
    def get_groups(self, obj):
        return ", ".join(g.name for g in obj.groups.all())
    get_groups.short_description = "Groups"
    get_groups.admin_order_field = "groups__name"
    
    list_display = list(list_display) + ["get_groups"]
    list_filter = list(list_filter) + ["groups__name"]



@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "instructor", "created_at", "updated_at")
    search_fields = ("title", "instructor__user__username")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "enrolled_at")
    search_fields = ("student__user__username", "course__title")


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "total_marks", "created_at", "updated_at")
    search_fields = ("title", "course__title")


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "quiz", "score", "submitted_at")
    search_fields = ("student__user__username", "quiz__title")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "deadline", "updated_at", "created_at")
    search_fields = ("title", "course__title")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "file", "submitted_at", "grade")
    search_fields = ("student__user__username", "assignment__title")


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("student", "title", "achievement_type", "date_earned")
    search_fields = ("student__user__username", "title")
    list_filter = ("achievement_type", "date_earned")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "status", "start_date", "end_date")
    search_fields = ("title", "course__title")
    list_filter = ("status", "start_date")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "related_to", "progress_percentage", "created_at")
    search_fields = ("title", "course__title")
    list_filter = ("related_to",)