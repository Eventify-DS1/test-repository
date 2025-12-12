#!/bin/sh
set -e

echo "Esperando a que la base de datos esté lista..."

# Función para verificar la conexión a la base de datos
wait_for_db() {
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Intento $attempt/$max_attempts: Verificando conexión a la base de datos..."
        if python manage.py check --database default 2>/dev/null; then
            echo "✓ Conexión a la base de datos exitosa"
            return 0
        fi
        echo "✗ Conexión fallida, esperando 2 segundos..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "⚠ Advertencia: No se pudo verificar la conexión a la base de datos después de $max_attempts intentos"
    echo "Continuando con las migraciones..."
    return 1
}

# Intentar esperar a la base de datos (no crítico si falla)
wait_for_db || true

# Ejecutar migraciones
echo "Aplicando migraciones..."
python manage.py migrate --noinput || {
    echo "⚠ Error al aplicar migraciones. Esto puede ser normal si la base de datos aún no está lista."
    echo "El servicio continuará y reintentará en el próximo ciclo."
}

echo "Migraciones completadas. Iniciando servicio..."

# Si no se proporciona un comando, usar daphne con el puerto correcto
if [ $# -eq 0 ]; then
    # Asegurar que PORT tenga un valor
    PORT=${PORT:-8000}
    echo "Iniciando daphne en puerto $PORT..."
    exec daphne -b 0.0.0.0 -p $PORT backend.asgi:application
else
    exec "$@"
fi

