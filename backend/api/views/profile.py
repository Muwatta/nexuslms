from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from api.models import Profile, Enrollment, InstructorAssignment, AuditLog
from api.serializers.profile import (
    ProfileSerializer, ProfileCreateUpdateSerializer,
    InstructorAssignmentSerializer, EnrollmentSerializer,
    AuditLogSerializer, ArchiveRestoreSerializer, PromoteStudentSerializer
)
from api.permissions import IsAdminOrInstructor, IsAdmin
from rest_framework.permissions import IsAdminUser as IsAdmin


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related('user').all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields  = ['role', 'department', 'student_class', 'is_archived', 'instructor_type']
    search_fields     = ['user__username', 'user__email', 'student_id', 'phone']
    ordering_fields   = ['created_at', 'user__username']
    ordering          = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProfileCreateUpdateSerializer
        return ProfileSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.profile.role == 'super_admin':
            return queryset
        if user.profile.role == 'school_admin':
            return queryset.filter(department=user.profile.department, is_archived=False)
        if user.profile.role == 'instructor':
            assigned_classes = InstructorAssignment.objects.filter(
                instructor=user.profile, is_active=True
            ).values_list('student_class', flat=True)
            return queryset.filter(
                student_class__in=assigned_classes, role='student', is_archived=False
            )
        return queryset.filter(user=user)

    # ── GET /profiles/me/ ─────────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Returns the current user's full profile including nested user object
        with first_name, last_name, email — the serializer now includes all of these.
        """
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    # ── PATCH /profiles/update_me/ ────────────────────────────────────────────
    @action(detail=False, methods=['patch'], url_path='update_me')
    def update_me(self, request):
        """
        Single endpoint to update BOTH user fields (first_name, last_name, email)
        AND profile fields (phone, address, bio, etc.) in one request.

        The frontend no longer needs to PATCH two separate endpoints.
        After saving, returns the full updated profile so the frontend can
        refresh localStorage in one round-trip.
        """
        profile = request.user.profile
        serializer = ProfileCreateUpdateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return the full profile (with nested user) so frontend can sync
        return Response(ProfileSerializer(profile).data)

    # ── Archive / restore / promote (unchanged) ───────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def archive(self, request, pk=None):
        profile = self.get_object()
        serializer = ArchiveRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile.archive(by_user=request.user)
        return Response({
            'status': 'archived',
            'archived_at': profile.archived_at,
            'message': 'Profile archived successfully'
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def restore(self, request, pk=None):
        profile = self.get_object()
        if not profile.is_archived:
            return Response({'error': 'Profile is not archived'}, status=status.HTTP_400_BAD_REQUEST)
        profile.restore(by_user=request.user)
        return Response({'status': 'restored', 'message': 'Profile restored successfully'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrInstructor])
    def promote(self, request, pk=None):
        profile = self.get_object()
        if profile.role != 'student':
            return Response({'error': 'Only students can be promoted'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = PromoteStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        current_enrollment = Enrollment.objects.filter(student=profile, status='active').first()
        if not current_enrollment:
            return Response({'error': 'No active enrollment found'}, status=status.HTTP_400_BAD_REQUEST)
        from api.models import Course
        try:
            next_course = Course.objects.get(id=serializer.validated_data['next_course_id'])
        except Course.DoesNotExist:
            return Response({'error': 'Next course not found'}, status=status.HTTP_404_NOT_FOUND)
        academic_year = serializer.validated_data.get('academic_year')
        new_enrollment = current_enrollment.promote_to(next_course=next_course, by_user=request.user)
        if academic_year:
            new_enrollment.academic_year = academic_year
            new_enrollment.save()
        return Response({'status': 'promoted', 'new_enrollment': EnrollmentSerializer(new_enrollment).data})

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def archived(self, request):
        queryset = Profile.objects.filter(is_archived=True)
        if request.user.profile.role == 'school_admin':
            queryset = queryset.filter(department=request.user.profile.department)
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(ProfileSerializer(page, many=True).data)
        return Response(ProfileSerializer(queryset, many=True).data)


class InstructorAssignmentViewSet(viewsets.ModelViewSet):
    queryset = InstructorAssignment.objects.select_related(
        'instructor', 'instructor__user', 'subject', 'assigned_by'
    ).all()
    serializer_class = InstructorAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructor]
    filterset_fields = ['instructor', 'subject', 'student_class', 'is_active']

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('student', 'student__user', 'course').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'academic_year', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.profile.role in ['admin', 'school_admin', 'super_admin']:
            return self.queryset
        if user.profile.role == 'instructor':
            assigned_classes = InstructorAssignment.objects.filter(
                instructor=user.profile, is_active=True
            ).values_list('student_class', flat=True)
            return self.queryset.filter(student__student_class__in=assigned_classes)
        return self.queryset.filter(student=user.profile)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['action', 'model_name', 'user', 'timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date   = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        return queryset