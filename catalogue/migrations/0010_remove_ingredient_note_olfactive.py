from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalogue', '0009_alter_essence_options_remove_essence_stock_litre_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='ingredient',
            name='note_olfactive',
        ),
    ]
