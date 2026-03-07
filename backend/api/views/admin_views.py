from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, serializers as drf_serializers
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import transaction

from api.models import Profile
from api.permissions import IsAdmin
from .. import signals as signals_module

User = get_user_model()


class AdminCreateUserSerializer(drf_serializers.Serializer):
    """Full validation for creating a new user + profile."""
    username        = drf_serializers.CharField(max_length=150)
    password        = drf_serializers.CharField(min_length=6, write_only=True)
    first_name      = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name       = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    email           = drf_serializers.EmailField(required=False, allow_blank=True)
    role            = drf_serializers.ChoiceField(choices=[
        "student","parent","teacher","instructor",
        "school_admin","admin","super_admin"
    ], default="student")
    department      = drf_serializers.ChoiceField(choices=[
        "western","arabic","programming"
    ], default="western")
    student_class   = drf_serializers.CharField(required=False, allow_blank=True, max_length=20)
    instructor_type = drf_serializers.ChoiceField(
        choices=["subject","class",""], required=False, allow_blank=True
    )
    bio             = drf_serializers.CharField(required=False, allow_blank=True)
    phone           = drf_serializers.CharField(required=False, allow_blank=True, max_length=30)
    address         = drf_serializers.CharField(required=False, allow_blank=True)
    parent_email    = drf_serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise drf_serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, data):
        role            = data.get("role", "student")
        instructor_type = data.get("instructor_type", "")
        student_class   = data.get("student_class", "")
        department      = data.get("department", "western")

        if role == "instructor" and not instructor_type:
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type is required for instructor role."}
            )
        if role != "instructor" and instructor_type:
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type can only be set for instructor role."}
            )
        if role == "student" and student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise drf_serializers.ValidationError(
                    {"student_class": f"'{student_class}' is not valid for {department} department."}
                )
        return data


class AdminUpdateUserSerializer(drf_serializers.Serializer):
    """Partial update — all fields optional, validated together."""
    first_name      = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name       = drf_serializers.CharField(required=False, allow_blank=True, max_length=150)
    email           = drf_serializers.EmailField(required=False, allow_blank=True)
    role            = drf_serializers.ChoiceField(required=False, choices=[
        "student","parent","teacher","instructor",
        "school_admin","admin","super_admin"
    ])
    department      = drf_serializers.ChoiceField(required=False, choices=[
        "western","arabic","programming"
    ])
    student_class   = drf_serializers.CharField(required=False, allow_blank=True, max_length=20)
    instructor_type = drf_serializers.ChoiceField(
        choices=["subject","class",""], required=False, allow_blank=True
    )
    bio             = drf_serializers.CharField(required=False, allow_blank=True)
    phone           = drf_serializers.CharField(required=False, allow_blank=True, max_length=30)
    address         = drf_serializers.CharField(required=False, allow_blank=True)
    parent_email    = drf_serializers.EmailField(required=False, allow_blank=True)
    is_archived     = drf_serializers.BooleanField(required=False)

    def validate(self, data):
        role            = data.get("role")
        instructor_type = data.get("instructor_type", "")
        student_class   = data.get("student_class", "")
        department      = data.get("department", "")

        if instructor_type and role and role != "instructor":
            raise drf_serializers.ValidationError(
                {"instructor_type": "Instructor type is only valid for instructor role."}
            )
        if student_class and role and role != "student":
            raise drf_serializers.ValidationError(
                {"student_class": "Student class is only valid for student role."}
            )
        if student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise drf_serializers.ValidationError(
                    {"student_class": f"'{student_class}' is not valid for {department} department."}
                )
        return data


class AdminSetPasswordSerializer(drf_serializers.Serializer):
    password = drf_serializers.CharField(min_length=6, write_only=True)

    def validate_password(self, value):
        if value.lower() in ("password", "123456", "qwerty", "admin", "pass"):
            raise drf_serializers.ValidationError("Password is too common.")
        return value


# ─── Response serializer (what we send back to the frontend) ──────────────────

class AdminProfileResponseSerializer(drf_serializers.ModelSerializer):
    """Read serializer — always returns nested user with first_name/last_name."""
    user = drf_serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id", "user", "role", "department", "student_class",
            "instructor_type", "bio", "phone", "address", "parent_email",
            "student_id", "is_archived", "archived_at", "created_at", "updated_at",
        ]

    def get_user(self, obj):
        return {
            "id":         obj.user.id,
            "username":   obj.user.username,
            "email":      obj.user.email    or "",
            "first_name": obj.user.first_name or "",
            "last_name":  obj.user.last_name  or "",
        }


# ─── Admin User Management ViewSet ───────────────────────────────────────────

class AdminUserViewSet(ModelViewSet):
    """
    Full CRUD for user + profile. Requires admin or super_admin role.

    GET    /api/admin/users/                → paginated list (filterable)
    POST   /api/admin/users/                → create user + profile
    GET    /api/admin/users/{id}/           → retrieve single user
    PATCH  /api/admin/users/{id}/           → update user + profile fields
    DELETE /api/admin/users/{id}/           → hard delete (irreversible)
    POST   /api/admin/users/{id}/set_password/ → change password
    POST   /api/admin/users/{id}/archive/   → soft delete
    POST   /api/admin/users/{id}/restore/   → un-archive
    GET    /api/admin/users/stats/          → aggregate counts
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = AdminProfileResponseSerializer

    def get_queryset(self):
        qs = Profile.objects.select_related("user").order_by("-created_at")

        role     = self.request.query_params.get("role", "")
        dept     = self.request.query_params.get("department", "")
        search   = self.request.query_params.get("search", "").strip()
        archived = self.request.query_params.get("archived", "false").lower() == "true"

        qs = qs.filter(is_archived=archived)

        if role:
            qs = qs.filter(role=role)
        if dept:
            qs = qs.filter(department=dept)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(student_id__icontains=search)
            )
        return qs.distinct()

    # ── CREATE ────────────────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        ser = AdminCreateUserSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        d = ser.validated_data
        with transaction.atomic():
            user = User.objects.create_user(
                username   = d["username"],
                password   = d["password"],
                email      = d.get("email", ""),
                first_name = d.get("first_name", ""),
                last_name  = d.get("last_name", ""),
            )
            # Profile is auto-created by signal; update its fields
            profile = user.profile
            profile.role            = d.get("role", "student")
            profile.department      = d.get("department", "western")
            profile.student_class   = d.get("student_class") or None
            profile.instructor_type = d.get("instructor_type") or None
            profile.bio             = d.get("bio", "")
            profile.phone           = d.get("phone", "")
            profile.address         = d.get("address", "")
            profile.parent_email    = d.get("parent_email", "")
            profile.save()

        return Response(
            AdminProfileResponseSerializer(profile).data,
            status=status.HTTP_201_CREATED
        )

    # ── PARTIAL UPDATE ────────────────────────────────────────────────────
    def partial_update(self, request, *args, **kwargs):
        profile = self.get_object()
        ser = AdminUpdateUserSerializer(data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        d = ser.validated_data
        with transaction.atomic():
            # User-level fields
            user = profile.user
            user_dirty = False
            for field in ("first_name", "last_name", "email"):
                if field in d:
                    setattr(user, field, d.pop(field))
                    user_dirty = True
            if user_dirty:
                user.save()

            # Profile-level fields
            for field, value in d.items():
                setattr(profile, field, value if value != "" else None
                        if field in ("student_class", "instructor_type") else value)
            profile.save()

        return Response(AdminProfileResponseSerializer(profile).data)

    # Disable full PUT — only PATCH is allowed
    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Use PATCH for partial updates."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    # ── DELETE ────────────────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()
        if profile.user == request.user:
            return Response(
                {"detail": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        username = profile.user.username
        with transaction.atomic():
            profile.user.delete()  # cascades to Profile
        return Response(
            {"detail": f"User '{username}' permanently deleted."},
            status=status.HTTP_200_OK
        )

    # ── SET PASSWORD ──────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="set_password")
    def set_password(self, request, pk=None):
        profile = self.get_object()
        ser = AdminSetPasswordSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        profile.user.set_password(ser.validated_data["password"])
        profile.user.save()
        return Response({"detail": "Password updated successfully."})

    # ── ARCHIVE (soft delete) ─────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        profile = self.get_object()
        if profile.user == request.user:
            return Response(
                {"detail": "You cannot archive your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if profile.is_archived:
            return Response(
                {"detail": "Profile is already archived."},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile.archive(by_user=request.user)
        return Response({"detail": "User archived.", "id": profile.id})

    # ── RESTORE ───────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        profile = self.get_object()
        if not profile.is_archived:
            return Response(
                {"detail": "Profile is not archived."},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile.restore(by_user=request.user)
        return Response({"detail": "User restored.", "id": profile.id})

    # ── STATS ─────────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = Profile.objects.filter(is_archived=False)
        return Response({
            "total":       qs.count(),
            "students":    qs.filter(role="student").count(),
            "instructors": qs.filter(role__in=["instructor", "teacher"]).count(),
            "admins":      qs.filter(role__in=["admin", "super_admin", "school_admin"]).count(),
            "parents":     qs.filter(role="parent").count(),
            "western":     qs.filter(department="western").count(),
            "arabic":      qs.filter(department="arabic").count(),
            "programming": qs.filter(department="programming").count(),
        })


# ─── Sync groups (unchanged, just fixed permission class) ─────────────────────

class SyncGroupsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, *args, **kwargs):
        user_ids = request.data.get("user_ids") or []
        if not isinstance(user_ids, (list, tuple)):
            return Response(
                {"detail": "user_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        processed, errors = [], []
        for uid in user_ids:
            try:
                user = User.objects.get(pk=uid)
            except User.DoesNotExist:
                errors.append({"id": uid, "error": "not_found"})
                continue
            profile = getattr(user, "profile", None)
            if not profile:
                errors.append({"id": uid, "error": "no_profile"})
                continue
            try:
                signals_module.sync_role_to_groups(type(profile), profile, False)
                processed.append(uid)
            except Exception as exc:
                errors.append({"id": uid, "error": str(exc)})
        return Response({"processed": processed, "errors": errors})