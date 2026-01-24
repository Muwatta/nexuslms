from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from .serializers import ProfileSerializer

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
        # Admin sees all
        return qs
