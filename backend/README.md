# Backend - Eventify

Backend del proyecto Eventify desarrollado con Django, Django REST Framework, Celery y Django Channels.

## Requisitos

- Python 3.11+
- Redis (para Celery y Channels)
- PostgreSQL (o SQLite para desarrollo)

## Instalación

1. Crear y activar el entorno virtual:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
   - Crear archivo `.env` en la raíz del proyecto
   - Configurar las variables necesarias (SECRET_KEY, DEBUG, DATABASE_URL, REDIS, etc.)

4. Aplicar migraciones:
```bash
python manage.py migrate
```

5. Crear superusuario (opcional):
```bash
python manage.py createsuperuser
```

## Ejecución del Proyecto

### Celery Beat

**IMPORTANTE**: Celery Beat debe estar corriendo para programar las tareas periódicas (notificaciones cada 15 segundos y limpieza cada 12 horas).

En una terminal:

```bash
cd backend
celery -A backend beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Celery Worker

**IMPORTANTE**: El Celery Worker debe estar corriendo para procesar las tareas asíncronas.

En otra terminal separada:

```bash
cd backend
celery -A backend worker --pool=threads --loglevel=info
```

### Servidor Django

En otra terminal separada:

```bash
cd backend
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000`

## Resumen: Terminales Necesarias

Para que el proyecto funcione completamente, necesitas **3 terminales abiertas**:

1. **Terminal 1 - Celery Beat:**
   ```bash
   cd backend
   celery -A backend beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

2. **Terminal 2 - Celery Worker:**
   ```bash
   cd backend
   celery -A backend worker --pool=threads --loglevel=info
   ```

3. **Terminal 3 - Django Server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

## Verificar que Celery funciona

### Celery Worker
Deberías ver mensajes como:
```
celery@hostname ready
```

### Celery Beat
Deberías ver mensajes como:
```
beat: Starting...
DatabaseScheduler: Schedule changed.
```

## Tareas Programadas

El proyecto tiene las siguientes tareas programadas:

1. **`notificar-eventos-proximos`**
   - Se ejecuta cada 15 segundos
   - Busca eventos que inician en 15 minutos, 1 hora o 1 día
   - Crea notificaciones para usuarios inscritos y organizadores

2. **`limpiar-notificaciones-eventos-finalizados`**
   - Se ejecuta cada 12 horas (medio día)
   - Busca eventos que ya finalizaron
   - Elimina las notificaciones relacionadas a esos eventos

## Notas Importantes

- **Redis debe estar corriendo** antes de iniciar Celery Worker y Beat (necesario para Celery y Channels)
- El **Worker procesa las tareas** que Beat programa
- El **Beat programa las tareas periódicas** según el schedule configurado
- Ambos servicios deben estar corriendo **simultáneamente** para que el sistema de notificaciones funcione correctamente

## Comandos Útiles

### Ver tareas registradas
```bash
celery -A backend inspect registered
```

### Ver workers activos
```bash
celery -A backend inspect active
```

### Ver estadísticas
```bash
celery -A backend inspect stats
```

### Ejecutar una tarea manualmente (para pruebas)
```bash
python manage.py shell
```

```python
from apps.notificaciones.tasks import notificar_eventos_proximos
notificar_eventos_proximos.delay()
```

## Estructura del Proyecto

```
backend/
├── apps/
│   ├── eventos/          # App de eventos
│   ├── notificaciones/   # App de notificaciones (Celery tasks)
│   └── usuarios/         # App de usuarios y autenticación
├── backend/
│   ├── settings.py       # Configuración de Django y Celery
│   ├── celery.py         # Configuración de Celery
│   └── urls.py           # URLs principales
└── manage.py
```

