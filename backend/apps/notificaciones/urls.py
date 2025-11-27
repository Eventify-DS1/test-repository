from django.urls import path
from . import views

urlpatterns = [
    path('eventos-por-mes/', views.eventos_por_mes),
    path('eventos-por-usuarios/', views.eventos_por_usuario),
    path('eventos-por-categoria/', views.eventos_por_categoria),
    path('eventos-por-lugar/', views.eventos_por_lugar),
    path('eventos-por-estado/', views.eventos_por_estado),
    path('export/csv/', views.export_csv),
    path('export/xlsx/', views.export_xlsx),
    path('export/pdf/', views.export_pdf),
    path('api/reportes/', include('reportes.urls')),
]
