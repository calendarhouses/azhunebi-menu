const MAX_OUTPUT_BYTES = 140 * 1024; // keep menu photos small but sharp
const MAX_DIMENSION = 960; // enough for retina dish cards
const MIN_DIMENSION = 640;
const MIN_QUALITY = 0.72;
const MAX_QUALITY = 0.9;

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

function drawToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): { canvas: HTMLCanvasElement; w: number; h: number } {
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

  return { canvas, w, h };
}

function encodeWebP(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
}

async function encodeBestQualityUnderLimit(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  const atMax = await encodeWebP(canvas, MAX_QUALITY);
  if (atMax && atMax.size <= MAX_OUTPUT_BYTES) {
    return atMax;
  }

  let lo = MIN_QUALITY;
  let hi = MAX_QUALITY;
  let best: Blob | null = null;

  for (let i = 0; i < 8; i += 1) {
    const quality = Math.round(((lo + hi) / 2) * 100) / 100;
    const blob = await encodeWebP(canvas, quality);
    if (!blob) {
      break;
    }

    if (blob.size <= MAX_OUTPUT_BYTES) {
      best = blob;
      lo = quality;
    } else {
      hi = quality;
    }

    if (hi - lo < 0.03) {
      break;
    }
  }

  if (best) {
    return best;
  }

  const fallback = await encodeWebP(canvas, MIN_QUALITY);
  if (!fallback) {
    throw new Error("WebP conversion failed (toBlob returned null)");
  }

  return fallback;
}

/**
 * Converts images to WebP with quality-first compression.
 * Keeps photos sharp by limiting dimensions gently and picking the
 * highest quality that still fits under ~140 KB.
 */
export async function convertToWebP(file: File): Promise<Blob> {
  const img = await loadImage(file);

  const needsResize =
    img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION;

  if (
    file.type === "image/webp" &&
    file.size <= MAX_OUTPUT_BYTES &&
    !needsResize
  ) {
    return file;
  }

  let maxDimension = MAX_DIMENSION;

  while (maxDimension >= MIN_DIMENSION) {
    const { canvas } = drawToCanvas(img, maxDimension);
    const blob = await encodeBestQualityUnderLimit(canvas);

    if (blob.size <= MAX_OUTPUT_BYTES || maxDimension === MIN_DIMENSION) {
      return blob;
    }

    maxDimension = Math.round(maxDimension * 0.88);
  }

  const { canvas } = drawToCanvas(img, MIN_DIMENSION);
  return encodeBestQualityUnderLimit(canvas);
}

/** Returns a human-readable file size string, e.g. "142 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
