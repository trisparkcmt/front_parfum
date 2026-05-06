from django.contrib import admin
from django.conf.urls.static import static
from django.conf import settings
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),          # Interface d'administration Django
    path('api/', include('api.urls')),       # Redirection vers l'application API
    path('accounts/', include('allauth.urls')), # Requis pour allauth

    

     # Schéma brut (JSON/YAML)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Interface Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Interface Redoc (alternative plus lisible)
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] 

# Uniquement en mode développement (DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
