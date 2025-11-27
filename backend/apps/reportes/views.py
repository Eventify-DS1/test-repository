from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.http import JsonResponse
from eventos.models import Evento
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import api_view, permission_classes


@api_view(["GET"])
@permission_classes([IsAdminUser])
def reporte_eventos_por_mes(request):
    inicio = request.GET.get("inicio")
    fin = request.GET.get("fin")

    qs = Evento.objects.all()

    if inicio:
        qs = qs.filter(fecha_inicio__date__gte=inicio)
    if fin:
        qs = qs.filter(fecha_inicio__date__lte=fin)

    datos = (
        qs.annotate(mes=TruncMonth("fecha_inicio"))
          .values("mes")
          .annotate(total=Count("id"))
          .order_by("mes")
    )

    return JsonResponse(list(datos), safe=False)

