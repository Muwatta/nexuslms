from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Profile, Course, Enrollment, Quiz, QuizSubmission, Payment
from .serializers import ProfileSerializer, CourseSerializer, EnrollmentSerializer, QuizSerializer, QuizSubmissionSerializer, PaymentSerializer
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Avg
# Profiles (already exists)
class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Profile.objects.all()
        if user.profile.role == "student":
            return qs.filter(user=user)
        elif user.profile.role == "instructor":
            return qs.filter(student_class=user.profile.student_class)
        return qs  # admin sees all

# Courses
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

# Enrollments
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["course", "student"]

    @action(detail=False, methods=["post"], url_path="enroll")
    def enroll_student(self, request):
        user = request.user
        if user.profile.role != "student":
            return Response({"detail": "Only students can enroll."}, status=status.HTTP_403_FORBIDDEN)

        course_id = request.data.get("course")
        if not course_id:
            return Response({"detail": "Course ID required."}, status=status.HTTP_400_BAD_REQUEST)

        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollment, created = Enrollment.objects.get_or_create(student=user.profile, course=course)
        if not created:
            return Response({"detail": "Already enrolled."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.profile.role == "student":
            return qs.filter(student=user.profile)
        elif user.profile.role == "instructor":
            # show enrollments for their courses
            return qs.filter(course__instructor=user.profile)
        return qs

# Quizzes
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["course"]  # filter quizzes by course
    search_fields = ["title", "course__title"]
    ordering_fields = ["created_at", "total_marks"]

# Quiz Submissions
class QuizSubmissionViewSet(viewsets.ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.profile.role == "student":
            return qs.filter(student=user.profile)
        elif user.profile.role == "instructor":
            return qs.filter(quiz__course__instructor=user.profile)
        return qs


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def course_analytics(request, course_id):
    user = request.user
    course = Course.objects.filter(id=course_id).first()
    if not course:
        return Response({"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

    # Only instructor or admin can view
    if user.profile.role == "instructor" and course.instructor != user.profile:
        return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    enrollments = Enrollment.objects.filter(course=course)
    students_count = enrollments.count()
    avg_progress = enrollments.aggregate(Avg("progress"))["progress__avg"] or 0

    quizzes = Quiz.objects.filter(course=course)
    quiz_count = quizzes.count()
    avg_scores = QuizSubmission.objects.filter(quiz__in=quizzes).aggregate(Avg("score"))["score__avg"] or 0

    return Response({
        "course": course.title,
        "students_count": students_count,
        "avg_progress": avg_progress,
        "quizzes_count": quiz_count,
        "avg_score": avg_scores
    })


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.profile)
