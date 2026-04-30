from django.urls import path, include

urlpatterns = [
    path('v1/', include('api.v1.urls')),     # Redirection vers la version 1 de l'API
]