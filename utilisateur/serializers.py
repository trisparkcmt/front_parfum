from rest_framework import serializers
from .models import User, Client, Prestataire, CommissionLog

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
