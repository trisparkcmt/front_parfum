# api/v1/urls/lab_urls.py
from django.urls import include
from catalogue.urls import lab_urlpatterns

urlpatterns = [
    *lab_urlpatterns,
]