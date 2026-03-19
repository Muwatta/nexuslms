# backend/api/pagination.py


from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    
    page_size              = 100
    page_size_query_param  = "page_size"
    max_page_size          = 200


class AdminUserPagination(PageNumberPagination):
   
    page_size              = 50
    page_size_query_param  = "page_size"
    max_page_size          = 200


class CoursePagination(PageNumberPagination):
    
    page_size              = 200
    page_size_query_param  = "page_size"
    max_page_size          = 1000


class EnrollmentPagination(PageNumberPagination):
    
    page_size              = 200
    page_size_query_param  = "page_size"
    max_page_size          = 500


class AuditLogPagination(PageNumberPagination):
    
    page_size              = 50
    page_size_query_param  = "page_size"
    max_page_size          = 200


class SmallPagination(PageNumberPagination):
   
    page_size              = 20
    page_size_query_param  = "page_size"
    max_page_size          = 100


class LargePagination(PageNumberPagination):
  
    page_size              = 500
    page_size_query_param  = "page_size"
    max_page_size          = 1000