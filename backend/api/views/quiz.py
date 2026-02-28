from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from api.models import Quiz, QuizSubmission
from api.serializers import QuizSerializer, QuizSubmissionSerializer
from .filters import QuizFilter


class QuizViewSet(ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = QuizFilter


class QuizSubmissionViewSet(ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]
