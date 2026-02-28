import os

ENV = os.getenv("DJANGO_ENV", "dev").lower()

if ENV == "prod":
    from .prod import *
else:
    from .dev import *
