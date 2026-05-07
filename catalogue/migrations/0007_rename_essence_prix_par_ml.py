from decimal import Decimal

from django.db import migrations


def convertir_prix_par_10ml_en_prix_par_ml(apps, schema_editor):
    Essence = apps.get_model('catalogue', 'Essence')
    for essence in Essence.objects.all():
        essence.prix_par_ml = essence.prix_par_ml / Decimal('10')
        essence.save(update_fields=['prix_par_ml'])


def restaurer_prix_par_10ml(apps, schema_editor):
    Essence = apps.get_model('catalogue', 'Essence')
    for essence in Essence.objects.all():
        essence.prix_par_ml = essence.prix_par_ml * Decimal('10')
        essence.save(update_fields=['prix_par_ml'])


class Migration(migrations.Migration):

    dependencies = [
        ('catalogue', '0006_remove_essence_image_principale_essence_notes_coeur_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='essence',
            old_name='prix_par_10ml',
            new_name='prix_par_ml',
        ),
        migrations.RunPython(
            convertir_prix_par_10ml_en_prix_par_ml,
            restaurer_prix_par_10ml,
        ),
    ]
