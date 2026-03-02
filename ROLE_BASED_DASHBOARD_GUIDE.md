# Role-Based Dashboard System - Complete Guide

## Overview

The LMS now has a complete role-based authentication and dashboard system where users are automatically redirected to their specific dashboard based on their role after login.

## System Flow

### 1. **Login Process**

When a user logs in at `/login`:

```
User enters credentials (username/password)
    ↓
POST /api/token/ (get JWT tokens)
    ↓
Call fetchUserProfile() to get user's role from /api/profiles/
    ↓
Store tokens in localStorage (access_token, refresh_token)
    ↓
Store user data in localStorage (including role)
    ↓
Redirect to role-specific dashboard
```

### 2. **Role-Based Routing**

After login, users are automatically redirected based on their role:

#### **Admins** (admin, school_admin, super_admin)

- **Route**: `/admin`
- **Component**: `AdminDashboard.tsx`
- **Features**:
  - System overview with key metrics
  - User management with role filtering
  - Course inventory and management
  - Department analytics
  - Enrollment statistics
- **Navbar Items**: AdminDashboard, Manage Users, Analytics
- **Access**: Full system visibility

#### **Parents** (parent)

- **Route**: `/parent-portal`
- **Component**: `ParentPortal.tsx`
- **Features**:
  - View child progress across courses
  - See assignment completion status
  - Monitor quiz scores
  - Track achievements earned
  - View enrolled courses
- **Navbar Items**: Parent Portal (plus general items like Courses, Quizzes, AI Help)
- **Access**: Only their own child's data from their department

#### **Students & Instructors** (student, teacher, instructor)

- **Route**: `/dashboard`
- **Component**: `Dashboard.tsx` → Department-specific dashboards
- **Sub-dashboards**:
  - **WesternDashboard** (Western curriculum)
  - **ArabicDashboard** (Arabic curriculum)
  - **ProgrammingDashboard** (Programming courses)
- **Features**:
  - Department-specific course content
  - Assignment submissions
  - Quiz participation
  - Achievement tracking
  - Course enrollment
- **Navbar Items**: All general items (Courses, My Classes, Assignments, Quizzes, etc.)
- **Access**: Full course and assignment access within their department

### 3. **Navbar Menu Items** (Role-Based)

The Sidebar now shows different menu items based on user role:

| Menu Item          | Available For           | Roles                                                 |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| 🏠 Dashboard       | All authenticated users | All                                                   |
| 📚 Courses         | All authenticated users | All                                                   |
| ✏️ My Classes      | All authenticated users | All                                                   |
| 📝 Assignments     | All authenticated users | All                                                   |
| ❓ Quizzes         | All authenticated users | All                                                   |
| 📊 Analytics       | Instructors & Admins    | instructor, teacher, admin, school_admin, super_admin |
| 🏆 Achievements    | All authenticated users | All                                                   |
| 📋 Projects        | All authenticated users | All                                                   |
| 🏁 Milestones      | All authenticated users | All                                                   |
| 🤖 AI Help         | All authenticated users | All                                                   |
| 🧠 Practice        | All authenticated users | All                                                   |
| 👥 Manage Users    | Admins only             | admin, school_admin, super_admin                      |
| 👨‍👧 Parent Portal   | Parents only            | parent                                                |
| ⚙️ Admin Dashboard | Admins only             | admin, school_admin, super_admin                      |

### 4. **Home Page Behavior**

When a logged-in user visits `/` (root):

- **Before**: showed Landing page to everyone
- **Now**: automatically redirects to role-specific dashboard
  - Admins → `/admin`
  - Parents → `/parent-portal`
  - Others → `/dashboard` (department-specific)

When a non-logged-in user visits `/`:

- Shows the Landing page (unchanged)

## Frontend Components & Files

### New Files Created

1. **frontend/src/utils/authUtils.ts**
   - `fetchUserProfile()` - Get user profile and role
   - `getDashboardRouteByRole()` - Determine landing page by role
   - `storeUserData()` / `getUserData()` - localStorage management
   - `clearUserData()` - Logout helper
   - `handleLoginSuccess()` - Complete login flow

### Updated Files

1. **frontend/src/pages/Login.tsx**
   - Uses `handleLoginSuccess()` to store user data
   - Redirects to role-specific dashboard
   - Shows loading state during login

2. **frontend/src/components/Navbar.tsx**
   - Uses `clearUserData()` on logout
   - Properly clears all user data from localStorage

3. **frontend/src/components/Sidebar.tsx**
   - Reads user role from localStorage
   - Filters menu items based on role
   - Shows role-appropriate links only

4. **frontend/src/App.tsx**
   - Added `HomeRouter` component
   - Routes authenticated users to appropriate dashboards
   - Returns Landing page for non-authenticated users
   - Maintains all existing routes (protected and public)

### Existing Dashboard Components

- **frontend/src/pages/Dashboard.tsx** - Routes to department-specific dashboard
- **frontend/src/pages/WesternDashboard.tsx** - Western curriculum dashboard
- **frontend/src/pages/ArabicDashboard.tsx** - Arabic curriculum dashboard
- **frontend/src/pages/ProgrammingDashboard.tsx** - Programming dashboard
- **frontend/src/pages/AdminDashboard.tsx** - Admin system overview (recently added)
- **frontend/src/pages/ParentPortal.tsx** - Parent progress tracking (recently added)

## Backend Integration

### Auth Endpoints

- `POST /api/token/` - Get JWT tokens
- `POST /api/token/refresh/` - Refresh tokens (handled by axios interceptor)
- `GET /api/profiles/` - Get user profile with role (role-based filtering)

### Permission System

- Backend uses `ProfileViewSet.get_queryset()` to filter profiles by role
- Roles implemented: student, parent, teacher, instructor, admin, school_admin, super_admin
- Permissions enforce:
  - Admins/Instructors see department profiles
  - Parents/Students see only their own profile
  - Superusers see everything

## Data Flow Example: Student Login

```
1. User enters username/password → POST /api/token/
2. Receive access_token & refresh_token
3. Call fetchUserProfile() → GET /api/profiles/
4. Response: {id: 1, role: "student", department: "western", ...}
5. Store in localStorage:
   - access_token: "eyJ..."
   - refresh_token: "eyJ..."
   - user: {id: 1, username: "john", role: "student", department: "western"}
6. Redirect to /dashboard
7. Dashboard.tsx fetches user department from localStorage
8. Loads WesternDashboard component
9. Display department-specific courses and assignments
```

## Security Considerations

1. **Token Management**
   - Tokens stored in localStorage (accessible via JavaScript)
   - Consider: Use httpOnly cookies for production security

2. **Role Verification**
   - Frontend filters UI based on role
   - Backend ENFORCES role-based permissions (critical!)
   - Always verify role on server-side for sensitive operations

3. **Session Cleanup**
   - `clearUserData()` removes all auth data on logout
   - Navbar handles logout redirection to /login

4. **Protected Routes**
   - All authenticated routes use `<ProtectedRoute>` wrapper
   - Redirects unauthenticated users to /login
   - Axios interceptor handles 401 errors (token refresh)

## Testing the System

### Test Case 1: Student Login

```
1. Navigate to /login
2. Enter student username/password
3. Verify redirects to /dashboard
4. Verify sidebar shows student menu items
5. Verify can access: Courses, Assignments, Quizzes, etc.
6. Verify CANNOT access: Admin, Manage Users
```

### Test Case 2: Admin Login

```
1. Navigate to /login
2. Enter admin username/password
3. Verify redirects to /admin
4. Verify sidebar shows admin menu items: Admin Dashboard, Manage Users
5. Verify sees AdminDashboard with system statistics
6. Verify can filter users by role
```

### Test Case 3: Parent Login

```
1. Navigate to /login
2. Enter parent username/password
3. Verify redirects to /parent-portal
4. Verify sidebar shows Parent Portal link
5. Verify can select children from department
6. Verify can see child progress metrics
```

### Test Case 4: Home Page Redirect

```
1. Logout (clear tokens)
2. Visit http://localhost:5173/ (home page)
3. Verify shows Landing page
4. Login as student
5. Visit http://localhost:5173/ (home page)
6. Verify auto-redirects to /dashboard
7. Login as admin (different tab)
8. Visit http://localhost:5173/
9. Verify auto-redirects to /admin
```

## Future Enhancements

1. **Parent-Student Linking**
   - Currently: Parents see students in their department
   - Improved: Create explicit ParentChild relationship model
   - Benefit: Parents only see their actual children

2. **Email Notifications**
   - Notify parents when child completes assignment
   - Notify admins of system events
   - Notify instructors of quiz submissions

3. **Admin Features**
   - User creation/deletion forms
   - Bulk user imports (CSV)
   - System logs and audit trails
   - Role-based access reports

4. **Performance Optimization**
   - Cache user profile data
   - Pagination for large datasets
   - Lazy load dashboards

5. **Session Management**
   - Migrate to httpOnly cookies
   - Implement session timeout
   - Add device management

## File Inventory Summary

**New/Modified for Role-Based System:**

- ✅ frontend/src/utils/authUtils.ts (NEW)
- ✅ frontend/src/pages/Login.tsx (MODIFIED)
- ✅ frontend/src/components/Navbar.tsx (MODIFIED)
- ✅ frontend/src/components/Sidebar.tsx (MODIFIED)
- ✅ frontend/src/App.tsx (MODIFIED)

**Existing Components Working With System:**

- frontend/src/pages/Dashboard.tsx
- frontend/src/pages/AdminDashboard.tsx
- frontend/src/pages/ParentPortal.tsx
- frontend/src/pages/WesternDashboard.tsx
- frontend/src/pages/ArabicDashboard.tsx
- frontend/src/pages/ProgrammingDashboard.tsx

**Backend:**

- api/views/core.py (ProfileViewSet with role-based filtering)
- api/models/user.py (ROLE_CHOICES with 7 roles)
- api/models/profile.py (role-based permissions)

---

## Quick Reference

### Environment Variables

```
VITE_API_URL=http://localhost:8000/api
```

### Key Functions (authUtils.ts)

```typescript
import {
  fetchUserProfile,
  getDashboardRouteByRole,
  storeUserData,
  getUserData,
  clearUserData,
  handleLoginSuccess,
} from "../utils/authUtils";
```

### Role → Dashboard Mapping

```
admin, school_admin, super_admin → /admin (AdminDashboard)
parent → /parent-portal (ParentPortal)
student, teacher, instructor → /dashboard (Department Dashboard)
```

---

**Last Updated**: March 2, 2026
**Version**: 2.0 - Role-Based Dashboard System
