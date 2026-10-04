import { afterEach, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MapsComparison from '../entrypoints/sidepanel/MapsComparison';
import setupBackground from '../entrypoints/background';

const mock = vi.hoisted(() => {
  const event = () => {
    const listeners = new Set<(...args: any[]) => void>();
    return { addListener: (fn: (...args: any[]) => void) => listeners.add(fn), clear: () => listeners.clear(), fire: (...args: any[]) => { for (const fn of [...listeners]) fn(...args); } };
  };
  const ports: any[] = [];
  const servers: any[] = [];
  const runtime: any = {
    id: 'test',
    onConnect: event(),
    getURL: (path: string) => `chrome-extension://test${path}`,
    connect: vi.fn(({ name }: { name: string }) => {
      const toClient = event();
      const toServer = event();
      const client: any = { name, onMessage: toClient, onDisconnect: event(), postMessage: vi.fn((message: any) => toServer.fire(message)), disconnect: vi.fn() };
      const sender = name === 'careunfold:results'
        ? { id: 'test', frameId: 0, tab: { id: 3 }, url: 'https://www.google.co.in/maps/search/doctor' }
        : { id: 'test', url: 'chrome-extension://test/sidepanel.html' };
      const server: any = { name, sender, onMessage: toServer, onDisconnect: event(), postMessage: vi.fn((message: any) => toClient.fire(message)), disconnect: vi.fn() };
      client.disconnect.mockImplementation(() => { client.onDisconnect.fire(); server.onDisconnect.fire(); });
      server.disconnect.mockImplementation(() => { client.onDisconnect.fire(); server.onDisconnect.fire(); });
      ports.push(client);
      servers.push(server);
      runtime.onConnect.fire(server);
      return client;
    }),
  };
  return {
    ports,
    servers,
    runtime,
    permissions: { request: vi.fn(async () => true), contains: vi.fn(async () => true), onRemoved: event() },
    tabs: { query: vi.fn(async () => [{ id: 3, url: 'https://www.google.co.in/maps/search/doctor' }]), get: vi.fn(async () => ({ url: 'https://www.google.co.in/maps/search/doctor' })), onRemoved: event() },
    sidePanel: { setPanelBehavior: vi.fn(async () => {}) },
    scripting: { executeScript: vi.fn(async () => []) },
  };
});
vi.mock('wxt/browser', () => ({ browser: mock }));
vi.mock('wxt/utils/define-background', () => ({ defineBackground: (fn: unknown) => fn }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); mock.ports.length = 0; mock.servers.length = 0; mock.runtime.onConnect.clear(); mock.permissions.onRemoved.clear(); mock.tabs.onRemoved.clear(); });

it('reconnects an idle disconnected panel when the user enables Maps', async () => {
  const { window, document } = parseHTML('<html><body><div id="root"></div></body></html>');
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', { protocol: 'chrome-extension:' });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<MapsComparison />));
    expect(document.querySelector('.maps-comparison')?.textContent).toContain('Test all loaded listings in a visible window once per session');
    expect(document.getElementById('visible-window-help')?.textContent).toContain('closes it when finished');
    expect(document.getElementById('visible-window-help')?.textContent).toContain('may cover other work');
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

it('keeps the native panel busy through reset until startup is acknowledged or rejected', async () => {
  (setupBackground as unknown as () => void)();
  const { window, document } = parseHTML('<html><body><div id="root"></div></body></html>');
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', { protocol: 'chrome-extension:' });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<MapsComparison />));
    const select = document.querySelector('select')!;
    Object.defineProperty(select, 'value', { configurable: true, writable: true, value: '100' });
    await act(async () => select.dispatchEvent(new window.Event('change', { bubbles: true })));
    const enable = document.querySelector<HTMLButtonElement>('.maps-actions .primary')!;
    const stop = document.querySelectorAll<HTMLButtonElement>('.maps-actions button')[1]!;

    await act(async () => { enable.click(); for (let i = 0; i < 8; i++) await Promise.resolve(); });
    expect(mock.ports[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'start' }));
    expect(enable.textContent).toBe('Connecting…');
    expect(enable.getAttribute('aria-busy')).toBe('true');
    expect(enable.disabled).toBe(true);
    expect(stop.disabled).toBe(false);

    await act(async () => { mock.runtime.connect({ name: 'careunfold:results' }); });
    expect(enable.getAttribute('aria-busy')).toBe('false');
    expect(enable.disabled).toBe(true);
    expect(stop.disabled).toBe(false);
    expect(document.querySelector('.maps-status')?.textContent).toContain('Watching already-loaded results');

    await act(async () => stop.click());
    let rejectInjection!: (error: Error) => void;
    mock.scripting.executeScript.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectInjection = reject; }));
    await act(async () => { enable.click(); for (let i = 0; i < 8; i++) await Promise.resolve(); });
    expect(enable.getAttribute('aria-busy')).toBe('true');
    expect(stop.disabled).toBe(false);
    await act(async () => { rejectInjection(new Error('Synthetic injection failure.')); for (let i = 0; i < 8; i++) await Promise.resolve(); });
    expect(enable.getAttribute('aria-busy')).toBe('false');
    expect(stop.disabled).toBe(true);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Synthetic injection failure.');
  } finally { await act(async () => root.unmount()); }
});
