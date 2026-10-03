import { afterEach, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import setupResults from '../entrypoints/maps-results';

const mock = vi.hoisted(() => {
  const event = () => {
    const listeners = new Set<(message?: unknown) => void>();
    return { addListener: (listener: (message?: unknown) => void) => listeners.add(listener), fire: (message?: unknown) => { for (const listener of listeners) listener(message); } };
  };
  const port = { onMessage: event(), onDisconnect: event(), postMessage: vi.fn() };
  return { port, runtime: { connect: vi.fn(() => port) } };
});
vi.mock('wxt/browser', () => ({ browser: mock }));
vi.mock('wxt/utils/define-unlisted-script', () => ({ defineUnlistedScript: (fn: unknown) => fn }));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('renders diagnostics through the actual source-port listener and clears the mirror and heartbeat on disconnect', () => {
  vi.useFakeTimers();
  const { document, window } = parseHTML('<html><body></body></html>');
  vi.stubGlobal('document', document);
  vi.stubGlobal('MutationObserver', window.MutationObserver);
  vi.stubGlobal('location', { href: 'https://example.com/maps/search/doctor' });
  const start = setupResults as unknown as () => void;
  start();
  expect(mock.runtime.connect).not.toHaveBeenCalled();
  vi.stubGlobal('location', { href: 'https://www.google.co.in/maps/search/doctor' });
  start();
  expect(mock.runtime.connect).toHaveBeenCalledWith({ name: 'careunfold:results' });
  expect(mock.port.postMessage).toHaveBeenCalledWith({ kind: 'listings', places: [] });
  mock.port.onMessage.fire({ kind: 'review', reviews: [] });
  expect(document.getElementById('careunfold-diagnostics')).toBeNull();
  const place = { key: '0x1:0x2', name: 'Invented clinic', totalReviews: 125, rating: 4.6 };
  mock.port.onMessage.fire({ kind: 'diagnostics', event: 'listings', places: [place], keepKeys: [] });
  mock.port.onMessage.fire({ kind: 'diagnostics', event: 'review', row: { ...place, captured: 10, original: 5, filtered: 5, excluded: 0, stopped: 'stalled' } });
  const root = document.getElementById('careunfold-diagnostics')!.shadowRoot!;
  expect(root.querySelector('tbody')!.textContent).toContain('10 captured / 125 listed');
  expect(root.querySelector('tbody')!.textContent).toContain('Stop stalled');
  vi.advanceTimersByTime(20_000);
  expect(mock.port.postMessage).toHaveBeenCalledWith({ kind: 'heartbeat' });
  mock.port.onDisconnect.fire();
  expect(document.getElementById('careunfold-diagnostics')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});
