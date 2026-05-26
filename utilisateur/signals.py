from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from allauth.account.signals import email_confirmed
from allauth.socialaccount.signals import social_account_added

from .models import Prestataire, Notification

User = get_user_model()


@receiver(post_save, sender=Prestataire)
def notify_admin_on_prestataire_request(sender, instance, created, **kwargs):
    """Signal envoyé à l'administrateur quand un prestataire fait une demande."""
    if created and instance.statut == 'en_attente':
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        subject = f"Nouvelle demande de prestataire : {instance.client.email}"
        message = (
            f"Une nouvelle demande de prestataire a été reçue.\n\n"
            f"Client: {instance.client.email}\n"
            f"Nom: {instance.client.user.get_full_name()}\n"
            f"Statut: {instance.statut}\n"
            f"Date: {instance.date_creation}\n\n"
            "Veuillez consulter l'admin ou le tableau de bord dédié pour traiter cette demande."
        )

        # Créer une notification globale visible par tous les admins
        Notification.objects.create(
            recipient=None,
            type='prestataire_request',
            title='Nouvelle demande de prestataire',
            message=message,
            url=f'/api/v1/utilisateur/prestataire-requests/{instance.pk}/',
            is_global_admin=True,
            metadata={
                'prestataire_id': instance.pk,
                'client_email': instance.client.email,
                'statut': instance.statut,
            }
        )

        # Envoi d'email en complément
        admin_emails = list(admin_users.values_list('email', flat=True))
        if admin_emails:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                admin_emails,
                fail_silently=True,
            )

def send_accessoire_welcome_email(user):
    """Envoie le mail de bienvenue Accessoires Exclusifs."""
    subject = "Bienvenue chez Accessoires Exclusifs !"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]

    context = {
        'user': user,
        'frontend_url': settings.FRONTEND_URL,
    }

    # Rendu des templates
    text_content = render_to_string('account/email/welcome_message.txt', context)
    html_content = render_to_string('account/email/welcome_message.html', context)

    # Création et envoi de l'email
    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


@receiver(email_confirmed)
def send_welcome_email(sender, request, email_address, **kwargs):
    """Signal envoyé par allauth quand un utilisateur confirme son adresse email."""
    user = email_address.user
    if not user.is_active:
        user.is_active = True
        user.save()
    send_accessoire_welcome_email(user)


@receiver(social_account_added)
def send_google_welcome_email(sender, request, sociallogin, **kwargs):
    """Envoie le mail de bienvenue quand un compte Google est créé ou lié."""
    if sociallogin.account.provider == 'google':
        send_accessoire_welcome_email(sociallogin.user)
