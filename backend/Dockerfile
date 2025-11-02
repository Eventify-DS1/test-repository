# backend/Dockerfile

FROM python:3.11-slim

# Evitar que Python genere archivos .pyc y usar stdout sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema (si usas Postgres, necesitas psycopg2 deps)
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos
COPY requirements.txt /app/

# Instalar dependencias de Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar todo el proyecto
COPY . /app/

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]