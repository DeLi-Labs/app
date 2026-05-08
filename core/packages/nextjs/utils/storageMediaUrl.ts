/**
 * IP metadata `image` values from the indexer are storage backend URIs (`local://…`, `ipfs://…`, etc.),
 * not URLs the browser can fetch. `/api/attachment` resolves them via the configured storage gateway.
 */
export function storageUriToProxiedImageUrl(uri: string | null | undefined): string | null {
  const trimmed = uri?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `/api/attachment?src=${encodeURIComponent(trimmed)}`;
}

/**
 * Use as `unoptimized={isAttachmentProxyImageSrc(src)}` on `next/image` when `src` is from
 * {@link storageUriToProxiedImageUrl}. Skips `/_next/image` + sharp; otherwise Next may error
 * "The requested resource isn't a valid image" for dynamic API bytes or loose content-types.
 */
export function isAttachmentProxyImageSrc(src: string): boolean {
  return src.startsWith("/api/attachment");
}
