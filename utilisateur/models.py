from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    """Utilisateur de base (connexion email/téléphone)"""
    email = models.EmailField(unique=True)
    telephone_validator = RegexValidator(regex=r'^\+?[0-9]{8,15}$', message="Format invalide")
    telephone = models.CharField(max_length=20, unique=True, null=True, blank=True, validators=[telephone_validator])
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['telephone']
    
    class Meta:
        db_table = 'auth_user'
    
    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.email} ({self.telephone})"
    
    @property
    def role(self):
        """Détermine le rôle de l'utilisateur dynamiquement"""
        if self.is_superuser:
            return "admin"
        
        # On vérifie les relations OneToOne
        if hasattr(self, 'client'):
            if hasattr(self.client, 'prestataire'):
                return "prestataire"
            if hasattr(self.client, 'livreur'):
                return "livreur"
        
        return "client"


class Client(models.Model):
    """Tout client (client simple, prestataire, livreur)"""
    GENRE_CHOICES = [('homme', 'Homme'), ('femme', 'Femme'), ('autre', 'Autre')]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client')
    date_naissance = models.DateField(null=True, blank=True)
    genre = models.CharField(max_length=10, choices=GENRE_CHOICES, blank=True)
    points_fidelite = models.IntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'client'
    
    @property
    def telephone(self):
        return self.user.telephone
    
    @property
    def email(self):
        return self.user.email
    
    def __str__(self):
        return self.user.email


class Prestataire(models.Model):
    """Prestataire = Client + spécificités"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('actif', 'Actif'),
        ('suspendu', 'Suspendu'),
        ('inactif', 'Inactif')
    ]
    
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='prestataire')
   
   
    code_promo = models.CharField(max_length=50, unique=True, null=True, blank=True)
    taux_commission = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    solde_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prestataire'
    
    @property
    def user(self):
        return self.client.user
    
    @property
    def nom(self):
        return self.user.last_name
    
    @property
    def prenom(self):
        return self.user.first_name
    
    def __str__(self):
        return f"{self.nom} {self.prenom} - {self.code_promo}"


class Livreur(models.Model):
    """Livreur = Client + spécificités"""
    STATUT_CHOICES = [('disponible', 'Disponible'), ('en_livraison', 'En livraison'), ('inactif', 'Inactif'), ('suspendu', 'Suspendu')]
    
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='livreur')
    photo = models.CharField(max_length=255, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='disponible')
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    nombre_livraisons = models.IntegerField(default=0)
    date_embauche = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'livreur'
    
    @property
    def user(self):
        return self.client.user
    
    @property
    def nom(self):
        return self.user.last_name
    
    @property
    def prenom(self):
        return self.user.first_name
    
    @property
    def telephone(self):
        return self.user.telephone
    
    @property
    def email(self):
        return self.user.email
    
    def __str__(self):
        return f"{self.nom} {self.prenom} - {self.telephone}"


class CommissionLog(models.Model):
    """Historique des gains d'un prestataire (Ventes, Retraits, Bonus)"""
    TYPE_CHOICES = [
        ('vente', 'Commission sur vente'),
        ('retrait', 'Retrait de solde'),
        ('bonus', 'Bonus / Ajustement'),
    ]

    prestataire = models.ForeignKey(Prestataire, on_delete=models.CASCADE, related_name='historique_commissions')
    type_operation = models.CharField(max_length=20, choices=TYPE_CHOICES, default='vente')
    montant = models.DecimalField(max_digits=10, decimal_places=2) # Positif pour vente, négatif pour retrait
    reference_commande = models.CharField(max_length=50, blank=True, null=True) # ID de la commande liée
    date_operation = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'commission_log'
        ordering = ['-date_operation']

    def __str__(self):
        return f"{self.prestataire.nom} - {self.type_operation} - {self.montant}€"

# ============================================================
# SIGNALS (Automatisation)
# ============================================================
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_client_profile(sender, instance, created, **kwargs):
    """Crée automatiquement un profil Client lors de la création d'un User"""
    if created:
        Client.objects.create(user=instance)