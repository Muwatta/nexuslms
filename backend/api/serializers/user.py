from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[("student", "Student"), ("instructor", "Instructor"), ("admin", "Admin")],
        default="student",
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

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "role",
            "department",
            "student_class",
            "bio",
            "phone",
            "parent_email",
        )

    def create(self, validated_data):
        role = validated_data.pop("role", "student")
        department = validated_data.pop("department", "western")
        student_class = validated_data.pop("student_class", None)
        bio = validated_data.pop("bio", "")
        phone = validated_data.pop("phone", "")
        parent_email = validated_data.pop("parent_email", "")

        user = User.objects.create_user(**validated_data)
        user.role = role
        user.save()

        # profile signal creates Profile automatically; ensure fields are synced
        profile = getattr(user, "profile", None)
        if profile:
            profile.role = role
            profile.department = department
            profile.student_class = student_class or None
            profile.bio = bio
            profile.phone = phone
            profile.parent_email = parent_email
            profile.save()
        return user
