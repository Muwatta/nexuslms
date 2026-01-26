# NexusLMS API

A Django REST Framework (DRF) API for a **Learning Management System (LMS)** with **JWT authentication**, **role-based access**, and full LMS features including **courses, enrollments, assignments, quizzes, submissions, payments, and analytics**.

---

## Features

* **JWT Authentication** (login, refresh token)
* **Role-based permissions**: `student`, `instructor`, `admin`
* **Profile system** linked to Django User
* **Courses**: CRUD operations for instructors/admins
* **Enrollments**: Students can enroll in courses
* **Assignments**: Students submit assignments; instructors can grade them
* **Quizzes**: Create and manage quizzes per course
* **Quiz Submissions**: Students submit answers, instructors view scores
* **Analytics**: Average progress and scores per course and per student
* **Payments**: Track course payments per student
* **Pagination and Filters**: Courses, quizzes, enrollments
* **Admin Interface**: Fully configured with search, list display, and filters

---

## Tech Stack

* Python 3.9+
* Django 4.2
* Django REST Framework
* Django Filter
* SimpleJWT (JWT authentication)
* SQLite (default, can switch to PostgreSQL for production)
* Docker (for deployment)

---

## Setup

```bash
# Clone the repository
git clone https://github.com/Muwatta/nexuslms.git
cd nexuslms

# Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

## Authentication

* **Obtain JWT token**:

```http
POST /api/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "yourpassword"
}
```

* **Refresh JWT token**:

```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

* Include the token in headers for all API requests:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

| Resource               | Method    | Endpoint                             | Description                                                    |
| ---------------------- | --------- | ------------------------------------ | -------------------------------------------------------------- |
| Profiles               | GET       | `/api/profiles/`                     | List profiles (filtered by role)                               |
| Profiles               | GET       | `/api/profiles/<id>/`                | Profile detail                                                 |
| Courses                | GET       | `/api/courses/`                      | List courses                                                   |
| Courses                | POST      | `/api/courses/`                      | Create course (instructor/admin only)                          |
| Courses                | PUT/PATCH | `/api/courses/<id>/`                 | Update course                                                  |
| Courses                | DELETE    | `/api/courses/<id>/`                 | Delete course                                                  |
| Enrollments            | GET       | `/api/enrollments/`                  | List enrollments (filtered by role)                            |
| Enrollments            | POST      | `/api/enrollments/enroll/`           | Enroll student in course                                       |
| Assignments            | GET       | `/api/assignments/`                  | List assignments per course                                    |
| Assignments            | POST      | `/api/assignments/`                  | Create assignment (instructor/admin only)                      |
| Assignment Submissions | GET       | `/api/submissions/assignments/`      | List assignment submissions (filtered by role)                 |
| Assignment Submissions | POST      | `/api/submissions/assignments/`      | Submit assignment                                              |
| Quizzes                | GET       | `/api/quizzes/`                      | List quizzes, filter by course                                 |
| Quizzes                | POST      | `/api/quizzes/`                      | Create quiz                                                    |
| Quiz Submissions       | GET       | `/api/submissions/`                  | List quiz submissions (filtered by role)                       |
| Quiz Submissions       | POST      | `/api/submissions/`                  | Submit quiz answers                                            |
| Payments               | GET       | `/api/payments/`                     | List payments                                                  |
| Payments               | POST      | `/api/payments/`                     | Make payment                                                   |
| Analytics              | GET       | `/api/analytics/course/<course_id>/` | Course analytics: student count, avg progress, avg quiz scores |

---

## Pagination & Filters

* Pagination is applied to **courses, quizzes, and enrollments** by default.
* Filter quizzes by course: `/api/quizzes/?course=<id>`
* Filter enrollments by student or course: `/api/enrollments/?student=<id>&course=<id>`

---

## Admin Interface

* Manage **Users, Profiles, Courses, Enrollments, Assignments, Quizzes, Submissions, Payments** from Django admin.
* Search and filter by relevant fields.
* Fully functional with list display and timestamps for easy tracking.

---

## Example Usage

### Enroll student in a course

```http
POST /api/enrollments/enroll/
Authorization: Bearer <token>
Content-Type: application/json

{
  "course": 2
}
```

### Submit an assignment

```http
POST /api/submissions/assignments/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "assignment": 1,
  "file": "<file_path>"
}
```

### Make a payment

```http
POST /api/payments/
Authorization: Bearer <token>
Content-Type: application/json

{
  "course": 2,
  "amount": "150.00",
  "status": "completed"
}
```

### Get course analytics (instructor/admin)

```http
GET /api/analytics/course/2/
Authorization: Bearer <token>
```

---

## Next Steps / Enhancements

1. Integrate a **real payment gateway** (Stripe/Paystack) with webhook support.
2. Expand **assignments & grading**: per-student submission stats, instructor grading workflow.
3. Enhance **analytics**: trends per student, per assignment, course completion rates.
4. Add **unit tests** for all models, serializers, views, and permissions.
5. Deploy with **PostgreSQL** and **Docker** for production readiness.
6. Implement **email notifications** for enrollments, assignment deadlines, and quiz results.


flowchart TD
    User["User (Custom)"] -->|has one| Profile
    Profile -->|can enroll| Enrollment
    Enrollment -->|relates to| Course
    Course -->|has many| Assignment
    Course -->|has many| Quiz
    Assignment -->|submissions| AssignmentSubmission
    Quiz -->|submissions| QuizSubmission
    Enrollment -->|payments| Payment

    subgraph "Roles & Permissions"
        User
    end


**Explanation:**

- `User` → your custom Django user with `role` field (`student`, `instructor`, `admin`)  
- `Profile` → additional info for a user  
- `Enrollment` → links students to courses  
- `Course` → contains `Assignments` and `Quizzes`  
- `AssignmentSubmission` → student submissions for assignments  
- `QuizSubmission` → student submissions for quizzes  
- `Payment` → tracks course payments  
- Mermaid makes it visually clear without needing an image

---

