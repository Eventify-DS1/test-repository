
from django.urls import path
from . import views

urlpatterns = [
    # Endpoints de consulta de datos
    path("eventos-por-mes/", views.eventos_por_mes, name="eventos_por_mes"),
    path("eventos-por-usuarios/", views.eventos_por_usuario, name="eventos_por_usuario"),
    path("eventos-por-categoria/", views.eventos_por_categoria, name="eventos_por_categoria"),
    path("eventos-por-lugar/", views.eventos_por_lugar, name="eventos_por_lugar"),
    path("eventos-por-estado/", views.eventos_por_estado, name="eventos_por_estado"),

    # Endpoints de exportación
    path("export/csv/", views.export_csv, name="export_csv"),
    path("export/xlsx/", views.export_xlsx, name="export_xlsx"),
    path("export/pdf/", views.export_pdf, name="export_pdf"),
]