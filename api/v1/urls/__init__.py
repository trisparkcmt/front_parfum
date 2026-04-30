from django.urls import path, include

urlpatterns = [
    path('auth/', include('api.v1.urls.auth_urls')),    # Connexion, Inscription
    path('shop/', include('api.v1.urls.shop_urls')),    # Parfums, Accessoires
    path('lab/', include('api.v1.urls.lab_urls')),      # DIY, IA, Essences
    path('orders/', include('api.v1.urls.order_urls')), # Paniers, Livraisons
]
