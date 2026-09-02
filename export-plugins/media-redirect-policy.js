const COMMON_MEDIA_REDIRECT_HOSTS = [
  'media.gettyimages.com',
  'media.istockphoto.com',
  'blobby.wsimg.com',
  'blobby.test-wsimg.com',
  'blobby.dev-wsimg.com',
  'img1.wsimg.com',
  'isteam.wsimg.com',
  'isteam.test-wsimg.com',
  'isteam.dev-wsimg.com',
];

export const ALLOWED_IMAGE_REDIRECT_HOSTS = new Set([
  ...COMMON_MEDIA_REDIRECT_HOSTS,
  'oaidalleapiprodscus.blob.core.windows.net',
  'img.youtube.com',
  'i.ytimg.com',
]);

export const ALLOWED_VIDEO_REDIRECT_HOSTS = new Set([
  ...COMMON_MEDIA_REDIRECT_HOSTS,
  'cdn.videvo.net',
  'player.vimeo.com',
  'www.youtube.com',
  'storage.googleapis.com',
]);

/**
 * @param {string} value URL to validate.
 * @returns {boolean} Whether the image-slot redirect proxy can serve it.
 */
export function isAllowedImageRedirectUrl(value) {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.port.length === 0 &&
    ALLOWED_IMAGE_REDIRECT_HOSTS.has(url.hostname)
  );
}
