from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.db.models import Q, Sum
from .serializers import UserSerializer, PrestataireSerializer, PrestataireApplicationSerializer, PrestataireValidationSerializer, MeSerializer
from .models import Prestataire, User
import random
import string

#==============================utils================================

def generate_promo_code(length=8):
    """Génère un code promo unique de type ACC-XXXXXX"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(chars) for _ in range(length))
    return f"ACC-{code}"

class AdminPagination(PageNumberPagination):
    """Configuration de la pagination pour l'admin (50 par page)"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

#==============================utilisateur==========================

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def manage_me(request):
    """
    Permet à l'utilisateur connecté de voir ou modifier son profil.
    """
    user = request.user

    if request.method == 'GET':
        user = (
            User.objects
            .select_related('client')
            .prefetch_related(
                'client__favoris__parfum__tags',
                'client__favoris__accessoire',
                'client__parfums_personnalises__flacon',
                'client__parfums_personnalises__lignes__essence',
                'client__commandes__lignes_parfums__parfum',
                'client__commandes__lignes_parfums_perso__parfum_personnalise',
                'client__commandes__lignes_accessoires__accessoire',
            )
            .get(pk=user.pk)
        )
        serializer = MeSerializer(user, context={'request': request})
        return Response(serializer.data) 

    elif request.method in ['PUT', 'PATCH']:
        # Sécurité : Si l'utilisateur change son email, on demande son mot de passe actuel
        new_email = request.data.get('email')
        if new_email and new_email != user.email:
            if user.has_usable_password():
                current_password = request.data.get('current_password')
                if not current_password or not user.check_password(current_password):
                    return Response(
                        {"detail": "Le mot de passe actuel est requis pour modifier l'adresse email."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        partial = request.method == 'PATCH'
        serializer = UserSerializer(user, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#==============================prestataire==========================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_prestataire(request):
    """
    Endpoint pour qu'un utilisateur postule en tant que prestataire.
    """
    user = request.user
    
    # Sécurité : On s'assure que le profil Client existe (au cas où le signal aurait échoué)
    from .models import Client
    client, _ = Client.objects.get_or_create(user=user)
    
    if hasattr(client, 'prestataire'):
        return Response({"detail": "Vous avez déjà une demande en cours ou êtes déjà prestataire."}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PrestataireApplicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(client=user.client, statut='en_attente')
        send_mail(
            "Demande de partenariat reçue",
            f"Bonjour {user.first_name}, votre demande pour devenir prestataire est bien reçue.",
            "noreply@accessoire-exclusif.com",
            [user.email],
            fail_silently=True,
        )
        return Response({"detail": "Demande envoyée avec succès."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_prestataire_requests(request):
    """
    Liste toutes les demandes en attente (Réservé à l'Admin).
    """
    requests = Prestataire.objects.filter(statut='en_attente')
    serializer = PrestataireSerializer(requests, many=True)
    return Response(serializer.data)

from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def validate_prestataire(request, pk):
    """
    Endpoint pour valider un prestataire (Réservé à l'Admin).
    L'admin doit fournir le taux_commission.
    """
    prestataire = get_object_or_404(Prestataire, pk=pk)
    
    if prestataire.statut != 'en_attente':
        return Response({"detail": "Ce prestataire a déjà été traité."}, status=status.HTTP_400_BAD_REQUEST)
        
    serializer = PrestataireValidationSerializer(prestataire, data=request.data, partial=True)
    if serializer.is_valid():
        # Génération du code promo et activation
        promo_code = generate_promo_code()
        prestataire = serializer.save(statut='actif', code_promo=promo_code)
        
        # EMAIL HTML : Félicitations et envoi des conditions
        user = prestataire.client.user
        subject = "Bienvenue parmi nos partenaires exclusifs !"
        from_email = "Accessoire Exclusif <noreply@accessoire-exclusif.com>"
        to = [user.email]
        
        context = {
            'first_name': user.first_name,
            'taux_commission': prestataire.taux_commission,
            'code_promo': promo_code
        }
        
        html_content = render_to_string('emails/prestataire_valide.html', context)
        text_content = strip_tags(html_content) # Version texte de secours
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
        
        return Response({
            "detail": "Prestataire validé avec succès.",
            "code_promo": promo_code,
            "taux_commission": prestataire.taux_commission
        }, status=status.HTTP_200_OK)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .serializers import (
    UserSerializer, PrestataireSerializer, PrestataireApplicationSerializer, 
    PrestataireValidationSerializer, PrestataireDashboardSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prestataire_dashboard(request):
    """
    Dashboard privé pour le prestataire connecté.
    Affiche son solde, son code promo et l'historique de ses gains.
    """
    user = request.user
    
    # On vérifie si l'utilisateur a un profil prestataire actif
    try:
        prestataire = user.client.prestataire
    except (AttributeError, Prestataire.DoesNotExist):
        return Response({"detail": "Accès réservé aux prestataires."}, status=status.HTTP_403_FORBIDDEN)
    
    if prestataire.statut != 'actif':
        return Response({"detail": "Votre compte prestataire n'est pas encore actif."}, status=status.HTTP_403_FORBIDDEN)
        
    serializer = PrestataireDashboardSerializer(prestataire)
    return Response(serializer.data)

from .serializers import AdminUserSerializer, AdminPrestataireUpdateSerializer, User, CommissionLog

# ============================================================
# ADMINISTRATION (GESTION GLOBALE)
# ============================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    """Liste paginée et recherchable de tous les utilisateurs"""
    search_query = request.query_params.get('search', '')
    users = User.objects.all().order_by('-date_joined')
    
    if search_query:
        users = users.filter(
            Q(email__icontains=search_query) | 
            Q(first_name__icontains=search_query) | 
            Q(last_name__icontains=search_query) |
            Q(telephone__icontains=search_query)
        )
    
    paginator = AdminPagination()
    page = paginator.paginate_queryset(users, request)
    serializer = AdminUserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_user_toggle_status(request, pk):
    """Bloquer ou débloquer un utilisateur (is_active)"""
    user = get_object_or_404(User, pk=pk)
    if user.is_superuser:
        return Response({"detail": "Impossible de modifier un super-administrateur."}, status=status.HTTP_400_BAD_REQUEST)
    
    user.is_active = not user.is_active
    user.save()
    status_str = "activé" if user.is_active else "bloqué"
    return Response({"detail": f"Utilisateur {status_str} avec succès.", "is_active": user.is_active})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_prestataires_list(request):
    """Liste de tous les prestataires avec filtrage par statut"""
    statut = request.query_params.get('statut')
    prestataires = Prestataire.objects.all().order_by('-date_creation')
    
    if statut:
        prestataires = prestataires.filter(statut=statut)
    
    serializer = PrestataireSerializer(prestataires, many=True)
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_prestataire_update(request, pk):
    """Modifier le taux de commission ou le statut d'un prestataire actif"""
    prestataire = get_object_or_404(Prestataire, pk=pk)
    serializer = AdminPrestataireUpdateSerializer(prestataire, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_global_stats(request):
    """Statistiques financières pour le dashboard admin"""
    from django.db.models import Sum
    total_users = User.objects.count()
    total_prestataires = Prestataire.objects.filter(statut='actif').count()
    solde_total_dus = Prestataire.objects.aggregate(Sum('solde_commission'))['solde_commission__sum'] or 0
    
    return Response({
        "total_users": total_users,
        "total_prestataires_actifs": total_prestataires,
        "solde_total_commission_dus": solde_total_dus
    })

#==============================social===============================

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
