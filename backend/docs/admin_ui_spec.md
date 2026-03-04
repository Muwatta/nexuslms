# Admin UI Specification (Non-technical School Admins)

Objective

- Provide a simple, discoverable admin interface built on top of the existing
  API so non-technical school admins can manage users, courses, enrollments,
  grades, payments, and reports without touching Django internals.

Key UX principles

- Role-based dashboards (School Admin, Instructor, Finance)
- Bulk actions for common tasks (CSV/Excel imports, bulk enrollments)
- Clear ‘next step’ callouts for onboarding tasks
- Audit trails and confirm dialogs for destructive actions

Primary pages & features

1. Dashboard

- System status summary (active courses, students, outstanding payments)
- Recent activity (new enrollments, recent grades posted)

2. Users

- List with filters: role, department, group membership
- Create user wizard (email, role, auto-generate password, send welcome)
- Each student receives an auto-generated unique ID (sc/YY/####) stored on profile
- Bulk Excel import with validation feedback (admin can upload spreadsheet of
  thousands of students to create accounts in one go)
- Select users → action: Sync groups from role (calls admin action)

3. Courses

- Create/edit course wizard (title, instructor, schedule, publish settings)
- Bulk import of course metadata (optional)

4. Enrollments

- Enroll/unenroll students, view course rosters
- Export roster CSV

5. Assignments & Quizzes

- Create assignments and quizzes, set deadlines, upload templates
- Gradebook view: list students, quick grade edit (inline)
- Bulk grade upload (CSV)

6. Financials

- Payments list and filters (by student, date, course)
- Export invoices and reconciliation CSVs
- Limited redaction or sensitive data masking for non-finance users

7. Reports

- Course completion, engagement, grade distributions
- Export (CSV, PDF) and schedule reports (email)

8. Groups & Roles

- Visual mapping: `Profile.role` ↔ Groups list
- Manual group management UI (add/remove users from groups)

9. Support & Help

- Inline help text, links to walkthrough videos, contact support button

API & integration notes

- Use existing DRF endpoints where available; add endpoints if missing:
  - `GET /api/admin/users/` (with filters)
  - `POST /api/admin/users/bulk_import/`
  - `POST /api/admin/sync-groups/` (or call admin action via backend)
  - `GET /api/admin/reports/` (params for date ranges)

Security

- Enforce permissions server-side (don’t rely on UI checks)
- Use CSRF-protected endpoints and short-lived admin tokens

Accessibility

- Ensure keyboard navigation and screen reader labels on critical flows

Deliverables & timeline (example)

- Week 1: UX wireframes + API gap analysis
- Week 2–3: Implement core pages (Users, Courses, Enrollments)
- Week 4: Gradebook, Reports, Testing, and training materials

Notes

- The frontend can be a separate admin SPA or integrated into the current frontend
  project as a protected route set.

---

This spec is intended for the first delivery (managed hosting + admin UI).
