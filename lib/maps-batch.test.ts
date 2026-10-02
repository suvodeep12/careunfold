import { expect, it, vi } from 'vitest';
import { loadMapsBatch } from './maps-batch';

const mock = vi.hoisted(() => {
  const event = () => {
    const listeners = new Set<(...args: any[]) => void>();
    return { addListener: (fn: (...args: any[]) => void) => listeners.add(fn), removeListener: (fn: (...args: any[]) => void) => listeners.delete(fn), fire: (...args: any[]) => { for (const fn of listeners) fn(...args); } };
  };
  let url = '';
  return { tabs: {
    onUpdated: event(), onActivated: event(), onRemoved: event(),
    create: vi.fn(async () => ({ id: 91 })),
    update: vi.fn(async (_id: number, change: { url: string }) => { url = change.url; }),
    get: vi.fn(async () => ({ status: 'complete', url })),
    remove: vi.fn(async () => {}),
    sendMessage: vi.fn(async () => ({ capture: { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' } })),
  }, scripting: { executeScript: vi.fn(async () => []) } };
});
vi.mock('wxt/browser', () => ({ browser: mock }));
const places = [1, 2].map(i => ({ key: `0x${i}:0x9`, name: `Invented ${i}`, url: `https://www.google.com/maps/place/Invented/data=!1s0x${i}:0x9` }));

it('reuses one inactive owned tab for a sequential batch and closes only that tab', async () => {
  vi.clearAllMocks();
  const report = vi.fn();
  await loadMapsBatch(places, 2, report, new AbortController().signal);
  expect(mock.tabs.create).toHaveBeenCalledExactlyOnceWith({ url: 'about:blank', active: false });
  expect(mock.tabs.update.mock.calls.map(([id, change]) => [id, change.url])).toEqual(places.map(p => [91, p.url]));
  expect(report.mock.calls.map(([p]) => p.key)).toEqual(places.map(p => p.key));
  expect(mock.tabs.remove).toHaveBeenCalledExactlyOnceWith(91);
});

it('hands an activated worker tab to the user and never navigates to the next listing', async () => {
  vi.clearAllMocks();
  mock.tabs.sendMessage.mockImplementationOnce(async () => {
    mock.tabs.onActivated.fire({ tabId: 91 });
    return { capture: { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' } };
  });
  await expect(loadMapsBatch(places, 2, vi.fn(), new AbortController().signal)).rejects.toThrow('activated');
  expect(mock.tabs.update).toHaveBeenCalledTimes(1);
  expect(mock.tabs.sendMessage).toHaveBeenCalledWith(91, { kind: 'careunfold:stop' });
  expect(mock.tabs.remove).not.toHaveBeenCalled();
});

it('waits for asynchronous tab removal before a cancelled batch finishes', async () => {
  vi.clearAllMocks();
  const controller = new AbortController();
  let release!: () => void;
  mock.tabs.remove.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  mock.tabs.sendMessage.mockImplementationOnce(async () => {
    controller.abort(new Error('Cancelled during review loading.'));
    return { capture: { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' } };
  });
  let finished = false;
  const batch = loadMapsBatch(places, 2, vi.fn(), controller.signal).catch(error => error).finally(() => { finished = true; });
  await vi.waitFor(() => expect(mock.tabs.remove).toHaveBeenCalledExactlyOnceWith(91));
  await new Promise(resolve => setTimeout(resolve, 0));
  try { expect(finished).toBe(false); }
  finally { release(); await batch; }
  expect(mock.tabs.update).toHaveBeenCalledTimes(1);
});
