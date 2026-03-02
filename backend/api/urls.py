from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet,
    RegisterView,
    CourseViewSet,
    EnrollmentViewSet,
    QuizViewSet,
    QuestionViewSet,
    QuizSubmissionViewSet,
    PaymentViewSet,
    AssignmentViewSet,
    AssignmentSubmissionViewSet,
    AchievementViewSet,
    ProjectViewSet,
    MilestoneViewSet,
    PracticeQuestionViewSet,
    course_analytics,
    student_analytics,
    AIView, 
)
from .views.admin_views import SyncGroupsView

router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profiles")
router.register("courses", CourseViewSet, basename="courses")
router.register("enrollments", EnrollmentViewSet, basename="enrollments")
router.register("quizzes", QuizViewSet, basename="quizzes")
router.register("questions", QuestionViewSet, basename="questions")

# FIXED: distinct resources
router.register("quiz-submissions", QuizSubmissionViewSet, basename="quiz-submissions")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")

router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("payments", PaymentViewSet, basename="payments")
router.register("achievements", AchievementViewSet, basename="achievements")
router.register("projects", ProjectViewSet, basename="projects")
router.register("milestones", MilestoneViewSet, basename="milestones")
router.register("practice-questions", PracticeQuestionViewSet, basename="practice-questions")

urlpatterns = router.urls

urlpatterns += [
    path("register/", RegisterView.as_view(), name="register"),
    path("analytics/course/<int:course_id>/", course_analytics, name="course_analytics"),
    path("analytics/student/<int:student_id>/", student_analytics, name="student_analytics"),
    path("ai/", AIView.as_view(), name="ai"),
    path("admin/sync-groups/", SyncGroupsView.as_view(), name="sync_groups"),
]
