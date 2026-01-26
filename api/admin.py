from django.contrib import admin
from .models import Profile, Course, Enrollment, Quiz, QuizSubmission, Assignment, AssignmentSubmission

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "student_class", "created_at")
    list_filter = ("role", "student_class")
    search_fields = ("user__username", "user__email")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "instructor", "created_at", "updated_at")
    search_fields = ("title", "instructor__user__username")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "enrolled_at", "created_at")
    search_fields = ("student__user__username", "course__title")


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "total_marks", "created_at", "updated_at")
    search_fields = ("title", "course__title")


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "quiz", "score", "submitted_at", "created_at")
    search_fields = ("student__user__username", "quiz__title")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "deadline", "updated_at", "created_at")
    search_fields = ("title", "course__title")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "file", "submitted_at", "grade", "created_at")
    search_fields = ("student__user__username", "assignment__title")
