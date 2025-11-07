from django.db import migrations, models


def eliminar_estado_cuenta_si_existe(apps, schema_editor):
    """
    Función para eliminar estado_cuenta solo si existe en la base de datos.
    """
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Verificar y eliminar estado_cuenta si existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios_usuario' AND column_name='estado_cuenta'
        """)
        if cursor.fetchone():
            cursor.execute("ALTER TABLE usuarios_usuario DROP COLUMN estado_cuenta")


def revertir_estado_cuenta(apps, schema_editor):
    """
    Función de reversa - restaura el campo estado_cuenta
    """
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios_usuario' AND column_name='estado_cuenta'
        """)
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE usuarios_usuario 
                ADD COLUMN estado_cuenta VARCHAR(20) DEFAULT 'pendiente'
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_alter_usuario_rol'),
    ]

    operations = [
        # Eliminar estado_cuenta solo si existe (usando función personalizada)
        migrations.RunPython(eliminar_estado_cuenta_si_existe, revertir_estado_cuenta),
        # Añadir codigo_estudiantil usando SeparateDatabaseAndState para actualizar BD y estado
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        DO $$ 
                        BEGIN 
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name='usuarios_usuario' AND column_name='codigo_estudiantil'
                            ) THEN
                                ALTER TABLE usuarios_usuario 
                                ADD COLUMN codigo_estudiantil VARCHAR(10) NULL;
                            END IF;
                        END $$;
                    """,
                    reverse_sql="ALTER TABLE usuarios_usuario DROP COLUMN IF EXISTS codigo_estudiantil;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='usuario',
                    name='codigo_estudiantil',
                    field=models.CharField(blank=True, max_length=10, null=True, unique=True),
                ),
            ],
        ),
    ]