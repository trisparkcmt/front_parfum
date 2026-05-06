# catalogue/signals.py
from decimal import Decimal
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import CategorieParfum, TypeAccessoire, TypeFlacon


# ============================================================
# HELPER — calcul du prix après réduction
# ============================================================
def appliquer_reduction(prix_unitaire, taux):
    """Calcule le prix après réduction, arrondi à 2 décimales."""
    reduction = Decimal(str(taux)) / Decimal('100')
    return (prix_unitaire * (1 - reduction)).quantize(Decimal('0.01'))


# ============================================================
# CAPTURE DE L'ANCIENNE VALEUR — via pre_save
#
# pre_save se déclenche AVANT l'écriture en base.
# On y récupère la valeur actuelle en BDD (l'ancienne)
# et on la stocke sur l'instance avec un attribut temporaire
# _ancien_taux_reduction, disponible dans post_save.
# ============================================================
@receiver(pre_save, sender=CategorieParfum)
def capturer_ancien_taux_categorie(sender, instance, **kwargs):
    """
    Avant la sauvegarde, on lit le taux actuel en base
    et on le stocke sur l'instance pour le comparer dans post_save.
    Si l'objet est nouveau (pas encore en base), _ancien_taux = 0.
    """
    if instance.pk:
        try:
            ancien = CategorieParfum.objects.get(pk=instance.pk)
            instance._ancien_taux_reduction = ancien.taux_reduction
        except CategorieParfum.DoesNotExist:
            instance._ancien_taux_reduction = Decimal('0')
    else:
        instance._ancien_taux_reduction = Decimal('0')


@receiver(pre_save, sender=TypeAccessoire)
def capturer_ancien_taux_accessoire(sender, instance, **kwargs):
    if instance.pk:
        try:
            ancien = TypeAccessoire.objects.get(pk=instance.pk)
            instance._ancien_taux_reduction = ancien.taux_reduction
        except TypeAccessoire.DoesNotExist:
            instance._ancien_taux_reduction = Decimal('0')
    else:
        instance._ancien_taux_reduction = Decimal('0')


@receiver(pre_save, sender=TypeFlacon)
def capturer_ancien_taux_flacon(sender, instance, **kwargs):
    if instance.pk:
        try:
            ancien = TypeFlacon.objects.get(pk=instance.pk)
            instance._ancien_taux_reduction = ancien.taux_reduction
        except TypeFlacon.DoesNotExist:
            instance._ancien_taux_reduction = Decimal('0')
    else:
        instance._ancien_taux_reduction = Decimal('0')


# ============================================================
# APPLICATION DES RÉDUCTIONS — via post_save
#
# Après la sauvegarde, on compare le nouveau taux avec l'ancien
# (_ancien_taux_reduction capturé dans pre_save) pour décider
# quoi faire sur les produits liés.
# ============================================================
@receiver(post_save, sender=CategorieParfum)
def mettre_a_jour_prix_parfums(sender, instance, **kwargs):
    """
    Cas 1 — Nouveau taux > 0 :
        Calcule prix_promotionnel = prix_unitaire * (1 - taux/100)
        SAUF si le produit a déjà un prix_promotionnel manuel
        plus avantageux (inférieur au prix calculé).

    Cas 2 — Nouveau taux = 0 (réduction désactivée) :
        Retire prix_promotionnel UNIQUEMENT sur les produits
        dont le prix_promotionnel correspond exactement au calcul
        fait avec l'ANCIEN taux (donc auto, pas manuel).
    """
    nouveau_taux = instance.taux_reduction
    ancien_taux  = getattr(instance, '_ancien_taux_reduction', Decimal('0'))

    # Aucun changement de taux → rien à faire
    if nouveau_taux == ancien_taux:
        return

    parfums = instance.parfums.filter(actif=True)

    if nouveau_taux > 0:
        for parfum in parfums:
            prix_calcule = appliquer_reduction(parfum.prix_unitaire, nouveau_taux)

            # Prix manuel plus avantageux → priorité au manuel
            if parfum.prix_promotionnel and parfum.prix_promotionnel < prix_calcule:
                continue

            parfum.prix_promotionnel = prix_calcule
            parfum.save(update_fields=['prix_promotionnel'])

    else:
        # taux → 0 : on retire uniquement les prix calculés automatiquement
        for parfum in parfums:
            if parfum.prix_promotionnel is None:
                continue

            # Recalcul avec l'ANCIEN taux (valeur fiable capturée avant save)
            prix_auto_precedent = appliquer_reduction(parfum.prix_unitaire, ancien_taux)

            # Si le prix stocké correspond exactement au calcul auto → c'est auto
            if parfum.prix_promotionnel == prix_auto_precedent:
                parfum.prix_promotionnel = None
                parfum.save(update_fields=['prix_promotionnel'])
            # Sinon → prix manuel, on ne touche pas


@receiver(post_save, sender=TypeAccessoire)
def mettre_a_jour_prix_accessoires(sender, instance, **kwargs):
    """Même logique que pour CategorieParfum, appliquée aux accessoires."""
    nouveau_taux = instance.taux_reduction
    ancien_taux  = getattr(instance, '_ancien_taux_reduction', Decimal('0'))

    if nouveau_taux == ancien_taux:
        return

    accessoires = instance.accessoires.filter(actif=True)

    if nouveau_taux > 0:
        for accessoire in accessoires:
            prix_calcule = appliquer_reduction(accessoire.prix_unitaire, nouveau_taux)

            if accessoire.prix_promotionnel and accessoire.prix_promotionnel < prix_calcule:
                continue

            accessoire.prix_promotionnel = prix_calcule
            accessoire.save(update_fields=['prix_promotionnel'])

    else:
        for accessoire in accessoires:
            if accessoire.prix_promotionnel is None:
                continue

            prix_auto_precedent = appliquer_reduction(accessoire.prix_unitaire, ancien_taux)

            if accessoire.prix_promotionnel == prix_auto_precedent:
                accessoire.prix_promotionnel = None
                accessoire.save(update_fields=['prix_promotionnel'])


@receiver(post_save, sender=TypeFlacon)
def mettre_a_jour_prix_flacons(sender, instance, **kwargs):
    """
    Flacon n'a pas de prix_promotionnel dans le modèle actuel.
    Signal prêt à être activé lors de l'ajout de ce champ.
    """
    pass