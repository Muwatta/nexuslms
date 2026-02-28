from rest_framework import serializers
from api.models import Quiz, QuizSubmission


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = "__all__"


class QuizSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmission
        fields = "__all__"
        read_only_fields = ("published",)
