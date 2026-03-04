from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from api.models import Profile
from api.signals import sync_role_to_groups

User = get_user_model()


class CustomGroupAdmin(admin.ModelAdmin):
    """Allow managing users within a group from the group change page."""
    list_display = ("name", "user_count")
    search_fields = ("name",)
    
    def user_count(self, obj):
        # use the custom reverse relation name api_user_set
        return obj.api_user_set.count()
    user_count.short_description = "User Count"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('api_user_set')
    
    class UserInline(admin.TabularInline):
        # Show all users and allow adding users to the group via the through model
        model = User.groups.through
        verbose_name = "User"
        verbose_name_plural = "Users in Group"
        extra = 0
        autocomplete_fields = ['user']  # Performance: avoid rendering all users as checkboxes
    
    inlines = [UserInline]


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

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        # Hide parent_email from non-superusers
        if not request.user.is_superuser and "parent_email" in fields:
            fields.remove("parent_email")
        return fields


class CustomUserAdmin(BaseUserAdmin):
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
        "get_groups",
    )
    list_filter = (
        "is_staff",
        "is_active",
        "profile__role",
        "profile__department",
        "groups__name",
    )
    search_fields = (
        "username",
        "email", 
        "first_name",
        "last_name",
        "profile__phone",
    )
    inlines = [ProfileInline]
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
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile').prefetch_related('groups')

    def get_inline_instances(self, request, obj=None):
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)
    
    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except Profile.DoesNotExist:
            return "-"
    get_role.short_description = "Role"
    get_role.admin_order_field = "profile__role"
    
    def get_department(self, obj):
        try:
            return obj.profile.get_department_display()
        except Profile.DoesNotExist:
            return "-"
    get_department.short_description = "Department"
    get_department.admin_order_field = "profile__department"
    
    def get_groups(self, obj):
        return ", ".join(g.name for g in obj.groups.all())
    get_groups.short_description = "Groups"
