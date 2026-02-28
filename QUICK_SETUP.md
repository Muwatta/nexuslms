# Quick Setup: Activate Department-Based LMS

## ⚡ Fast Track (5 minutes)

### Step 1: Backend Database Migration

```bash
cd c:\Users\DELL\Documents\nexuslms\backend
python manage.py migrate api
```

**Expected Output**: ✅ "Applying api.0003_add_achievements_projects..."

### Step 2: Test Backend API

```bash
cd backend
python manage.py runserver
```

Visit in browser: `http://localhost:8000/api/achievements/`

- Should show empty JSON list: `[]`

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Expected Output**: Vite server running at `http://localhost:5173`

### Step 4: Test Registration

1. Click **Sign Up** on navbar
2. Fill in form with new fields:
   - Select department (Western, Arabic, or Programming)
   - Pick class level from list
   - Enter bio, phone, parent email
3. Submit and verify success message

### Step 5: Test Department Dashboard

1. Click **Login**
2. Login with registered account
3. Should automatically route to your department dashboard:
   - **Western**: Blue theme, English focus
   - **Arabic**: Green theme, Arabic interface
   - **Programming**: Dark terminal theme

---

## 📱 New Pages to Explore

After logging in, click navbar links to explore:

- ✅ **Dashboard** - Department-specific home
- 📚 **Courses** - Enrolled courses
- ✏️ **My Classes** - Class enrollments
- 📝 **Assignments** - Course assignments
- **🏆 Achievements** - Certificates & badges (NEW)
- **📋 Projects** - Course projects (NEW)
- **🏁 Milestones** - Progress tracking (NEW)
- 📊 **Analytics** - Student statistics

---

## 🎨 What Changed

### New Components

✨ **3 Department Dashboards** - Each styled for its school
✨ **Achievement Viewer** - Display earned certificates
✨ **Project Tracker** - Monitor project status
✨ **Milestone Progress** - See completion percentage

### Enhanced Registration

📝 Department selection with radio buttons
📝 Class level dropdown (13 options)
📝 Bio, phone, parent email fields

### Better Navigation

🎯 Professional navbar with emojis
🎯 Links to all new features
🎯 Logout button with better styling

---

## 🔍 Admin Management

### Manage Achievements, Projects, Milestones

```bash
cd backend
python manage.py runserver
# Visit: http://localhost:8000/admin/
# Login with superuser account
# New sections: Achievements, Projects, Milestones, Profiles (updated)
```

### Add Example Achievement

In Django admin:

1. Go to **Achievements**
2. Click **Add Achievement**
3. Select student, course, type (certificate/badge/award)
4. Save

---

## ✅ Verification Checklist

Run these to verify everything works:

### Backend

```bash
# Check migrations applied
python manage.py showmigrations api
# Should show: [X] 0003_add_achievements_projects

# Check models loaded
python manage.py shell
>>> from api.models import Achievement, Project, Milestone
>>> print("✅ All models imported successfully")
```

### Frontend

```bash
# Check no TypeScript errors
cd frontend
npm run tsc --noEmit
# Should show: ✅ No errors

# Check npm packages
npm list react react-router-dom axios
# Should show versions installed
```

---

## 🚨 Common Issues & Fixes

| Problem                       | Fix                                          |
| ----------------------------- | -------------------------------------------- |
| "Table does not exist"        | Run `python manage.py migrate api`           |
| New fields not in form        | Clear browser cache (Ctrl+Shift+Del)         |
| 404 on achievements page      | Restart frontend: `npm run dev`              |
| Login loops without dashboard | Check user profile department field in admin |
| Navbar links don't work       | Ensure App.tsx imports are correct           |

---

## 📊 Testing Registration Data

Example student registration:

```json
{
  "username": "ahmed_western",
  "email": "ahmed@muwata.edu",
  "password": "SecurePass123!",
  "role": "student",
  "department": "western",
  "student_class": "SS2",
  "bio": "Passionate about English literature",
  "phone": "+234 XXX XXX XXXX",
  "parent_email": "parent@email.com"
}
```

---

## 🎯 Key Features by Department

### Western School 🌍

- English language focus
- Modern studies curriculum
- Blue theme, Western layout

### Arabic School 🕌

- Arabic language excellence
- Islamic studies
- Bilingual (English + عربي)
- Green theme

### Programming 💻

- Coding projects
- Technical skills
- Tech terminal design
- Dark theme with tech aesthetics

---

## 📱 Frontend Files Created/Updated

```
✨ NEW FILES:
- frontend/src/pages/WesternDashboard.tsx
- frontend/src/pages/ArabicDashboard.tsx
- frontend/src/pages/ProgrammingDashboard.tsx
- frontend/src/pages/ViewAchievements.tsx
- frontend/src/pages/ViewProjects.tsx
- frontend/src/pages/ViewMilestones.tsx

📝 UPDATED FILES:
- frontend/src/pages/Dashboard.tsx (now routes to dept dashboard)
- frontend/src/pages/Signup.tsx (new fields added)
- frontend/src/components/Navbar.tsx (enhanced links)
- frontend/src/App.tsx (new routes added)
```

---

## 🔌 Backend Files Created/Updated

```
✨ NEW MODEL FILES:
- api/models/achievement.py

📝 UPDATED MODEL FILES:
- api/models/profile.py (added dept, bio, phone, parent_email)

✨ NEW VIEW FILES:
- api/views/achievement.py (AchievementViewSet, ProjectViewSet, MilestoneViewSet)

✨ NEW SERIALIZER FILES:
- api/serializers/achievement.py

📝 UPDATED FILES:
- api/urls.py (registered new viewsets)
- api/admin.py (registered new models)
- api/serializers/user.py (UserRegistrationSerializer updated)

✨ NEW MIGRATION:
- api/migrations/0003_add_achievements_projects.py
```

---

## 📖 Documentation Files

- **DEPARTMENT_SETUP_GUIDE.md** - Comprehensive guide (this document)
- **README.md** - Updated with new features

---

## 🎓 Next: Advanced Configuration (Optional)

After initial setup, consider:

1. **Create test achievements** in Django admin
2. **Set up email notifications** for achievements
3. **Configure instructor dashboard** for managing achievements
4. **Deploy to production** with PostgreSQL
5. **Set up Docker containers** for deployment

---

**Ready?** Run the migration and start the servers! 🚀

```bash
# Terminal 1: Backend
cd nexuslms
python manage.py migrate api
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser! 🎉
