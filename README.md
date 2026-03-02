# NexusLMS

🚧 **Work in Progress** — Backend API is production-ready with comprehensive integration test coverage (8/8 passing). Frontend React application under active development.

---

## Overview

NexusLMS is a modern Learning Management System designed for scalable course delivery, secure assessments, and instructor-student workflows.

The platform focuses on robust backend architecture, permission-aware APIs, and reliable assessment and payment flows suitable for real educational environments.

---

## Current Status

| Component               | Status              | Notes                                                                                          |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| **Backend API**         | ✅ Production-ready | JWT auth, role-based permissions (including parents), auto-graded & timed quizzes, PDF results |
| **Database Models**     | ✅ Complete         | Users, profiles, courses, enrollments, assignments, quizzes, submissions, payments             |
| **API Documentation**   | ✅ Available        | OpenAPI/Swagger at `/api/schema/`                                                              |
| **Frontend (React)**    | 🔄 In Progress      | Core pages implemented, UI refinement ongoing                                                  |
| **Payment Integration** | ✅ Integrated       | Paystack with webhook verification                                                             |
| **Deployment**          | ⏳ Planned          | Dockerized backend, PostgreSQL migration ready                                                 |

---

## Architecture

Backend follows a layered Django REST architecture:

- Domain models encapsulate core LMS entities
- Serializers handle validation and data mapping
- Views manage orchestration and permissions
- Business rules enforced in services and view logic
- Integration tests validate API behavior end-to-end

Key design priorities:

- Explicit permission boundaries
- Testable business logic
- Stable API contracts for SPA consumption
- External service isolation (payments, PDF)

---

## Design Philosophy & Vision

### Core Philosophy

"An LMS should be invisible — learning happens when technology gets out of the way."

### User Hierarchy & Permissions

| Role         | Permissions       | Primary Actions                          |
| ------------ | ----------------- | ---------------------------------------- |
| Super Admin  | System-wide       | Manage schools, billing, global settings |
| School Admin | Institution-wide  | Manage instructors, courses, reports     |
| Instructor   | Course-wide       | Create content, grade, message students  |
| Student      | Enrollment-only   | Learn, submit, track progress            |
| Parent       | View-only (child) | Monitor progress, receive reports        |

> See [backend/docs/permission_groups.md](backend/docs/permission_groups.md) for a breakdown of Django
> **Groups** used by the LMS and which human roles belong in each bucket.

### Module Architecture

```
┌─────────────────────────────────────────┐
│           FRONTEND (React/Vue)          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Student │ │Instructor│ │  Admin   │  │
│  │  Portal │ │ Dashboard│ │  Panel   │  │
│  └─────────┘ └─────────┘ └──────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           BACKEND (Django)              │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │  Core   │ │ Content │ │ Analytics│  │
│  │  Auth   │ │ Mgmt    │ │  Engine  │  │
│  └─────────┘ └─────────┘ └──────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Payments│ │Notifications│ │ Reports │ │
│  │(Paystack)│ │(WebSockets)│ │(PDF/Excel)││
│  └─────────┘ └─────────┘ └──────────┘  │
└─────────────────────────────────────────┘
```

### Critical Features by Stakeholder

#### For Students

| Feature            | Why It Matters                        |
| ------------------ | ------------------------------------- |
| Progress Tracking  | Visual % completion, gamification     |
| Mobile-First       | 70% access via phones in many regions |
| Offline Capability | Download videos, sync when online     |
| Peer Interaction   | Discussion forums, group projects     |
| Instant Feedback   | Auto-grading quizzes, rubrics         |

#### For Instructors

| Feature             | Implementation                        |
| ------------------- | ------------------------------------- |
| Drag-Drop Content   | React-DnD + S3 uploads                |
| Rich Text + LaTeX   | TipTap/Quill editor                   |
| Bulk Operations     | CSV import grades, mass message       |
| Analytics Dashboard | Chart.js: completion rates, drop-offs |
| AI Assistance       | Auto-generate quizzes, grade essays   |

#### For Admins

| Feature            | Tech Stack                        |
| ------------------ | --------------------------------- |
| Enrollment Reports | Pandas + Excel export             |
| Financial Tracking | Paystack webhooks, reconciliation |
| Audit Logs         | Who changed what, when            |
| Multi-tenancy      | Separate data per school          |
| Compliance         | GDPR deletion, data export        |

### Technical Decisions

| Decision          | Rationale                                         |
| ----------------- | ------------------------------------------------- |
| PostgreSQL        | JSON fields for flexible content, ACID for grades |
| Redis             | Session cache, real-time leaderboards             |
| Celery + RabbitMQ | Async video processing, email digests             |
| AWS S3/CloudFront | Video streaming, CDN for global speed             |
| WebSockets        | Live classes, instant notifications               |
| PWA               | Installable app, offline service workers          |

### Data Model (Simplified)

```
User (Django auth)
└── Profile (role, school, avatar)
    ├── Student → Enrollment → Course → Content → Progress
    ├── Instructor → Course (created) → Assignment → Submission → Grade
    └── Admin → School → Billing → Reports

Course
├── Module (ordered)
│   ├── Lesson (video, text, quiz)
│   ├── Assignment (file upload, rubric)
│   └── Quiz (questions, auto-grade)
└── Enrollment (student, status, completion %)

Notification
├── Type: grade_posted, deadline_approaching, announcement
├── Channel: in-app, email, SMS, push
└── Read status + timestamps
```

### Security Checklist

| Layer    | Implementation                                              |
| -------- | ----------------------------------------------------------- |
| Auth     | JWT short-lived (15min), refresh rotation, HttpOnly cookies |
| Content  | Signed URLs for videos (expire after 1 hour)                |
| Grades   | Immutable audit trail, who changed what                     |
| Privacy  | FERPA/GDPR: student data encrypted at rest                  |
| Payments | PCI compliance via Paystack (never touch card data)         |

### My LMS in Action

**Scenario: New semester starts**

1. Admin uploads CSV of 500 students → Auto-create accounts → Send welcome emails
2. Instructor drags 12 modules into course → Sets release schedule (drip content)
3. Student logs in → Sees personalized dashboard → Clicks "Continue: Module 3, Lesson 2"
4. System tracks video watch % → Auto-pauses at 90% → Quiz unlocks
5. Student submits assignment → AI checks plagiarism → Instructor grades with rubric
6. Parent gets weekly email: "Jamila completed 4/5 assignments this week"
7. Admin runs report: "Course completion rate: 78% (up from 62% last term)"

### What We'd Build Next

| Phase | Feature                             | Business Value             |
| ----- | ----------------------------------- | -------------------------- |
| MVP   | Courses, enrollments, submissions   | Validate demand            |
| V2    | Quizzes, auto-grading, analytics    | Reduce instructor workload |
| V3    | Live classes (WebRTC), mobile app   | Higher engagement          |
| V4    | AI tutor, predictive dropout alerts | Personalized learning      |

---

---

## Core Features

- JWT authentication with role-based access control
- Course creation and enrollment workflows
- Auto-graded quizzes with question ordering, optional timing, and instructor publish control
- Secure PDF result generation
- Payment tracking with Paystack integration
- Analytics endpoints for instructors and students
- Comprehensive integration test coverage

---

## Engineering Considerations

Several production concerns shaped implementation:

**Authentication alignment**
SPA authentication requires token-based flows across backend, frontend, and tests.

**Authorization semantics**
List endpoints filter inaccessible objects (404).
Detail endpoints enforce object permissions (403).

**Pagination contracts**
DRF paginated responses require normalization at the frontend boundary.

**Assessment integrity**
Quiz submissions enforce duplicate prevention and deterministic scoring.

**External service isolation**
Payments and PDF generation are mocked in tests to ensure deterministic execution.

---

## API Documentation

Interactive schema available at:

```
/api/schema/
```

---

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Environment variables:

```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
PAYSTACK_SECRET_KEY=your-paystack-key
```

---

## Testing

Integration tests cover authentication, permissions, assessments, analytics, and payments.

```bash
python manage.py test
```

---

## Roadmap

- Frontend assessment workflows completion
- Instructor grading dashboard
- Course content delivery modules
- Containerized deployment pipeline
- Production hosting configuration

---

## Contributions

Issues and pull requests are welcome, particularly around:

- LMS domain modeling
- API design and permissions
- Testing strategy
- Frontend integration

---

## License

MIT License — free to use and adapt.

---

## Contact

**Abdullahi Musliudeen**
LinkedIn: [https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/](https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/)
Email: [abdullahmusliudeen@gmail.com](mailto:abdullahmusliudeen@gmail.com)
