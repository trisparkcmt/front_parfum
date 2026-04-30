from django.db import models
from decimal import Decimal

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
    image = models.CharField(max_length=255, blank=True)
    ordre_affichage = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
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
    image_principale = models.CharField(max_length=255, blank=True)
    images_supplementaires = models.JSONField(default=list, blank=True)
    
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
    
    nom = models.CharField(max_length=150)
    code_reference = models.CharField(max_length=50, unique=True)
    
    # Descriptions
    description = models.TextField(blank=True)
    description_ia = models.TextField(blank=True, help_text="Description narrative envoyée à l'IA")
    
    # Fournisseur
    fournisseur = models.CharField(max_length=200, blank=True)
    origine_pays = models.CharField(max_length=100, blank=True)
    concentration_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Stock
    stock_litre = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    seuil_alerte_stock = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    prix_par_10ml = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Tags (ManyToMany via la table de liaison)
    tags = models.ManyToManyField(Tag, through='TagEssence', related_name='essences', blank=True)
    
    # Autres attributs conservés
    intensite = models.CharField(max_length=20, choices=INTENSITE_CHOICES, blank=True)
    genre_cible = models.CharField(max_length=20, choices=GENRE_CHOICES, default='mixte')
    
    # Statut
    actif = models.BooleanField(default=True)
    
    # Dates
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'essence'
        verbose_name = 'Essence'
        verbose_name_plural = 'Essences'
    
    def __str__(self):
        return f"{self.nom} - {self.prix_par_10ml} FCFA/10ml"
    
    def calculer_prix_quantite(self, quantite_ml):
        """Calcule le prix pour une quantité donnée en ml"""
        return (self.prix_par_10ml * Decimal(str(quantite_ml))) / Decimal('10')
    
    # Méthodes pour récupérer les tags par type
    def get_tags_by_type(self, tag_type):
        """Récupère tous les tags d'un type donné pour cette essence"""
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
    def moments_journee(self):
        tags = self.get_tags_by_type('moment_journee')
        return [tag.nom for tag in tags]
    
    @property
    def occasions(self):
        tags = self.get_tags_by_type('occasion')
        return [tag.nom for tag in tags]
    
    @property
    def saisons_compatibles(self):
        tags = self.get_tags_by_type('saison')
        return [tag.nom for tag in tags]
    
    @property
    def signes_astrologiques_compatibles(self):
        tags = self.get_tags_by_type('signe_astrologique')
        return [tag.nom for tag in tags]
    
    @property
    def tranches_age_compatibles(self):
        # Si tu veux garder les tranches d'âge (optionnel)
        # Sinon, on peut aussi les mettre dans Tag avec un type 'tranche_age'
        return []  # À implémenter si nécessaire


# ============================================================
# ACCESSOIRES
# ============================================================
class TypeAccessoire(models.Model):
    nom = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=255, blank=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'type_accessoire'
        verbose_name = 'Type d\'accessoire'
        verbose_name_plural = 'Types d\'accessoires'
    
    def __str__(self):
        return self.nom


class Accessoire(models.Model):
    type_accessoire = models.ForeignKey(TypeAccessoire, on_delete=models.SET_NULL, null=True, related_name='accessoires')
    nom = models.CharField(max_length=200)
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
    image_principale = models.CharField(max_length=255, blank=True)
    images_supplementaires = models.JSONField(default=list, blank=True)
    poids_grammes = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
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
    image = models.CharField(max_length=255, blank=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
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
    image_principale = models.CharField(max_length=255, blank=True)
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