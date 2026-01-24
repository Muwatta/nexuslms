from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet,
    CourseViewSet,
    EnrollmentViewSet,
    QuizViewSet,
    QuizSubmissionViewSet,
    PaymentViewSet,
    AssignmentViewSet,
    AssignmentSubmissionViewSet,
    course_analytics,
    student_analytics,
)

router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profiles")
router.register("courses", CourseViewSet, basename="courses")
router.register("enrollments", EnrollmentViewSet, basename="enrollments")
router.register("quizzes", QuizViewSet, basename="quizzes")

# FIXED: distinct resources
router.register("quiz-submissions", QuizSubmissionViewSet, basename="quiz-submissions")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")

router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("payments", PaymentViewSet, basename="payments")

urlpatterns = router.urls

urlpatterns += [
    path("analytics/course/<int:course_id>/", course_analytics, name="course_analytics"),
    path("analytics/student/<int:student_id>/", student_analytics, name="student_analytics"),
]
