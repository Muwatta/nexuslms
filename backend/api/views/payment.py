from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from api.models import Payment, Profile
from api.serializers import PaymentSerializer
from api.paystack_client import initialize_transaction, verify_transaction

class PaymentViewSet(ModelViewSet):
    """
    ViewSet for handling Payments.
    - Students can only see their own payments.
    - Admins/Instructors can see all payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = getattr(self.request.user, "profile", None)

        if not user_profile:
            # Safety check
            return Payment.objects.none()

        # Students can only see their own payments
        if user_profile.role == "student":
            return Payment.objects.filter(student=user_profile)
        
        # Admins/Instructors can see all payments
        return Payment.objects.all()

    def perform_create(self, serializer):
        user_profile = getattr(self.request.user, "profile", None)

        if not user_profile:
            raise PermissionDenied("No profile associated with this user.")

        # Students can only create payments for themselves
        if user_profile.role == "student":
            payment = serializer.save(student=user_profile)
        else:
            payment = serializer.save()

        # if paystack key present and payment is pending, initialize
        if payment.status == "pending":
            try:
                # use the student's email (or a default)
                email = payment.student.user.email or "no-reply@example.com"
                init_data = initialize_transaction(
                    amount=payment.amount,
                    email=email,
                    reference=payment.reference,
                )
                # store paystack response in an attribute for debugging
                payment.paystack_response = init_data
                payment.save()
            except Exception:
                # swallow exceptions so API call still works
                pass
