A Django REST Framework API for a Learning Management System (LMS) with **JWT authentication**, **role-based access**, and **full LMS features** including courses, enrollments, quizzes, submissions, payments, and analytics.

---

## Features

* **JWT authentication** (login, refresh token)
* **Role-based permissions**: `student`, `instructor`, `admin`
* **Profile system** linked to Django User
* **Courses**: CRUD operations for instructors/admins
* **Enrollments**: Students can enroll in courses
* **Quizzes**: Create and manage quizzes per course
* **Quiz submissions**: Students submit answers, instructors can view scores
* **Analytics**: Average progress and scores per course
* **Payments**: Track course payments per student
* **Pagination and filters**: Courses, quizzes, enrollments
* **Admin interface**: Fully configured with search, list display, and filters

---

## Tech Stack

* Python 3.9+
* Django 4.2
* Django REST Framework
* Django Filter
* SimpleJWT
* SQLite (default, can switch to PostgreSQL for production)

---

## Setup

```bash
# Clone the repository
git clone https://github.com/Muwatta/lms_api.git
cd lms_api

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

```
POST /api/token/
{
  "username": "admin",
  "password": "yourpassword"
}
```

* **Refresh JWT token**:

```
POST /api/token/refresh/
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

| Resource         | Method    | Endpoint                             | Description                                                    |
| ---------------- | --------- | ------------------------------------ | -------------------------------------------------------------- |
| Profiles         | GET       | `/api/profiles/`                     | List profiles (filtered by role)                               |
| Profiles         | GET       | `/api/profiles/<id>/`                | Profile detail                                                 |
| Courses          | GET       | `/api/courses/`                      | List courses                                                   |
| Courses          | POST      | `/api/courses/`                      | Create course (instructor/admin only)                          |
| Courses          | PUT/PATCH | `/api/courses/<id>/`                 | Update course                                                  |
| Courses          | DELETE    | `/api/courses/<id>/`                 | Delete course                                                  |
| Enrollments      | GET       | `/api/enrollments/`                  | List enrollments (filtered by role)                            |
| Enrollments      | POST      | `/api/enrollments/enroll/`           | Enroll student in course                                       |
| Quizzes          | GET       | `/api/quizzes/`                      | List quizzes, filter by course                                 |
| Quizzes          | POST      | `/api/quizzes/`                      | Create quiz                                                    |
| Quiz Submissions | GET       | `/api/submissions/`                  | List submissions (filtered by role)                            |
| Quiz Submissions | POST      | `/api/submissions/`                  | Submit quiz answers                                            |
| Payments         | GET       | `/api/payments/`                     | List payments                                                  |
| Payments         | POST      | `/api/payments/`                     | Make payment                                                   |
| Analytics        | GET       | `/api/analytics/course/<course_id>/` | Course analytics: student count, avg progress, avg quiz scores |

---

## Pagination & Filters

* Pagination is applied to courses, quizzes, and enrollments by default.
* Filter quizzes by course: `/api/quizzes/?course=<id>`
* Filter enrollments by student or course: `/api/enrollments/?student=<id>&course=<id>`

---

## Admin Interface

* Manage **Users, Profiles, Courses, Enrollments, Quizzes, Submissions, Payments** from Django admin.
* Search and filter by relevant fields.

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

* Integrate real payment gateway (Stripe/Paystack)
* Add assignment submissions and grading
* Expand analytics (per student, course progress trends)
* Deploy with PostgreSQL and Docker for production

