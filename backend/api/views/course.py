from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from api.models import Course
from api.models import PracticeQuestion
from api.serializers import CourseSerializer
from api.serializers import PracticeQuestionSerializer
from api.permissions import IsAdminOrInstructor
from api.filters import CourseFilter

class CourseViewSet(ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]
    filterset_class = CourseFilter

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'instructor':
            try:
                user_profile = user.profile
                return qs.filter(instructor=user_profile)
            except:
                return qs.none()
        return qs

class PracticeQuestionViewSet(ModelViewSet):
    queryset = PracticeQuestion.objects.all()
    serializer_class = PracticeQuestionSerializer
    permission_classes = [IsAuthenticated]
