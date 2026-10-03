import { browser } from 'wxt/browser';
import { mapsPlaceIdentity, type MapsPlace } from './maps-dom';
import { parseMapsCapture, type MapsCapture } from './maps-loader';

function loaded(tabId: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: unknown) => {
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(updated);
      signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve();
    };
    const updated = (id: number, info: { status?: string }) => { if (id === tabId && info.status === 'complete') finish(); };
    const abort = () => finish(signal.reason);
    const timer = setTimeout(() => finish(new Error('The review page did not finish loading.')), 20_000);
    browser.tabs.onUpdated.addListener(updated);
    signal.addEventListener('abort', abort, { once: true });
    // Close the race where loading completed before the event listener was installed.
    browser.tabs.get(tabId).then(tab => { if (tab.status === 'complete') finish(); }, finish);
  });
}

// Call from the background only. One temporary tab per batch, sequential listing loads.
// No permanent state, extraction API, search navigation or additional-result scrolling.
export async function loadMapsBatch(
  places: MapsPlace[], limit: number, report: (place: MapsPlace, capture: MapsCapture | null, error?: string) => void,
  signal: AbortSignal, visibleTest = false,
) {
  if (visibleTest && places.length !== 1) throw new Error('The visible diagnostic requires exactly one listing.');
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Provide an explicit review limit.');
  const identities = places.map(place => mapsPlaceIdentity(place.url));
  if (identities.some((id, index) => !id || id.key !== places[index]!.key)) throw new Error('A listing has an unsupported identity.');
  if (!places.length) return;
  let ownedTab: number | undefined;
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason ?? new Error('Review loading stopped.'));
  const touched = ({ tabId }: { tabId: number }) => {
    if (visibleTest) return; // This explicitly enabled experiment intentionally activates its tab.
    if (tabId !== ownedTab) return;
    // Hand the activated tab to the user; stop its reader without navigating or closing it.
    ownedTab = undefined;
    void browser.tabs.sendMessage(tabId, { kind: 'careunfold:stop' }).catch(() => {});
    controller.abort(new Error('The review tab was activated. Review loading stopped.'));
  };
  const removed = (tabId: number) => { if (tabId === ownedTab) { ownedTab = undefined; controller.abort(new Error('The review tab was closed.')); } };
  let closing: Promise<void> = Promise.resolve();
  const close = async () => {
    const id = ownedTab;
    ownedTab = undefined;
    if (id !== undefined) closing = browser.tabs.remove(id).catch(() => {});
    await closing;
  };
  signal.throwIfAborted();
  signal.addEventListener('abort', cancel, { once: true });
  controller.signal.addEventListener('abort', () => { void close(); }, { once: true });
  browser.tabs.onActivated.addListener(touched);
  browser.tabs.onRemoved.addListener(removed);
  try {
    const tab = await browser.tabs.create({ url: 'about:blank', active: false });
    ownedTab = tab.id;
    if (ownedTab === undefined) throw new Error('The temporary review tab could not be created.');
    if (visibleTest) await browser.windows.create({ tabId: ownedTab, type: 'popup', focused: true, width: 720, height: 900 });
    for (const [index, place] of places.entries()) {
      controller.signal.throwIfAborted();
      try {
        await browser.tabs.update(ownedTab, { url: identities[index]!.url, active: visibleTest });
        await loaded(ownedTab, controller.signal);
        controller.signal.throwIfAborted();
        const current = await browser.tabs.get(ownedTab);
        if (mapsPlaceIdentity(current.url ?? '')?.key !== place.key) throw new Error('The page redirected or changed listing.');
        await browser.scripting.executeScript({ target: { tabId: ownedTab }, files: ['/maps-reader.js'], world: 'ISOLATED' });
        const response = await browser.tabs.sendMessage(ownedTab, { kind: 'careunfold:reviews', key: place.key, limit });
        controller.signal.throwIfAborted();
        if (!response?.capture) throw new Error(response?.error ?? 'The review reader did not return a sample.');
        report(place, parseMapsCapture(response.capture, limit));
      } catch (error) {
        controller.signal.throwIfAborted();
        report(place, null, error instanceof Error ? error.message : 'Reviews unavailable.');
      }
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    browser.tabs.onActivated.removeListener(touched);
    browser.tabs.onRemoved.removeListener(removed);
    await close();
  }
}
