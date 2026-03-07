from rest_framework import serializers
from django.contrib.auth import get_user_model
from api.models import Profile, InstructorAssignment, Enrollment, AuditLog

User = get_user_model()


# ── Nested user serializer ────────────────────────────────────────────────────
class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']


# ── Main read serializer ──────────────────────────────────────────────────────
class ProfileSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    # Flat convenience aliases kept for backwards compat
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email    = serializers.CharField(source='user.email',    read_only=True)

    department_display      = serializers.CharField(source='get_department_display',      read_only=True)
    role_display            = serializers.CharField(source='get_role_display',            read_only=True)
    instructor_type_display = serializers.CharField(source='get_instructor_type_display', read_only=True)
    valid_class_choices     = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            # nested user object — contains first_name, last_name, email, username
            'user',
            # flat aliases
            'user_username', 'user_email',
            # profile fields
            'id', 'department', 'department_display',
            'student_class', 'role', 'role_display',
            'instructor_type', 'instructor_type_display',
            'bio', 'phone', 'address', 'parent_email', 'student_id',
            'is_archived', 'archived_at', 'created_at', 'updated_at',
            'valid_class_choices',
        ]
        read_only_fields = ['student_id', 'archived_at', 'created_at', 'updated_at']

    def get_valid_class_choices(self, obj):
        return Profile.get_classes_for_department(obj.department)

    def validate(self, data):
        if data.get('student_class') and data.get('department'):
            valid_classes = [c[0] for c in Profile.get_classes_for_department(data['department'])]
            if data['student_class'] not in valid_classes:
                raise serializers.ValidationError({
                    'student_class': f"Invalid class for {data['department']} department"
                })
        return data

    def update(self, instance, validated_data):
        """Handle nested user fields in a single PATCH call."""
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        return super().update(instance, validated_data)


# ── Write serializer ──────────────────────────────────────────────────────────
class ProfileCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Used by PATCH /profiles/update_me/
    Accepts user-level fields (first_name, last_name, email) alongside
    profile fields and saves both objects in one call.
    """
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name  = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email      = serializers.EmailField(required=False, write_only=True)

    class Meta:
        model = Profile
        fields = [
            # user-level (write-only — returned via ProfileSerializer after save)
            'first_name', 'last_name', 'email',
            # profile-level
            'department', 'student_class', 'role',
            'instructor_type', 'bio', 'phone', 'address', 'parent_email',
        ]

    def validate(self, data):
        role            = data.get('role')
        instructor_type = data.get('instructor_type')
        student_class   = data.get('student_class')
        department      = data.get('department')

        if role != 'instructor' and instructor_type:
            raise serializers.ValidationError({'instructor_type': 'Only valid for instructors'})
        if role != 'student' and student_class:
            raise serializers.ValidationError({'student_class': 'Only valid for students'})
        if student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise serializers.ValidationError({'student_class': f"Invalid class for {department}"})
        return data

    def update(self, instance, validated_data):
        # Split user-level fields from profile fields
        first_name = validated_data.pop('first_name', None)
        last_name  = validated_data.pop('last_name',  None)
        email      = validated_data.pop('email',      None)

        user = instance.user
        changed = False
        if first_name is not None: user.first_name = first_name; changed = True
        if last_name  is not None: user.last_name  = last_name;  changed = True
        if email      is not None: user.email      = email;      changed = True
        if changed:
            user.save()

        return super().update(instance, validated_data)


# ── Supporting serializers (unchanged) ───────────────────────────────────────
class InstructorAssignmentSerializer(serializers.ModelSerializer):
    instructor_name  = serializers.CharField(source='instructor.user.username', read_only=True)
    subject_title    = serializers.CharField(source='subject.title',            read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username',     read_only=True)

    class Meta:
        model = InstructorAssignment
        fields = [
            'id', 'instructor', 'instructor_name', 'subject', 'subject_title',
            'student_class', 'is_active', 'assigned_by', 'assigned_by_name',
            'assigned_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['assigned_by', 'assigned_at', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name          = serializers.CharField(source='student.user.username', read_only=True)
    course_title          = serializers.CharField(source='course.title',          read_only=True)
    promoted_from_details = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'course', 'course_title',
            'academic_year', 'status', 'enrolled_at', 'completed_at',
            'promoted_from', 'promoted_from_details', 'promoted_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['enrolled_at', 'promoted_at', 'created_at', 'updated_at']

    def get_promoted_from_details(self, obj):
        if obj.promoted_from:
            return {
                'id':            obj.promoted_from.id,
                'course':        obj.promoted_from.course.title,
                'academic_year': obj.promoted_from.academic_year,
            }
        return None


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_username', 'action', 'model_name',
            'object_id', 'old_values', 'new_values', 'timestamp', 'ip_address',
        ]
        read_only_fields = ['timestamp']


class ArchiveRestoreSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class PromoteStudentSerializer(serializers.Serializer):
    next_course_id = serializers.IntegerField(required=True)
    academic_year  = serializers.CharField(required=False, max_length=9)

    def validate_academic_year(self, value):
        if value and '/' not in value:
            raise serializers.ValidationError("Format must be YYYY/YYYY")
        return value