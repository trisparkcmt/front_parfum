from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),          # Interface d'administration Django
    path('api/', include('api.urls')),       # Redirection vers l'application API
    path('accounts/', include('allauth.urls')), # Requis pour allauth
]