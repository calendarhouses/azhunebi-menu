import {
  isImageCached,
  isImageFailed,
  markImageCached,
  markImageFailed,
} from "@/lib/imageLoadCache";

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      markImageCached(url);
      resolve();
    };
    img.onerror = () => {
      markImageFailed(url);
      resolve();
    };
    img.src = url;
  });
}

/**
 * Warms the in-memory + browser cache for all menu photos.
 * Optional timeout so the preloader never blocks too long on slow networks.
 */
export async function prefetchMenuImages(
  items: { image_url: string | null }[],
  options?: { timeoutMs?: number }
): Promise<void> {
  const urls = [
    ...new Set(
      items
        .map((item) => item.image_url)
        .filter((url): url is string => Boolean(url))
    ),
  ].filter((url) => !isImageCached(url) && !isImageFailed(url));

  if (urls.length === 0) return;

  const loading = Promise.all(urls.map(loadImage));

  if (options?.timeoutMs) {
    await Promise.race([
      loading,
      new Promise<void>((resolve) => {
        setTimeout(resolve, options.timeoutMs);
      }),
    ]);
    return;
  }

  await loading;
}
