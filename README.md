# NexusLMS

🚧 **Work in Progress** — Backend API is production-ready with comprehensive integration test coverage (8/8 passing). Frontend React application under active development.

---

## Overview

NexusLMS is a modern Learning Management System designed for scalable course delivery, secure assessments, and instructor-student workflows.

The platform focuses on robust backend architecture, permission-aware APIs, and reliable assessment and payment flows suitable for real educational environments.

---

## Current Status

| Component               | Status             | Notes                                                                              |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| **Backend API**         | ✅ Production-ready | JWT authentication, role-based permissions, auto-graded quizzes, PDF results       |
| **Database Models**     | ✅ Complete         | Users, profiles, courses, enrollments, assignments, quizzes, submissions, payments |
| **API Documentation**   | ✅ Available        | OpenAPI/Swagger at `/api/schema/`                                                  |
| **Frontend (React)**    | 🔄 In Progress     | Core pages implemented, UI refinement ongoing                                      |
| **Payment Integration** | ✅ Integrated       | Paystack with webhook verification                                                 |
| **Deployment**          | ⏳ Planned          | Dockerized backend, PostgreSQL migration ready                                     |

---

## Architecture

Backend follows a layered Django REST architecture:

* Domain models encapsulate core LMS entities
* Serializers handle validation and data mapping
* Views manage orchestration and permissions
* Business rules enforced in services and view logic
* Integration tests validate API behavior end-to-end

Key design priorities:

* Explicit permission boundaries
* Testable business logic
* Stable API contracts for SPA consumption
* External service isolation (payments, PDF)

---

## Core Features

* JWT authentication with role-based access control
* Course creation and enrollment workflows
* Auto-graded quizzes with instructor publish control
* Secure PDF result generation
* Payment tracking with Paystack integration
* Analytics endpoints for instructors and students
* Comprehensive integration test coverage

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

* Frontend assessment workflows completion
* Instructor grading dashboard
* Course content delivery modules
* Containerized deployment pipeline
* Production hosting configuration

---

## Contributions

Issues and pull requests are welcome, particularly around:

* LMS domain modeling
* API design and permissions
* Testing strategy
* Frontend integration

---

## License

MIT License — free to use and adapt.

---

## Contact

**Abdullahi Musliudeen**
LinkedIn: [https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/](https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/)
Email: [abdullahmusliudeen@gmail.com](mailto:abdullahmusliudeen@gmail.com)

