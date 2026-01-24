# LMS User Management API

A Django REST Framework API for managing users in a Learning Management System (LMS) with role-based access and JWT authentication.

## Features
- JWT authentication
- Role-based access: student, instructor, admin
- Profiles linked to Django's built-in User
- CRUD operations for admin and instructor
- Students can view only their own profile
- Admin interface with search, filters, and list display

## Tech Stack
- Python
- Django 4.2
- Django REST Framework
- SimpleJWT

## Setup
```bash
git clone https://github.com/Muwatta/lms_api.git

cd project_testing
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
