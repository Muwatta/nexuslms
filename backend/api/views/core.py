from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import IsAdminOrInstructor, IsOwnerOrAdmin
from rest_framework.response import Response
from rest_framework.decorators import action 
from rest_framework import status
from rest_framework.views import APIView

from api.models import Profile
from api.serializers import ProfileSerializer
from api.serializers.user import UserRegistrationSerializer


from rest_framework.exceptions import PermissionDenied

class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    # Allow admins/instructors to list/manage profiles; owners can view/update their own
    def get_permissions(self):
        # allow any authenticated user to list (they'll only see what
        # get_queryset returns); creation still restricted to staff roles
        if self.action == 'list':
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsAuthenticated(), IsAdminOrInstructor()]
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, 'role', None)
        # debug logging to help diagnose empty lists
        try:
            user_profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            user_profile = None
        print(f"[DEBUG] ProfileViewSet.get_queryset user={user} role={user_role} has_profile={user_profile is not None}")
        # admin, teachers and instructors see profiles within their department
        if user_role in ['admin', 'teacher', 'instructor'] and user_profile:
            return qs.filter(department=user_profile.department)
        # parents and students only see their own profile
        if user_role in ['parent', 'student']:
            return qs.filter(user=user)
        # superusers can see everything
        if user.is_superuser:
            return qs
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        user_role = getattr(user, 'role', None)
        try:
            creator_profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            creator_profile = None
        # allow teachers/instructors/admins to create students in their department
        if user_role in ['admin', 'teacher', 'instructor'] and creator_profile:
            serializer.save(department=creator_profile.department)
        else:
            raise PermissionDenied('Not allowed to create profiles')

    def perform_update(self, serializer):
        user_role = getattr(self.request.user, 'role', None)
        if user_role != 'admin' and not self.request.user.is_superuser:
            raise PermissionDenied('Only admins can modify profiles')
        serializer.save()

    def perform_destroy(self, instance):
        user_role = getattr(self.request.user, 'role', None)
        if user_role != 'admin' and not self.request.user.is_superuser:
            raise PermissionDenied('Only admins can delete profiles')
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrInstructor])
    def set_password(self, request, pk=None):
        """Allow admin/teachers/instructors to set a user's password."""
        profile = self.get_object()
        pwd = request.data.get('password')
        if not pwd:
            return Response({"error": "Password required"}, status=status.HTTP_400_BAD_REQUEST)
        user = profile.user
        user.set_password(pwd)
        user.save()
        return Response({"detail": "Password updated"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # if creator authenticated and is teacher/admin/instructor, enforce their department
        creator = request.user if request.user.is_authenticated else None
        if creator and hasattr(creator, 'role') and creator.role in ['teacher', 'admin', 'instructor']:
            try:
                creator_prof = Profile.objects.get(user=creator)
                prof = user.profile
                prof.department = creator_prof.department
                prof.save()
            except Profile.DoesNotExist:
                pass
        return Response(
            {"id": user.id, "username": user.username, "role": user.role},
            status=status.HTTP_201_CREATED,
        )
