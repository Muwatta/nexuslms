from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, CourseViewSet, EnrollmentViewSet,
    QuizViewSet, QuizSubmissionViewSet, PaymentViewSet,
    course_analytics
)

# Router for standard CRUD endpoints
router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profiles')
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'quizzes', QuizViewSet, basename='quizzes')
router.register(r'submissions', QuizSubmissionViewSet, basename='submissions')
router.register(r'payments', PaymentViewSet, basename='payments')

urlpatterns = router.urls

# Custom analytics endpoint
urlpatterns += [
    path("analytics/course/<int:course_id>/", course_analytics, name="course_analytics"),
]
