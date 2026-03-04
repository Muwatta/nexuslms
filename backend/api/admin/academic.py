from django.contrib import admin
from api.models import Course, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "display_instructor", "created_at", "updated_at")
    search_fields = ("title",)

    def display_instructor(self, obj):
        instr = obj.instructor
        if instr and getattr(instr, 'user', None):
            return instr.user.username
        return "-"
    display_instructor.short_description = "Instructor"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("instructor__user")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "enrolled_at")
    search_fields = ("course__title",)
    date_hierarchy = "enrolled_at"
    readonly_fields = ("enrolled_at",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("student__user", "course")
