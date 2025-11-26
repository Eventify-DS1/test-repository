"""
Utilidades de seguridad para prevenir XSS y sanitizar datos.
"""
import html
import re
from django.utils.html import strip_tags


def sanitize_html(html_content, allowed_tags=None):
    """
    Sanitiza contenido HTML para prevenir XSS.
    Por defecto, escapa todo el HTML. Si se necesitan tags específicos,
    se recomienda usar una librería como bleach.
    
    Args:
        html_content: Contenido HTML a sanitizar
        allowed_tags: Lista de tags HTML permitidos (opcional, requiere bleach)
    
    Returns:
        Contenido HTML sanitizado (escapado por defecto)
    """
    if not html_content:
        return html_content
    
    # Por defecto, escapar todo el HTML para máxima seguridad
    # Si se necesita permitir HTML, usar strip_tags de Django o instalar bleach
    if allowed_tags:
        # Si se especifican tags permitidos, usar strip_tags
        # Nota: Para sanitización más robusta, instalar bleach: pip install bleach
        try:
            from django.utils.html import strip_tags
            # strip_tags elimina todos los tags, luego podemos permitir algunos
            # Para una implementación completa, usar bleach
            cleaned = strip_tags(str(html_content))
            return cleaned
        except Exception:
            return html.escape(str(html_content))
    else:
        # Escapar todo el HTML por defecto (más seguro)
        return html.escape(str(html_content))


def sanitize_text(text_content, max_length=None):
    """
    Sanitiza texto plano eliminando caracteres peligrosos.
    
    Args:
        text_content: Texto a sanitizar
        max_length: Longitud máxima permitida
    
    Returns:
        Texto sanitizado
    """
    if not text_content:
        return text_content
    
    # Convertir a string y escapar HTML
    sanitized = html.escape(str(text_content))
    
    # Eliminar caracteres de control excepto saltos de línea y tabs
    sanitized = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', sanitized)
    
    # Limitar longitud si se especifica
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def sanitize_url(url):
    """
    Valida y sanitiza URLs para prevenir ataques.
    
    Args:
        url: URL a validar
    
    Returns:
        URL sanitizada o None si es inválida
    """
    if not url:
        return None
    
    url = str(url).strip()
    
    # Solo permitir http, https, mailto
    allowed_schemes = ['http', 'https', 'mailto']
    
    # Verificar que comience con un esquema permitido
    for scheme in allowed_schemes:
        if url.lower().startswith(f'{scheme}://'):
            # Escapar caracteres peligrosos en la URL
            return html.escape(url)
    
    # Si no tiene esquema, asumir que es relativa y escapar
    if url.startswith('/') or url.startswith('./'):
        return html.escape(url)
    
    # Si no es una URL válida, retornar None
    return None

