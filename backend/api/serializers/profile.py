from rest_framework import serializers
from api.models import Profile, InstructorAssignment, Enrollment, AuditLog


class ProfileSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    instructor_type_display = serializers.CharField(
        source='get_instructor_type_display', read_only=True
    )
    valid_class_choices = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user_username', 'user_email', 'department', 'department_display',
            'student_class', 'role', 'role_display', 'instructor_type', 
            'instructor_type_display', 'bio', 'phone', 'parent_email', 'student_id',
            'is_archived', 'archived_at', 'created_at', 'updated_at',
            'valid_class_choices'
        ]
        read_only_fields = ['student_id', 'archived_at', 'created_at', 'updated_at']
    
    def get_valid_class_choices(self, obj):
        return Profile.get_classes_for_department(obj.department)
    
    def validate(self, data):
        # Validate class belongs to department
        if data.get('student_class') and data.get('department'):
            valid_classes = [c[0] for c in Profile.get_classes_for_department(data['department'])]
            if data['student_class'] not in valid_classes:
                raise serializers.ValidationError({
                    'student_class': f"Invalid class for {data['department']} department"
                })
        return data


class ProfileCreateUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for write operations with validation"""
    
    class Meta:
        model = Profile
        fields = [
            'department', 'student_class', 'role', 'instructor_type',
            'bio', 'phone', 'parent_email'
        ]
    
    def validate(self, data):
        role = data.get('role')
        instructor_type = data.get('instructor_type')
        student_class = data.get('student_class')
        department = data.get('department')
        
        # Role validation
        if role != 'instructor' and instructor_type:
            raise serializers.ValidationError({
                'instructor_type': 'Only valid for instructors'
            })
        
        if role != 'student' and student_class:
            raise serializers.ValidationError({
                'student_class': 'Only valid for students'
            })
        
        # Department/class validation
        if student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise serializers.ValidationError({
                    'student_class': f"Invalid class for {department}"
                })
        
        return data


class InstructorAssignmentSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.user.username', read_only=True)
    subject_title = serializers.CharField(source='subject.title', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = InstructorAssignment
        fields = [
            'id', 'instructor', 'instructor_name', 'subject', 'subject_title',
            'student_class', 'is_active', 'assigned_by', 'assigned_by_name', 
            'assigned_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['assigned_by', 'assigned_at', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    promoted_from_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'course', 'course_title',
            'academic_year', 'status', 'enrolled_at', 'completed_at',
            'promoted_from', 'promoted_from_details', 'promoted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['enrolled_at', 'promoted_at', 'created_at', 'updated_at']
    
    def get_promoted_from_details(self, obj):
        if obj.promoted_from:
            return {
                'id': obj.promoted_from.id,
                'course': obj.promoted_from.course.title,
                'academic_year': obj.promoted_from.academic_year
            }
        return None


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_username', 'action', 'model_name', 
            'object_id', 'old_values', 'new_values', 'timestamp', 'ip_address'
        ]
        read_only_fields = ['timestamp']


class ArchiveRestoreSerializer(serializers.Serializer):
    """Serializer for archive/restore actions"""
    reason = serializers.CharField(required=False, allow_blank=True)


class PromoteStudentSerializer(serializers.Serializer):
    """Serializer for promoting student to next class"""
    next_course_id = serializers.IntegerField(required=True)
    academic_year = serializers.CharField(required=False, max_length=9)
    
    def validate_academic_year(self, value):
        if value and not '/' in value:
            raise serializers.ValidationError("Format must be YYYY/YYYY")
        return value