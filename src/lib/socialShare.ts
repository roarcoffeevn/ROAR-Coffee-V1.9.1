export interface SharePayload {
  url: string;
  title: string;
  text: string;
  hashtags?: string[];
}

export function buildCanonicalShareUrl(pathname: string): string {
  if (typeof window === 'undefined') {
    return `https://roarcoffee.vn${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  }
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${window.location.origin}${cleanPath}`;
}

export function buildFacebookShareHref(payload: SharePayload): string {
  const quote = payload.hashtags?.length
    ? `${payload.text} ${payload.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
    : payload.text;
  const params = new URLSearchParams({
    u: payload.url,
    quote,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildInstagramCaption(payload: SharePayload): string {
  const tags = payload.hashtags?.length
    ? payload.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
    : '#ROARCOFFEE #SpecialtyCoffeeVietnam';
  return `${payload.text}\n\n${payload.url}\n${tags}`;
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  } catch {
    return false;
  }
  return false;
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
