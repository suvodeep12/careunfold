// Only rendered page markup is read. No private endpoints, page runtime state or network calls.
export type MapsPlace = { key: string; name: string; url: string; rating?: number; totalReviews?: number };
export type MapsReview = {
  id: string; text: string; rating: number; reportedDate?: string; reviewerReviewCount?: number;
  translated: boolean | null; truncated: boolean | null; edited: boolean | null;
};
export const MAPS_SITE = 'https://www.google.com/maps/*';
export function isMapsPage(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && url.hostname === 'www.google.com' && !url.port && !url.username && !url.password
      && (url.pathname === '/maps' || url.pathname.startsWith('/maps/'));
  } catch { return false; }
}

// Extension messages are a trust boundary, even when the reader is packaged locally.
export function parseLoadedPlaces(raw: unknown): MapsPlace[] {
  if (!Array.isArray(raw) || raw.length > 1000) throw new Error('Unsupported loaded-result message.');
  const places = new Map<string, MapsPlace>();
  for (const value of raw) {
    if (!value || typeof value !== 'object' || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 500
      || typeof value.url !== 'string' || value.url.length > 8000) throw new Error('Invalid loaded listing.');
    const identity = mapsPlaceIdentity(value.url);
    if (!identity || identity.key !== value.key) throw new Error('The loaded listing identity could not be verified.');
    if (value.rating !== undefined && (typeof value.rating !== 'number' || !Number.isFinite(value.rating) || value.rating < 1 || value.rating > 5)) throw new Error('Invalid listing rating.');
    if (value.totalReviews !== undefined && (!Number.isSafeInteger(value.totalReviews) || value.totalReviews < 0)) throw new Error('Invalid listing review count.');
    places.set(identity.key, { ...identity, name: value.name.trim(), rating: value.rating, totalReviews: value.totalReviews });
  }
  return [...places.values()];
}

export function mapsPlaceIdentity(href: string): { key: string; url: string } | null {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || url.port || url.username || url.password || !url.pathname.startsWith('/maps/place/')) return null;
    const path = decodeURIComponent(url.pathname);
    const key = path.match(/!1s(0x[\da-f]+:0x[\da-f]+)/i)?.[1]
      ?? path.match(/!(?:1|19)s(ChIJ[\w-]+)/)?.[1];
    if (!key) return null;
    // Keep the account selection but discard unrelated tracking parameters.
    const account = url.searchParams.get('authuser');
    url.search = '';
    if (account && /^\d+$/.test(account)) url.searchParams.set('authuser', account);
    url.hash = '';
    return { key, url: url.href };
  } catch { return null; }
}

export function mapsRating(label: string): { rating?: number; totalReviews?: number } {
  const match = label.trim().match(/^([1-5](?:\.\d+)?)\s+stars?(?:\s+([\d,]+)\s+reviews?)?$/i);
  if (!match) return {};
  const rating = Number(match[1]);
  const total = match[2] === undefined ? undefined : Number(match[2].replaceAll(',', ''));
  return { rating: rating <= 5 ? rating : undefined,
    totalReviews: total !== undefined && Number.isSafeInteger(total) && total >= 0 ? total : undefined };
}

export function readLoadedMapsPlaces(root: ParentNode): MapsPlace[] {
  const places = new Map<string, MapsPlace>();
  // Restrict reading to the actual search feed, excluding recommendations and map controls.
  for (const article of root.querySelectorAll('[role="feed"] [role="article"]')) {
    const link = article.querySelector<HTMLAnchorElement>('a[href*="/maps/place/"][aria-label]');
    const identity = link ? mapsPlaceIdentity(link.href) : null;
    const name = link?.getAttribute('aria-label')?.trim();
    if (!identity || !name || places.has(identity.key)) continue;
    const label = [...article.querySelectorAll('[role="img"][aria-label]')]
      .map(e => e.getAttribute('aria-label') ?? '').find(text => /^\d(?:\.\d+)?\s+stars?/i.test(text));
    places.set(identity.key, { ...identity, name, ...mapsRating(label ?? '') });
  }
  return [...places.values()];
}

export function readLoadedMapsReviews(root: ParentNode): MapsReview[] {
  const reviews = new Map<string, MapsReview>();
  for (const node of root.querySelectorAll('.jftiEf[data-review-id]')) {
    const id = node.getAttribute('data-review-id');
    const rating = mapsRating(node.querySelector('.kvMYJc[role="img"]')?.getAttribute('aria-label') ?? '').rating;
    if (!id || id.length > 500 || !rating || !Number.isInteger(rating) || reviews.has(id)) continue;
    const body = node.querySelector('.MyEned');
    const text = body?.querySelector('.wiI7pd')?.textContent?.trim() ?? '';
    if (text.length > 8000) continue;
    const reportedDate = node.querySelector('.rsqaWe')?.textContent?.trim() || undefined;
    const countMatch = node.querySelector('.RfnDt')?.textContent?.match(/(?:^|·)\s*([\d,]+)\s+reviews?\b/i);
    const count = countMatch ? Number(countMatch[1]!.replaceAll(',', '')) : undefined;
    reviews.set(id, { id, text, rating, reportedDate,
      reviewerReviewCount: count !== undefined && Number.isSafeInteger(count) && count > 0 ? count : undefined,
      truncated: body ? !!body.querySelector('button[aria-expanded="false"]') : text ? null : false,
      // Absence of a translation/edit marker does not prove either flag is false.
      translated: /translated by google/i.test(body?.textContent ?? '') ? true : null,
      edited: /^edited\b/i.test(reportedDate ?? '') ? true : null });
  }
  return [...reviews.values()];
}
