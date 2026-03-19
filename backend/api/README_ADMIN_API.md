# Admin API Endpoints

This small helper documents the admin-specific API endpoints added for the
admin UI.

POST /api/admin/sync-groups/

- Body: { "user_ids": [1,2,3] }
- Auth: staff users (IsAdminUser)
- Response: { "processed": [...], "errors": [...] }

Use this endpoint from the frontend Manage Users page to re-sync Django Group
membership for selected users based on their `Profile.role`.
