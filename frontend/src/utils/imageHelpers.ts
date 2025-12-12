/**
 * Construye la URL completa para una imagen desde el backend
 * @param imagePath - La ruta relativa de la imagen desde el backend (ej: "/media/eventos/imagen.jpg")
 * @returns La URL completa o undefined si no hay imagen
 */
export const getImageUrl = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  
  // Si ya es una URL completa (http:// o https://), devolverla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // En desarrollo, usar ruta relativa (el proxy de Vite maneja /media)
  // En producción, construir la URL completa
  if (import.meta.env.DEV) {
    // Asegurarse de que la ruta comience con /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return path; // Ruta relativa, el proxy de Vite la manejará
  }
  
  // En producción, usar la URL completa del backend
  const baseURL = import.meta.env.VITE_API_URL || window.location.origin;
  
  // Asegurarse de que la ruta comience con /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseURL}${path}`;
};

/**
 * Valida si una URL de imagen es accesible
 * @param imageUrl - La URL de la imagen a validar
 * @returns Promise que resuelve true si la imagen es accesible
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

