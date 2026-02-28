from rest_framework.permissions import BasePermission

class IsAdminOrInstructor(BasePermission):
    def has_permission(self, request, view):
        # Allow if user is admin, instructor, or superuser
        if request.user.is_superuser:
            return True
        return getattr(request.user.profile, 'role', None) in ["admin", "instructor"]

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user owns the object, is admin, or is superuser
        if request.user.is_superuser:
            return True
        return obj.user == request.user or getattr(request.user.profile, 'role', None) == "admin"
