from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role in ['admin', 'school_admin', 'super_admin']
        except AttributeError:
            return False

class IsAdminOrInstructor(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return getattr(request.user.profile, 'role', None) in ["admin", "instructor"]

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user owns the object, is admin, or is superuser
        if request.user.is_superuser:
            return True
        return obj.user == request.user or getattr(request.user.profile, 'role', None) == "admin"

class IsClassInstructor(BasePermission):
    """Only allows class instructors to perform certain actions."""
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            profile = request.user.profile
            return profile.role == "instructor" and profile.instructor_type == "class"
        except AttributeError:
            return False

class IsSubjectInstructor(BasePermission):
    """Only allows subject instructors to perform certain actions."""
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            profile = request.user.profile
            return profile.role == "instructor" and profile.instructor_type == "subject"
        except AttributeError:
            return False

class IsInstructor(BasePermission):
    """Allows any type of instructor."""
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            profile = request.user.profile
            return profile.role == "instructor"
        except AttributeError:
            return False

class IsAdminOrClassInstructor(BasePermission):
    """Allows admins or class instructors."""
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            profile = request.user.profile
            return profile.role in ["admin", "super_admin"] or \
                   (profile.role == "instructor" and profile.instructor_type == "class")
        except AttributeError:
            return False

class IsAdminOrInstructor(BasePermission):
    """Allows admins or any type of instructor."""
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            profile = request.user.profile
            return profile.role in ["admin", "super_admin"] or profile.role == "instructor"
        except AttributeError:
            return False


# Add this to the end of api/permissions.py

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role in ['admin', 'school_admin', 'super_admin']
        except AttributeError:
            return False