# pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
 
 
class StandardPagination(PageNumberPagination):
    page_size             = 50
    page_size_query_param = 'limit'   # ?limit=20 pour surcharger
    max_page_size         = 100
 
    def get_paginated_response(self, data):
        return Response({
            'count'        : self.page.paginator.count,
            'pages'        : self.page.paginator.num_pages,
            'page_actuelle': self.page.number,
            'suivant'      : self.get_next_link(),
            'precedent'    : self.get_previous_link(),
            'resultats'    : data,
        })
