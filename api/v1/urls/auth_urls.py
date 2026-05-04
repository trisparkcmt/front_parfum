from django.urls import path, include
from utilisateur.views import (
    manage_me, GoogleLogin, apply_prestataire, 
    list_prestataire_requests, validate_prestataire,
    prestataire_dashboard,
    # Admin views
    admin_users_list, admin_user_toggle_status,
    admin_prestataires_list, admin_prestataire_update,
    admin_global_stats
)

urlpatterns = [
    # Authentification classique
    path('', include('dj_rest_auth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),

    # Authentification Google
    path('google/', GoogleLogin.as_view(), name='google_login'),

    # Profil utilisateur personnalisé
    path('me/', manage_me, name='me'),

    # Workflow Prestataire (Côté Client)
    path('prestataire/apply/', apply_prestataire, name='prestataire-apply'),
    path('prestataire/dashboard/', prestataire_dashboard, name='prestataire-dashboard'),

    # ADMINISTRATION (Routes réservées aux Admin)
    path('admin/users/', admin_users_list, name='admin-users-list'),
    path('admin/users/<int:pk>/toggle-status/', admin_user_toggle_status, name='admin-user-toggle-status'),
    path('admin/prestataires/', admin_prestataires_list, name='admin-prestataires-list'),
    path('admin/prestataires/validate/<int:pk>/', validate_prestataire, name='admin-prestataire-validate'),
    path('admin/prestataires/<int:pk>/update/', admin_prestataire_update, name='admin-prestataire-update'),
    path('admin/stats/global/', admin_global_stats, name='admin-global-stats'),
]