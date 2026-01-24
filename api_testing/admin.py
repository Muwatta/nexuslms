from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "student_class", "created_at")
    list_filter = ("role", "student_class")
    search_fields = ("user__username", "user__email")
