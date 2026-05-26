from django.urls import path
from .views import admin_notifications, detail_prestataire_request, list_prestataire_requests

urlpatterns = [
    path('notifications/', admin_notifications, name='admin-notifications'),
    path('prestataire-requests/', list_prestataire_requests, name='prestataire-requests'),
    path('prestataire-requests/<int:pk>/', detail_prestataire_request, name='prestataire-request-detail'),
]
