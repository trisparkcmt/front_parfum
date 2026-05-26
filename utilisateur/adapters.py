from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.models import Site

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        """
        Force l'utilisateur à être inactif (is_active=False) lors de son inscription,
        jusqu'à ce qu'il confirme son adresse email.
        """
        from django.conf import settings
        if getattr(settings, 'ACCOUNT_EMAIL_VERIFICATION', 'optional') == 'mandatory':
            user.is_active = False
        return super().save_user(request, user, form, commit=commit)

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Génère l'URL de confirmation d'email qui sera envoyée à l'utilisateur.
        Force l'utilisation du domaine défini par SITE_ID.
        """
        url = reverse("account_confirm_email", args=[emailconfirmation.key])
        site = Site.objects.get_current()
        return f"https://{site.domain}{url}"

    def send_mail(self, template_prefix, email, context):
        """
        Intercepte l'envoi d'email pour garder le reset password cote backend
        tout en conservant FRONTEND_URL pour les liens generaux.
        """
        if 'password_reset_url' in context and 'uid' in context and 'token' in context:
            path = reverse("password_reset_confirm", args=[context['uid'], context['token']])
            site = Site.objects.get_current()
            context['password_reset_url'] = f"https://{site.domain}{path}"

        # Ajout de FRONTEND_URL à tous les contextes d'email pour le bouton général/footer
        context['frontend_url'] = settings.FRONTEND_URL

        super().send_mail(template_prefix, email, context)
