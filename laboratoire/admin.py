from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import ParfumPersonnalise, ParfumPersonnaliseLigne


class ParfumPersonnaliseLigneInline(admin.TabularInline):
    model = ParfumPersonnaliseLigne
    extra = 1
    fields = ('essence', 'quantite_ml', 'prix_par_ml_snapshot', 'prix_ligne')
    readonly_fields = ('prix_ligne',)
    autocomplete_fields = ('essence',)


@admin.register(ParfumPersonnalise)
class ParfumPersonnaliseAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'client_info', 'contenance_ml', 'prix_total', 'statut', 'date_creation', 'voir_lignes')
    list_filter = ('statut', 'date_creation')
    search_fields = ('nom', 'client__user__email', 'client__user__username', 'client__user__first_name', 'client__user__last_name')
    readonly_fields = ('date_creation', 'date_modification', 'prix_essences', 'prix_total', 'prix_flacon_snapshot')
    inlines = [ParfumPersonnaliseLigneInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('client', 'nom', 'description')
        }),
        ('Composition', {
            'fields': ('flacon', 'contenance_ml')
        }),
        ('Prix', {
            'fields': ('prix_essences', 'prix_flacon_snapshot', 'prix_total')
        }),
        ('Suivi laboratoire', {
            'fields': ('statut', 'note_laboratoire')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def client_info(self, obj):
        """Affiche les infos du client"""
        return format_html(
            '<b>{}</b><br/><small>{}</small>',
            obj.client.user.get_full_name() or obj.client.user.email,
            obj.client.telephone
        )
    client_info.short_description = 'Client'
    
    def voir_lignes(self, obj):
        """Lien pour voir les lignes de composition"""
        count = obj.lignes.count()
        return format_html(
            '<a href="{}" target="_blank">{} essence(s)</a>',
            f"/admin/laboratoire/parfumpersonnaliseligne/?parfum_personnalise__id__exact={obj.id}",
            count
        )
    voir_lignes.short_description = 'Composition'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client', 'client__user', 'flacon')
    
    actions = ['valider_creations']
    
    def valider_creations(self, request, queryset):
        """Action pour valider plusieurs créations"""
        updated = queryset.update(statut='validé')
        self.message_user(request, f'{updated} création(s) validée(s).')
    valider_creations.short_description = 'Valider les créations sélectionnées'


@admin.register(ParfumPersonnaliseLigne)
class ParfumPersonnaliseLigneAdmin(admin.ModelAdmin):
    list_display = ('id', 'parfum_personnalise', 'essence', 'quantite_ml', 'prix_par_ml_snapshot', 'prix_ligne')
    list_filter = ('parfum_personnalise__statut',)
    search_fields = ('parfum_personnalise__nom', 'essence__nom')
    readonly_fields = ('prix_ligne',)
    autocomplete_fields = ('parfum_personnalise', 'essence')
    
    fieldsets = (
        ('Lien', {
            'fields': ('parfum_personnalise', 'essence')
        }),
        ('Quantité et prix', {
            'fields': ('quantite_ml', 'prix_par_ml_snapshot', 'prix_ligne')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parfum_personnalise', 'parfum_personnalise__client', 'essence')