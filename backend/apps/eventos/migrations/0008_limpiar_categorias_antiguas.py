from django.db import migrations

def limpiar_categorias_antiguas(apps, schema_editor):
    CategoriaEvento = apps.get_model('eventos', 'CategoriaEvento')
    categorias_antiguas = ["Académico", "Deportivo", "Social"]
    # No eliminamos "Cultural" porque también está en las nuevas
    CategoriaEvento.objects.filter(nombre__in=categorias_antiguas).delete()

class Migration(migrations.Migration):
    dependencies = [
        ("eventos", "0007_seed_categorias_final"),
    ]
    operations = [
        migrations.RunPython(limpiar_categorias_antiguas),
    ]