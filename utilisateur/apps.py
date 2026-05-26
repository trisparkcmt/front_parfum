from django.apps import AppConfig


class UtilisateurConfig(AppConfig):
    name = 'utilisateur'

    def ready(self):
        import utilisateur.signals  # noqa: F401
