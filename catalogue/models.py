from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator

# UTILITAIRE — chemin dynamique pour les uploads

def upload_to_parfum(instance, filename):
    """Range les images dans media/parfums/{slug}/"""
    return f'parfums/{instance.slug}/{filename}'
 
def upload_to_parfum_galerie(instance, filename):
    return f'parfums/{instance.slug}/galerie/{filename}'
 
def upload_to_essence(instance, filename):
    return f'essences/{instance.code_reference}/{filename}'
 
def upload_to_accessoire(instance, filename):
    return f'accessoires/{instance.slug}/{filename}'
 
def upload_to_accessoire_galerie(instance, filename):
    return f'accessoires/{instance.slug}/galerie/{filename}'
 
def upload_to_flacon(instance, filename):
    return f'flacons/{instance.reference_sku}/{filename}'
 
def upload_to_flacon_galerie(instance, filename):
    return f'flacons/{instance.reference_sku}/galerie/{filename}'
 
def upload_to_categorie(instance, filename):
    return f'categories/{instance.slug}/{filename}'
 
def upload_to_type_accessoire(instance, filename):
    return f'types/accessoires/{instance.slug}/{filename}'
 
def upload_to_type_flacon(instance, filename):
    return f'types/flacons/{instance.pk}/{filename}'

#Favoris 
class Favori(models.Model):
    client = models.ForeignKey('utilisateur.Client', on_delete=models.CASCADE, related_name='favoris')
    parfum = models.ForeignKey('catalogue.Parfum', on_delete=models.CASCADE, null=True, blank=True)
    accessoire = models.ForeignKey('catalogue.Accessoire', on_delete=models.CASCADE, null=True, blank=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favori'
        verbose_name = 'Favori'
        verbose_name_plural = 'Favoris'
        constraints = [
            models.UniqueConstraint(fields=['client', 'parfum'], condition=models.Q(parfum__isnull=False), name='unique_favori_parfum'),
            models.UniqueConstraint(fields=['client', 'accessoire'], condition=models.Q(accessoire__isnull=False), name='unique_favori_accessoire'),
        ]

    def __str__(self):
        produit = self.parfum.nom if self.parfum else self.accessoire.nom
        return f"{self.client.user.email} - {produit}"


# ============================================================
# TAGS CENTRALISÉS
# ============================================================
class Tag(models.Model):
    """
    Table centralisée pour tous les tags
    Types : famille_olfactive, signe_astrologique, humeur, saison, moment_journee, occasion
    """
    TYPE_CHOICES = [
        ('famille_olfactive', 'Famille olfactive'),
        ('signe_astrologique', 'Signe astrologique'),
        ('humeur', 'Humeur compatible'),
        ('saison', 'Saison compatible'),
        ('moment_journee', 'Moment de la journée'),
        ('occasion', 'Occasion'),
    ]
    
    nom = models.CharField(max_length=100)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tag'
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        unique_together = [['nom', 'type']]  # Un tag unique par type
    
    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"


class TagParfum(models.Model):
    """
    Table de liaison entre Parfum et Tag (ManyToMany)
    """
    parfum = models.ForeignKey('Parfum', on_delete=models.CASCADE, related_name='tags_associes')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='parfums_associes')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tag_parfum'
        verbose_name = 'Tag de parfum'
        verbose_name_plural = 'Tags de parfums'
        unique_together = [['parfum', 'tag']]
    
    def __str__(self):
        return f"{self.parfum.nom} → {self.tag.nom}"


class TagEssence(models.Model):
    """
    Table de liaison entre Essence et Tag (ManyToMany)
    """
    essence = models.ForeignKey('Essence', on_delete=models.CASCADE, related_name='tags_associes')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='essences_associes')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tag_essence'
        verbose_name = 'Tag d\'essence'
        verbose_name_plural = 'Tags d\'essences'
        unique_together = [['essence', 'tag']]
    
    def __str__(self):
        return f"{self.essence.nom} → {self.tag.nom}"


# ============================================================
# CATALOGUE PARFUMS
# ============================================================
class CategorieParfum(models.Model):
    nom = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=upload_to_categorie,blank=True, null=True,
        help_text="Image de la catégorie (jpg, png, webp)"
    )

    ordre_affichage = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    taux_reduction = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(99)],
        help_text="Réduction en % appliquée à tous les parfums de cette catégorie (0 = pas de réduction)"
    )


    class Meta:
        db_table = 'categorie_parfum'
        verbose_name = 'Catégorie de parfum'
        verbose_name_plural = 'Catégories de parfums'
    
    def __str__(self):
        return self.nom


class Parfum(models.Model):
    GENRE_CHOICES = [
        ('homme', 'Homme'),
        ('femme', 'Femme'),
        ('mixte', 'Mixte'),
    ]
    INTENSITE_CHOICES = [
        ('légère', 'Légère'),
        ('moyenne', 'Moyenne'),
        ('forte', 'Forte'),
        ('très forte', 'Très forte'),
    ]
    
    categorie = models.ForeignKey(CategorieParfum, on_delete=models.SET_NULL, null=True, related_name='parfums')
    nom = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    marque = models.CharField(max_length=200 ,blank=True)
    duree = models.CharField(max_length=200 ,blank=True)
    reference_sku = models.CharField(max_length=100, unique=True)
    description_courte = models.CharField(max_length=500, blank=True)
    description_longue = models.TextField(blank=True)
    
    # Notes olfactives
    notes_tete = models.CharField(max_length=300, blank=True)
    notes_coeur = models.CharField(max_length=300, blank=True)
    notes_fond = models.CharField(max_length=300, blank=True)
    
    # Caractéristiques
    contenance_ml = models.IntegerField(help_text="30, 50, 75, 100 ml")
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    prix_promotionnel = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantite = models.IntegerField(default=0)
    seuil_alerte_stock = models.IntegerField(default=5)
    
    # Images
    image_principale = models.ImageField(
        upload_to=upload_to_parfum,
        blank=True, null=True,
        help_text="Image principale du parfum (jpg, png, webp — max 2Mo)"
    )

    images_supplementaires = models.JSONField(default=list, blank=True,  help_text="URLs des images supplémentaires (géré via l'upload multiple)")
    
    # Tags (ManyToMany via la table de liaison)
    tags = models.ManyToManyField(Tag, through='TagParfum', related_name='parfums', blank=True)
    
    # Autres attributs conservés
    genre_cible = models.CharField(max_length=20, choices=GENRE_CHOICES, default='mixte')
    intensite = models.CharField(max_length=20, choices=INTENSITE_CHOICES, blank=True)
    
    # IA
    description_ia = models.TextField(blank=True, help_text="Description narrative envoyée à l'IA")
    
    # Statut
    est_nouveau = models.BooleanField(default=False)
    est_bestseller = models.BooleanField(default=False)
    est_hotseller = models.BooleanField(default=False) 
    actif = models.BooleanField(default=True)
    
    # Dates
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parfum'
        verbose_name = 'Parfum'
        verbose_name_plural = 'Parfums'
    
    def __str__(self):
        return f"{self.nom} - {self.prix_unitaire} FCFA"
    
    @property
    def prix_actuel(self):
        return self.prix_promotionnel if self.prix_promotionnel else self.prix_unitaire
    
    # Méthodes pour récupérer les tags par type
    def get_tags_by_type(self, tag_type):
        """Récupère tous les tags d'un type donné pour ce parfum"""
        return self.tags.filter(type=tag_type)
    
    @property
    def famille_olfactive(self):
        tags = self.get_tags_by_type('famille_olfactive')
        return [tag.nom for tag in tags]
    
    @property
    def humeurs_compatibles(self):
        tags = self.get_tags_by_type('humeur')
        return [tag.nom for tag in tags]
    
    @property
    def occasions(self):
        tags = self.get_tags_by_type('occasion')
        return [tag.nom for tag in tags]
    
    @property
    def saisons_compatibles(self):
        tags = self.get_tags_by_type('saison')
        return [tag.nom for tag in tags]


class Ingredient(models.Model):
    # NOTE_CHOICES = [
    #     ('tête', 'Tête'),
    #     ('coeur', 'Cœur'),
    #     ('fond', 'Fond'),
    # ]
    
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    # note_olfactive = models.CharField(max_length=20, blank=True , null=True choices=NOTE_CHOICES)
    prix_par_ml = models.DecimalField(max_digits=10, decimal_places=2)
    stock_ml = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ingredient'
        verbose_name = 'Ingrédient'
        verbose_name_plural = 'Ingrédients'
        
    def __str__(self):
        return f"{self.nom} ({self.get_note_olfactive_display()})"


from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
import math

class Essence(models.Model):
    INTENSITE_CHOICES = [
        ('légère', 'Légère'),
        ('moyenne', 'Moyenne'),
        ('forte', 'Forte'),
        ('très forte', 'Très forte'),
    ]
    GENRE_CHOICES = [
        ('homme', 'Homme'),
        ('femme', 'Femme'),
        ('mixte', 'Mixte'),
    ]
    CATEGORIE_CHOICES = [
        ('super_premium', 'Super Premium'),
        ('premium', 'Premium'),
        ('high', 'High'),
    ]
    
    # --- Identité ---
    nom = models.CharField(max_length=150)
    code_reference = models.CharField(max_length=50, unique=True)
    marque = models.CharField(max_length=100, blank=True)
    
    # --- Descriptions ---
    description = models.TextField(blank=True)
    description_ia = models.TextField(blank=True, help_text="Description narrative envoyée à l'IA")
    
    # --- Fournisseur & Technique ---
    fournisseur = models.CharField(max_length=200, blank=True)
    origine_pays = models.CharField(max_length=100, blank=True)
    concentration_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    couleur = models.CharField(max_length=50, blank=True)
    duree = models.CharField(max_length=50, blank=True)
    
    # --- STOCK (Logique Synchronisée) ---
    # Nombre de flacons neufs (scellés) en rayon
    stock_flacon = models.PositiveIntegerField(
        default=0, 
        verbose_name="Nombre de flacons neufs"
    )
    # Taille du flacon (ex: 10, 15, 30, 50, 100)
    contenance_ml = models.PositiveIntegerField(
        default=10, 
        help_text="Contenance d'un flacon (ex: 10 pour 10ml)"
    )
    # Millilitres restants de flacons déjà ouverts pour le Labo
    stock_ouvert_ml = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name="Reliquat Labo (ml ouverts)"
    )
    # Stock total calculé (Flacons neufs * contenance + stock ouvert)
    stock_ml_total_reel = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        editable=False, 
        default=0
    )
    seuil_alerte_stock = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)

    # --- PRIX ---
    prix_unitaire_fini = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Prix du flacon",  default=0
    )
    # Automatiquement calculé : prix_unitaire_fini / contenance_ml
    prix_par_ml = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        editable=False 
    )
    
    # --- Attributs Olfactifs ---
    intensite = models.CharField(max_length=20, choices=INTENSITE_CHOICES, blank=True)
    genre_cible = models.CharField(max_length=20, choices=GENRE_CHOICES, default='mixte')
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default='premium')
    notes_tete = models.CharField(max_length=300, blank=True)
    notes_coeur = models.CharField(max_length=300, blank=True)
    notes_fond = models.CharField(max_length=300, blank=True)

    # --- Tags ---
    tags = models.ManyToManyField('Tag', through='TagEssence', related_name='essences', blank=True)
    
    # --- Statuts & Dates ---
    actif = models.BooleanField(default=True)
    vendu_comme_produit_fini = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'essence'
        verbose_name = 'Essence'
        verbose_name_plural = 'Essences'
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.stock_flacon} flacons | {self.stock_ouvert_ml}ml ouverts)"

    def save(self, *args, **kwargs):
        """Calculs automatiques lors de la sauvegarde."""
        # 1. Calcul du prix au ML (Prix flacon / contenance)
        if self.prix_unitaire_fini and self.contenance_ml:
            self.prix_par_ml = self.prix_unitaire_fini / Decimal(self.contenance_ml)
        
        # 2. Mise à jour du stock total en ML (lecture seule pour info)
        self.stock_ml_total_reel = Decimal(self.stock_flacon * self.contenance_ml) + Decimal(self.stock_ouvert_ml)
        
        super().save(*args, **kwargs)

    # --- Méthodes Métier ---
    
    def calculer_prix_quantite(self, quantite_ml):
        """Calcule le prix pour une quantité donnée en ml (utilisé en labo)"""
        return self.prix_par_ml * Decimal(str(quantite_ml))

    def get_tags_by_type(self, tag_type):
        """Récupère tous les tags d'un type donné"""
        return self.tags.filter(type=tag_type)

    # --- Properties (Compatibilité & Interface) ---

    @property
    def famille_olfactive(self):
        return [tag.nom for tag in self.get_tags_by_type('famille_olfactive')]
    
    @property
    def humeurs_compatibles(self):
        return [tag.nom for tag in self.get_tags_by_type('humeur')]
    
    @property
    def moments_journee(self):
        return [tag.nom for tag in self.get_tags_by_type('moment_journee')]
    
    @property
    def occasions(self):
        return [tag.nom for tag in self.get_tags_by_type('occasion')]
    
    @property
    def saisons_compatibles(self):
        return [tag.nom for tag in self.get_tags_by_type('saison')]

    @property
    def signes_astrologiques_compatibles(self):
        return [tag.nom for tag in self.get_tags_by_type('signe_astrologique')]

    @property
    def stock_ml_total(self):
        """Retourne le stock total théorique en ML."""
        return self.stock_ml_total_reel
    @property
    def tranches_age_compatibles(self):
        # Si tu veux garder les tranches d'âge (optionnel)
        # Sinon, on peut aussi les mettre dans Tag avec un type 'tranche_age'
        return []  # À implémenter si nécessaire
    # ============================================================
    # MÉTHODES MÉTIER POUR LE STOCK
    # ============================================================
    def vendre_flacon(self, quantite=1):
        """
        Vente d'un ou plusieurs flacons neufs.
        Décrémente stock_flacon et stock_ml_total_reel (via save()).
        """
        if self.stock_flacon < quantite:
            raise ValueError(f"Stock flacons insuffisant (disponible: {self.stock_flacon})")
        self.stock_flacon -= quantite
        # Le stock total ml sera recalculé automatiquement dans save()
        self.save()

    def prelever_ml(self, quantite_ml):
        """
        Prélèvement pour le laboratoire (parfum personnalisé).
        Utilise d'abord le reliquat ouvert (stock_ouvert_ml), puis ouvre des flacons neufs si nécessaire.
        """
        if self.stock_ml_total_reel < quantite_ml:
            raise ValueError(f"Stock total insuffisant (disponible: {self.stock_ml_total_reel} ml)")

        # On utilise d'abord le stock déjà ouvert
        if self.stock_ouvert_ml >= quantite_ml:
            self.stock_ouvert_ml -= quantite_ml
        else:
            reste = quantite_ml - self.stock_ouvert_ml
            self.stock_ouvert_ml = 0
            # Calcul du nombre de flacons neufs à ouvrir (division entière supérieure)
            flacons_ouvrir = (reste + self.contenance_ml - 1) // self.contenance_ml
            if self.stock_flacon < flacons_ouvrir:
                raise ValueError("Stock flacons insuffisant pour ouvrir de nouveaux flacons")
            self.stock_flacon -= flacons_ouvrir
            # Le nouveau reliquat est ce qui reste dans les flacons ouverts après prélèvement
            self.stock_ouvert_ml = (flacons_ouvrir * self.contenance_ml) - reste
        self.save()


# ============================================================
# ACCESSOIRES
# ============================================================
class TypeAccessoire(models.Model):
    nom = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icone = models.ImageField(
        upload_to=upload_to_type_accessoire,
        blank=True, null=True,
        help_text="Icône du type d'accessoire (svg, png — fond transparent recommandé)"
    )

    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
     
    taux_reduction = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(99)],
        help_text="Réduction en % appliquée à tous les accessoires de ce type (0 = pas de réduction)"
    )

    
    class Meta:
        db_table = 'type_accessoire'
        verbose_name = 'Type d\'accessoire'
        verbose_name_plural = 'Types d\'accessoires'
    
    def __str__(self):
        return self.nom


class Accessoire(models.Model):
    type_accessoire = models.ForeignKey(TypeAccessoire, on_delete=models.SET_NULL, null=True, related_name='accessoires')
    nom = models.CharField(max_length=200)
    marque = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(max_length=220, unique=True)
    reference_sku = models.CharField(max_length=100, unique=True)
    description_courte = models.CharField(max_length=500, blank=True)
    description_longue = models.TextField(blank=True)
    matiere = models.CharField(max_length=100, blank=True)
    couleur = models.CharField(max_length=50, blank=True)
    taille = models.CharField(max_length=50, blank=True)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    prix_promotionnel = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantite = models.IntegerField(default=0)
    seuil_alerte_stock = models.IntegerField(default=3)
    image_principale = models.ImageField(
        upload_to=upload_to_accessoire,
        blank=True, null=True,
        help_text="Image principale de l'accessoire"
    )

    images_supplementaires = models.JSONField(default=list, blank=True)
    poids_grammes = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    est_bestseller = models.BooleanField(default=False)
    est_hotseller = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'accessoire'
        verbose_name = 'Accessoire'
        verbose_name_plural = 'Accessoires'
    
    def __str__(self):
        return f"{self.nom} - {self.prix_unitaire} FCFA"
    
    @property
    def prix_actuel(self):
        return self.prix_promotionnel if self.prix_promotionnel else self.prix_unitaire


# ============================================================
# FLACONS
# ============================================================
class TypeFlacon(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to=upload_to_type_flacon,
        blank=True, null=True,
        help_text="Image représentative du type de flacon"
    )

    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
     
    taux_reduction = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(99)],
        help_text="Réduction en % appliquée à tous les flacons de ce type (0 = pas de réduction)"
    )

    
    class Meta:
        db_table = 'type_flacon'
        verbose_name = 'Type de flacon'
        verbose_name_plural = 'Types de flacons'
    
    def __str__(self):
        return self.nom


class Flacon(models.Model):
    type_flacon = models.ForeignKey(TypeFlacon, on_delete=models.SET_NULL, null=True, related_name='flacons')
    nom = models.CharField(max_length=200)
    reference_sku = models.CharField(max_length=100, unique=True)
    contenance_ml = models.IntegerField(help_text="30, 50, 75, 100, 150 ml")
    matiere = models.CharField(max_length=100, blank=True)
    couleur = models.CharField(max_length=50, blank=True)
    hauteur_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    largeur_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    poids_grammes = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    image_principale = models.ImageField(
        upload_to=upload_to_flacon,
        blank=True, null=True,
        help_text="Image principale du flacon"
    )

    images_supplementaires = models.JSONField(default=list, blank=True)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantite = models.IntegerField(default=0)
    seuil_alerte_stock = models.IntegerField(default=5, help_text="En dessous de ce seuil la commande est bloquée")
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flacon'
        verbose_name = 'Flacon'
        verbose_name_plural = 'Flacons'
    
    def __str__(self):
        return f"{self.nom} ({self.contenance_ml}ml) - {self.prix_unitaire} FCFA"
    
