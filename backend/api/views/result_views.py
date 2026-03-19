# backend/api/views/result_views.py

from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone

from api.models import Profile, Course, Result, ReportCard, Enrollment
from api.permissions import IsTeacher, IsAdmin


# ── Serializers

class ResultSerializer(serializers.ModelSerializer):
    student_name  = serializers.SerializerMethodField()
    course_title  = serializers.SerializerMethodField()
    entered_by_name = serializers.SerializerMethodField()
    ca_total      = serializers.FloatField(read_only=True)

    class Meta:
        model  = Result
        fields = [
            "id", "student", "student_name", "course", "course_title",
            "term", "academic_year", "student_class",
            "test1", "test2", "assignment", "midterm", "exam",
            "ca_total", "total", "grade", "position", "remark",
            "status", "entered_by", "entered_by_name",
            "submitted_at", "reviewed_at", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "total", "grade", "ca_total", "position",
            "submitted_at", "reviewed_at", "published_at",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        u = obj.student.user
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_course_title(self, obj):
        return obj.course.title

    def get_entered_by_name(self, obj):
        if not obj.entered_by:
            return None
        u = obj.entered_by.user
        return f"{u.first_name} {u.last_name}".strip() or u.username


class ResultWriteSerializer(serializers.ModelSerializer):
    """Used for creating/updating results (teacher entry)."""

    class Meta:
        model  = Result
        fields = [
            "student", "course", "term", "academic_year",
            "test1", "test2", "assignment", "midterm", "exam",
            "remark",
        ]

    def validate(self, data):
        # Validate score ranges
        errors = {}
        for field, max_val in [
            ("test1", 10), ("test2", 10),
            ("assignment", 10), ("midterm", 10), ("exam", 60),
        ]:
            val = data.get(field, 0)
            if val < 0 or val > max_val:
                errors[field] = f"Must be between 0 and {max_val}."
        if errors:
            raise serializers.ValidationError(errors)
        return data


class BulkResultSerializer(serializers.Serializer):
    """For bulk entry — list of result records for a course/term."""
    course        = serializers.IntegerField()
    term          = serializers.CharField()
    academic_year = serializers.CharField()
    results       = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )


class ReportCardSerializer(serializers.ModelSerializer):
    student_name  = serializers.SerializerMethodField()
    results       = serializers.SerializerMethodField()

    class Meta:
        model  = ReportCard
        fields = [
            "id", "student", "student_name",
            "term", "academic_year", "student_class",
            "total_subjects", "total_score", "average_score",
            "position_in_class", "class_size",
            "days_present", "days_absent", "total_days",
            "class_teacher_remark", "principal_remark", "resumption_date",
            "is_published", "generated_at", "published_at",
            "results",
        ]

    def get_student_name(self, obj):
        u = obj.student.user
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_results(self, obj):
        """Embed all published results for this report card's term."""
        results = Result.objects.filter(
            student=obj.student,
            term=obj.term,
            academic_year=obj.academic_year,
            status="published",
        ).select_related("course")
        return [
            {
                "course":   r.course.title,
                "test1":    r.test1,
                "test2":    r.test2,
                "assignment": r.assignment,
                "midterm":  r.midterm,
                "exam":     r.exam,
                "ca_total": r.ca_total,
                "total":    r.total,
                "grade":    r.grade,
                "position": r.position,
                "remark":   r.remark,
            }
            for r in results
        ]


# ── Result ViewSet ────────────────────────────────────────────────────────────

class ResultViewSet(viewsets.ModelViewSet):
    """
    CRUD for results.

    - Teachers see only results they entered.
    - Class teachers see all results for their class.
    - Admins see everything.
    - Students see only their own published results.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ResultWriteSerializer
        return ResultSerializer

    def get_queryset(self):
        user    = self.request.user
        profile = getattr(user, "profile", None)
        if not profile:
            return Result.objects.none()

        role = profile.role

        if role in ("admin", "super_admin", "school_admin"):
            qs = Result.objects.all()
        elif role == "teacher":
            teacher_type = getattr(profile, "teacher_type", None)
            if teacher_type == "class":
                # Class teacher sees all results for their class
                qs = Result.objects.filter(
                    student_class=profile.student_class or "",
                )
            else:
                # Subject teacher sees only results they entered
                qs = Result.objects.filter(entered_by=profile)
        elif role == "student":
            qs = Result.objects.filter(student=profile, status="published")
        elif role == "parent":
            # Parent sees their child's published results
            # Link via parent_email matching student's parent_email
            children = Profile.objects.filter(
                role="student",
                parent_email=user.email,
            )
            qs = Result.objects.filter(student__in=children, status="published")
        else:
            return Result.objects.none()

        # Optional filters
        params = self.request.query_params
        if params.get("term"):
            qs = qs.filter(term=params["term"])
        if params.get("academic_year"):
            qs = qs.filter(academic_year=params["academic_year"])
        if params.get("course"):
            qs = qs.filter(course_id=params["course"])
        if params.get("student"):
            qs = qs.filter(student_id=params["student"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("student_class"):
            qs = qs.filter(student_class=params["student_class"])

        return qs.select_related(
            "student__user", "course", "entered_by__user"
        )

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        student = serializer.validated_data.get("student")
        serializer.save(
            entered_by=profile,
            student_class=getattr(student, "student_class", "") or "",
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        # Only allow edits while in draft
        if instance.status not in ("draft",):
            raise serializers.ValidationError(
                "Cannot edit a result that has already been submitted."
            )
        serializer.save()

    # ── Submit (teacher → class teacher) ─────────────────────────────────────

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if result.entered_by != profile and profile.role not in ("admin", "super_admin"):
            return Response(
                {"detail": "Only the entering teacher can submit this result."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status != "draft":
            return Response(
                {"detail": f"Cannot submit — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status       = "submitted"
        result.submitted_at = timezone.now()
        result.save()
        return Response({"detail": "Result submitted for review.", "status": "submitted"})

    # ── Review (class teacher) ────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if profile.role not in ("teacher", "admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only teachers or admins can review results."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status != "submitted":
            return Response(
                {"detail": f"Cannot review — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status      = "reviewed"
        result.reviewed_by = profile
        result.reviewed_at = timezone.now()
        result.save()
        return Response({"detail": "Result reviewed.", "status": "reviewed"})

    # ── Publish (admin) ───────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        result  = self.get_object()
        profile = getattr(request.user, "profile", None)

        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish results."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if result.status not in ("reviewed", "submitted"):
            return Response(
                {"detail": f"Cannot publish — current status is '{result.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status       = "published"
        result.published_by = request.user
        result.published_at = timezone.now()
        result.save()
        return Response({"detail": "Result published.", "status": "published"})

    # ── Class results (class teacher overview) ────────────────────────────────

    @action(detail=False, methods=["get"])
    def class_results(self, request):
        """All results for a given class/term/year."""
        student_class = request.query_params.get("student_class")
        term          = request.query_params.get("term")
        academic_year = request.query_params.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = Result.objects.filter(
            student_class=student_class,
            term=term,
            academic_year=academic_year,
        ).select_related("student__user", "course", "entered_by__user")

        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)

    # ── Bulk entry ────────────────────────────────────────────────────────────

    @action(detail=False, methods=["post"])
    def bulk_entry(self, request):
        """
        Teacher enters results for all students in a course at once.
        POST body:
        {
            "course": 5,
            "term": "First Term",
            "academic_year": "2025/2026",
            "results": [
                {"student": 12, "test1": 8, "test2": 7, "assignment": 9,
                 "midterm": 8, "exam": 52},
                ...
            ]
        }
        """
        serializer = BulkResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile       = getattr(request.user, "profile", None)
        course_id     = serializer.validated_data["course"]
        term          = serializer.validated_data["term"]
        academic_year = serializer.validated_data["academic_year"]
        entries       = serializer.validated_data["results"]

        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = []
        updated = []
        errors  = []

        with transaction.atomic():
            for entry in entries:
                student_id = entry.get("student")
                try:
                    student = Profile.objects.get(pk=student_id, role="student")
                except Profile.DoesNotExist:
                    errors.append({"student": student_id, "error": "Student not found."})
                    continue

                result, was_created = Result.objects.update_or_create(
                    student=student,
                    course=course,
                    term=term,
                    academic_year=academic_year,
                    defaults={
                        "test1":       float(entry.get("test1", 0)),
                        "test2":       float(entry.get("test2", 0)),
                        "assignment":  float(entry.get("assignment", 0)),
                        "midterm":     float(entry.get("midterm", 0)),
                        "exam":        float(entry.get("exam", 0)),
                        "remark":      entry.get("remark", ""),
                        "entered_by":  profile,
                        "student_class": student.student_class or "",
                        "status":      "draft",
                    },
                )
                if was_created:
                    created.append(result.id)
                else:
                    updated.append(result.id)

        return Response({
            "detail": f"{len(created)} created, {len(updated)} updated, {len(errors)} errors.",
            "created": created,
            "updated": updated,
            "errors":  errors,
        })

    # ── Compute positions ─────────────────────────────────────────────────────

    @action(detail=False, methods=["post"])
    def compute_positions(self, request):
        """
        Admin triggers position computation for a class/term/year.
        Positions are computed per subject (position in subject)
        and stored on each Result.
        """
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can compute positions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all courses for this class
        courses = Course.objects.filter(student_class=student_class)
        updated = 0

        with transaction.atomic():
            for course in courses:
                results = Result.objects.filter(
                    course=course,
                    term=term,
                    academic_year=academic_year,
                    status__in=["reviewed", "published"],
                ).order_by("-total")

                for position, result in enumerate(results, start=1):
                    result.position = position
                    result.save(update_fields=["position"])
                    updated += 1

        return Response({
            "detail": f"Positions computed for {updated} results.",
            "student_class": student_class,
            "term": term,
            "academic_year": academic_year,
        })


# ── ReportCard ViewSet ────────────────────────────────────────────────────────

class ReportCardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only for students/parents.
    Admins can generate and publish report cards.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ReportCardSerializer

    def get_queryset(self):
        user    = self.request.user
        profile = getattr(user, "profile", None)
        if not profile:
            return ReportCard.objects.none()

        role = profile.role

        if role in ("admin", "super_admin", "school_admin"):
            qs = ReportCard.objects.all()
        elif role == "teacher":
            qs = ReportCard.objects.filter(
                student_class=getattr(profile, "student_class", "") or ""
            )
        elif role == "student":
            qs = ReportCard.objects.filter(student=profile, is_published=True)
        elif role == "parent":
            children = Profile.objects.filter(
                role="student", parent_email=user.email
            )
            qs = ReportCard.objects.filter(
                student__in=children, is_published=True
            )
        else:
            return ReportCard.objects.none()

        params = self.request.query_params
        if params.get("term"):
            qs = qs.filter(term=params["term"])
        if params.get("academic_year"):
            qs = qs.filter(academic_year=params["academic_year"])
        if params.get("student"):
            qs = qs.filter(student_id=params["student"])

        return qs.select_related("student__user")

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        Admin generates/regenerates report cards for a class/term/year.
        Computes: total_score, average, position_in_class from published results.
        """
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can generate report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")
        resumption    = request.data.get("resumption_date")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all students in this class with published results
        students = Profile.objects.filter(
            role="student",
            student_class=student_class,
        )

        generated = []

        with transaction.atomic():
            # Compute each student's total + average
            student_scores = []
            for student in students:
                results = Result.objects.filter(
                    student=student,
                    term=term,
                    academic_year=academic_year,
                    status="published",
                )
                if not results.exists():
                    continue

                total_score    = sum(r.total for r in results)
                total_subjects = results.count()
                average_score  = round(total_score / total_subjects, 2) if total_subjects else 0

                student_scores.append({
                    "student":        student,
                    "total_score":    total_score,
                    "total_subjects": total_subjects,
                    "average_score":  average_score,
                })

            # Sort by total_score descending to compute positions
            student_scores.sort(key=lambda x: x["total_score"], reverse=True)
            class_size = len(student_scores)

            for position, data in enumerate(student_scores, start=1):
                card, _ = ReportCard.objects.update_or_create(
                    student=data["student"],
                    term=term,
                    academic_year=academic_year,
                    defaults={
                        "student_class":    student_class,
                        "total_subjects":   data["total_subjects"],
                        "total_score":      data["total_score"],
                        "average_score":    data["average_score"],
                        "position_in_class": position,
                        "class_size":       class_size,
                        "resumption_date":  resumption,
                    },
                )
                generated.append(card.id)

        return Response({
            "detail": f"{len(generated)} report cards generated.",
            "student_class": student_class,
            "term":          term,
            "academic_year": academic_year,
        })

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Admin publishes a report card — student can now see it."""
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )
        card = self.get_object()
        card.publish(by_user=request.user)
        return Response({"detail": "Report card published."})

    @action(detail=False, methods=["post"])
    def publish_all(self, request):
        """Admin publishes ALL report cards for a class/term/year at once."""
        profile = getattr(request.user, "profile", None)
        if profile.role not in ("admin", "super_admin", "school_admin"):
            return Response(
                {"detail": "Only admins can publish report cards."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_class = request.data.get("student_class")
        term          = request.data.get("term")
        academic_year = request.data.get("academic_year")

        if not all([student_class, term, academic_year]):
            return Response(
                {"detail": "student_class, term, and academic_year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now     = timezone.now()
        updated = ReportCard.objects.filter(
            student_class=student_class,
            term=term,
            academic_year=academic_year,
            is_published=False,
        ).update(
            is_published=True,
            published_at=now,
            published_by=request.user,
        )

        return Response({"detail": f"{updated} report cards published."})