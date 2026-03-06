from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from api.models import Profile, Assignment, Enrollment
from api.serializers import ProfileSerializer, AssignmentSerializer, EnrollmentSerializer
from api.permissions import IsClassInstructor, IsSubjectInstructor, IsInstructor, IsAdminOrClassInstructor


class InstructorProfileViewSet(ReadOnlyModelViewSet):
    """ViewSet for instructors to view profiles based on their type."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Profile.objects.none()

        if profile.instructor_type == "class":
            # Class instructors can see all students and instructors in their department
            return Profile.objects.filter(department=profile.department)
        elif profile.instructor_type == "subject":
            # Subject instructors can see students enrolled in their subjects
            # For now, return all students in their department
            # This should be filtered by actual subject assignments in the future
            return Profile.objects.filter(
                department=profile.department,
                role="student"
            )
        return Profile.objects.none()


class InstructorAssignmentViewSet(ModelViewSet):
    """ViewSet for instructors to manage assignments."""
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Assignment.objects.none()

        # Instructors can only see/manage assignments in their department
        return Assignment.objects.filter(course__department=profile.department)

    def perform_create(self, serializer):
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            raise PermissionError("Profile not found")

        # Ensure assignment is created in instructor's department
        course = serializer.validated_data.get('course')
        if course and course.department != profile.department:
            raise PermissionError("Cannot create assignments outside your department")

        serializer.save(created_by=user)


class InstructorStudentManagementViewSet(ModelViewSet):
    """ViewSet for class instructors to manage students."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminOrClassInstructor]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Profile.objects.none()

        # Only class instructors can manage students
        if profile.role == "instructor" and profile.instructor_type == "class":
            return Profile.objects.filter(
                department=profile.department,
                role="student"
            )
        elif profile.role in ["admin", "super_admin"]:
            return Profile.objects.filter(role="student")

        return Profile.objects.none()

    def perform_create(self, serializer):
        """Only class instructors and admins can create students."""
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            raise PermissionError("Profile not found")

        # Set department to match instructor's department
        serializer.save(
            department=profile.department,
            role="student"
        )

    def perform_update(self, serializer):
        """Only class instructors and admins can update students."""
        instance = serializer.save()

        # Update user fields if provided
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
        """Only admins can delete students, not instructors."""
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            raise PermissionError("Profile not found")

        if profile.role not in ["admin", "super_admin"]:
            raise PermissionError("Only administrators can delete student profiles")

        instance.delete()


class InstructorResultsViewSet(ReadOnlyModelViewSet):
    """ViewSet for instructors to view student results."""
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Enrollment.objects.none()

        if profile.instructor_type == "class":
            # Class instructors can see all enrollments in their department
            return Enrollment.objects.filter(
                course__department=profile.department
            ).select_related('student', 'course')
        elif profile.instructor_type == "subject":
            # Subject instructors can see enrollments for their subjects
            # For now, return all enrollments in their department
            # This should be filtered by actual subject assignments in the future
            return Enrollment.objects.filter(
                course__department=profile.department
            ).select_related('student', 'course')

        return Enrollment.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsInstructor])
    def update_result(self, request, pk=None):
        """Allow instructors to update student results."""
        enrollment = self.get_object()
        user = request.user

        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if instructor can update this enrollment
        if enrollment.course.department != profile.department:
            return Response(
                {"error": "Cannot update results outside your department"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate score fields (0-100)
        score_fields = ['first_test_score', 'second_test_score', 'attendance_score', 'assignment_score']
        for field in score_fields:
            if field in request.data:
                score = request.data[field]
                if score is not None and (score < 0 or score > 100):
                    return Response(
                        {"error": f"{field} must be between 0 and 100"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Update the enrollment
        for field in score_fields:
            if field in request.data:
                setattr(enrollment, field, request.data[field])

        enrollment.save()

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)