/**
 * Motor de optimización y compresión de imágenes a formato WebP.
 * Reduce imágenes pesadas (PNG/JPEG de 3-10MB) a WebP ultra ligero (<30KB)
 * para ahorrar almacenamiento en Neon DB y acelerar la carga en la red.
 */

/**
 * Convierte un File o Blob a DataURL optimizado en WebP
 * @param {File|Blob} file Archivo original de imagen (PNG, JPG, etc.)
 * @param {Object} options Opciones de compresión
 * @param {number} options.maxWidth Ancho máximo permitido (default: 512px para logos)
 * @param {number} options.maxHeight Alto máximo permitido (default: 512px para logos)
 * @param {number} options.quality Calidad de compresión WebP entre 0 y 1 (default: 0.82)
 * @returns {Promise<{ dataUrl: string, originalSize: number, optimizedSize: number, ratio: number, width: number, height: number, mimeType: string }>}
 */
export function optimizeImageToWebP(file, options = {}) {
  const { maxWidth = 512, maxHeight = 512, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'));
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'));
      img.onload = () => {
        // Calcular dimensiones proporcionales
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
          }
        }

        // Crear canvas para procesamiento en memoria
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el contexto 2D del canvas.'));
        }

        // Suavizado de bordes bicúbico de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP
        let webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Fallback a JPEG si el navegador no soporta exportación WebP en canvas
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calcular peso aproximado del string base64
        const stringLength = webpDataUrl.length - 'data:image/webp;base64,'.length;
        const optimizedSize = Math.round((stringLength * 3) / 4);
        const ratio = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

        resolve({
          dataUrl: webpDataUrl,
          originalSize,
          optimizedSize,
          ratio: Math.max(0, ratio),
          width,
          height,
          mimeType: webpDataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
        });
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formatea bytes a representación legible (KB / MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default optimizeImageToWebP;
