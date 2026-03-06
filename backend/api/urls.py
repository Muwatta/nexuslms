from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from .views import (
    RegisterView,
    CourseViewSet,
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
from .views.profile import (
    ProfileViewSet,
    EnrollmentViewSet as NewEnrollmentViewSet,
    AuditLogViewSet,
)
from .views.admin_views import SyncGroupsView
from .views.instructor_views import (
    InstructorProfileViewSet,
    InstructorAssignmentViewSet,
    InstructorStudentManagementViewSet,
    InstructorResultsViewSet,
)
from .models import Profile


class ClassChoicesByDepartmentView(APIView):
    def get(self, request):
        department = request.query_params.get('department', 'western')
        classes = Profile.get_classes_for_department(department)
        return Response({
            'department': department,
            'classes': [{'value': value, 'label': label} for value, label in classes]
        })


router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profiles")
router.register("enrollments", NewEnrollmentViewSet, basename="enrollments")
router.register("audit-logs", AuditLogViewSet, basename="audit-logs")
router.register("courses", CourseViewSet, basename="courses")
router.register("quizzes", QuizViewSet, basename="quizzes")
router.register("questions", QuestionViewSet, basename="questions")
router.register("quiz-submissions", QuizSubmissionViewSet, basename="quiz-submissions")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")
router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("payments", PaymentViewSet, basename="payments")
router.register("achievements", AchievementViewSet, basename="achievements")
router.register("projects", ProjectViewSet, basename="projects")
router.register("milestones", MilestoneViewSet, basename="milestones")
router.register("practice-questions", PracticeQuestionViewSet, basename="practice-questions")

# Instructor-specific endpoints (keep existing)
router.register("instructor/profiles", InstructorProfileViewSet, basename="instructor-profiles")
router.register("instructor/assignments", InstructorAssignmentViewSet, basename="instructor-assignments")
router.register("instructor/students", InstructorStudentManagementViewSet, basename="instructor-students")
router.register("instructor/results", InstructorResultsViewSet, basename="instructor-results")

urlpatterns = router.urls + [
    path("register/", RegisterView.as_view(), name="register"),
    path("analytics/course/<int:course_id>/", course_analytics, name="course_analytics"),
    path("analytics/student/<int:student_id>/", student_analytics, name="student_analytics"),
    path("ai/", AIView.as_view(), name="ai"),
    path("admin/sync-groups/", SyncGroupsView.as_view(), name="sync_groups"),
    path("class-choices/", ClassChoicesByDepartmentView.as_view(), name="class_choices"),
]