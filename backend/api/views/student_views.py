"""
backend/api/views/student_views.py

All endpoints consumed by the StudentDashboard frontend.

URL registration (add to urls.py):
    router.register("student/courses",     StudentCourseViewSet,     basename="student-courses")
    router.register("student/enrollments", StudentEnrollmentViewSet, basename="student-enrollments")
    path("student/dashboard/",   StudentDashboardView.as_view(),  name="student-dashboard"),
    path("student/chat/",        StudentChatView.as_view(),        name="student-chat"),
    path("student/chat/<int:pk>/", StudentChatDetailView.as_view(), name="student-chat-detail"),
    path("student/announcements/", AnnouncementListView.as_view(), name="student-announcements"),
"""

from django.db import models as django_models
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, serializers

from api.models import Profile, Course, Enrollment, Assignment, FeePayment
from api.models.chat import ChatMessage

User = get_user_model()

TERM_CHOICES = ['First Term', 'Second Term', 'Third Term']
ADD_DROP_LIMIT = 2


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_student_profile(user):
    try:
        p = user.profile
        if p.role != 'student':
            return None
        return p
    except Profile.DoesNotExist:
        return None


def current_academic_year():
    now = timezone.now()
    y = now.year
    return f"{y}/{y+1}" if now.month >= 9 else f"{y-1}/{y}"


def current_term():
    month = timezone.now().month
    if month in (9, 10, 11, 12, 1):
        return 'First Term'
    elif month in (2, 3, 4):
        return 'Second Term'
    return 'Third Term'


# ─── Serializers ──────────────────────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    instructor_id   = serializers.SerializerMethodField()
    is_enrolled     = serializers.SerializerMethodField()
    total_students  = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'department',
            'student_class', 'is_active',
            'instructor_name', 'instructor_id',
            'is_enrolled', 'total_students',
        ]

    def get_instructor_name(self, obj):
        if obj.instructor and obj.instructor.user:
            u = obj.instructor.user
            name = f"{u.first_name} {u.last_name}".strip()
            return name or u.username
        return None

    def get_instructor_id(self, obj):
        return obj.instructor.id if obj.instructor else None

    def get_is_enrolled(self, obj):
        student = self.context.get('student')
        if not student:
            return False
        return Enrollment.objects.filter(
            student=student, course=obj,
            status__in=['active', 'pending'],
        ).exists()

    def get_total_students(self, obj):
        return obj.enrollments.filter(status='active').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title      = serializers.CharField(source='course.title', read_only=True)
    course_department = serializers.CharField(source='course.department', read_only=True)
    instructor_name   = serializers.SerializerMethodField()
    add_drop_count    = serializers.IntegerField(read_only=True)
    drop_history      = serializers.JSONField(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_title', 'course_department',
            'academic_year', 'term', 'status',
            'enrolled_at', 'add_drop_count', 'drop_history',
            'instructor_name',
        ]

    def get_instructor_name(self, obj):
        instr = obj.course.instructor
        if instr and instr.user:
            name = f"{instr.user.first_name} {instr.user.last_name}".strip()
            return name or instr.user.username
        return None


class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'due_date', 'course', 'course_title', 'max_score']


class FeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = [
            'id', 'academic_year', 'term', 'total_amount',
            'amount_paid', 'balance', 'status', 'due_date', 'last_payment_date',
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name    = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    sender_role    = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_role',
            'recipient', 'recipient_name',
            'message', 'timestamp', 'is_read',
        ]
        read_only_fields = ['sender', 'timestamp']

    def _profile_name(self, user):
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.username

    def get_sender_name(self, obj):
        return self._profile_name(obj.sender)

    def get_recipient_name(self, obj):
        return self._profile_name(obj.recipient)

    def get_sender_role(self, obj):
        try:
            return obj.sender.profile.role
        except Exception:
            return None


class InstructorSerializer(serializers.ModelSerializer):
    """Thin serializer for showing a student's instructors."""
    full_name  = serializers.SerializerMethodField()
    username   = serializers.CharField(source='user.username', read_only=True)
    email      = serializers.CharField(source='user.email', read_only=True)
    course_titles = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'username', 'email', 'department',
                  'instructor_type', 'course_titles']

    def get_full_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name or obj.user.username

    def get_course_titles(self, obj):
        student = self.context.get('student')
        if not student:
            return []
        return list(
            Course.objects.filter(
                instructor=obj,
                enrollments__student=student,
                enrollments__status__in=['active', 'pending'],
            ).values_list('title', flat=True).distinct()
        )


# ─── Views ────────────────────────────────────────────────────────────────────

class StudentDashboardView(APIView):
    """
    GET /api/student/dashboard/
    Returns everything the student home screen needs in one call.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_student_profile(request.user)
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=403)

        year = current_academic_year()
        term = current_term()

        # Active enrollments
        enrollments = Enrollment.objects.filter(
            student=student,
            academic_year=year,
            term=term,
            status__in=['active', 'pending'],
        ).select_related('course', 'course__instructor', 'course__instructor__user')

        # Assignments for enrolled courses
        enrolled_course_ids = enrollments.values_list('course_id', flat=True)
        assignments = Assignment.objects.filter(
            course_id__in=enrolled_course_ids
        ).order_by('deadline')[:10]

        # Fee status for this year/term
        fees = FeePayment.objects.filter(
            student=student,
            academic_year=year,
            term=term,
        ).first()

        # Instructors: all instructors of courses the student is enrolled in
        instructor_ids = enrollments.values_list(
            'course__instructor_id', flat=True
        ).distinct()
        instructors = Profile.objects.filter(
            id__in=instructor_ids
        ).select_related('user')

        # Unread messages count
        unread_count = ChatMessage.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()

        # Add/drop info for current term
        add_drop_used = Enrollment.objects.filter(
            student=student,
            academic_year=year,
            term=term,
        ).aggregate(
            total=django_models.Sum('add_drop_count')
        )['total'] or 0

        return Response({
            'student': {
                'id':            student.id,
                'student_id':    student.student_id,
                'first_name':    request.user.first_name,
                'last_name':     request.user.last_name,
                'username':      request.user.username,
                'email':         request.user.email,
                'department':    student.department,
                'student_class': student.student_class,
                'bio':           student.bio,
                'phone':         student.phone,
            },
            'current_year':       year,
            'current_term':       term,
            'enrollments':        EnrollmentSerializer(enrollments, many=True).data,
            'assignments':        AssignmentSerializer(assignments, many=True).data,
            'fee_status':         FeeSerializer(fees).data if fees else None,
            'instructors':        InstructorSerializer(
                                    instructors, many=True,
                                    context={'student': student}
                                  ).data,
            'unread_messages':    unread_count,
            'add_drop_used':      add_drop_used,
            'add_drop_remaining': max(0, ADD_DROP_LIMIT - add_drop_used),
        })


class StudentCourseViewSet(ReadOnlyModelViewSet):
    """
    GET /api/student/courses/           → all courses in student's dept
    POST /api/student/courses/{id}/enroll/  → enroll (add)
    POST /api/student/courses/{id}/drop/    → drop
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CourseSerializer

    def get_queryset(self):
        student = get_student_profile(self.request.user)
        if not student:
            return Course.objects.none()
        return Course.objects.filter(
            department=student.department,
            is_active=True,
        ).select_related('instructor', 'instructor__user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['student'] = get_student_profile(self.request.user)
        return ctx

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        student = get_student_profile(request.user)
        if not student:
            return Response({'detail': 'Not a student.'}, status=403)

        course = self.get_object()
        year = current_academic_year()
        term = current_term()

        # Check add/drop limit for this term
        used = Enrollment.objects.filter(
            student=student, academic_year=year, term=term,
        ).aggregate(total=django_models.Sum('add_drop_count'))['total'] or 0

        if used >= ADD_DROP_LIMIT:
            return Response({
                'detail': f'Add/drop limit reached ({ADD_DROP_LIMIT} per term). '
                          f'You cannot add more courses this term.',
                'add_drop_used': used,
                'add_drop_limit': ADD_DROP_LIMIT,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Already enrolled?
        existing = Enrollment.objects.filter(
            student=student, course=course,
            academic_year=year, term=term,
        ).first()
        if existing:
            if existing.status == 'dropped':
                # Re-adding a previously dropped course counts as add/drop
                existing.status = 'active'
                existing.add_drop_count = (existing.add_drop_count or 0) + 1
                existing.drop_history = (existing.drop_history or []) + [{
                    'action': 'add',
                    'course_id': course.id,
                    'course_title': course.title,
                    'timestamp': timezone.now().isoformat(),
                }]
                existing.save()
                return Response({'detail': f'Re-enrolled in {course.title}', 'status': 'added'})
            return Response({'detail': 'Already enrolled in this course.'}, status=400)

        enrollment = Enrollment.objects.create(
            student=student,
            course=course,
            academic_year=year,
            term=term,
            status='active',
            enrolled_at=timezone.now(),
            add_drop_count=0,
            drop_history=[{
                'action': 'add',
                'course_id': course.id,
                'course_title': course.title,
                'timestamp': timezone.now().isoformat(),
            }],
        )
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def drop(self, request, pk=None):
        student = get_student_profile(request.user)
        if not student:
            return Response({'detail': 'Not a student.'}, status=403)

        course = self.get_object()
        year = current_academic_year()
        term = current_term()

        enrollment = Enrollment.objects.filter(
            student=student, course=course,
            academic_year=year, term=term,
            status__in=['active', 'pending'],
        ).first()

        if not enrollment:
            return Response({'detail': 'Not enrolled in this course.'}, status=400)

        # Check limit
        used = Enrollment.objects.filter(
            student=student, academic_year=year, term=term,
        ).aggregate(total=django_models.Sum('add_drop_count'))['total'] or 0

        if used >= ADD_DROP_LIMIT:
            return Response({
                'detail': f'Add/drop limit reached ({ADD_DROP_LIMIT} per term). '
                          f'Contact your instructor to make changes.',
                'add_drop_used': used,
                'add_drop_limit': ADD_DROP_LIMIT,
            }, status=status.HTTP_400_BAD_REQUEST)

        enrollment.status = 'dropped'
        enrollment.add_drop_count = (enrollment.add_drop_count or 0) + 1
        enrollment.drop_history = (enrollment.drop_history or []) + [{
            'action': 'drop',
            'course_id': course.id,
            'course_title': course.title,
            'timestamp': timezone.now().isoformat(),
        }]
        enrollment.save()

        return Response({'detail': f'Dropped {course.title}', 'status': 'dropped'})


class StudentEnrollmentViewSet(ReadOnlyModelViewSet):
    """
    GET /api/student/enrollments/  → student's full enrollment history
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        student = get_student_profile(self.request.user)
        if not student:
            return Enrollment.objects.none()
        return Enrollment.objects.filter(
            student=student,
        ).select_related('course', 'course__instructor', 'course__instructor__user').order_by(
            '-academic_year', 'term', 'course__title'
        )


class StudentChatView(APIView):
    """
    GET  /api/student/chat/?with={user_id}  → message thread
    POST /api/student/chat/                 → send message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with_id = request.query_params.get('with')
        if not with_id:
            # Return list of unique conversations
            sent = ChatMessage.objects.filter(
                sender=request.user
            ).values_list('recipient_id', flat=True).distinct()
            received = ChatMessage.objects.filter(
                recipient=request.user
            ).values_list('sender_id', flat=True).distinct()
            user_ids = set(list(sent) + list(received))
            users = User.objects.filter(id__in=user_ids)
            result = []
            for u in users:
                last_msg = ChatMessage.objects.filter(
                    django_models.Q(sender=request.user, recipient=u) |
                    django_models.Q(sender=u, recipient=request.user)
                ).first()
                unread = ChatMessage.objects.filter(
                    sender=u, recipient=request.user, is_read=False
                ).count()
                try:
                    role = u.profile.role
                    name = f"{u.first_name} {u.last_name}".strip() or u.username
                except Exception:
                    role, name = None, u.username
                result.append({
                    'user_id':     u.id,
                    'name':        name,
                    'role':        role,
                    'last_message': last_msg.message if last_msg else None,
                    'last_time':    last_msg.timestamp if last_msg else None,
                    'unread':       unread,
                })
            return Response(result)

        # Thread with specific user
        try:
            other = User.objects.get(pk=with_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        messages = ChatMessage.objects.filter(
            django_models.Q(sender=request.user, recipient=other) |
            django_models.Q(sender=other, recipient=request.user)
        ).order_by('timestamp')

        # Mark as read
        messages.filter(recipient=request.user, is_read=False).update(is_read=True)

        return Response(ChatMessageSerializer(messages, many=True).data)

    def post(self, request):
        recipient_id = request.data.get('recipient')
        message_text = request.data.get('message', '').strip()
        if not recipient_id or not message_text:
            return Response({'detail': 'recipient and message are required.'}, status=400)
        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            return Response({'detail': 'Recipient not found.'}, status=404)

        msg = ChatMessage.objects.create(
            sender=request.user,
            recipient=recipient,
            message=message_text,
        )
        return Response(ChatMessageSerializer(msg).data, status=201)


class AnnouncementListView(APIView):
    """
    GET /api/student/announcements/
    Returns recent assignments as announcements + placeholder news.
    Extend with a real Announcement model when ready.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_student_profile(request.user)
        if not student:
            return Response([])

        enrolled_ids = Enrollment.objects.filter(
            student=student, status__in=['active', 'pending']
        ).values_list('course_id', flat=True)

        assignments = Assignment.objects.filter(
            course_id__in=enrolled_ids
        ).order_by('-id')[:5]

        announcements = [
            {
                'id':      f'assign-{a.id}',
                'type':    'assignment',
                'title':   f'New Assignment: {a.title}',
                'body':    a.description or '',
                'course':  a.course.title,
                'due':     a.deadline,
                'created': a.id,
            }
            for a in assignments
        ]
        return Response(announcements)