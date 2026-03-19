from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the token from HttpOnly cookies
    instead of the Authorization header.
    """
    
    def authenticate(self, request):
        # Try to get token from cookie first
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        # Fall back to standard header-based auth if no cookie
        return super().authenticate(request)