const TARGET_BYTES = 80 * 1024; // 80 KB — sweet spot for menu photos
const INITIAL_MAX_DIMENSION = 640;
const MIN_MAX_DIMENSION = 360;
const INITIAL_QUALITY = 0.72;
const MIN_QUALITY = 0.42;

function scaleDimensions(
  width: number,
  height: number,
  maxDimension: number
): { w: number; h: number } {
  let w = width;
  let h = height;

  if (w <= maxDimension && h <= maxDimension) {
    return { w, h };
  }

  if (w >= h) {
    h = Math.round((h * maxDimension) / w);
    w = maxDimension;
  } else {
    w = Math.round((w * maxDimension) / h);
    h = maxDimension;
  }

  return { w, h };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image for conversion"));
    };

    img.src = objectUrl;
  });
}

function encodeWebP(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
}

/**
 * Converts any browser-readable image to WebP, iteratively reducing
 * quality and dimensions until the blob is ≤80 KB (or min limits hit).
 */
export async function convertToWebP(file: File): Promise<Blob> {
  const img = await loadImage(file);

  let maxDimension = INITIAL_MAX_DIMENSION;
  let quality = INITIAL_QUALITY;

  while (maxDimension >= MIN_MAX_DIMENSION) {
    while (quality >= MIN_QUALITY) {
      const { w, h } = scaleDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxDimension
      );

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas 2D context unavailable");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await encodeWebP(canvas, quality);
      if (!blob) {
        throw new Error("WebP conversion failed (toBlob returned null)");
      }

      if (blob.size <= TARGET_BYTES) {
        return blob;
      }

      quality = Math.round((quality - 0.08) * 100) / 100;
    }

    maxDimension = Math.round(maxDimension * 0.82);
    quality = INITIAL_QUALITY;
  }

  // Last resort — smallest settings
  const { w, h } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    MIN_MAX_DIMENSION
  );
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await encodeWebP(canvas, MIN_QUALITY);
  if (!blob) throw new Error("WebP conversion failed");
  return blob;
}

/** Returns a human-readable file size string, e.g. "142 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
