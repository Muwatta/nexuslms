from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response

from .views import (
    RegisterView, CourseViewSet, QuizViewSet, QuestionViewSet,
    QuizSubmissionViewSet, PaymentViewSet, AssignmentViewSet,
    AssignmentSubmissionViewSet, AchievementViewSet, ProjectViewSet,
    MilestoneViewSet, PracticeQuestionViewSet,
    course_analytics, student_analytics, AIView,
)
from .views.profile import (
    ProfileViewSet,
    EnrollmentViewSet as NewEnrollmentViewSet,
    AuditLogViewSet,
)
from .views.admin_views import SyncGroupsView, AdminUserViewSet
from .views.instructor_views import (
    InstructorProfileViewSet, InstructorAssignmentViewSet,
    InstructorStudentManagementViewSet, InstructorResultsViewSet,
)

from .views.student_views import (
    StudentDashboardView,
    StudentCourseViewSet,
    StudentEnrollmentViewSet,
    StudentChatView,
    AnnouncementListView,
)
from .models import Profile


class ClassChoicesByDepartmentView(APIView):
    def get(self, request):
        department = request.query_params.get('department', 'western')
        classes = Profile.get_classes_for_department(department)
        return Response({
            'department': department,
            'classes': [{'value': v, 'label': l} for v, l in classes]
        })


router = DefaultRouter()

# ── Profiles / enrollments / audit ───────────────────────────────────────────
router.register("profiles",    ProfileViewSet,       basename="profiles")
router.register("enrollments", NewEnrollmentViewSet, basename="enrollments")
router.register("audit-logs",  AuditLogViewSet,      basename="audit-logs")

# ── Admin full CRUD ───────────────────────────────────────────────────────────
# GET/POST   /api/admin/users/
# GET/PATCH/DELETE /api/admin/users/{id}/
# POST /api/admin/users/{id}/set_password/
# POST /api/admin/users/{id}/archive/
# POST /api/admin/users/{id}/restore/
# GET  /api/admin/users/stats/
router.register("admin/users", AdminUserViewSet, basename="admin-users")

# ── Academic ──────────────────────────────────────────────────────────────────
router.register("courses",                CourseViewSet,               basename="courses")
router.register("quizzes",                QuizViewSet,                 basename="quizzes")
router.register("questions",              QuestionViewSet,             basename="questions")
router.register("quiz-submissions",       QuizSubmissionViewSet,       basename="quiz-submissions")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")
router.register("assignments",            AssignmentViewSet,           basename="assignments")
router.register("payments",               PaymentViewSet,              basename="payments")
router.register("achievements",           AchievementViewSet,          basename="achievements")
router.register("projects",               ProjectViewSet,              basename="projects")
router.register("milestones",             MilestoneViewSet,            basename="milestones")
router.register("practice-questions",     PracticeQuestionViewSet,     basename="practice-questions")
router.register("student/courses",     StudentCourseViewSet,     basename="student-courses")
router.register("student/enrollments", StudentEnrollmentViewSet, basename="student-enrollments")

# ── Instructor ────────────────────────────────────────────────────────────────
router.register("instructor/profiles",    InstructorProfileViewSet,           basename="instructor-profiles")
router.register("instructor/assignments", InstructorAssignmentViewSet,         basename="instructor-assignments")
router.register("instructor/students",    InstructorStudentManagementViewSet,  basename="instructor-students")
router.register("instructor/results",     InstructorResultsViewSet,            basename="instructor-results")

urlpatterns = router.urls + [
    path("register/",                           RegisterView.as_view(),               name="register"),
    path("analytics/course/<int:course_id>/",   course_analytics,                     name="course_analytics"),
    path("analytics/student/<int:student_id>/", student_analytics,                    name="student_analytics"),
    path("ai/",                                 AIView.as_view(),                     name="ai"),
    path("admin/sync-groups/",                  SyncGroupsView.as_view(),             name="sync_groups"),
    path("class-choices/",                      ClassChoicesByDepartmentView.as_view(), name="class_choices"),
    path("student/dashboard/",     StudentDashboardView.as_view(),  name="student-dashboard"),
    path("student/chat/",          StudentChatView.as_view(),        name="student-chat"),
    path("student/announcements/", AnnouncementListView.as_view(),  name="student-announcements"),
]