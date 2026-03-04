from django.contrib import admin
from api.models import Quiz, QuizSubmission, Assignment, AssignmentSubmission


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "total_marks", "created_at", "updated_at")
    search_fields = ("title", "course__title")
    date_hierarchy = "created_at"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("course")


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "quiz", "score", "submitted_at")
    search_fields = ("quiz__title",)
    date_hierarchy = "submitted_at"
    readonly_fields = ("submitted_at",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("student__user", "quiz")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "deadline", "updated_at", "created_at")
    search_fields = ("title", "course__title")
    date_hierarchy = "created_at"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("course")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "file", "submitted_at", "grade")
    search_fields = ("assignment__title",)
    date_hierarchy = "submitted_at"
    readonly_fields = ("submitted_at",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("student__user", "assignment")
