from rest_framework import serializers
from api.models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    # expose user names at top level so frontend can easily read/write them
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)

    class Meta:
        model = Profile
        # include all profile fields plus the two user name fields
        fields = "__all__"  # depth=1 still applies for nested user details
        depth = 1  # include nested user details (first_name, last_name, etc.)
