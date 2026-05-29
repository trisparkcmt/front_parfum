from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Client, Prestataire, Livreur, CommissionLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'telephone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'telephone')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('telephone',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {'fields': ('telephone',)}),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_telephone', 'genre', 'points_fidelite', 'date_creation')
    list_filter = ('genre', 'date_creation')
    search_fields = ('user__email', 'user__username', 'user__first_name', 'user__last_name', 'user__telephone')
    readonly_fields = ('date_creation', 'date_modification', 'points_fidelite')
    
    fieldsets = (
        ('Informations utilisateur', {
            'fields': ('user', 'date_naissance', 'genre')
        }),
        ('Fidélité', {
            'fields': ('points_fidelite',)
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_telephone(self, obj):
        return obj.telephone
    get_telephone.short_description = 'Téléphone'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Prestataire)
class PrestataireAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_nom', 'get_prenom', 'code_promo', 'taux_commission', 'solde_commission', 'statut')
    list_filter = ('statut', 'date_creation')
    search_fields = ('client__user__last_name', 'client__user__first_name', 'entreprise', 'email_professionnel', 'code_promo')
    readonly_fields = ('date_creation', 'date_modification')
    
    fieldsets = (
        ('Client associé', {
            'fields': ('client',)
        }),
        ('Informations professionnelles', {
            'fields': ('entreprise', 'email_professionnel')
        }),
        ('Commission', {
            'fields': ('code_promo', 'taux_commission', 'solde_commission')
        }),
        ('Statut', {
            'fields': ('statut',)
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_nom(self, obj):
        return obj.nom
    get_nom.short_description = 'Nom'
    
    def get_prenom(self, obj):
        return obj.prenom
    get_prenom.short_description = 'Prénom'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client', 'client__user')


@admin.register(CommissionLog)
class CommissionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'prestataire', 'type_operation', 'montant', 'reference_commande', 'date_operation')
    list_filter = ('type_operation', 'date_operation')
    search_fields = ('prestataire__client__user__email', 'reference_commande', 'description')
    autocomplete_fields = ('prestataire',)


@admin.register(Livreur)
class LivreurAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_nom', 'get_prenom', 'get_telephone', 'statut', 'note_moyenne', 'nombre_livraisons')
    list_filter = ('statut', 'date_embauche')
    search_fields = ('client__user__last_name', 'client__user__first_name', 'client__user__telephone', 'client__user__email')
    readonly_fields = ('date_creation', 'date_modification', 'note_moyenne', 'nombre_livraisons')
    
    fieldsets = (
        ('Client associé', {
            'fields': ('client', 'photo')
        }),
        ('Informations professionnelles', {
            'fields': ('date_embauche',)
        }),
        ('Statistiques', {
            'fields': ('statut', 'note_moyenne', 'nombre_livraisons')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_nom(self, obj):
        return obj.nom
    get_nom.short_description = 'Nom'
    
    def get_prenom(self, obj):
        return obj.prenom
    get_prenom.short_description = 'Prénom'
    
    def get_telephone(self, obj):
        return obj.telephone
    get_telephone.short_description = 'Téléphone'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client', 'client__user')