from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class ParfumPersonnalise(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
       
        ('validé', 'Validé'),
  
    ]
    
    client = models.ForeignKey('utilisateur.Client', on_delete=models.CASCADE, related_name='parfums_personnalises')
    flacon = models.ForeignKey('catalogue.Flacon', on_delete=models.SET_NULL, null=True, related_name='parfums_personnalises')
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    contenance_ml = models.DecimalField(max_digits=8, decimal_places=2)
    prix_essences = models.DecimalField(max_digits=10, decimal_places=2, help_text="Somme calculée des prix des essences")
    prix_flacon_snapshot = models.DecimalField(max_digits=10, decimal_places=2, help_text="Prix du flacon au moment de la création")
    prix_total = models.DecimalField(max_digits=10, decimal_places=2, help_text="prix_essences + prix_flacon_snapshot")
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='brouillon')
    note_laboratoire = models.TextField(blank=True, help_text="Retour du labo en cas de refus")
    
    # date_validation = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parfum_personnalise'
        verbose_name = 'Parfum personnalisé'
        verbose_name_plural = 'Parfums personnalisés'
    
    def __str__(self):
        return f"{self.nom} - {self.client.user.email}"
    
    def recalculer_prix(self):
        total_essences = sum(ligne.prix_ligne for ligne in self.lignes.all())
        self.prix_essences = total_essences
        self.prix_total = total_essences + (self.prix_flacon_snapshot or 0)
        self.save()
        return self.prix_total


class ParfumPersonnaliseLigne(models.Model):
    parfum_personnalise = models.ForeignKey('laboratoire.ParfumPersonnalise', on_delete=models.CASCADE, related_name='lignes')
    essence = models.ForeignKey('catalogue.Essence', on_delete=models.CASCADE, related_name='utilisations')
    quantite_ml = models.DecimalField(max_digits=8, decimal_places=3, validators=[MinValueValidator(Decimal('0.1'))])
    prix_par_ml_snapshot = models.DecimalField(max_digits=10, decimal_places=2, help_text="Prix de l'essence au moment de la création")
    prix_ligne = models.DecimalField(max_digits=10, decimal_places=2, help_text="(prix_par_10ml_snapshot * quantite_ml) / 10")
    
    class Meta:
        db_table = 'parfum_personnalise_ligne'
        verbose_name = 'Ligne de parfum personnalisé'
        verbose_name_plural = 'Lignes de parfums personnalisés'
        unique_together = [['parfum_personnalise', 'essence']]
    
    def __str__(self):
        return f"{self.parfum_personnalise.nom} - {self.essence.nom}: {self.quantite_ml}ml"
    
    def save(self, *args, **kwargs):
        self.prix_ligne = (self.prix_par_10ml_snapshot * self.quantite_ml) / Decimal('10')
        super().save(*args, **kwargs)