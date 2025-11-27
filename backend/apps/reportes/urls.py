from django.urls import path
from .views import reporte_eventos_por_mes

urlpatterns = [
    path("eventos-por-mes/", reporte_eventos_por_mes, name="reporte_eventos_por_mes"),
]
