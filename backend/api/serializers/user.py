from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[
            ("student", "Student"),
            ("parent", "Parent"),
            ("teacher", "Teacher"),
            ("instructor", "Instructor"),
            ("admin", "Admin"),
        ],
        default="student",
    )
    instructor_type = serializers.ChoiceField(
        choices=[
            ("subject", "Subject Instructor"),
            ("class", "Class Instructor"),
        ],
        required=False,
        allow_blank=True,
    )
    department = serializers.ChoiceField(
        choices=[
            ("western", "Western School"),
            ("arabic", "Arabic School"),
            ("programming", "Programming"),
        ],
        default="western",
    )
    student_class = serializers.ChoiceField(
        choices=[
            ("B1", "Basic 1"),
            ("B2", "Basic 2"),
            ("B3", "Basic 3"),
            ("B4", "Basic 4"),
            ("B5", "Basic 5"),
            ("JSS1", "JSS 1"),
            ("JSS2", "JSS 2"),
            ("JSS3", "JSS 3"),
            ("SS1", "SS 1"),
            ("SS2", "SS 2"),
            ("SS3", "SS 3"),
            ("idaady", "Idaady"),
            ("thanawi", "Thanawi"),
        ],
        required=False,
        allow_blank=True,
    )
    bio = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    parent_email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "instructor_type",
            "department",
            "student_class",
            "bio",
            "phone",
            "parent_email",
        )

    def create(self, validated_data):
        role = validated_data.pop("role", "student")
        instructor_type = validated_data.pop("instructor_type", None)
        department = validated_data.pop("department", "western")
        student_class = validated_data.pop("student_class", None)
        bio = validated_data.pop("bio", "")
        phone = validated_data.pop("phone", "")
        parent_email = validated_data.pop("parent_email", "")

        # pop out name fields since create_user doesn't expect them
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        user = User.objects.create_user(**validated_data)
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.role = role
        user.save()

        # profile signal creates Profile automatically; ensure fields are synced
        profile = getattr(user, "profile", None)
        if profile:
            profile.role = role
            profile.instructor_type = instructor_type or None
            profile.department = department
            profile.student_class = student_class or None
            profile.bio = bio
            profile.phone = phone
            profile.parent_email = parent_email
            profile.save()
        return user
