
from django.urls import path
from laboratoire.views import (
    liste_creer_parfums_perso, 
    detail_parfum_perso, 
    recalculer_prix_parfum,
    ia_recommandation,
    liste_creer_essences_perso,
    detail_essence_perso
)

urlpatterns = [
    # Liste et Création
    path('parfums-perso/', liste_creer_parfums_perso, name='parfum-perso-liste'),
    
    # Détail, Modification et Suppression
    path('parfums-perso/<int:pk>/', detail_parfum_perso, name='parfum-perso-detail'),
    
    # Action spécifique : Recalculer le prix
    path('parfums-perso/<int:pk>/recalculer/', recalculer_prix_parfum, name='parfum-perso-recalculer'),
    
    # IA Recommandation
    path('ia-recommandation/', ia_recommandation, name='ia-recommandation'),
    
    # Essences Personnalisées
    path('essences-perso/', liste_creer_essences_perso, name='essence-perso-liste'),
    path('essences-perso/<int:pk>/', detail_essence_perso, name='essence-perso-detail'),
]

