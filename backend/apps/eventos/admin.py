from django.contrib import admin
from .models import Evento, CategoriaEvento, Inscripcion, Reseña, Favorito

# Register your models here.
admin.site.register(CategoriaEvento)
admin.site.register(Evento)
admin.site.register(Inscripcion)
admin.site.register(Reseña)
admin.site.register(Favorito)
