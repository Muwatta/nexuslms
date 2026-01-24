from django.apps import AppConfig

class ApiTestingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api_testing"

    def ready(self):
        import api_testing.signals
