import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
afterEach(() => vi.useRealTimers());
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function port(name: string, sender: object) {
  const p = { name, sender: { id: 'test', ...sender }, onMessage: mock.event(), onDisconnect: mock.event(), postMessage: vi.fn(), disconnect: vi.fn(() => p.onDisconnect.fire()) };
  return p;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function messages(panel: ReturnType<typeof port>) {
  return panel.postMessage.mock.calls.map(([message]) => message);
}

function expectStartupTimeout(panel: ReturnType<typeof port>) {
  const sent = messages(panel);
  expect(sent).toContainEqual(expect.objectContaining({ kind: 'stopped', message: expect.stringContaining('20 seconds') }));
  const problem = sent.find(message => message.kind === 'problem');
  expect(problem?.message).toContain('20 seconds');
  expect(problem?.message).toContain('respond');
  expect(problem?.message.length).toBeLessThanOrEqual(180);
}

it.each([
  ['an injection that completes without a source connection', false],
  ['an injection that remains pending', true],
])('ends startup when %s', async (_description, hangs) => {
  vi.useFakeTimers();
  if (hangs) mock.scripting.executeScript.mockImplementationOnce(() => new Promise(() => {}));
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  expect(mock.scripting.executeScript).toHaveBeenCalledOnce();

  await vi.advanceTimersByTimeAsync(20_000);

  expectStartupTimeout(panel);
  const lateSource = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(lateSource);
  expect(lateSource.disconnect).toHaveBeenCalledOnce();
  expect(messages(panel).some(message => message.kind === 'watching')).toBe(false);
});

it('starts the deadline before permissions resolve and ignores their stale completion', async () => {
  vi.useFakeTimers();
  const permission = deferred<boolean>();
  mock.permissions.contains.mockImplementationOnce(() => permission.promise);
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  expect(mock.tabs.get).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(20_000);
  expectStartupTimeout(panel);
  permission.resolve(true);
  await flush();
  expect(mock.tabs.get).not.toHaveBeenCalled();
  expect(mock.scripting.executeScript).not.toHaveBeenCalled();
});

it('times out and disconnects a source port that never sends listings', async () => {
  vi.useFakeTimers();
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  expect(messages(panel)).toContainEqual({ kind: 'watching', sourceTabId: 3 });

  await vi.advanceTimersByTimeAsync(20_000);

  expectStartupTimeout(panel);
  expect(source.disconnect).toHaveBeenCalledOnce();
  const afterTimeout = messages(panel).length;
  source.onMessage.fire({ kind: 'listings', places: [] });
  await flush();
  expect(mock.batch).not.toHaveBeenCalled();
  expect(messages(panel)).toHaveLength(afterTimeout);
});

it('clears the deadline after the first valid listings message, including an empty list', async () => {
  vi.useFakeTimers();
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  expect(messages(panel)).toContainEqual({ kind: 'watching', sourceTabId: 3 });
  source.onMessage.fire({ kind: 'listings', places: [] });
  await flush();
  expect(vi.getTimerCount()).toBe(0);

  await vi.advanceTimersByTimeAsync(20_000);

  expect(messages(panel).some(message => message.kind === 'problem' || (message.kind === 'stopped' && message.message.includes('20 seconds')))).toBe(false);
  panel.onMessage.fire({ kind: 'stop' });
});

it.each(['Stop', 'panel disconnect'])('clears the startup deadline on %s', async action => {
  vi.useFakeTimers();
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  if (action === 'Stop') panel.onMessage.fire({ kind: 'stop' });
  else panel.onDisconnect.fire();
  const afterCancel = messages(panel).length;
  await vi.advanceTimersByTimeAsync(20_000);
  expect(messages(panel).slice(afterCancel).some(message => message.kind === 'problem')).toBe(false);
  const lateSource = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(lateSource);
  expect(lateSource.disconnect).toHaveBeenCalledOnce();
});

it('clears the old deadline on a new start and ignores stale injection failure', async () => {
  vi.useFakeTimers();
  const oldInjection = deferred<never[]>();
  mock.scripting.executeScript.mockImplementationOnce(() => oldInjection.promise);
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  await vi.advanceTimersByTimeAsync(10_000);

  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 20 });
  await flush();
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  source.onMessage.fire({ kind: 'listings', places: [] });
  await flush();
  oldInjection.reject(new Error('Old session injection failed.'));
  await flush();
  expect(messages(panel).some(message => message.kind === 'problem' && message.message === 'Old session injection failed.')).toBe(false);

  await vi.advanceTimersByTimeAsync(20_000);
  expect(messages(panel).some(message => message.kind === 'problem' || (message.kind === 'stopped' && message.message.includes('20 seconds')))).toBe(false);
  panel.onMessage.fire({ kind: 'stop' });
});

it('hands a native development panel session to the local console without native controls', async () => {
  (setupBackground as unknown as () => void)();
  const panel = port('careunfold:panel', { url: 'chrome-extension://test/sidepanel.html' });
  mock.runtime.onConnect.fire(panel);
  panel.onMessage.fire({ kind: 'start', sourceTabId: 3, limit: 100 });
  await flush();
  const source = port('careunfold:results', { frameId: 0, tab: { id: 3 }, url: 'https://www.google.com/maps/search/doctor' });
  mock.runtime.onConnect.fire(source);
  const console = port('careunfold:dev-panel', { frameId: 0, tab: { id: 9 }, url: 'http://127.0.0.1:3000/careunfold-test' });
  mock.runtime.onConnect.fire(console);
  expect(panel.disconnect).toHaveBeenCalledOnce();
  expect(source.disconnect).toHaveBeenCalledOnce();
  expect(console.disconnect).not.toHaveBeenCalled();
  console.onMessage.fire({ kind: 'sources' });
  await flush();
  expect(console.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'sources', allowed: true }));
  const competing = port('careunfold:dev-panel', { frameId: 0, tab: { id: 10 }, url: 'http://127.0.0.1:3000/careunfold-test' });
  mock.runtime.onConnect.fire(competing);
  expect(competing.disconnect).toHaveBeenCalledOnce();
  console.disconnect();
});

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
  expect(mock.batch.mock.calls[beforeTest]![0]).toEqual([{ ...place, rating: undefined, totalReviews: undefined }, { ...second, rating: undefined, totalReviews: undefined }]);
  expect(mock.batch.mock.calls[beforeTest]![4]).toBe(true);
  expect(panel.postMessage).toHaveBeenCalledWith({ kind: 'idle', count: 2, visibleTest: true });
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
