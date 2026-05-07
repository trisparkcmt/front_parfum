from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import authenticate
from django.urls import reverse
from dj_rest_auth.serializers import LoginSerializer
from .models import User, Client, Prestataire, CommissionLog
from catalogue.models import Favori
from laboratoire.models import ParfumPersonnalise, ParfumPersonnaliseLigne
from orders.models import (
    Commande,
    CommandeLigneAccessoire,
    CommandeLigneParfum,
    CommandeLigneParfumPerso,
)


class EmailOrTelephoneLoginSerializer(LoginSerializer):
    """Connexion avec email ou téléphone sans changer l'inscription."""
    email = serializers.CharField(required=False, allow_blank=True)
    telephone = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        identifier = (
            attrs.get('email')
            or attrs.get('telephone')
            or attrs.get('username')
        )
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError(
                'Veuillez fournir un email ou un téléphone avec le mot de passe.'
            )

        user = self._get_user(identifier)
        if not user:
            raise serializers.ValidationError('Identifiants invalides.')

        authenticated_user = authenticate(
            self.context['request'],
            email=user.email,
            password=password
        )
        if not authenticated_user:
            raise serializers.ValidationError('Identifiants invalides.')

        self.validate_auth_user_status(authenticated_user)
        if 'dj_rest_auth.registration' in settings.INSTALLED_APPS:
            self.validate_email_verification_status(authenticated_user, email=authenticated_user.email)

        attrs['user'] = authenticated_user
        return attrs

    def _get_user(self, identifier):
        identifier = identifier.strip()
        lookup = {'email__iexact': identifier} if '@' in identifier else {'telephone': identifier}
        try:
            return User.objects.get(**lookup)
        except User.DoesNotExist:
            return None

class CommissionLogSerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des gains"""
    class Meta:
        model = CommissionLog
        fields = ['id', 'type_operation', 'montant', 'reference_commande', 'date_operation', 'description']

class PrestataireDashboardSerializer(serializers.ModelSerializer):
    """Serializer pour le résumé du dashboard prestataire"""
    historique = CommissionLogSerializer(source='historique_commissions', many=True, read_only=True)
    
    class Meta:
        model = Prestataire
        fields = ['solde_commission', 'taux_commission', 'code_promo', 'statut', 'historique']


class PrestataireApplicationSerializer(serializers.ModelSerializer):
    """Serializer pour la demande initiale de l'utilisateur"""
    class Meta:
        model = Prestataire
        fields = [] # L'utilisateur ne remplit rien, on crée juste l'objet en attente

class PrestataireValidationSerializer(serializers.ModelSerializer):
    """Serializer pour la validation par l'administrateur"""
    class Meta:
        model = Prestataire
        fields = ['taux_commission'] # L'admin doit obligatoirement remplir le taux
        extra_kwargs = {
            'taux_commission': {'required': True}
        }

class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les données de base de l'utilisateur"""
    class Meta:
        model = User
        fields = ['id', 'email', 'telephone', 'first_name', 'last_name', 'role']
        read_only_fields = ['role'] # Le rôle reste non-modifiable, mais l'email l'est désormais

class ClientSerializer(serializers.ModelSerializer):
    """Serializer pour le profil Client complet"""
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Client
        fields = ['id', 'user_details', 'date_naissance', 'genre', 'points_fidelite']


class MeClientSerializer(serializers.ModelSerializer):
    """Données client rattachées au profil connecté."""
    class Meta:
        model = Client
        fields = ['id', 'date_naissance', 'genre', 'points_fidelite', 'date_creation']


class MeFavoriSerializer(serializers.ModelSerializer):
    type_produit = serializers.SerializerMethodField()
    produit_id = serializers.SerializerMethodField()
    nom_produit = serializers.SerializerMethodField()
    prix_produit = serializers.SerializerMethodField()
    image_produit = serializers.SerializerMethodField()
    detail_url = serializers.SerializerMethodField()

    class Meta:
        model = Favori
        fields = [
            'id', 'type_produit', 'produit_id', 'nom_produit',
            'prix_produit', 'image_produit', 'detail_url', 'date_ajout'
        ]

    def get_type_produit(self, obj):
        return 'parfum' if obj.parfum_id else 'accessoire'

    def get_produit_id(self, obj):
        if obj.parfum_id:
            return obj.parfum_id
        return obj.accessoire_id

    def get_nom_produit(self, obj):
        produit = obj.parfum or obj.accessoire
        return produit.nom if produit else None

    def get_prix_produit(self, obj):
        produit = obj.parfum or obj.accessoire
        return str(produit.prix_actuel) if produit else None

    def get_image_produit(self, obj):
        produit = obj.parfum or obj.accessoire
        image = getattr(produit, 'image_principale', None)
        if not image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(image.url)
        return image.url

    def get_detail_url(self, obj):
        produit = obj.parfum or obj.accessoire
        if not produit:
            return None

        if obj.parfum_id:
            url = reverse('parfum-detail', kwargs={'slug': produit.slug})
        else:
            url = reverse('accessoire-detail', kwargs={'slug': produit.slug})

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url


class MeParfumPersonnaliseLigneSerializer(serializers.ModelSerializer):
    essence_id = serializers.IntegerField(source='essence.id', read_only=True)
    essence_nom = serializers.CharField(source='essence.nom', read_only=True)

    class Meta:
        model = ParfumPersonnaliseLigne
        fields = [
            'id', 'essence_id', 'essence_nom', 'quantite_ml',
            'prix_par_ml_snapshot', 'prix_ligne'
        ]


class MeParfumPersonnaliseSerializer(serializers.ModelSerializer):
    flacon_id = serializers.IntegerField(source='flacon.id', read_only=True)
    flacon_nom = serializers.CharField(source='flacon.nom', read_only=True)
    lignes = MeParfumPersonnaliseLigneSerializer(many=True, read_only=True)
    detail_url = serializers.SerializerMethodField()

    class Meta:
        model = ParfumPersonnalise
        fields = [
            'id', 'nom', 'description', 'detail_url', 'flacon_id', 'flacon_nom',
            'contenance_ml', 'prix_essences', 'prix_flacon_snapshot',
            'prix_total', 'statut', 'note_laboratoire', 'lignes',
            'date_creation', 'date_modification'
        ]

    def get_detail_url(self, obj):
        return None


class MeCommandeLigneParfumSerializer(serializers.ModelSerializer):
    parfum_id = serializers.IntegerField(source='parfum.id', read_only=True)

    class Meta:
        model = CommandeLigneParfum
        fields = [
            'id', 'parfum_id', 'nom_snapshot', 'quantite',
            'prix_unitaire_snapshot', 'remise_ligne', 'sous_total',
            'mouvement_stock_genere'
        ]


class MeCommandeLigneParfumPersoSerializer(serializers.ModelSerializer):
    parfum_personnalise_id = serializers.IntegerField(source='parfum_personnalise.id', read_only=True)
    parfum_personnalise_nom = serializers.CharField(source='parfum_personnalise.nom', read_only=True)

    class Meta:
        model = CommandeLigneParfumPerso
        fields = [
            'id', 'parfum_personnalise_id', 'parfum_personnalise_nom',
            'quantite', 'prix_snapshot', 'sous_total', 'statut_laboratoire',
            'proportions_mises_a_jour', 'note_laboratoire'
        ]


class MeCommandeLigneAccessoireSerializer(serializers.ModelSerializer):
    accessoire_id = serializers.IntegerField(source='accessoire.id', read_only=True)

    class Meta:
        model = CommandeLigneAccessoire
        fields = [
            'id', 'accessoire_id', 'nom_snapshot', 'quantite',
            'prix_unitaire_snapshot', 'remise_ligne', 'sous_total',
            'mouvement_stock_genere'
        ]


class MeCommandeSerializer(serializers.ModelSerializer):
    lignes_parfums = MeCommandeLigneParfumSerializer(many=True, read_only=True)
    lignes_parfums_perso = MeCommandeLigneParfumPersoSerializer(many=True, read_only=True)
    lignes_accessoires = MeCommandeLigneAccessoireSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'numero_commande', 'statut', 'statut_livraison',
            'statut_paiement', 'methode_paiement', 'sous_total',
            'remise_code_promo', 'code_promo_utilise', 'frais_livraison',
            'total_ttc', 'livraison_nom_complet', 'livraison_quartier',
            'livraison_ville', 'livraison_telephone',
            'date_livraison_estimee', 'date_livraison_reelle',
            'note_client', 'lignes_parfums', 'lignes_parfums_perso',
            'lignes_accessoires', 'date_creation', 'date_modification'
        ]


class MeSerializer(serializers.ModelSerializer):
    user = UserSerializer(source='*', read_only=True)
    client = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()
    favoris = serializers.SerializerMethodField()
    parfums_personnalises = serializers.SerializerMethodField()
    commandes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user', 'client', 'preferences', 'favoris', 'parfums_personnalises', 'commandes']

    def _get_client(self, obj):
        return getattr(obj, 'client', None)

    def get_client(self, obj):
        client = self._get_client(obj)
        if not client:
            return None
        return MeClientSerializer(client).data

    def get_favoris(self, obj):
        client = self._get_client(obj)
        if not client:
            return []
        return MeFavoriSerializer(
            client.favoris.all(),
            many=True,
            context=self.context
        ).data

    def get_preferences(self, obj):
        client = self._get_client(obj)
        preferences = {
            'familles_olfactives': [],
            'humeurs': [],
            'saisons': [],
            'occasions': [],
            'signes_astrologiques': [],
            'moments_journee': [],
            'genres': [],
        }
        if not client:
            return preferences

        tag_mapping = {
            'famille_olfactive': 'familles_olfactives',
            'humeur': 'humeurs',
            'saison': 'saisons',
            'occasion': 'occasions',
            'signe_astrologique': 'signes_astrologiques',
            'moment_journee': 'moments_journee',
        }
        values = {key: set() for key in preferences}

        for favori in client.favoris.all():
            parfum = favori.parfum
            if not parfum:
                continue
            if parfum.genre_cible:
                values['genres'].add(parfum.genre_cible)
            for tag in parfum.tags.all():
                target = tag_mapping.get(tag.type)
                if target:
                    values[target].add(tag.nom)

        return {key: sorted(value) for key, value in values.items()}

    def get_parfums_personnalises(self, obj):
        client = self._get_client(obj)
        if not client:
            return []
        return MeParfumPersonnaliseSerializer(
            client.parfums_personnalises.all(),
            many=True
        ).data

    def get_commandes(self, obj):
        client = self._get_client(obj)
        if not client:
            return []
        return MeCommandeSerializer(
            client.commandes.all(),
            many=True
        ).data


class PrestataireSerializer(serializers.ModelSerializer):
    """Serializer complet pour l'affichage (Admin)"""
    user_details = UserSerializer(source='client.user', read_only=True)
    class Meta:
        model = Prestataire
        fields = '__all__'

# ============================================================
# SERIALIZERS ADMINISTRATION
# ============================================================

class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer ultra-complet pour l'administration des utilisateurs"""
    is_prestataire = serializers.SerializerMethodField()
    prestataire_statut = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'telephone', 'first_name', 'last_name', 
            'role', 'is_active', 'is_staff', 'date_joined', 
            'is_prestataire', 'prestataire_statut'
        ]

    def get_is_prestataire(self, obj):
        return hasattr(obj, 'client') and hasattr(obj.client, 'prestataire')

    def get_prestataire_statut(self, obj):
        if hasattr(obj, 'client') and hasattr(obj.client, 'prestataire'):
            return obj.client.prestataire.statut
        return None

class AdminPrestataireUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour modifier un prestataire depuis l'admin"""
    class Meta:
        model = Prestataire
        fields = ['taux_commission', 'statut']
