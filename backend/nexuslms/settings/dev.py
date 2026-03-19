from .base import *

DEBUG = True

# Development hosts
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# Disable HTTPS requirements for local development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0

# Cookie security for development (HTTP allowed)
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# SimpleJWT cookie settings for development
SIMPLE_JWT['AUTH_COOKIE_SECURE'] = False

# CORS: Allow all common development origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']