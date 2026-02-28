from rest_framework import serializers
from api.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    paystack_response = serializers.JSONField(read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("paystack_response",)
