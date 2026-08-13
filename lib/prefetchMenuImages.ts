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
 * Warm cache for a small set of visible dish photos only.
 * Full-menu prefetch was a major Supabase Storage egress source.
 */
export async function prefetchMenuImages(
  items: { image_url: string | null }[],
  options?: { timeoutMs?: number; limit?: number }
): Promise<void> {
  const limit = options?.limit ?? 6;
  const urls = [
    ...new Set(
      items
        .map((item) => item.image_url)
        .filter((url): url is string => Boolean(url))
    ),
  ]
    .filter((url) => !isImageCached(url) && !isImageFailed(url))
    .slice(0, limit);

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
