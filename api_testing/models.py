from django.db import models
from django.contrib.auth.models import User

# Profile model (already exists)
class Profile(models.Model):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    ]

    CLASS_CHOICES = [
        ("JSS1", "JSS 1"),
        ("JSS2", "JSS 2"),
        ("JSS3", "JSS 3"),
        ("SS1", "SS 1"),
        ("SS2", "SS 2"),
        ("SS3", "SS 3"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_class = models.CharField(max_length=10, choices=CLASS_CHOICES, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

# Courses
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True,
                                   limit_choices_to={'role': 'instructor'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# Enrollment: link students to courses
class Enrollment(models.Model):
    student = models.ForeignKey(Profile, on_delete=models.CASCADE,
                                limit_choices_to={'role': 'student'})
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress = models.FloatField(default=0.0)  # percentage 0-100

    class Meta:
        unique_together = ('student', 'course')  # no duplicates

    def __str__(self):
        return f"{self.student.user.username} -> {self.course.title}"

# Quizzes
class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    total_marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.course.title})"

# Quiz submission
class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(Profile, on_delete=models.CASCADE,
                                limit_choices_to={'role': 'student'})
    score = models.FloatField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('quiz', 'student')

    def __str__(self):
        return f"{self.student.user.username} - {self.quiz.title}"

class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    deadline = models.DateTimeField()

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student = models.ForeignKey(Profile, on_delete=models.CASCADE)
    file = models.FileField(upload_to="submissions/")
    score = models.IntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)


class Payment(models.Model):
    student = models.ForeignKey(Profile, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.user.username} - {self.course.title} ({self.status})"
