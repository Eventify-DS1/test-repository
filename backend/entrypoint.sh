#!/bin/sh
set -e

echo "Esperando a que la base de datos esté lista..."
python manage.py migrate --noinput

echo "Migraciones aplicadas. Iniciando servidor..."
exec "$@"

