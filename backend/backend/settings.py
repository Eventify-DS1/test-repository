"""
Django settings for backend project.
"""

import os
from pathlib import Path
import environ
from datetime import timedelta
import dj_database_url
from celery.schedules import crontab, schedule

# ============================================
# CONFIGURACIÓN BÁSICA
# ============================================

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
PROJECT_ROOT = BASE_DIR.parent
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.environ.get('SECRET_KEY') or env('SECRET_KEY', default='django-insecure-temporary-key-change-in-production')

DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = [
    'test-repository-production-b71d.up.railway.app',
    'main-eventify.vercel.app',
    'localhost',
    '127.0.0.1',
    '.railway.app',
    '.vercel.app'
]


REDIS_PASS = env('REDIS_PASS', default='')
REDIS_ENDPOINT = env('REDIS_ENDPOINT', default='redis:6379' if os.environ.get('DOCKER_CONTAINER') else 'localhost:6379')

redis_pass_raw = os.environ.get('REDIS_PASS', None)
if redis_pass_raw is not None and str(redis_pass_raw).strip():
    redis_pass_clean = str(redis_pass_raw).strip()
    if redis_pass_clean.lower() not in ('none', 'null', ''):
        REDIS_URL = f"redis://:{redis_pass_clean}@{REDIS_ENDPOINT}"
    else:
        REDIS_URL = f"redis://{REDIS_ENDPOINT}"
else:
    REDIS_URL = f"redis://{REDIS_ENDPOINT}"

# ============================================
# APPS
# ============================================

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',              
    'django_celery_beat',
    
    'apps.usuarios',
    'apps.eventos',
    'apps.notificaciones',
    'apps.reportes',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # 'whitenoise.middleware.WhiteNoiseMiddleware', # Mantener comentado si no lo usas para evitar error 502
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'backend.middleware.SecurityHeadersMiddleware', 
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

DATABASES = {
    'default': dj_database_url.parse(
        env('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'usuarios.Usuario'

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ============================================
# CORS & CSRF (Configuración Cross-Site)
# ============================================

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "https://test-repository-production-b71d.up.railway.app",
    "https://main-eventify.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_EXPOSE_HEADERS = ['Set-Cookie']

CSRF_TRUSTED_ORIGINS = [
    "https://test-repository-production-b71d.up.railway.app",
    "https://main-eventify.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

# ============================================
# COOKIES (SOLUCIÓN AL ERROR 401)
# ============================================

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_USE_SESSIONS = False
CSRF_COOKIE_AGE = None

# Configuración de cookies de sesión
# IMPORTANTE: SameSite='None' y Secure=True son requeridos para que lsa cookies viajen 
# entre dominios diferentes (Vercel -> Railway)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'None' 
CSRF_COOKIE_SECURE = True

# ============================================
# REST FRAMEWORK & SECURITY
# ============================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.usuarios.auth.CookieJWTAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 9,
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '1000/hour' if not DEBUG else '100000/day',
        'anon': '100/hour' if not DEBUG else '10000/day',
    },
    'DATETIME_FORMAT': "%Y-%m-%d %H:%M:%S",
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}

EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='eventifyuv@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Bogota'

CELERY_BEAT_SCHEDULE = {
    'notificar-eventos-proximos': {
        'task': 'apps.notificaciones.tasks.notificar_eventos_proximos',
        'schedule': schedule(run_every=timedelta(seconds=15)),
    },
    'limpiar-notificaciones-eventos-finalizados': {
        'task': 'apps.notificaciones.tasks.limpiar_notificaciones_eventos_finalizados',
        'schedule': schedule(run_every=timedelta(hours=12)),
    },
    'limpiar-intentos-login': {
        'task': 'apps.usuarios.tasks.limpiar_intentos_login',
        'schedule': schedule(run_every=timedelta(days=1)),
    },
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    }
}

# Configuración de Proxy SSL para Railway (Obligatorio)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True) # Forzamos True en producción

SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SESSION_COOKIE_AGE = 7200
SESSION_SAVE_EVERY_REQUEST = False

LOGIN_MAX_ATTEMPTS = env.int('LOGIN_MAX_ATTEMPTS', default=5)
LOGIN_BLOCK_TIME_MINUTES = env.int('LOGIN_BLOCK_TIME_MINUTES', default=15)
MFA_MAX_ATTEMPTS = env.int('MFA_MAX_ATTEMPTS', default=5)

# CSP
CSP_DEFAULT_SRC = env.list('CSP_DEFAULT_SRC', default=["'self'"])
CSP_SCRIPT_SRC = env.list('CSP_SCRIPT_SRC', default=["'self'", "'unsafe-inline'", "'unsafe-eval'" if DEBUG else ""])
CSP_STYLE_SRC = env.list('CSP_STYLE_SRC', default=["'self'", "'unsafe-inline'"])
CSP_IMG_SRC = env.list('CSP_IMG_SRC', default=["'self'", "data:", "https:"])
CSP_FONT_SRC = env.list('CSP_FONT_SRC', default=["'self'", "data:"])
CSP_CONNECT_SRC = env.list('CSP_CONNECT_SRC', default=["'self'", "ws:", "wss:" if not DEBUG else ""])
CSP_FRAME_SRC = env.list('CSP_FRAME_SRC', default=["'none'"])
CSP_OBJECT_SRC = env.list('CSP_OBJECT_SRC', default=["'none'"])
CSP_BASE_URI = env.list('CSP_BASE_URI', default=["'self'"])
CSP_FORM_ACTION = env.list('CSP_FORM_ACTION', default=["'self'"])
CSP_UPGRADE_INSECURE_REQUESTS = env.bool('CSP_UPGRADE_INSECURE_REQUESTS', default=not DEBUG)

CSP_HEADER = (
    f"default-src {' '.join(CSP_DEFAULT_SRC)}; "
    f"script-src {' '.join([s for s in CSP_SCRIPT_SRC if s])}; "
    f"style-src {' '.join(CSP_STYLE_SRC)}; "
    f"img-src {' '.join(CSP_IMG_SRC)}; "
    f"font-src {' '.join(CSP_FONT_SRC)}; "
    f"connect-src {' '.join([s for s in CSP_CONNECT_SRC if s])}; "
    f"frame-src {' '.join(CSP_FRAME_SRC)}; "
    f"object-src {' '.join(CSP_OBJECT_SRC)}; "
    f"base-uri {' '.join(CSP_BASE_URI)}; "
    f"form-action {' '.join(CSP_FORM_ACTION)}; "
    + (f"upgrade-insecure-requests; " if CSP_UPGRADE_INSECURE_REQUESTS else "")
)
