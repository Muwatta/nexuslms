# Quick Testing Guide - Role-Based Dashboard System

## Pre-Testing Checklist

- [ ] Backend server running: `python manage.py runserver`
- [ ] Frontend dev server running: `npm run dev` (from frontend directory)
- [ ] API URL correct: http://localhost:8000/api
- [ ] Database migrations applied (including user roles)
- [ ] Test users created with different roles

## Creating Test Users

If test users don't exist, create them via Django admin or API:

### Option 1: Django Admin Panel

```bash
# From backend directory
python manage.py createsuperuser
python manage.py shell
```

### Option 2: API Signup

```bash
POST http://localhost:8000/api/register/
{
  "username": "student_test",
  "password": "testpass123",
  "email": "student@test.com",
  "role": "student"
}
```

### Test User Accounts to Create

```
1. Student Account
   Username: student001
   Password: TestPass123!
   Email: student@academy.com
   Role: student
   Department: western

2. Instructor Account
   Username: instructor001
   Password: TestPass123!
   Email: instructor@academy.com
   Role: instructor
   Department: western

3. Admin Account
   Username: admin001
   Password: TestPass123!
   Email: admin@academy.com
   Role: admin
   Department: western

4. Parent Account
   Username: parent001
   Password: TestPass123!
   Email: parent@academy.com
   Role: parent
   Department: western

5. Teacher Account
   Username: teacher001
   Password: TestPass123!
   Email: teacher@academy.com
   Role: teacher
   Department: western
```

---

## Test Cases

### Test 1: Student Login Flow

**Expected**: Student logs in → redirects to /dashboard → sees WesternDashboard

```
1. Open http://localhost:5173/
2. Click "Login" or navigate to /login
3. Enter: student001 / TestPass123!
4. Click "Sign in"
5. Wait for redirect...
6. __VERIFY__:
   ✓ Redirected to http://localhost:5173/dashboard
   ✓ WesternDashboard displayed
   ✓ Can see courses, assignments, quizzes
   ✓ Sidebar visible with student menu items
   ✓ Cannot access Admin Dashboard link
   ✓ Cannot access Manage Users link
7. Check localStorage (DevTools → Application → Local Storage):
   ✓ access_token exists
   ✓ refresh_token exists
   ✓ user.role === "student"
   ✓ user.department === "western"
```

### Test 2: Instructor Login Flow

**Expected**: Instructor logs in → redirects to /dashboard → sees WesternDashboard → has Analytics access

```
1. Open http://localhost:5173/login
2. Enter: instructor001 / TestPass123!
3. Click "Sign in"
4. __VERIFY__:
   ✓ Redirected to /dashboard
   ✓ WesternDashboard displayed
   ✓ Sidebar shows "📊 Analytics" link (instructor-only)
   ✓ Can click Analytics to view insights
   ✓ Cannot see "👥 Manage Users" link
```

### Test 3: Admin Login Flow

**Expected**: Admin logs in → redirects to /admin → sees AdminDashboard

```
1. Open http://localhost:5173/login
2. Enter: admin001 / TestPass123!
3. Click "Sign in"
4. __VERIFY__:
   ✓ Redirected to http://localhost:5173/admin
   ✓ AdminDashboard displayed with title "⚙️ Admin Dashboard"
   ✓ Three tabs visible: Overview, Users, Courses
   ✓ Overview tab shows statistics:
     - Total Students count
     - Total Instructors count
     - Total Courses count
     - Department breakdown
   ✓ Users tab shows user list with role filter
   ✓ Can filter users by role (student, teacher, instructor, admin, parent)
   ✓ Courses tab shows course cards
   ✓ Sidebar shows:
     - "⚙️ Admin Dashboard" link
     - "👥 Manage Users" link
     - "📊 Analytics" link
   ✓ Can access other admin features
```

### Test 4: Parent Login Flow

**Expected**: Parent logs in → redirects to /parent-portal → sees ParentPortal

```
1. Open http://localhost:5173/login
2. Enter: parent001 / TestPass123!
3. Click "Sign in"
4. __VERIFY__:
   ✓ Redirected to http://localhost:5173/parent-portal
   ✓ ParentPortal displayed with "👨‍👧 Parent Portal" title
   ✓ Can see list of children (students in same department)
   ✓ Can click on child to view progress
   ✓ Progress shows:
     - Enrolled courses count
     - Completed assignments
     - Average quiz score
     - Achievements earned
   ✓ Can view course enrollments for selected child
   ✓ Can view quiz scores for selected child
   ✓ Can view achievements for selected child
   ✓ Sidebar shows "👨‍👧 Parent Portal" link
   ✓ Can still access general pages: Courses, Quizzes, etc.
```

### Test 5: Home Page Redirect (Authenticated)

**Expected**: Logged-in user visits "/" → auto-redirects to role-specific dashboard

```
1. Login as student001
2. Navigate to http://localhost:5173/
3. __VERIFY__:
   ✓ Immediately redirects to http://localhost:5173/dashboard
   ✓ Does NOT show Landing page
   ✓ Shows WesternDashboard with student content

4. Logout
5. Navigate to http://localhost:5173/
6. __VERIFY__:
   ✓ Shows Landing page (with welcome text)
   ✓ "Get Started" and "Already a Student?" buttons visible
   ✓ Programs section visible
   ✓ No student content visible
```

### Test 6: Admin Home Redirect

**Expected**: Logged-in admin visits "/" → auto-redirects to /admin

```
1. Login as admin001
2. Navigate to http://localhost:5173/
3. __VERIFY__:
   ✓ Immediately redirects to http://localhost:5173/admin
   ✓ AdminDashboard displayed
   ✓ Does NOT show Landing page
```

### Test 7: Logout Flow

**Expected**: User logs out → cleared from localStorage → redirected to /login

```
1. Login as any user
2. Click "🚪 Logout" button in navbar
3. __VERIFY__:
   ✓ Redirected to /login
   ✓ localStorage cleared: access_token removed
   ✓ localStorage cleared: refresh_token removed
   ✓ localStorage cleared: user removed
   ✓ Only dark_mode remains in localStorage
4. Try accessing /dashboard directly
   ✓ Redirected to /login (ProtectedRoute)
```

### Test 8: Sidebar Menu Filtering

**Expected**: Different roles see different sidebar items

```
1. Login as student001
   Check sidebar has: Dashboard, Courses, My Classes, Assignments, Quizzes,
                      Achievements, Projects, Milestones, AI Help, Practice
   Check sidebar does NOT have: Admin Dashboard, Manage Users, Parent Portal

2. Logout, login as instructor001
   Check sidebar has: Analytics (in addition to student items)
   Check sidebar does NOT have: Manage Users, Parent Portal

3. Logout, login as admin001
   Check sidebar has: Admin Dashboard, Manage Users, Analytics
   Check sidebar does NOT have: Parent Portal

4. Logout, login as parent001
   Check sidebar has: Parent Portal
   Check sidebar does NOT have: Admin Dashboard
```

### Test 9: Token Refresh

**Expected**: Expired token auto-refreshes using refresh_token

```
1. Login as student001
2. Open DevTools → Network tab
3. Wait or manually expire access_token (modify localStorage: delete access_token)
4. Make API call (click on course, visit /enrollments, etc.)
5. __VERIFY__:
   ✓ Axios interceptor triggers token refresh
   ✓ POST /api/token/refresh/ called
   ✓ New access_token returned
   ✓ Original request retried with new token
   ✓ Page content loads normally
   ✓ No error displayed
```

### Test 10: Protected Route Access

**Expected**: Unauthenticated users cannot access protected routes

```
1. Logout (clear all auth)
2. Try to access http://localhost:5173/dashboard
   ✓ Redirected to /login

3. Try to access http://localhost:5173/admin
   ✓ Redirected to /login

4. Try to access http://localhost:5173/parent-portal
   ✓ Redirected to /login

5. Try to access http://localhost:5173/assignments
   ✓ Redirected to /login

6. But CAN access public routes:
   ✓ http://localhost:5173/about - shows About page
   ✓ http://localhost:5173/ - shows Landing page
   ✓ http://localhost:5173/login - shows Login
   ✓ http://localhost:5173/signup - shows Signup
```

---

## Debugging Commands

### Check localStorage Content

```javascript
// In browser console (F12 → Console)
console.log(JSON.parse(localStorage.getItem("user")));
console.log(localStorage.getItem("access_token"));
console.log(localStorage.getItem("refresh_token"));
```

### Check API Response

```javascript
// Fetch user profile manually
fetch("http://localhost:8000/api/profiles/", {
  headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
})
  .then((r) => r.json())
  .then((data) => console.log(data));
```

### Check Token Content

```javascript
// Decode JWT token (in browser console)
const token = localStorage.getItem("access_token");
const parts = token.split(".");
const payload = JSON.parse(atob(parts[1]));
console.log(payload);
```

### Backend Debug

```bash
# Check user role in Django shell
python manage.py shell
>>> from api.models import User, Profile
>>> user = User.objects.get(username="student001")
>>> Profile.objects.get(user=user).role
```

---

## Common Issues & Fixes

### Issue: After login, stays on /login page

**Solution**:

1. Check browser console for errors (F12)
2. Check if backend API is running: `python manage.py runserver`
3. Check API_URL in frontend (should be `http://localhost:8000/api`)
4. Verify tokens are being returned from /api/token/

### Issue: User data not stored in localStorage

**Solution**:

1. Check if `/api/profiles/` endpoint returns data
2. Verify user has a Profile record (create via admin if missing)
3. Check browser localStorage is not disabled
4. Look for errors in browser console

### Issue: Sidebar menu items not filtering correctly

**Solution**:

1. Check if `user` object is in localStorage
2. Verify role is spelled correctly in localStorage vs. code
3. Open DevTools → Application → Local Storage and check role value
4. Refresh page (Ctrl+R or Cmd+R)

### Issue: Logout button doesn't work

**Solution**:

1. Check if Navbar is imported correctly
2. Verify clearUserData() is imported from authUtils
3. Check browser console for errors
4. Manual logout: Clear localStorage and go to /login

### Issue: Admin sees student dashboard

**Solution**:

1. Backend issue: Check user.role in database
2. Frontend issue: Check localStorage user.role after login
3. Check if user actually has admin role (not just instructor)
4. Verify getDashboardRouteByRole() logic

---

## Test Execution Checklist

### Before Running Tests

- [ ] Backend running: `python manage.py runserver`
- [ ] Frontend running: `npm run dev`
- [ ] Test users created with correct roles
- [ ] Database migrations applied
- [ ] No console errors on page load

### Test Results

- [ ] Test 1: Student Login - PASS/FAIL
- [ ] Test 2: Instructor Login - PASS/FAIL
- [ ] Test 3: Admin Login - PASS/FAIL
- [ ] Test 4: Parent Login - PASS/FAIL
- [ ] Test 5: Home Redirect Auth - PASS/FAIL
- [ ] Test 6: Admin Home Redirect - PASS/FAIL
- [ ] Test 7: Logout Flow - PASS/FAIL
- [ ] Test 8: Sidebar Filtering - PASS/FAIL
- [ ] Test 9: Token Refresh - PASS/FAIL
- [ ] Test 10: Protected Routes - PASS/FAIL

### Overall: PASS/FAIL

### Notes:

```
[Add any test observations, unexpected behaviors, or issues found]
```

---

**Testing Guide Version**: 1.0
**Last Updated**: March 2, 2026
**Ready for**: Complete System Testing
