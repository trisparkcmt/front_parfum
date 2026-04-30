from django.urls import path

# Imports des views (à remplir quand tu créeras les views)
# from orders.views import ...

urlpatterns = [
    # Panier
    # path('panier/', PanierView.as_view(), name='panier'),
    # path('panier/ajouter/', AjouterAuPanierView.as_view(), name='panier-ajouter'),
    # path('panier/supprimer/<int:pk>/', SupprimerDuPanierView.as_view(), name='panier-supprimer'),

    # Commandes
    # path('commandes/', CommandeListView.as_view(), name='commandes-list'),
    # path('commandes/<str:numero>/', CommandeDetailView.as_view(), name='commande-detail'),
    # path('commandes/passer/', PasserCommandeView.as_view(), name='commande-passer'),

    # Livraisons
    # path('livraisons/', AffectationLivraisonListView.as_view(), name='livraisons-list'),
    # path('livraisons/<int:pk>/statut/', UpdateStatutLivraisonView.as_view(), name='livraison-statut'),
]
