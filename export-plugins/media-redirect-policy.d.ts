export const ALLOWED_IMAGE_REDIRECT_HOSTS: ReadonlySet<string>;
export const ALLOWED_VIDEO_REDIRECT_HOSTS: ReadonlySet<string>;

/** Returns whether a URL can be served by the image-slot redirect proxy. */
export function isAllowedImageRedirectUrl(value: string): boolean;
