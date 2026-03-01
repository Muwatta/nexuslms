from .core import ProfileViewSet, RegisterView
from .course import CourseViewSet
from .course import PracticeQuestionViewSet
from .enrollment import EnrollmentViewSet
from .quiz import QuizViewSet, QuizSubmissionViewSet, QuestionViewSet
from .assignment import AssignmentViewSet, AssignmentSubmissionViewSet
from .payment import PaymentViewSet
from .achievement import AchievementViewSet, ProjectViewSet, MilestoneViewSet
from .analytics import course_analytics, student_analytics
from .ai import AIView
