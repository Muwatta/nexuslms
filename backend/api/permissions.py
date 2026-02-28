from rest_framework.permissions import BasePermission

class IsAdminOrInstructor(BasePermission):
    def has_permission(self, request, view):
        # Allow if user is admin or instructor
        return request.user.profile.role in ["admin", "instructor"]

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user owns the object or is admin
        return obj.user == request.user or request.user.profile.role == "admin"
