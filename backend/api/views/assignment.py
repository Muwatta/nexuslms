from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from api.models import Assignment, AssignmentSubmission
from api.serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
)


class AssignmentViewSet(ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]


class AssignmentSubmissionViewSet(ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
