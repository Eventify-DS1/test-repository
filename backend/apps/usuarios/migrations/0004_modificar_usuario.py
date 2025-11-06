from django.db import migrations, models


def eliminar_campos_antiguos(apps, schema_editor):
    """
    Función para eliminar datos relacionados con campos que se van a remover.
    En este caso, no hay datos que migrar, solo eliminamos los campos.
    """
    pass


def revertir_campos(apps, schema_editor):
    """
    Función de reversa - restaura los campos eliminados
    """
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_alter_usuario_rol'),
    ]

    operations = [
        # Eliminar estado_cuenta
        migrations.RemoveField(
            model_name='usuario',
            name='estado_cuenta',
        ),
        # Eliminar is_staff (viene de AbstractUser)
        migrations.RemoveField(
            model_name='usuario',
            name='is_staff',
        ),
         # Eliminar is_active (viene de AbstractUser)
        migrations.RemoveField(
            model_name='usuario',
            name='is_active',
        ),
        # Añadir codigo_estudiantil
        migrations.AddField(
            model_name='usuario',
            name='codigo_estudiantil',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]