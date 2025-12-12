# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Solo instalar libpq (runtime, no compilación)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt /app/

# Instalar dependencias Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Crear usuario no-root para Celery (seguridad)
RUN groupadd -r celeryuser && useradd -r -g celeryuser celeryuser

# Copiar proyecto
COPY . /app/

# Copiar y hacer ejecutable el entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Dar permisos al usuario celeryuser para escribir en /app (necesario para migraciones y logs)
RUN chown -R celeryuser:celeryuser /app

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
# Usar daphne para producción (soporta WebSockets y HTTP)
# Escuchar en 0.0.0.0 y usar la variable de entorno $PORT (o 8000 por defecto)
CMD daphne -b 0.0.0.0 -p ${PORT:-8000} backend.asgi:application