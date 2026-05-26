from django.urls import path, include
from rest_framework.routers import DefaultRouter
from laboratoire.views import (
    ParfumPersonnaliseViewSet,
    EssencePersonnaliseeViewSet,
    ia_recommandation,
)
from catalogue.urls import lab_urlpatterns

router = DefaultRouter()
router.register(r'parfums-perso', ParfumPersonnaliseViewSet, basename='parfumpersonnalise')
router.register(r'essences-perso', EssencePersonnaliseeViewSet, basename='essencepersonnalisee')

urlpatterns = [
    path('ia-recommandation/', ia_recommandation, name='ia-recommandation'),
    path('', include(router.urls)),
    path('', include(lab_urlpatterns)),
]

