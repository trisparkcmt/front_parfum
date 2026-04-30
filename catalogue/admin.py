from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Tag, TagParfum, TagEssence,
    CategorieParfum, Parfum, Essence, 
    TypeAccessoire, Accessoire, TypeFlacon, Flacon
)


# ============================================================
# TAGS
# ============================================================
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'type', 'actif', 'date_creation')
    list_filter = ('type', 'actif')
    search_fields = ('nom',)
    list_editable = ('actif',)
    
    fieldsets = (
        ('Informations', {
            'fields': ('nom', 'type', 'actif')
        }),
    )


class TagParfumInline(admin.TabularInline):
    model = TagParfum
    extra = 1
    autocomplete_fields = ('tag',)


class TagEssenceInline(admin.TabularInline):
    model = TagEssence
    extra = 1
    autocomplete_fields = ('tag',)


# ============================================================
# CATEGORIES & PARFUMS
# ============================================================
@admin.register(CategorieParfum)
class CategorieParfumAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'slug', 'ordre_affichage', 'actif', 'date_creation')
    list_filter = ('actif', 'date_creation')
    search_fields = ('nom', 'description')
    prepopulated_fields = {'slug': ('nom',)}
    ordering = ('ordre_affichage', 'nom')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'slug', 'description', 'image')
        }),
        ('Affichage', {
            'fields': ('ordre_affichage', 'actif')
        }),
        ('Dates', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Parfum)
class ParfumAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'categorie', 'contenance_ml', 'prix_unitaire', 'prix_promotionnel', 'stock_quantite', 'actif', 'est_nouveau', 'est_bestseller')
    list_filter = ('categorie', 'actif', 'est_nouveau', 'est_bestseller', 'genre_cible', 'intensite', 'date_creation')
    search_fields = ('nom', 'slug', 'reference_sku', 'description_courte', 'description_longue')
    readonly_fields = ('date_creation', 'date_modification')
    prepopulated_fields = {'slug': ('nom',)}
    list_editable = ('prix_unitaire', 'stock_quantite', 'actif')
    inlines = [TagParfumInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('categorie', 'nom', 'slug', 'reference_sku')
        }),
        ('Descriptions', {
            'fields': ('description_courte', 'description_longue', 'description_ia')
        }),
        ('Notes olfactives', {
            'fields': ('notes_tete', 'notes_coeur', 'notes_fond')
        }),
        ('Caractéristiques', {
            'fields': ('contenance_ml', 'genre_cible', 'intensite')
        }),
        ('Prix et stock', {
            'fields': ('prix_unitaire', 'prix_promotionnel', 'stock_quantite', 'seuil_alerte_stock')
        }),
        ('Images', {
            'fields': ('image_principale', 'images_supplementaires')
        }),
        ('Statut', {
            'fields': ('actif', 'est_nouveau', 'est_bestseller')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('categorie')


# ============================================================
# ESSENCES
# ============================================================
@admin.register(Essence)
class EssenceAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'code_reference', 'prix_par_10ml', 'stock_litre', 'intensite', 'genre_cible', 'actif')
    list_filter = ('intensite', 'genre_cible', 'actif', 'date_creation')
    search_fields = ('nom', 'code_reference', 'fournisseur', 'origine_pays')
    readonly_fields = ('date_creation', 'date_modification')
    inlines = [TagEssenceInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code_reference', 'description', 'description_ia')
        }),
        ('Fournisseur', {
            'fields': ('fournisseur', 'origine_pays', 'concentration_max')
        }),
        ('Stock', {
            'fields': ('stock_litre', 'seuil_alerte_stock', 'prix_par_10ml')
        }),
        ('Caractéristiques', {
            'fields': ('intensite', 'genre_cible')
        }),
        ('Statut', {
            'fields': ('actif',)
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


# ============================================================
# ACCESSOIRES
# ============================================================
@admin.register(TypeAccessoire)
class TypeAccessoireAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'slug', 'actif', 'date_creation')
    list_filter = ('actif',)
    search_fields = ('nom', 'description')
    prepopulated_fields = {'slug': ('nom',)}
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'slug', 'description', 'icone')
        }),
        ('Statut', {
            'fields': ('actif',)
        }),
        ('Dates', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Accessoire)
class AccessoireAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'type_accessoire', 'matiere', 'prix_unitaire', 'prix_promotionnel', 'stock_quantite', 'actif')
    list_filter = ('type_accessoire', 'matiere', 'couleur', 'actif', 'date_creation')
    search_fields = ('nom', 'slug', 'reference_sku', 'description_courte')
    readonly_fields = ('date_creation', 'date_modification')
    prepopulated_fields = {'slug': ('nom',)}
    list_editable = ('prix_unitaire', 'stock_quantite', 'actif')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('type_accessoire', 'nom', 'slug', 'reference_sku')
        }),
        ('Descriptions', {
            'fields': ('description_courte', 'description_longue')
        }),
        ('Caractéristiques', {
            'fields': ('matiere', 'couleur', 'taille', 'poids_grammes')
        }),
        ('Prix et stock', {
            'fields': ('prix_unitaire', 'prix_promotionnel', 'stock_quantite', 'seuil_alerte_stock')
        }),
        ('Images', {
            'fields': ('image_principale', 'images_supplementaires')
        }),
        ('Statut', {
            'fields': ('actif',)
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('type_accessoire')


# ============================================================
# FLACONS
# ============================================================
@admin.register(TypeFlacon)
class TypeFlaconAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'actif', 'date_creation')
    list_filter = ('actif',)
    search_fields = ('nom', 'description')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'description', 'image')
        }),
        ('Statut', {
            'fields': ('actif',)
        }),
        ('Dates', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Flacon)
class FlaconAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'type_flacon', 'contenance_ml', 'matiere', 'prix_unitaire', 'stock_quantite', 'actif')
    list_filter = ('type_flacon', 'matiere', 'couleur', 'actif', 'date_creation')
    search_fields = ('nom', 'reference_sku')
    readonly_fields = ('date_creation', 'date_modification')
    list_editable = ('prix_unitaire', 'stock_quantite', 'actif')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('type_flacon', 'nom', 'reference_sku')
        }),
        ('Caractéristiques', {
            'fields': ('contenance_ml', 'matiere', 'couleur', 'hauteur_cm', 'largeur_cm', 'poids_grammes')
        }),
        ('Prix et stock', {
            'fields': ('prix_unitaire', 'stock_quantite', 'seuil_alerte_stock')
        }),
        ('Images', {
            'fields': ('image_principale', 'images_supplementaires')
        }),
        ('Statut', {
            'fields': ('actif',)
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('type_flacon')