import os
from paystackapi.paystack import Paystack


def get_paystack_client():
    key = os.getenv("PAYSTACK_SECRET_KEY")
    if not key:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    return Paystack(secret_key=key)


def initialize_transaction(amount, email, reference=None, callback_url=None):
    """Create a transaction on Paystack and return the initialization data."""
    client = get_paystack_client()
    payload = {
        "amount": int(amount * 100),  # paystack expects kobo
        "email": email,
    }
    if reference:
        payload["reference"] = reference
    if callback_url:
        payload["callback_url"] = callback_url
    return client.transaction.initialize(**payload)


def verify_transaction(reference):
    """Verify transaction status by reference."""
    client = get_paystack_client()
    return client.transaction.verify(reference=reference)
