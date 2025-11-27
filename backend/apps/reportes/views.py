from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from eventos.models import Evento, CategoriaEvento
import io, csv
from openpyxl import Workbook
from django.template.loader import render_to_string
# optional: weasyprint (see notas)
from weasyprint import HTML

# Eventos por mes
@api_view(['GET'])
@permission_classes([IsAdminUser])
def eventos_por_mes(request):
    qs = Evento.objects.all()
    inicio = request.GET.get('inicio')
    fin = request.GET.get('fin')
    if inicio:
        qs = qs.filter(fecha_inicio__date__gte=inicio)
    if fin:
        qs = qs.filter(fecha_inicio__date__lte=fin)

    datos = (
        qs.annotate(mes=TruncMonth('fecha_inicio'))
          .values('mes')
          .annotate(total=Count('id'))
          .order_by('mes')
    )
    # normalizar isoformat para JSON serializable
    out = [{'mes': d['mes'].isoformat() if d['mes'] else None, 'total': d['total']} for d in datos]
    return Response(out)

# Eventos por usuario (organizadores)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def eventos_por_usuario(request):
    qs = Evento.objects.values('organizador__id','organizador__username')\
              .annotate(total=Count('id')).order_by('-total')
    out = [{'usuario_id': r['organizador__id'], 'username': r['organizador__username'], 'total': r['total']} for r in qs]
    return Response(out)

# Eventos por categoría
@api_view(['GET'])
@permission_classes([IsAdminUser])
def eventos_por_categoria(request):
    qs = Evento.objects.values('categoria__id','categoria__nombre')\
              .annotate(total=Count('id')).order_by('-total')
    out = [{'categoria_id': r['categoria__id'], 'nombre': r['categoria__nombre'], 'total': r['total']} for r in qs]
    return Response(out)

# Eventos por lugar (ubicacion)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def eventos_por_lugar(request):
    qs = Evento.objects.values('ubicacion').annotate(total=Count('id')).order_by('-total')
    out = [{'ubicacion': r['ubicacion'], 'total': r['total']} for r in qs]
    return Response(out)

# Eventos por estado (futuro, en curso, finalizado, lleno)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def eventos_por_estado(request):
    ahora = timezone.now()
    futuros = Evento.objects.filter(fecha_inicio__gt=ahora).count()
    en_curso = Evento.objects.filter(fecha_inicio__lte=ahora, fecha_fin__gte=ahora).count()
    finalizados = Evento.objects.filter(fecha_fin__lt=ahora).count()
    llenos = Evento.objects.annotate(insc=Count('inscripciones')).filter(insc__gte=models.F('aforo')).count()
    return Response({'futuros': futuros, 'en_curso': en_curso, 'finalizados': finalizados, 'llenos': llenos})

# helpers
def csv_response(filename, headers, rows):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for r in rows:
        writer.writerow([r.get(h, '') for h in headers])
    resp = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_csv(request):
    tipo = request.GET.get('tipo','global')
    if tipo == 'mes':
        datos = list(Evento.objects.annotate(mes=TruncMonth('fecha_inicio')).values('mes').annotate(total=Count('id')).order_by('mes'))
        rows = [{'mes': d['mes'].isoformat() if d['mes'] else '', 'total': d['total']} for d in datos]
        return csv_response('eventos_por_mes.csv', ['mes','total'], rows)
    if tipo == 'usuarios':
        qs = Evento.objects.values('organizador__username').annotate(total=Count('id')).order_by('-total')
        rows = [{'username': r['organizador__username'], 'total': r['total']} for r in qs]
        return csv_response('eventos_por_usuario.csv', ['username','total'], rows)
    # global
    qs = Evento.objects.all().values('id','titulo','fecha_inicio','fecha_fin','ubicacion','aforo')
    rows = [{'id':r['id'],'titulo':r['titulo'],'fecha_inicio':r['fecha_inicio'].isoformat(),'fecha_fin':r['fecha_fin'].isoformat(),'ubicacion':r['ubicacion'],'aforo':r['aforo']} for r in qs]
    return csv_response('eventos_global.csv', ['id','titulo','fecha_inicio','fecha_fin','ubicacion','aforo'], rows)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_xlsx(request):
    tipo = request.GET.get('tipo','global')
    wb = Workbook()
    ws = wb.active
    if tipo == 'mes':
        datos = list(Evento.objects.annotate(mes=TruncMonth('fecha_inicio')).values('mes').annotate(total=Count('id')).order_by('mes'))
        ws.append(['mes','total'])
        for d in datos:
            ws.append([d['mes'].isoformat() if d['mes'] else '', d['total']])
    elif tipo == 'usuarios':
        qs = Evento.objects.values('organizador__username').annotate(total=Count('id')).order_by('-total')
        ws.append(['username','total'])
        for r in qs:
            ws.append([r['organizador__username'], r['total']])
    else:
        qs = Evento.objects.all().values('id','titulo','fecha_inicio','fecha_fin','ubicacion','aforo')
        ws.append(['id','titulo','fecha_inicio','fecha_fin','ubicacion','aforo'])
        for r in qs:
            ws.append([r['id'], r['titulo'], r['fecha_inicio'].isoformat(), r['fecha_fin'].isoformat(), r['ubicacion'], r['aforo']])
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    resp = HttpResponse(stream.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="report.xlsx"'
    return resp

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_pdf(request):
    tipo = request.GET.get('tipo','global')
    if tipo == 'mes':
        datos = list(Evento.objects.annotate(mes=TruncMonth('fecha_inicio')).values('mes').annotate(total=Count('id')).order_by('mes'))
        context = {'titulo':'Eventos por mes','rows':[{'mes':d['mes'].isoformat() if d['mes'] else '', 'total':d['total']} for d in datos]}
        html = render_to_string('reportes/pdf/mes.html', context)
    elif tipo == 'usuarios':
        qs = list(Evento.objects.values('organizador__username').annotate(total=Count('id')).order_by('-total'))
        context = {'titulo':'Eventos por usuario','rows':[{'username':r['organizador__username'], 'total':r['total']} for r in qs]}
        html = render_to_string('reportes/pdf/usuarios.html', context)
    else:
        qs = list(Evento.objects.all().values('id','titulo','fecha_inicio','fecha_fin','ubicacion','aforo'))
        context = {'titulo':'Listado de eventos','rows':[r for r in qs]}
        html = render_to_string('reportes/pdf/global.html', context)

    pdf_file = HTML(string=html).write_pdf()
    resp = HttpResponse(pdf_file, content_type='application/pdf')
    resp['Content-Disposition'] = 'attachment; filename="report.pdf"'
    return resp
