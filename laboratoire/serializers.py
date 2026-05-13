from rest_framework import serializers
from catalogue.models import Essence, Flacon, Accessoire, Parfum, Ingredient
from laboratoire.models import ParfumPersonnalise, ParfumPersonnaliseLigne, EssencePersonnalisee, EssencePersonnaliseeLigne
from django.db import transaction
from decimal import Decimal

class EssenceLabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Essence
        fields = ['id', 'nom', 'code_reference', 'prix_par_ml']
        read_only_fields = fields

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'nom', 'description', 'note_olfactive', 'prix_par_ml']
        read_only_fields = fields

class FlaconLabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flacon
        fields = ['id', 'nom', 'contenance_ml', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class AccessoireLabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessoire
        fields = ['id', 'nom', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class ParfumLabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parfum
        fields = ['id', 'nom', 'prix_unitaire', 'image_principale']
        read_only_fields = fields

class EssencePersonnaliseeLigneSerializer(serializers.ModelSerializer):
    ingredient_detail = IngredientSerializer(source='ingredient', read_only=True)
    ingredient = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all())

    class Meta:
        model = EssencePersonnaliseeLigne
        fields = ['id', 'ingredient', 'ingredient_detail', 'quantite_ml', 'prix_ligne']
        read_only_fields = ['prix_ligne']

class EssencePersonnaliseeSerializer(serializers.ModelSerializer):
    lignes = EssencePersonnaliseeLigneSerializer(many=True)

    class Meta:
        model = EssencePersonnalisee
        fields = ['id', 'nom', 'prix_par_ml_calcule', 'lignes', 'date_creation']
        read_only_fields = ['prix_par_ml_calcule']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        request = self.context.get('request')
        
        if not request or not hasattr(request.user, 'client'):
            raise serializers.ValidationError("L'utilisateur doit avoir un profil client.")
            
        client = request.user.client

        with transaction.atomic():
            essence_perso = EssencePersonnalisee.objects.create(client=client, **validated_data)
            for ligne_data in lignes_data:
                EssencePersonnaliseeLigne.objects.create(essence_personnalisee=essence_perso, **ligne_data)
            
            essence_perso.recalculer_prix()
            
        return essence_perso


class ParfumPersonnaliseLigneSerializer(serializers.ModelSerializer):
    essence_catalogue_detail = EssenceLabSerializer(source='essence_catalogue', read_only=True)
    essence_personnalisee_detail = EssencePersonnaliseeSerializer(source='essence_personnalisee', read_only=True)
    
    essence_catalogue = serializers.PrimaryKeyRelatedField(queryset=Essence.objects.all(), required=False, allow_null=True)
    essence_personnalisee = serializers.PrimaryKeyRelatedField(queryset=EssencePersonnalisee.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ParfumPersonnaliseLigne
        fields = [
            'id', 'essence_catalogue', 'essence_personnalisee', 
            'essence_catalogue_detail', 'essence_personnalisee_detail', 
            'quantite_ml', 'prix_par_ml_snapshot', 'prix_ligne'
        ]
        read_only_fields = ['prix_par_ml_snapshot', 'prix_ligne']

    def validate(self, data):
        # Vérifier qu'une et une seule essence est fournie
        essence_cat = data.get('essence_catalogue')
        essence_perso = data.get('essence_personnalisee')
        
        if essence_cat and essence_perso:
            raise serializers.ValidationError("Vous ne pouvez pas fournir à la fois une essence du catalogue et une essence personnalisée pour la même ligne.")
        if not essence_cat and not essence_perso:
            raise serializers.ValidationError("Vous devez fournir soit une essence du catalogue, soit une essence personnalisée.")
        return data


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

    def validate_volume_essences(self, flacon, lignes_data):
        if not flacon:
            raise serializers.ValidationError("Un flacon est requis.")
            
        contenance_flacon = Decimal(str(flacon.contenance_ml))
        volume_max_autorise = contenance_flacon * Decimal('0.45')
        
        volume_total_essences = sum(Decimal(str(ligne.get('quantite_ml', 0))) for ligne in lignes_data)
        
        if volume_total_essences > volume_max_autorise:
            raise serializers.ValidationError({
                "lignes": f"La quantité totale d'essences ({volume_total_essences}ml) dépasse les 45% autorisés pour ce flacon ({volume_max_autorise}ml max)."
            })

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        request = self.context.get('request')
        
        if not request or not hasattr(request.user, 'client'):
            raise serializers.ValidationError("L'utilisateur doit avoir un profil client.")
            
        client = request.user.client
        flacon = validated_data.get('flacon')
        
        # Validation de la règle des 45%
        self.validate_volume_essences(flacon, lignes_data)
        
        validated_data['prix_flacon_snapshot'] = flacon.prix_unitaire if flacon else Decimal('0')
        validated_data['prix_essences'] = Decimal('0')
        validated_data['prix_total'] = Decimal('0')
        
        with transaction.atomic():
            parfum = ParfumPersonnalise.objects.create(client=client, **validated_data)
            for ligne_data in lignes_data:
                ParfumPersonnaliseLigne.objects.create(parfum_personnalise=parfum, **ligne_data)
            
            parfum.recalculer_prix()
            
        return parfum

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        request = self.context.get('request')

        if not request or not hasattr(request.user, 'client'):
            raise serializers.ValidationError("L'utilisateur doit avoir un profil client.")

        if 'flacon' in validated_data:
            flacon = validated_data.get('flacon')
            validated_data['prix_flacon_snapshot'] = flacon.prix_unitaire if flacon else Decimal('0')

        with transaction.atomic():
            parfum = super().update(instance, validated_data)

            if lignes_data is not None:
                # Validation de la règle des 45% lors de la modification
                flacon = parfum.flacon
                self.validate_volume_essences(flacon, lignes_data)
                
                existing_lignes = {ligne.id: ligne for ligne in parfum.lignes.all()}
                sent_ids = []

                for ligne_data in lignes_data:
                    ligne_id = ligne_data.get('id')
                    if ligne_id:
                        if ligne_id not in existing_lignes:
                            raise serializers.ValidationError(f"Ligne de parfum personnalisé introuvable : {ligne_id}")
                        sent_ids.append(ligne_id)
                        ligne = existing_lignes[ligne_id]
                        
                        ligne.essence_catalogue = ligne_data.get('essence_catalogue', ligne.essence_catalogue)
                        ligne.essence_personnalisee = ligne_data.get('essence_personnalisee', ligne.essence_personnalisee)
                        ligne.quantite_ml = ligne_data.get('quantite_ml', ligne.quantite_ml)
                        
                        # Réinitialiser le snapshot si l'essence change
                        ligne.prix_par_ml_snapshot = None 
                        ligne.save()
                    else:
                        ParfumPersonnaliseLigne.objects.create(parfum_personnalise=parfum, **ligne_data)

                for ligne_id, ligne in existing_lignes.items():
                    if ligne_id not in sent_ids:
                        ligne.delete()

            parfum.recalculer_prix()

        return parfum
