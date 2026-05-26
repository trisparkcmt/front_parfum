# serializers.py
from decimal import Decimal
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .utils import get_similar_products
from .models import Tag, Parfum, Essence, Accessoire, Flacon, TypeAccessoire, TypeFlacon, Favori, Ingredient

# catalogue/serializers.py (ajouter après les imports existants)

class ParfumSimilaireSerializer(serializers.ModelSerializer):
    prix_actuel = serializers.SerializerMethodField()
    image_principale = serializers.SerializerMethodField()

    class Meta:
        model = Parfum
        fields = ['id', 'nom', 'slug', 'prix_actuel', 'image_principale']

    def get_prix_actuel(self, obj):
        prix = obj.prix_promotionnel or obj.prix_unitaire
        return formater_prix(prix)

    def get_image_principale(self, obj):
        return get_image_url(self.context.get('request'), obj.image_principale)


class AccessoireSimilaireSerializer(serializers.ModelSerializer):
    prix_actuel = serializers.SerializerMethodField()
    image_principale = serializers.SerializerMethodField()

    class Meta:
        model = Accessoire
        fields = ['id', 'nom', 'slug', 'prix_actuel', 'image_principale']

    def get_prix_actuel(self, obj):
        prix = obj.prix_promotionnel or obj.prix_unitaire
        return formater_prix(prix)

    def get_image_principale(self, obj):
        return get_image_url(self.context.get('request'), obj.image_principale)
    

# ============================================================
# HELPER
# ============================================================
def formater_prix(valeur):
    """
    Formate un Decimal en str avec 2 décimales,
    cohérent avec le format DRF (DecimalField → '25000.00').
    """
    return str(valeur.quantize(Decimal('0.01')))

def get_image_url(request, image_field):
    """
    Retourne l'URL absolue d'un ImageField.
    Ex : http://localhost:8000/media/parfums/royal-oud/image.jpg
    Retourne None si pas d'image.
    """
    if not image_field:
        return None
    if request:
        return request.build_absolute_uri(image_field.url)
    return image_field.url



# TAGS

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'nom', 'type']



# PARFUMS

class ParfumSerializer(serializers.ModelSerializer):
    tags                = TagSerializer(many=True, read_only=True)
    famille_olfactive   = serializers.ListField(child=serializers.CharField(), read_only=True)
    humeurs_compatibles = serializers.ListField(child=serializers.CharField(), read_only=True)
    occasions           = serializers.ListField(child=serializers.CharField(), read_only=True)
    saisons_compatibles = serializers.ListField(child=serializers.CharField(), read_only=True)
    prix_actuel         = serializers.SerializerMethodField()
    taux_reduction      = serializers.SerializerMethodField()
    en_promotion        = serializers.SerializerMethodField()
    image_principale    = serializers.SerializerMethodField() 
    produits_similaires = serializers.SerializerMethodField()
    is_favori = serializers.SerializerMethodField()

    class Meta:
        model  = Parfum
        fields = [
            'id', 'nom', 'slug', 'reference_sku',
            'description_courte', 'contenance_ml',
            'prix_unitaire', 'prix_actuel',
            'taux_reduction', 'en_promotion',
            'genre_cible', 'intensite',
            'notes_tete', 'notes_coeur', 'notes_fond',
            'tags', 'famille_olfactive', 'humeurs_compatibles',
            'occasions', 'saisons_compatibles',
            'est_nouveau', 'est_bestseller',
            'image_principale', 'images_supplementaires', 'stock_quantite',
            'date_creation','produits_similaires', 'is_favori',
        ]

    @extend_schema_field(OpenApiTypes.STR)
    def get_prix_actuel(self, obj):
        """
        Retourne le prix final en str formatée '25000.00'.
        Priorité : prix_promotionnel > prix_unitaire.
        Le signal a déjà calculé prix_promotionnel si une réduction catégorie existe.
        """
        prix = obj.prix_promotionnel if obj.prix_promotionnel else obj.prix_unitaire
        return formater_prix(prix)

    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_taux_reduction(self, obj):
        """
        Calcule le taux affiché au client.
        Retourne None si aucune réduction n'est appliquée.
        """
        if not obj.prix_promotionnel:
            return None
        taux = (1 - obj.prix_promotionnel / obj.prix_unitaire) * 100
        return round(float(taux), 1)

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_en_promotion(self, obj):
        return obj.prix_promotionnel is not None
    
    @extend_schema_field(OpenApiTypes.URI)
    def get_image_principale(self, obj):
        return get_image_url(self.context.get('request'), obj.image_principale)
    
    def get_produits_similaires(self, obj):
        from .utils import get_similar_products
        from .models import Parfum
        similaires = get_similar_products(obj, Parfum, limit=4)
        return ParfumSimilaireSerializer(similaires, many=True, context=self.context).data
  
    def get_is_favori(self, obj):
        request = self.context.get('request')
        # On vérifie si l'utilisateur est connecté[cite: 11]
        if request and request.user.is_authenticated:
            try:
                # On récupère le profil client
                client = request.user.client
                # On filtre spécifiquement sur le champ 'parfum' du modèle Favori
                return Favori.objects.filter(client=client, parfum=obj).exists()
            except AttributeError:
                return False
        return False
# ============================================================
# INGREDIENTS
# ============================================================
class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ingredient
        fields = [
            'id', 'nom', 'description',
            'prix_par_ml', 'stock_ml', 'actif',
            'date_creation',
        ]


# ============================================================
# ESSENCES
# ============================================================
class EssenceSerializer(serializers.ModelSerializer):
    tags                             = TagSerializer(many=True, read_only=True)
    famille_olfactive                = serializers.ListField(child=serializers.CharField(), read_only=True)
    humeurs_compatibles              = serializers.ListField(child=serializers.CharField(), read_only=True)
    occasions                        = serializers.ListField(child=serializers.CharField(), read_only=True)
    saisons_compatibles              = serializers.ListField(child=serializers.CharField(), read_only=True)
    signes_astrologiques_compatibles = serializers.ListField(child=serializers.CharField(), read_only=True)
    moments_journee                  = serializers.ListField(child=serializers.CharField(), read_only=True)
    
    class Meta:
        model  = Essence
        fields = [
            'id', 'nom', 'code_reference', 'marque',
            'description', 'description_ia', 'fournisseur', 'origine_pays',
            'stock_flacon', 'contenance_ml', 'stock_ouvert_ml', 'stock_ml_total_reel',
            'seuil_alerte_stock',
            'prix_unitaire_fini', 'prix_par_ml',
            'intensite', 'genre_cible', 'categorie',
            'notes_tete', 'notes_coeur', 'notes_fond',
            'tags', 'famille_olfactive', 'humeurs_compatibles',
            'occasions', 'saisons_compatibles',
            'signes_astrologiques_compatibles', 'moments_journee',
            'actif', 'vendu_comme_produit_fini',
            'date_creation', 'date_modification',
        ]



# ============================================================
# ACCESSOIRES
# ============================================================
class TypeAccessoireSerializer(serializers.ModelSerializer):
    icone = serializers.SerializerMethodField()

    class Meta:
        model  = TypeAccessoire
        fields = ['id', 'nom', 'slug', 'description', 'icone']

    @extend_schema_field(OpenApiTypes.URI)
    def get_icone(self, obj):
     return get_image_url(self.context.get('request'), obj.icone)



class AccessoireSerializer(serializers.ModelSerializer):
    type_accessoire = TypeAccessoireSerializer(read_only=True)
    prix_actuel     = serializers.SerializerMethodField()
    taux_reduction  = serializers.SerializerMethodField()
    en_promotion    = serializers.SerializerMethodField()
    image_principale = serializers.SerializerMethodField()
    produits_similaires = serializers.SerializerMethodField()
    is_favori = serializers.SerializerMethodField()

    class Meta:
        model  = Accessoire
        fields = [
            'id', 'nom', 'slug', 'reference_sku',
            'type_accessoire',
            'description_courte',
            'matiere', 'couleur', 'taille',
            'prix_unitaire', 'prix_actuel',
            'taux_reduction', 'en_promotion',
            'stock_quantite', 'poids_grammes',
            'image_principale', 'images_supplementaires',
            'date_creation','produits_similaires','is_favori',
        ]

    @extend_schema_field(OpenApiTypes.STR)
    def get_prix_actuel(self, obj):
        prix = obj.prix_promotionnel if obj.prix_promotionnel else obj.prix_unitaire
        return formater_prix(prix)

    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_taux_reduction(self, obj):
        if not obj.prix_promotionnel:
            return None
        taux = (1 - obj.prix_promotionnel / obj.prix_unitaire) * 100
        return round(float(taux), 1)

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_en_promotion(self, obj):
        return obj.prix_promotionnel is not None
    
    @extend_schema_field(OpenApiTypes.URI)
    def get_image_principale(self, obj):
        return get_image_url(self.context.get('request'), obj.image_principale)
    
    def get_produits_similaires(self, obj):
        from .utils import get_similar_products
        similaires = get_similar_products(obj, Accessoire, limit=4)
        return AccessoireSimilaireSerializer(similaires, many=True, context=self.context).data
    
    def get_is_favori(self, obj): 
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                client = request.user.client
                # On filtre spécifiquement sur le champ 'accessoire' du modèle Favori
                return Favori.objects.filter(client=client, accessoire=obj).exists()
            except AttributeError:
                return False
        return False

# ============================================================
# FLACONS
# ============================================================
class TypeFlaconSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model  = TypeFlacon
        fields = ['id', 'nom', 'description', 'image']

    @extend_schema_field(OpenApiTypes.URI)
    def get_image(self, obj):
        return get_image_url(self.context.get('request'), obj.image)


class FlaconSerializer(serializers.ModelSerializer):
    
    type_flacon     = TypeFlaconSerializer(read_only=True)
    stock_suffisant = serializers.SerializerMethodField()
    image_principale = serializers.SerializerMethodField() 

    class Meta:
        model  = Flacon
        fields = [
            'id', 'nom', 'reference_sku',
            'type_flacon',
            'contenance_ml',
            'matiere', 'couleur',
            'hauteur_cm', 'largeur_cm', 'poids_grammes',
            'prix_unitaire', 'stock_quantite',
            'seuil_alerte_stock', 'stock_suffisant',
            'image_principale', 'images_supplementaires',
            'date_creation',
        ]

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_stock_suffisant(self, obj) -> bool:
        """
        True  → stock > seuil_alerte_stock (commande possible)
        False → stock ≤ seuil_alerte_stock (commande bloquée)
        """
        return obj.stock_quantite > obj.seuil_alerte_stock
    
    @extend_schema_field(OpenApiTypes.URI)
    def get_image_principale(self, obj):
        return get_image_url(self.context.get('request'), obj.image_principale)
 
#favori 

from .models import Favori   # en haut du fichier

class FavoriSerializer(serializers.ModelSerializer):
    nom_produit = serializers.SerializerMethodField()
    prix_produit = serializers.SerializerMethodField()
    image_produit = serializers.SerializerMethodField()
    type_produit = serializers.SerializerMethodField()
    slug_produit = serializers.SerializerMethodField()
    id_produit = serializers.SerializerMethodField()

    class Meta:
        model = Favori
        fields = ['id', 'date_ajout', 'nom_produit', 'prix_produit', 'image_produit', 'type_produit', 'slug_produit', 'id_produit']

    def get_nom_produit(self, obj):
        if obj.parfum:
            return obj.parfum.nom
        return obj.accessoire.nom if obj.accessoire else None

    def get_prix_produit(self, obj):
        if obj.parfum:
            # Utilise le prix actuel (promotion ou non)
            return str(obj.parfum.prix_actuel)
        if obj.accessoire:
            return str(obj.accessoire.prix_actuel)
        return None

    def get_image_produit(self, obj):
        request = self.context.get('request')
        produit = obj.parfum if obj.parfum else obj.accessoire
        if produit and produit.image_principale:
            if request:
                return request.build_absolute_uri(produit.image_principale.url)
            return produit.image_principale.url
        return None

    def get_type_produit(self, obj):
        return "parfum" if obj.parfum else "accessoire"

    def get_slug_produit(self, obj):
        if obj.parfum:
            return obj.parfum.slug
        return obj.accessoire.slug if obj.accessoire else None

    def get_id_produit(self, obj):
        if obj.parfum:
            return obj.parfum.id
        return obj.accessoire.id if obj.accessoire else None
