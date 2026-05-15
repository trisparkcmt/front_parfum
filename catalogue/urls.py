# catalogue/urls.py
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, ParfumViewSet, EssenceViewSet, AccessoireViewSet, FlaconViewSet, FavoriViewSet

# ============================================================
# ROUTER SHOP — /api/shop/...
# Parfums, Accessoires, Flacons
# ============================================================
shop_router = DefaultRouter()
shop_router.register(r'parfums',     ParfumViewSet,     basename='parfum')
shop_router.register(r'accessoires', AccessoireViewSet, basename='accessoire')
shop_router.register(r'flacons',     FlaconViewSet,     basename='flacon')
shop_router.register(r'favoris', FavoriViewSet, basename='favori')
# ============================================================
# ROUTER LAB — /api/lab/...
# Essences
# ============================================================
lab_router = DefaultRouter()
lab_router.register(r'essences', EssenceViewSet, basename='essence')
lab_router.register(r'ingredients', IngredientViewSet, basename='ingredient')

# Exportés et utilisés dans shop_urls.py et lab_urls.py
shop_urlpatterns = shop_router.urls
lab_urlpatterns  = lab_router.urls

# urlpatterns vide ici — chaque router est branché dans son fichier dédié
urlpatterns = []