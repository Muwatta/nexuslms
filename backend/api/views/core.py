from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import IsAdminOrInstructor, IsOwnerOrAdmin, IsAdminOrClassInstructor
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
        # admin roles see all profiles
        if user_role in ['admin', 'school_admin', 'super_admin'] or user.is_superuser:
            return qs
        # teachers and instructors see profiles within their department
        if user_role in ['teacher', 'instructor'] and user_profile:
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

        # Allow class instructors and admins to create students in their department
        if user_role in ['admin', 'super_admin'] or \
           (user_role == 'instructor' and creator_profile and creator_profile.instructor_type == 'class'):
            serializer.save(department=creator_profile.department if creator_profile else 'western')
        else:
            raise PermissionDenied('Not allowed to create profiles. Only class instructors and admins can create student profiles.')

    def perform_update(self, serializer):
        user_role = getattr(self.request.user, 'role', None)
        if user_role != 'admin' and not self.request.user.is_superuser:
            raise PermissionDenied('Only admins can modify profiles')
        instance = serializer.save()
        # if first/last name provided in payload, update related user object
        user_fields = {}
        if 'first_name' in self.request.data:
            user_fields['first_name'] = self.request.data.get('first_name')
        if 'last_name' in self.request.data:
            user_fields['last_name'] = self.request.data.get('last_name')
        if user_fields:
            for attr, val in user_fields.items():
                setattr(instance.user, attr, val)
            instance.user.save()

    def perform_destroy(self, instance):
        user_role = getattr(self.request.user, 'role', None)
        if user_role not in ['admin', 'super_admin']:
            raise PermissionDenied('Only administrators can delete profiles. Instructors cannot delete student profiles.')
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrInstructor])
    def set_password(self, request, pk=None):
        """Allow admin/instructors to set a user's password."""
        profile = self.get_object()
        pwd = request.data.get('password')
        if not pwd:
            return Response({"error": "Password required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if instructor can modify this profile
        user = request.user
        try:
            user_profile = user.profile
        except Profile.DoesNotExist:
            return Response({"error": "User profile not found"}, status=status.HTTP_403_FORBIDDEN)

        # Class instructors can only modify students in their department
        if user_profile.role == 'instructor' and user_profile.instructor_type == 'class':
            if profile.role != 'student' or profile.department != user_profile.department:
                return Response(
                    {"error": "Class instructors can only modify students in their department"},
                    status=status.HTTP_403_FORBIDDEN
                )
        # Subject instructors cannot set passwords
        elif user_profile.role == 'instructor' and user_profile.instructor_type == 'subject':
            return Response(
                {"error": "Subject instructors cannot set passwords"},
                status=status.HTTP_403_FORBIDDEN
            )

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
