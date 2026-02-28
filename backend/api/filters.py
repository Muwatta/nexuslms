from django_filters import rest_framework as filters

from .models import Course, Enrollment, Quiz


class CourseFilter(filters.FilterSet):
    instructor = filters.NumberFilter(field_name="instructor__id")
    title = filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = Course
        fields = ["instructor", "title"]


class EnrollmentFilter(filters.FilterSet):
    student = filters.NumberFilter(field_name="student__id")
    course = filters.NumberFilter(field_name="course__id")

    class Meta:
        model = Enrollment
        fields = ["student", "course"]


class QuizFilter(filters.FilterSet):
    course = filters.NumberFilter(field_name="course__id")
    title = filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = Quiz
        fields = ["course", "title"]
