const MAX_DIMENSION = 1200;

/**
 * Converts any browser-readable image file (JPG, PNG, HEIC on iOS, etc.)
 * to a WebP Blob using an off-screen Canvas at ≤1200px and quality 0.8.
 * Throws if the browser can't load the image or doesn't support WebP encoding.
 */
export async function convertToWebP(
  file: File,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // Scale down proportionally if the image is too large
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        if (w >= h) {
          h = Math.round((h * MAX_DIMENSION) / w);
          w = MAX_DIMENSION;
        } else {
          w = Math.round((w * MAX_DIMENSION) / h);
          h = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("WebP conversion failed (toBlob returned null)"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image for conversion"));
    };

    img.src = objectUrl;
  });
}

/** Returns a human-readable file size string, e.g. "142 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
