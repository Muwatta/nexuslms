from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from api.models import Enrollment
from api.serializers import EnrollmentSerializer
from api.permissions import IsAdminOrInstructor

class EnrollmentViewSet(ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == "student":
            # students only see their own enrollments
            return Enrollment.objects.filter(student=user.profile)
        return super().get_queryset()
