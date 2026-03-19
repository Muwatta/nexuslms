# backend/nexuslms/settings/__init__.py
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

# Determine which settings file to use based on DJANGO_ENV
ENVIRONMENT = os.getenv('DJANGO_ENV', 'dev')

if ENVIRONMENT == 'prod':
    from .prod import *
elif ENVIRONMENT == 'dev':
    from .dev import *
else:
    from .base import *