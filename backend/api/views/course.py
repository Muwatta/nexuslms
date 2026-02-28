from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from api.models import Course
from api.models import PracticeQuestion
from api.serializers import CourseSerializer
from api.serializers import PracticeQuestionSerializer
from api.permissions import IsAdminOrInstructor
from .filters import CourseFilter

class CourseViewSet(ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]
    filterset_class = CourseFilter

class PracticeQuestionViewSet(ModelViewSet):
    queryset = PracticeQuestion.objects.all()
    serializer_class = PracticeQuestionSerializer
    permission_classes = [IsAuthenticated]
