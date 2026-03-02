from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from .. import signals as signals_module

User = get_user_model()


class SyncGroupsView(APIView):
    """POST: Accepts JSON {"user_ids": [1,2,3]} and syncs groups from profile role."""
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        user_ids = request.data.get("user_ids") or []
        if not isinstance(user_ids, (list, tuple)):
            return Response({"detail": "user_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        processed = []
        errors = []
        for uid in user_ids:
            try:
                user = User.objects.get(pk=uid)
            except User.DoesNotExist:
                errors.append({"id": uid, "error": "not_found"})
                continue

            # attempt to access profile and run the sync handler
            profile = getattr(user, "profile", None)
            if not profile:
                errors.append({"id": uid, "error": "no_profile"})
                continue

            try:
                # call the same handler used by signals
                signals_module.sync_role_to_groups(type(profile), profile, False)
                processed.append(uid)
            except Exception as exc:
                errors.append({"id": uid, "error": str(exc)})

        return Response({"processed": processed, "errors": errors}, status=status.HTTP_200_OK)
