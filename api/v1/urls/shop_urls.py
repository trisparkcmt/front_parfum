# api/v1/urls/shop_urls.py
from django.urls import include
from catalogue.urls import shop_urlpatterns

urlpatterns = [
    *shop_urlpatterns,
]