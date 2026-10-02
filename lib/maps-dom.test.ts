import { expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import { isMapsPage, mapsPlaceIdentity, mapsRating, parseLoadedPlaces, readLoadedMapsPlaces, readLoadedMapsReviews } from './maps-dom';

it('accepts a supported place identity while rejecting unsafe and unrelated URLs', () => {
  const url = 'https://www.google.com/maps/place/Invented/data=!4m7!1s0x123:0x456!19sChIJexample?authuser=1&rclk=1#tracking';
  expect(mapsPlaceIdentity(url)).toEqual({ key: '0x123:0x456', url: 'https://www.google.com/maps/place/Invented/data=!4m7!1s0x123:0x456!19sChIJexample?authuser=1' });
  for (const bad of ['javascript:alert(1)', 'https://www.google.com.evil.test/maps/place/x/data=!1s0x1:0x2', 'https://user@www.google.com/maps/place/x/data=!1s0x1:0x2', 'https://www.google.com/maps/contrib/123', 'https://www.google.com/maps/place/x/data=%invalid']) expect(mapsPlaceIdentity(bad)).toBeNull();
});

it('accepts India Maps pages and identities without accepting lookalikes or other sites', () => {
  const url = 'https://www.google.co.in/maps/place/Invented/data=!1s0x123:0x456?authuser=1&rclk=1';
  expect(isMapsPage('https://www.google.co.in/maps/search/urologist')).toBe(true);
  expect(mapsPlaceIdentity(url)).toEqual({ key: '0x123:0x456', url: 'https://www.google.co.in/maps/place/Invented/data=!1s0x123:0x456?authuser=1' });
  for (const bad of ['https://www.google.co.in.evil.test/maps/place/x/data=!1s0x1:0x2', 'https://user@www.google.co.in/maps/place/x/data=!1s0x1:0x2', 'http://www.google.co.in/maps/place/x/data=!1s0x1:0x2', 'https://www.google.co.in:444/maps/place/x/data=!1s0x1:0x2', 'https://www.google.co.in/search?q=doctor', 'https://www.google.co.uk/maps/place/x/data=!1s0x1:0x2']) {
    expect(isMapsPage(bad)).toBe(false);
    expect(mapsPlaceIdentity(bad)).toBeNull();
  }
});

it('reads only loaded search cards and keeps distinct listing identities separate', () => {
  const article = (id: string, label = '') => `<div role="article"><a aria-label="Invented clinic" href="https://www.google.com/maps/place/Invented/data=!1s${id}"></a><span role="img" aria-label="${label}"></span></div>`;
  const { document } = parseHTML(`<html><body>${article('0x1:0x2', '5 stars 9 Reviews')}<div role="feed">${article('0x3:0x4', '4.8 stars 295 Reviews')}${article('0x3:0x4')}${article('0x5:0x6')}</div></body></html>`);
  expect(readLoadedMapsPlaces(document)).toEqual([
    { key: '0x3:0x4', name: 'Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x3:0x4', rating: 4.8, totalReviews: 295 },
    { key: '0x5:0x6', name: 'Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x5:0x6', rating: undefined, totalReviews: undefined },
  ]);
});

it('excludes owner replies, deduplicates nested ids and preserves unknown review metadata', () => {
  const { document } = parseHTML(`<html><body>
    <div class="jftiEf" data-review-id="synthetic-a"><div data-review-id="synthetic-a">
      <span class="kvMYJc" role="img" aria-label="5 stars"></span><span class="rsqaWe">6 months ago</span>
      <div class="RfnDt">Local Guide · 11 reviews · 10 photos</div>
      <div class="MyEned"><span class="wiI7pd">Invented patient text</span><button aria-expanded="false">More</button></div>
      <div class="CDe7pd"><span class="wiI7pd">Invented owner reply</span></div>
    </div></div>
    <div class="jftiEf" data-review-id="synthetic-b"><span class="kvMYJc" role="img" aria-label="1 star"></span></div>
    <div class="jftiEf" data-review-id="invalid"><span class="kvMYJc" role="img" aria-label="4.8 stars"></span></div>
    </body></html>`);
  expect(readLoadedMapsReviews(document)).toEqual([
    { id: 'synthetic-a', text: 'Invented patient text', rating: 5, reportedDate: '6 months ago', reviewerReviewCount: 11, translated: null, truncated: true, edited: null },
    { id: 'synthetic-b', text: '', rating: 1, reportedDate: undefined, reviewerReviewCount: undefined, translated: null, truncated: false, edited: null },
  ]);
});

it('keeps unknown ratings and totals unknown instead of extracting unrelated numbers', () => {
  expect(mapsRating('4.8 stars 1,295 Reviews')).toEqual({ rating: 4.8, totalReviews: 1295 });
  expect(mapsRating('1 star')).toEqual({ rating: 1, totalReviews: undefined });
  for (const label of ['No reviews', 'Doctor 5 stars away', '6 stars', '5.9 stars', '4,8 Sterne']) expect(mapsRating(label).rating).toBeUndefined();
});

it('validates loaded-result messages before any browser navigation', () => {
  const place = { key: '0x1:0x2', name: 'Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2' };
  expect(parseLoadedPlaces([place, place])).toHaveLength(1);
  expect(parseLoadedPlaces([place])[0]!.rating).toBeUndefined();
  for (const bad of [null, [null], [{ ...place, url: 'https://example.com/' }], [{ ...place, key: 'another' }], [{ ...place, rating: NaN }], [{ ...place, totalReviews: -1 }]]) expect(() => parseLoadedPlaces(bad)).toThrow();
  expect(isMapsPage('https://www.google.com/maps/search/doctors')).toBe(true);
  expect(isMapsPage('https://www.google.com/search?q=doctors')).toBe(false);
  expect(isMapsPage('https://www.google.com.evil.test/maps/')).toBe(false);
});
