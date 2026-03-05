# Instructor Role-Based System Implementation Guide

## Overview

The system now supports two distinct types of instructors, each with their own dashboard and specific features. This allows for flexible management of different instructor roles within the learning management system.

## Backend Changes

### 1. Database Model Updates

**File**: `api/models/profile.py`

- Added `INSTRUCTOR_TYPE_CHOICES` with options:
  - `"subject"` - Subject Instructor
  - `"class"` - Class Instructor
- Added `instructor_type` field to the `Profile` model:

  ```python
  instructor_type = models.CharField(
      max_length=20,
      choices=INSTRUCTOR_TYPE_CHOICES,
      null=True,
      blank=True,
      help_text="Only applicable if role is instructor"
  )
  ```

- Migration created: `0014_profile_instructor_type.py`

### 2. API Serializer Updates

**File**: `api/serializers/user.py`

- Added `instructor_type` field to `UserRegistrationSerializer`
- Added validation for instructor type when creating new instructors
- Updated `create()` method to set instructor_type on profile creation

**File**: `api/serializers/core.py`

- `ProfileSerializer` automatically includes `instructor_type` (uses `fields = "__all__"`)

### 3. Admin Interface Updates

**File**: `api/admin/users.py`

- Added `instructor_type` field to `ProfileInline` form
- Added `get_instructor_type()` display method to `CustomUserAdmin`
- Updated `list_display` to show instructor type for all users
- Updated `list_filter` to allow filtering by instructor type

## Frontend Changes

### 1. New Components

#### InstructorDashboard

**File**: `frontend/src/pages/InstructorDashboard.tsx`

- Main routing component that checks instructor_type
- Routes to appropriate dashboard based on type
- Fallback error handling for missing instructor type

#### SubjectInstructorDashboard

**File**: `frontend/src/pages/SubjectInstructorDashboard.tsx`

**Features**:

- 📝 **Assignments**: Send assignments and collect submissions
- 📖 **Subjects**: Manage assigned subjects
- 👥 **Students**: View all enrolled students
- 📊 **Results**: Update student results with:
  - First test score (0-100)
  - Second test score (0-100)
  - Attendance (0-100)
  - Assignment score (0-100)

#### ClassInstructorDashboard

**File**: `frontend/src/pages/ClassInstructorDashboard.tsx`

**Features**:

- 👥 **Students**: Register and manage new students (cannot delete, only superAdmin can)
- 📝 **Assignments**: Send assignments to entire class
- 📖 **Subjects**: Manage class subjects
- 📊 **Results**: Update student results in bulk
- 👨‍🏫 **Instructors**: View all instructors in the class and their subjects

### 2. Updated Components

**File**: `frontend/src/pages/ManageUsers.tsx`

- Added `instructor_type` field to user creation form
- Conditional display: Only shows when role is "instructor"
- Form includes dropdown: "Subject Instructor" or "Class Instructor"
- Updated `newUser` state to include `instructor_type`

**File**: `frontend/src/App.tsx`

- Added lazy loading for three new instructor dashboard components
- Added three new routes:
  - `/instructor-dashboard` - Main instructor dashboard (routing)
  - `/subject-instructor-dashboard` - Subject instructor specific
  - `/class-instructor-dashboard` - Class instructor specific

**File**: `frontend/src/utils/authUtils.ts`

- Updated `UserData` interface to include `instructor_type` field
- Updated `fetchUserProfile()` to retrieve instructor_type from backend
- Updated `getDashboardRouteByRole()` to route instructors based on type:
  - Subject Instructor → `/subject-instructor-dashboard`
  - Class Instructor → `/class-instructor-dashboard`
- Updated `HomeRouter` to pass instructor_type to routing function

## Creating a New Instructor

### Via Admin Interface

1. Go to Django Admin > Users
2. Click "Add User"
3. Fill in basic user info (username, email, name, password)
4. Save the user
5. In the Profile Details section:
   - Set Role to "Instructor"
   - Select Instructor Type: "Subject Instructor" or "Class Instructor"
   - Select Department: Western, Arabic, or Programming
   - Save

### Via Frontend ManageUsers

1. Go to Manage Users page (Admin feature)
2. Click "Add New User"
3. Fill in user details
4. Set Role to "Instructor"
5. **NEW**: Select Instructor Type from dropdown:
   - Subject Instructor
   - Class Instructor
6. Select Department
7. Click "Create User"

## Instructor Dashboard Routes

### Login and Auto-Routing

When an instructor logs in:

1. System fetches their profile including `instructor_type`
2. Auto-routes to appropriate dashboard:
   - Subject Instructor → Features for individual subject management
   - Class Instructor → Features for entire class management

### Manual Navigation

Instructors can also directly navigate to:

- `/instructor-dashboard` - Smart routing based on type
- `/subject-instructor-dashboard` - Specific dashboard
- `/class-instructor-dashboard` - Specific dashboard

## Feature Comparison

| Feature                    | Subject Instructor       | Class Instructor     |
| -------------------------- | ------------------------ | -------------------- |
| Send Assignments           | ✅                       | ✅                   |
| View Subjects              | ✅                       | ✅                   |
| View Students              | ✅ (enrolled in subject) | ✅ (all in class)    |
| Update Results             | ✅ (test/attendance)     | ✅ (test/attendance) |
| Register New Students      | ❌                       | ✅                   |
| Modify Student Info        | ❌                       | ✅                   |
| Delete Students            | ❌                       | ❌ (superAdmin only) |
| View All Class Instructors | ❌                       | ✅                   |
| View Subject Instructors   | ❌                       | ✅                   |

## Database Migrations

To apply the changes to your database:

```bash
cd backend
python manage.py migrate
```

This will:

1. Add `instructor_type` column to `api_profile` table
2. Set all existing instructors to NULL for instructor_type
3. Allow admins to set the type for existing instructors

## Testing

### Test Creating a Subject Instructor

1. Go to ManageUsers
2. Create new user with role "Instructor"
3. Select "Subject Instructor" type
4. Login as this user
5. Should see SubjectInstructorDashboard

### Test Creating a Class Instructor

1. Go to ManageUsers
2. Create new user with role "Instructor"
3. Select "Class Instructor" type
4. Login as this user
5. Should see ClassInstructorDashboard

### Test Missing Instructor Type

1. Via Django admin, create an instructor without setting instructor_type
2. Login as this user
3. Should see generic InstructorDashboard with error message

## Error Handling

- **Missing instructor_type**: Shows error message, route to generic dashboard
- **Invalid role**: Only shows dashboard to users with instructor role
- **Unauthorized access**: ProtectedRoute component handles auth

## Future Enhancements

1. Add course/subject assignment management
2. Add attendance tracking UI
3. Add result export functionality
4. Add announcement system for instructors
5. Add student performance analytics
6. Add assignment submission viewing
7. Integration with actual assignment/test models
8. Add instructor messaging system
