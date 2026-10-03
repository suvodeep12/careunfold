import { afterEach, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MapsComparison from '../entrypoints/sidepanel/MapsComparison';

const mock = vi.hoisted(() => {
  const event = () => {
    const listeners = new Set<(...args: any[]) => void>();
    return { addListener: (fn: (...args: any[]) => void) => listeners.add(fn), fire: (...args: any[]) => { for (const fn of [...listeners]) fn(...args); } };
  };
  const ports: any[] = [];
  return {
    ports,
    runtime: { connect: vi.fn(() => {
      const port = { onMessage: event(), onDisconnect: event(), postMessage: vi.fn(), disconnect: vi.fn() };
      ports.push(port);
      return port;
    }) },
    permissions: { request: vi.fn(async () => true) },
    tabs: { query: vi.fn(async () => [{ id: 3, url: 'https://www.google.co.in/maps/search/doctor' }]) },
  };
});
vi.mock('wxt/browser', () => ({ browser: mock }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); mock.ports.length = 0; });

it('reconnects an idle disconnected panel when the user enables Maps', async () => {
  const { window, document } = parseHTML('<html><body><div id="root"></div></body></html>');
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', { protocol: 'chrome-extension:' });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<MapsComparison />));
    expect(document.querySelector('button')!.disabled).toBe(true);
    expect(document.querySelector('button')!.getAttribute('aria-busy')).toBe('false');
    expect(document.getElementById('review-limit-help')?.textContent).toContain('Choose a review limit');
    const select = document.querySelector('select')!;
    Object.defineProperty(select, 'value', { configurable: true, writable: true, value: '100' });
    await act(async () => select.dispatchEvent(new window.Event('change', { bubbles: true })));
    expect(document.getElementById('review-limit-help')).toBeNull();
    const places = [1, 2].map(id => ({ key: `0x${id}:0x9`, name: `Invented ${id}`, url: `https://www.google.co.in/maps/place/Invented/data=!1s0x${id}:0x9` }));
    await act(async () => mock.ports[0].onMessage.fire({ kind: 'listings', places, keepKeys: [] }));
    await act(async () => mock.ports[0].onMessage.fire({ kind: 'review', place: places[0], capture: { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' } }));
    expect(document.querySelector('.maps-list')!.textContent).toContain('Waiting for reviews');
    await act(async () => mock.ports[0].onDisconnect.fire());
    expect(document.querySelector('.maps-list')!.textContent).not.toContain('Waiting for reviews');
    expect(document.querySelector('.maps-list')!.textContent).toContain('0 captured ratings');
    expect(document.querySelector('.maps-list')!.textContent).toContain('Collection stopped before reviews were captured');
    const enable = document.querySelector('button')!;
    expect(enable.disabled).toBe(false);
    await act(async () => enable.click());
    expect(mock.runtime.connect).toHaveBeenCalledTimes(2);
    expect(mock.permissions.request).toHaveBeenCalledWith({ origins: ['https://www.google.com/maps/*', 'https://www.google.co.in/maps/*'] });
    expect(mock.ports[1].postMessage).toHaveBeenCalledWith({ kind: 'start', sourceTabId: 3, limit: 100, diagnostics: false, visibleTest: false });
    await act(async () => mock.ports[1].onMessage.fire({ kind: 'stopped', message: 'Stopped.' }));
    for (const kind of ['stopped', 'problem']) {
      await act(async () => mock.ports[1].onMessage.fire({ kind: 'listings', places, keepKeys: [] }));
      await act(async () => mock.ports[1].onMessage.fire({ kind, message: 'Collection ended.' }));
      expect(document.querySelector('.maps-list')!.textContent).not.toContain('Waiting for reviews');
      expect(document.querySelector('.maps-list')!.textContent).toContain('Collection stopped before reviews were captured');
    }
    mock.ports[1].postMessage.mockClear();
    let grant!: (allowed: boolean) => void;
    mock.permissions.request.mockImplementationOnce(() => new Promise(resolve => { grant = resolve; }));
    await act(async () => enable.click());
    const stop = document.querySelectorAll('button')[1]!;
    expect(enable.getAttribute('aria-busy')).toBe('true');
    expect(stop.disabled).toBe(false);
    await act(async () => stop.click());
    expect(enable.getAttribute('aria-busy')).toBe('false');
    await act(async () => grant(true));
    expect(mock.ports[1].postMessage).toHaveBeenCalledExactlyOnceWith({ kind: 'stop' });
    expect(mock.tabs.query).toHaveBeenCalledTimes(1);

    let query!: (tabs: { id: number; url: string }[]) => void;
    mock.tabs.query.mockImplementationOnce(() => new Promise(resolve => { query = resolve; }));
    await act(async () => enable.click());
    await act(async () => root.unmount());
    await act(async () => query([{ id: 3, url: 'https://www.google.com/maps/search/doctor' }]));
    expect(mock.ports[1].postMessage).toHaveBeenCalledExactlyOnceWith({ kind: 'stop' });
    expect(mock.ports[1].disconnect).toHaveBeenCalledTimes(1);
  } finally { await act(async () => root.unmount()); }
});
