from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import ParfumPersonnalise
from api.v1.serializers import (
    ParfumPersonnaliseSerializer, 
    ParfumLabSerializer, 
    EssenceLabSerializer, 
    AccessoireLabSerializer
)
from catalogue.models import Parfum, Essence, Accessoire, Flacon
from .utils_ia import demander_recommandation_ia

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def liste_creer_parfums_perso(request):
    """
    GET: Liste les parfums personnalisés du client connecté
    POST: Crée un nouveau parfum personnalisé
    """
    if not hasattr(request.user, 'client'):
        return Response({"error": "Profil client manquant"}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        parfums = ParfumPersonnalise.objects.filter(client=request.user.client).prefetch_related('lignes__essence')
        serializer = ParfumPersonnaliseSerializer(parfums, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ParfumPersonnaliseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def detail_parfum_perso(request, pk):
    """
    GET: Détails d'un parfum
    PUT/PATCH: Modifier un parfum
    DELETE: Supprimer un parfum
    """
    if not hasattr(request.user, 'client'):
        return Response({"error": "Profil client manquant"}, status=status.HTTP_400_BAD_REQUEST)

    parfum = get_object_or_404(ParfumPersonnalise, pk=pk, client=request.user.client)

    if request.method == 'GET':
        serializer = ParfumPersonnaliseSerializer(parfum)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = ParfumPersonnaliseSerializer(parfum, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        parfum.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculer_prix_parfum(request, pk):
    """
    Action pour recalculer le prix total d'un parfum
    """
    if not hasattr(request.user, 'client'):
        return Response({"error": "Profil client manquant"}, status=status.HTTP_400_BAD_REQUEST)

    parfum = get_object_or_404(ParfumPersonnalise, pk=pk, client=request.user.client)
    parfum.recalculer_prix()
    
    return Response({
        'status': 'prix recalculé',
        'prix_essences': parfum.prix_essences,
        'prix_total': parfum.prix_total
    })

@api_view(['POST'])
@permission_classes([AllowAny]) # On peut laisser ça public pour attirer les clients
def ia_recommandation(request):
    """
    Reçoit un prompt de l'utilisateur, interroge l'IA Gemini et renvoie des produits.
    """
    prompt = request.data.get('prompt')
    if not prompt:
        return Response({"error": "Veuillez fournir un 'prompt'."}, status=status.HTTP_400_BAD_REQUEST)
        
    # Appel à l'IA
    reponse_ia = demander_recommandation_ia(prompt)
    
    if "error" in reponse_ia:
        return Response(reponse_ia, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Récupération des données
    ids_parfums = reponse_ia.get('parfums', [])
    essences_data = reponse_ia.get('essences', [])
    ids_accessoires = reponse_ia.get('accessoires', [])
    flacon_id = reponse_ia.get('flacon_id')
    quantite_demandee_ml = reponse_ia.get('quantite_demandee_ml', 50)
    
    # Récupération des objets en BD
    parfums = Parfum.objects.filter(id__in=ids_parfums, actif=True)
    accessoires = Accessoire.objects.filter(id__in=ids_accessoires, actif=True)
    flacon = None
    
    # Récupération du flacon recommandé
    if flacon_id:
        try:
            flacon = Flacon.objects.get(id=flacon_id, actif=True)
        except Flacon.DoesNotExist:
            flacon = None
    
    # Traitement des essences avec quantités
    essences_recommandees = []
    essence_ids = [e.get('id') for e in essences_data if isinstance(e, dict)]
    essences_db = {e.id: e for e in Essence.objects.filter(id__in=essence_ids, actif=True)}
    
    for essence_data in essences_data:
        if isinstance(essence_data, dict):
            essence_id = essence_data.get('id')
            quantite_ml = essence_data.get('quantite_ml', 0)
            if essence_id in essences_db:
                essence = essences_db[essence_id]
                essences_recommandees.append({
                    'id': essence.id,
                    'nom': essence.nom,
                    'code_reference': essence.code_reference,
                    'prix_par_10ml': str(essence.prix_par_10ml),
                    'quantite_ml': quantite_ml,
                    'prix_total_quantite': str((essence.prix_par_10ml * quantite_ml) / 10)
                })
    
    # Construction de la réponse
    response_data = {
        "message": reponse_ia.get("message", "Voici quelques recommandations :"),
        "quantite_demandee_ml": quantite_demandee_ml,
        "flacon": {
            "id": flacon.id,
            "nom": flacon.nom,
            "contenance_ml": flacon.contenance_ml,
            "prix_unitaire": str(flacon.prix_unitaire)
        } if flacon else None,
        "parfums": ParfumLabSerializer(parfums, many=True).data,
        "essences": essences_recommandees,
        "accessoires": AccessoireLabSerializer(accessoires, many=True).data
    }
    
    return Response(response_data)
