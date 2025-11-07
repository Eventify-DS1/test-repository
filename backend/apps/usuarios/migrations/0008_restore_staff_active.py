from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0007_remove_usuario_estado_cuenta"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE usuarios_usuario
                ADD COLUMN IF NOT EXISTS is_staff BOOLEAN NOT NULL DEFAULT FALSE
            """,
            reverse_sql="ALTER TABLE usuarios_usuario DROP COLUMN IF EXISTS is_staff",
        ),
        migrations.RunSQL(
            sql="""
                ALTER TABLE usuarios_usuario
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
            """,
            reverse_sql="ALTER TABLE usuarios_usuario DROP COLUMN IF EXISTS is_active",
        ),
    ]


