from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Quiz, QuizSubmission
from api.serializers import QuizSerializer, QuizSubmissionSerializer
from .filters import QuizFilter


class QuizViewSet(ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = QuizFilter


class QuizSubmissionViewSet(ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    # only teachers or admins can publish and view unpublished
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role in ["teacher", "admin"]:
            return qs
        # students and parents see only published
        return qs.filter(published=True)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        submission = self.get_object()
        if request.user.role not in ["teacher", "admin"]:
            return Response({"detail": "Not allowed"}, status=403)
        submission.published = True
        submission.save()
        return Response({"status": "published"})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def pdf(self, request, pk=None):
        # simple PDF output using reportlab
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        sub = self.get_object()
        if not sub.published and request.user.role not in ["teacher", "admin"]:
            return Response({"detail": "Not available"}, status=403)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="submission_{sub.id}.pdf"'
        p = canvas.Canvas(response)
        p.drawString(100, 800, f"Quiz: {sub.quiz.title}")
        p.drawString(100, 780, f"Student: {sub.student.user.username}")
        p.drawString(100, 760, f"Score: {sub.score}")
        p.showPage()
        p.save()
        return response
