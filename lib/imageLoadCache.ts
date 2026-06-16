const loadedSources = new Set<string>();
const failedSources = new Set<string>();

export function isImageCached(src: string) {
  return loadedSources.has(src);
}

export function isImageFailed(src: string) {
  return failedSources.has(src);
}

export function markImageCached(src: string) {
  loadedSources.add(src);
  failedSources.delete(src);
}

export function markImageFailed(src: string) {
  failedSources.add(src);
  loadedSources.delete(src);
}
