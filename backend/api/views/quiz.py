from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from api.models import Quiz, QuizSubmission, Question
from api.serializers import QuizSerializer, QuizSubmissionSerializer, QuestionSerializer
from api.filters import QuizFilter


class QuizViewSet(ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = QuizFilter


class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'profile', None) and user.profile.role
        if role not in ["instructor", "admin"]:
            raise PermissionDenied("Only instructors can add questions")
        serializer.save()


class QuizSubmissionViewSet(ModelViewSet):
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Auto-grade submission based on answers"""
        user_profile = self.request.user.profile
        
        # Only students can submit
        if user_profile.role != 'student':
            raise ValidationError("Only students can submit quizzes")
        
        quiz = serializer.validated_data.get('quiz')
        answers = serializer.validated_data.get('answers', [])
        
        # Check if already submitted
        if QuizSubmission.objects.filter(student=user_profile, quiz=quiz).exists():
            raise ValidationError("Already submitted this quiz")
        
        # Calculate score
        score = self.calculate_score(quiz, answers)
        
        serializer.save(
            student=user_profile,
            score=score,
            published=False
        )
    
    def calculate_score(self, quiz, answers):
        """Calculate score from answers"""
        score = 0
        questions = {q.id: q for q in Question.objects.filter(quiz=quiz)}
        
        for answer in answers:
            qid = answer.get('question_id')
            selected = answer.get('selected_option', '').upper()
            
            if qid in questions:
                question = questions[qid]
                if selected == question.correct_option:
                    score += question.marks
        
        return score

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, 'profile', None) and user.profile.role
        if role in ["instructor", "admin"]:
            return qs
        return qs.filter(published=True)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        submission = self.get_object()
        role = getattr(request.user, 'profile', None) and request.user.profile.role
        if role not in ["instructor", "admin"]:
            return Response({"detail": "Not allowed"}, status=403)
        submission.published = True
        submission.save()
        return Response({"status": "published"})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def pdf(self, request, pk=None):
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        
        sub = self.get_object()
        role = getattr(request.user, 'profile', None) and request.user.profile.role
        if not sub.published and role not in ["instructor", "admin"]:
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