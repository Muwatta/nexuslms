from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            "error": True,
            "message": response.data.get("detail", "An error occurred"),
            "status_code": response.status_code
        }
    
    return response