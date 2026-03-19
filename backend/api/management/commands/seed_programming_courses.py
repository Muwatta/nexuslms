# backend/api/management/commands/seed_programming_courses.py


from django.core.management.base import BaseCommand
from django.db import transaction



TRACK_COURSES = {

    "ai_ml": {
        "label": "AI & Machine Learning",
        "levels": {
            "beginner": [
                ("intro_ai",            "Introduction to Artificial Intelligence"),
                ("python_basics",       "Python Programming Basics"),
                ("math_for_ai",         "Mathematics for AI (Algebra & Statistics)"),
                ("data_concepts",       "Understanding Data"),
                ("problem_solving",     "Problem Solving and Logic"),
            ],
            "junior": [
                ("python_intermediate", "Intermediate Python"),
                ("numpy_pandas",        "NumPy and Pandas"),
                ("data_visualization",  "Data Visualization with Matplotlib"),
                ("intro_ml",            "Introduction to Machine Learning"),
                ("supervised_learning", "Supervised Learning"),
                ("unsupervised_learning","Unsupervised Learning"),
            ],
            "intermediate": [
                ("deep_learning",       "Deep Learning Fundamentals"),
                ("neural_networks",     "Neural Networks"),
                ("nlp_basics",          "Natural Language Processing Basics"),
                ("computer_vision",     "Computer Vision"),
                ("model_evaluation",    "Model Evaluation and Tuning"),
                ("scikit_learn",        "Scikit-Learn in Practice"),
            ],
            "advanced": [
                ("tensorflow_pytorch",  "TensorFlow and PyTorch"),
                ("llm_fundamentals",    "Large Language Models (LLMs)"),
                ("mlops",               "MLOps and Model Deployment"),
                ("ai_ethics",           "AI Ethics and Responsible AI"),
                ("ai_capstone",         "AI Capstone Project"),
            ],
        },
    },

    # ── Data Science ─────────────────────────────────────────────────────────
    "data_science": {
        "label": "Data Science",
        "levels": {
            "beginner": [
                ("intro_data_science",  "Introduction to Data Science"),
                ("python_basics",       "Python for Data Science"),
                ("statistics_basics",   "Statistics Fundamentals"),
                ("excel_data",          "Data Analysis with Excel"),
                ("data_literacy",       "Data Literacy and Thinking"),
            ],
            "junior": [
                ("numpy_pandas",        "NumPy and Pandas"),
                ("sql_basics",          "SQL for Data Analysis"),
                ("data_cleaning",       "Data Cleaning and Wrangling"),
                ("data_visualization",  "Data Visualization"),
                ("exploratory_analysis","Exploratory Data Analysis (EDA)"),
            ],
            "intermediate": [
                ("statistical_modeling","Statistical Modeling"),
                ("ml_for_ds",           "Machine Learning for Data Scientists"),
                ("databases_advanced",  "Advanced Databases"),
                ("bi_tools",            "Business Intelligence Tools"),
                ("storytelling_data",   "Storytelling with Data"),
                ("feature_engineering", "Feature Engineering"),
            ],
            "advanced": [
                ("big_data",            "Big Data Technologies"),
                ("data_pipelines",      "Data Pipelines and ETL"),
                ("cloud_data",          "Cloud Data Platforms"),
                ("real_time_analytics", "Real-Time Analytics"),
                ("ds_capstone",         "Data Science Capstone Project"),
            ],
        },
    },

    # ── Scratch (Kids / Beginners) ────────────────────────────────────────────
    "scratch": {
        "label": "Scratch Programming",
        "levels": {
            "beginner": [
                ("intro_scratch",       "Introduction to Scratch"),
                ("scratch_interface",   "Scratch Interface and Sprites"),
                ("motion_blocks",       "Motion and Animation Blocks"),
                ("sound_music",         "Sound and Music in Scratch"),
                ("basic_games",         "Building Basic Games"),
            ],
            "junior": [
                ("variables_scratch",   "Variables and Data in Scratch"),
                ("loops_conditions",    "Loops and Conditions"),
                ("interactive_stories", "Interactive Stories"),
                ("scratch_art",         "Drawing and Art with Scratch"),
                ("mini_projects",       "Mini Project Challenges"),
            ],
            "intermediate": [
                ("advanced_games",      "Advanced Game Design"),
                ("clones_events",       "Clones and Events"),
                ("scratch_physics",     "Physics Simulations in Scratch"),
                ("collaborative_proj",  "Collaborative Scratch Projects"),
                ("scratch_to_python",   "Transition: Scratch to Python"),
            ],
            "advanced": [
                ("game_design",         "Full Game Design Project"),
                ("animation_project",   "Animation and Storytelling Project"),
                ("scratch_portfolio",   "Scratch Portfolio Building"),
                ("showcase_prep",       "Showcase and Presentation Skills"),
            ],
        },
    },

    # ── Frontend Development ─────────────────────────────────────────────────
    "frontend": {
        "label": "Frontend Development",
        "levels": {
            "beginner": [
                ("html_fundamentals",   "HTML Fundamentals"),
                ("css_fundamentals",    "CSS Fundamentals"),
                ("responsive_design",   "Responsive Design"),
                ("javascript_basics",   "JavaScript Basics"),
                ("git_github",          "Git and GitHub"),
            ],
            "junior": [
                ("javascript_es6",      "JavaScript ES6+"),
                ("dom_manipulation",    "DOM Manipulation"),
                ("flexbox_grid",        "Flexbox and CSS Grid"),
                ("forms_validation",    "Forms and Validation"),
                ("web_accessibility",   "Web Accessibility"),
                ("debugging_tools",     "Browser DevTools and Debugging"),
            ],
            "intermediate": [
                ("react_fundamentals",  "React Fundamentals"),
                ("react_hooks",         "React Hooks and State Management"),
                ("typescript_basics",   "TypeScript Basics"),
                ("api_integration",     "API Integration and Fetch"),
                ("testing_frontend",    "Frontend Testing"),
                ("performance_web",     "Web Performance Optimization"),
            ],
            "advanced": [
                ("nextjs",              "Next.js and SSR"),
                ("state_management",    "Advanced State Management (Redux/Zustand)"),
                ("ui_architecture",     "UI Architecture and Design Systems"),
                ("pwa",                 "Progressive Web Apps (PWA)"),
                ("frontend_capstone",   "Frontend Capstone Project"),
            ],
        },
    },

    # ── Backend Development ──────────────────────────────────────────────────
    "backend": {
        "label": "Backend Development",
        "levels": {
            "beginner": [
                ("python_basics",       "Python Programming Basics"),
                ("intro_backend",       "Introduction to Backend Development"),
                ("cli_linux",           "Command Line and Linux Basics"),
                ("git_github",          "Git and GitHub"),
                ("http_basics",         "HTTP and the Web"),
            ],
            "junior": [
                ("python_intermediate", "Intermediate Python"),
                ("sql_basics",          "SQL and Relational Databases"),
                ("django_intro",        "Introduction to Django"),
                ("rest_api_basics",     "REST API Basics"),
                ("authentication",      "Authentication and Sessions"),
                ("django_orm",          "Django ORM"),
            ],
            "intermediate": [
                ("django_rest_framework","Django REST Framework (DRF)"),
                ("jwt_auth",            "JWT Authentication"),
                ("postgresql_advanced", "PostgreSQL Advanced"),
                ("caching",             "Caching with Redis"),
                ("testing_backend",     "Backend Testing"),
                ("api_security",        "API Security Best Practices"),
            ],
            "advanced": [
                ("docker",              "Docker and Containerization"),
                ("ci_cd",               "CI/CD Pipelines"),
                ("microservices",       "Microservices Architecture"),
                ("cloud_deployment",    "Cloud Deployment (AWS/Azure)"),
                ("backend_capstone",    "Backend Capstone Project"),
            ],
        },
    },

    # ── AI Automation ────────────────────────────────────────────────────────
    "ai_automation": {
        "label": "AI Automation",
        "levels": {
            "beginner": [
                ("intro_automation",    "Introduction to Automation"),
                ("python_basics",       "Python for Automation"),
                ("no_code_tools",       "No-Code Automation Tools"),
                ("zapier_make",         "Zapier and Make (Integromat)"),
                ("workflow_design",     "Workflow Design Thinking"),
            ],
            "junior": [
                ("python_scripting",    "Python Scripting and Task Automation"),
                ("web_scraping",        "Web Scraping with BeautifulSoup"),
                ("api_automation",      "API-Based Automation"),
                ("file_automation",     "File and Data Automation"),
                ("intro_llm_apis",      "Using LLM APIs (OpenAI/Claude)"),
                ("prompt_engineering",  "Prompt Engineering"),
            ],
            "intermediate": [
                ("langchain_basics",    "LangChain Fundamentals"),
                ("ai_agents",           "Building AI Agents"),
                ("rag_systems",         "Retrieval-Augmented Generation (RAG)"),
                ("automation_testing",  "Testing Automated Systems"),
                ("n8n_advanced",        "Advanced n8n Workflows"),
                ("voice_ai",            "Voice AI Integration"),
            ],
            "advanced": [
                ("custom_ai_agents",    "Custom AI Agent Development"),
                ("ai_pipelines",        "AI Automation Pipelines"),
                ("multi_agent_systems", "Multi-Agent Systems"),
                ("enterprise_automation","Enterprise Automation Solutions"),
                ("automation_capstone", "AI Automation Capstone Project"),
            ],
        },
    },
}

LEVEL_LABELS = {
    "beginner":     "Beginner",
    "junior":       "Junior Developer",
    "intermediate": "Intermediate",
    "advanced":     "Advanced",
}

# student_class code = track_level
def class_code(track: str, level: str) -> str:
    return f"{track}_{level}"


class Command(BaseCommand):
    help = "Seed all Programming school courses (6 tracks × 4 levels)"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument(
            "--track",
            type=str,
            default=None,
            help="Only seed a specific track (e.g. frontend)",
        )

    def handle(self, *args, **options):
        from api.models import Course

        dry_run    = options["dry_run"]
        only_track = options["track"]

        self.stdout.write(self.style.WARNING(
            f"{'[DRY RUN] ' if dry_run else ''}Seeding programming school courses..."
        ))

        total_created = 0
        total_skipped = 0

        tracks = TRACK_COURSES.items()
        if only_track:
            tracks = [(only_track, TRACK_COURSES[only_track])]

        for track_code, track_data in tracks:
            track_label = track_data["label"]
            self.stdout.write(f"\n  📚 {track_label}")

            for level_code, courses in track_data["levels"].items():
                student_class = class_code(track_code, level_code)
                level_label   = LEVEL_LABELS[level_code]
                created = skipped = 0

                for course_code, course_name in courses:
                    title = f"{course_name}"
                    exists = Course.objects.filter(
                        department="programming",
                        student_class=student_class,
                        title=title,
                    ).exists()

                    if exists:
                        skipped += 1
                    else:
                        if not dry_run:
                            with transaction.atomic():
                                Course.objects.create(
                                    title=title,
                                    description=(
                                        f"{course_name} | {track_label} — "
                                        f"{level_label} | Programming Department"
                                    ),
                                    department="programming",
                                    student_class=student_class,
                                    is_active=True,
                                )
                        created += 1

                self.stdout.write(
                    f"    {level_label}: +{created} created, {skipped} already exist"
                )
                total_created += created
                total_skipped += skipped

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'[DRY RUN] ' if dry_run else ''}Done. "
            f"{total_created} courses created, {total_skipped} already existed."
        ))