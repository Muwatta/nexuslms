from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Course, Enrollment, QuizSubmission


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def course_analytics(request, course_id):
    enrollments = Enrollment.objects.filter(course_id=course_id).count()
    submissions = QuizSubmission.objects.filter(quiz__course_id=course_id).count()

    return Response({
        "course_id": course_id,
        "total_enrollments": enrollments,
        "total_quiz_submissions": submissions,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_analytics(request, student_id):
    submissions = QuizSubmission.objects.filter(student_id=student_id).count()

    return Response({
        "student_id": student_id,
        "total_quiz_submissions": submissions,
    })
