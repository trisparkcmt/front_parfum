from rest_framework import serializers
from catalogue.models import Essence, Flacon, Accessoire, Parfum
from laboratoire.models import ParfumPersonnalise, ParfumPersonnaliseLigne
from django.db import transaction
from decimal import Decimal

class EssenceLabSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les essences dans le labo"""
    class Meta:
        model = Essence
        fields = ['id', 'nom', 'code_reference', 'prix_par_10ml']
        read_only_fields = fields

class FlaconLabSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les flacons dans le labo"""
    class Meta:
        model = Flacon
        fields = ['id', 'nom', 'contenance_ml', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class AccessoireLabSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les accessoires"""
    class Meta:
        model = Accessoire
        fields = ['id', 'nom', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class ParfumLabSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les parfums"""
    class Meta:
        model = Parfum
        fields = ['id', 'nom', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class ParfumPersonnaliseLigneSerializer(serializers.ModelSerializer):
    essence_detail = EssenceLabSerializer(source='essence', read_only=True)
    
    class Meta:
        model = ParfumPersonnaliseLigne
        fields = ['id', 'essence', 'essence_detail', 'quantite_ml', 'prix_par_ml_snapshot', 'prix_ligne']
        read_only_fields = ['prix_par_ml_snapshot', 'prix_ligne']

class ParfumPersonnaliseSerializer(serializers.ModelSerializer):
    lignes = ParfumPersonnaliseLigneSerializer(many=True)
    flacon_detail = FlaconLabSerializer(source='flacon', read_only=True)
    
    class Meta:
        model = ParfumPersonnalise
        fields = [
            'id', 'client', 'flacon', 'flacon_detail', 'nom', 'description', 
            'contenance_ml', 'prix_essences', 'prix_flacon_snapshot', 
            'prix_total', 'statut', 'note_laboratoire', 'lignes', 'date_creation'
        ]
        read_only_fields = ['client', 'prix_essences', 'prix_flacon_snapshot', 'prix_total', 'statut', 'note_laboratoire']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        request = self.context.get('request')
        
        # Sécurité : on s'assure que l'utilisateur est un client
        if not request or not hasattr(request.user, 'client'):
            raise serializers.ValidationError("L'utilisateur doit avoir un profil client.")
            
        client = request.user.client
        
        # On récupère le prix du flacon au moment de la création
        flacon = validated_data.get('flacon')
        validated_data['prix_flacon_snapshot'] = flacon.prix_unitaire if flacon else Decimal('0')
        
        # Valeurs par défaut pour les prix avant calcul
        validated_data['prix_essences'] = Decimal('0')
        validated_data['prix_total'] = Decimal('0')
        
        with transaction.atomic():
            parfum = ParfumPersonnalise.objects.create(client=client, **validated_data)
            for ligne_data in lignes_data:
                ParfumPersonnaliseLigne.objects.create(parfum_personnalise=parfum, **ligne_data)
            
            # Recalcul du prix total après création des lignes
            parfum.recalculer_prix()
            
        return parfum
