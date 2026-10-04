import { beforeEach, expect, it, vi } from 'vitest';
import setupBackground from '../entrypoints/background';
import type { MapsPlace } from './maps-dom';
import type { MapsCapture } from './maps-loader';

const mock = vi.hoisted(() => {
  const event = () => {
    const listeners = new Set<(...args: any[]) => void>();
    return { clear: () => listeners.clear(), addListener: (fn: (...args: any[]) => void) => listeners.add(fn), fire: (...args: any[]) => { for (const fn of [...listeners]) fn(...args); } };
  };
  return {
    event,
    sidePanel: { setPanelBehavior: vi.fn(async () => {}) },
    runtime: { id: 'test', onConnect: event(), getURL: (path: string) => `chrome-extension://test${path}` },
    permissions: { contains: vi.fn(async () => true), onRemoved: event() },
    tabs: { get: vi.fn(async () => ({ url: 'https://www.google.com/maps/search/doctor' })), query: vi.fn(async () => [{ id: 3, title: 'Maps search', url: 'https://www.google.com/maps/search/doctor' }, { id: 4, title: 'Unrelated', url: 'https://example.com' }]), onRemoved: event() },
    scripting: { executeScript: vi.fn(async () => []) },
    batch: vi.fn(async (places: MapsPlace[], _limit: number, report: (place: MapsPlace, capture: MapsCapture | null) => void, _signal: AbortSignal, _visibleTest = false) => {
      for (const place of places) report(place, { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' });
    }),
  };
});

it('isolates the development console, preserves ownership and sends aggregates only', async () => {
  mock.runtime.onConnect.clear();
  (setupBackground as unknown as () => void)();
  for (const sender of [{ frameId: 1, tab: { id: 9 }, url: 'http://127.0.0.1:3000/careunfold-test' }, { frameId: 0, tab: { id: 9 }, url: 'http://127.0.0.1:3000/other' }]) {
    const rejected = port('careunfold:dev-panel', sender);
    mock.runtime.onConnect.fire(rejected);
    expect(rejected.disconnect).toHaveBeenCalledOnce();
  }
  const console = port('careunfold:dev-panel', { frameId: 0, tab: { id: 9 }, url: 'http://127.0.0.1:3000/careunfold-test' });
  mock.runtime.onConnect.fire(console);
  console.onMessage.fire({ kind: 'sources' });
  await flush();
  expect(console.postMessage).toHaveBeenCalledWith({ kind: 'sources', allowed: true, tabs: [{ id: 3, title: 'Maps search' }] });
  const competing = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(competing);
  expect(competing.disconnect).toHaveBeenCalledOnce();
  console.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 100 });
  await flush();
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  source.onMessage.fire({ kind: 'listings', places: [{ key: '0x1:0x2', name: 'Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2' }] });
  await flush();
  expect(console.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'diagnostics', event: 'review' }));
  const messages = JSON.stringify(console.postMessage.mock.calls);
  expect(messages).not.toContain('"reviews":');
  expect(messages).not.toContain('https://');
  console.onMessage.fire({ kind: 'stop' });
  expect(source.disconnect).toHaveBeenCalledOnce();
  console.disconnect();
});
vi.mock('wxt/browser', () => ({ browser: mock }));
vi.mock('wxt/utils/define-background', () => ({ defineBackground: (fn: unknown) => fn }));
vi.mock('./maps-batch', () => ({ loadMapsBatch: mock.batch }));
beforeEach(() => {
  vi.clearAllMocks();
  mock.runtime.onConnect.clear();
  mock.tabs.onRemoved.clear();
  mock.permissions.onRemoved.clear();
});
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function port(name: string, sender: object) {
  const p = { name, sender: { id: 'test', ...sender }, onMessage: mock.event(), onDisconnect: mock.event(), postMessage: vi.fn(), disconnect: vi.fn(() => p.onDisconnect.fire()) };
  return p;
}

it('requires site access and explicit limits, watches changes and clears the session on disconnect', async () => {
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3 });
  await flush();
  expect(mock.scripting.executeScript).not.toHaveBeenCalled();
  mock.permissions.contains.mockResolvedValueOnce(false);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 2 });
  await flush();
  expect(mock.scripting.executeScript).not.toHaveBeenCalled();
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 2 });
  await flush();
  expect(mock.scripting.executeScript).toHaveBeenCalledExactlyOnceWith({ target: { tabId: 3 }, files: ['/maps-results.js'], world: 'ISOLATED' });
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  const place = { key: '0x1:0x2', name: 'Invented', url: 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2' };
  source.onMessage.fire({ kind: 'listings', places: [place] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(1);
  expect(mock.batch.mock.calls[0]![0]).toEqual([{ ...place, rating: undefined, totalReviews: undefined }]);
  expect(mock.batch.mock.calls[0]![1]).toBe(2);
  expect(source.postMessage).not.toHaveBeenCalled();
  source.onMessage.fire({ kind: 'listings', places: [place] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(1);
  const second = { ...place, key: '0x3:0x4', url: 'https://www.google.com/maps/place/Second/data=!1s0x3:0x4' };
  source.onMessage.fire({ kind: 'listings', places: [place, second] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(2);
  expect(mock.batch.mock.calls[1]![0]).toEqual([{ ...second, rating: undefined, totalReviews: undefined }]);
  expect(panel.postMessage).toHaveBeenCalledWith({ kind: 'listings', places: [{ ...place, rating: undefined, totalReviews: undefined }, { ...second, rating: undefined, totalReviews: undefined }], keepKeys: [place.key] });
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 2, diagnostics: true });
  await flush();
  const diagnosticSource = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(diagnosticSource);
  diagnosticSource.onMessage.fire({ kind: 'listings', places: [place] });
  await flush();
  expect(diagnosticSource.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'diagnostics', event: 'review', row: expect.objectContaining({ captured: 0, stopped: 'unavailable' }) }));
  expect(JSON.stringify(diagnosticSource.postMessage.mock.calls)).not.toContain('"reviews":');
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 100, diagnostics: true, visibleTest: true });
  await flush();
  const visibleSource = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(visibleSource);
  const beforeTest = mock.batch.mock.calls.length;
  visibleSource.onMessage.fire({ kind: 'listings', places: [] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(beforeTest);
  visibleSource.onMessage.fire({ kind: 'listings', places: [place, second] });
  await flush();
  expect(mock.batch.mock.calls[beforeTest]![0]).toEqual([{ ...place, rating: undefined, totalReviews: undefined }]);
  expect(mock.batch.mock.calls[beforeTest]![4]).toBe(true);
  expect(panel.postMessage).toHaveBeenCalledWith({ kind: 'idle', count: 1, visibleTest: true });
  visibleSource.onMessage.fire({ kind: 'listings', places: [second] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(beforeTest + 1);
  const afterTestMessages = visibleSource.postMessage.mock.calls.length;
  visibleSource.onMessage.fire({ kind: 'listings', places: [] });
  await flush();
  expect(mock.batch).toHaveBeenCalledTimes(beforeTest + 1);
  expect(visibleSource.postMessage).toHaveBeenCalledTimes(afterTestMessages);
  panel.onDisconnect.fire();
  expect(visibleSource.disconnect).toHaveBeenCalledTimes(1);
  expect(diagnosticSource.disconnect).toHaveBeenCalledTimes(1);
  expect(source.disconnect).toHaveBeenCalledTimes(1);
  expect(mock.batch.mock.calls[1]![3].aborted).toBe(true);
  const stranger = port('careunfold:results', { frameId: 0, tab: { id: 44 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(stranger);
  expect(stranger.disconnect).toHaveBeenCalledTimes(1);
});
