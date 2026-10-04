import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { isMapsPage, MAPS_SITES, parseLoadedPlaces, type MapsPlace } from '../lib/maps-dom';
import { loadMapsBatch } from '../lib/maps-batch';
import { diagnosticPlace, diagnosticReview, type DiagnosticEvent } from '../lib/maps-diagnostics';

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
    console.error('CareUnfold could not enable action-click side panel opening:', error);
  });
  type Port = ReturnType<typeof browser.runtime.connect>;
  let panel: Port | null = null;
  let source: Port | null = null;
  let sourceId: number | undefined;
  let limit: number | undefined;
  let diagnostics = false;
  let visibleTest = false;
  let signature = '';
  let generation = 0;
  let controller: AbortController | null = null;
  let running: Promise<void> = Promise.resolve();
  let completed = new Set<string>();
  const send = (message: any) => {
    if (import.meta.env.DEV && panel?.name === 'careunfold:dev-panel') {
      if (message.kind === 'review') message = { kind: 'diagnostics', event: 'review', row: diagnosticReview(message.place, message.capture, message.error, message.capturedAt) };
      else if (message.kind === 'listings') message = { kind: 'diagnostics', event: 'listings', places: message.places.map(diagnosticPlace), keepKeys: message.keepKeys };
    }
    try { panel?.postMessage(message); } catch { /* Disconnected panels receive nothing. */ }
  };
  const mirror = (message: DiagnosticEvent) => { if (diagnostics) { try { source?.postMessage(message); } catch { /* Disconnect clears the mirror. */ } } };
  const stop = (message: string) => {
    generation++;
    controller?.abort(new Error(message));
    controller = null;
    const old = source;
    source = null;
    old?.disconnect();
    sourceId = undefined;
    limit = undefined;
    diagnostics = false;
    visibleTest = false;
    signature = '';
    completed.clear();
    send({ kind: 'stopped', message });
  };
  const schedule = (places: MapsPlace[]) => {
    // A diagnostic session tests the first loaded listing once, without further automatic batches.
    if (visibleTest && signature) return;
    if (visibleTest && !places.length) {
      send({ kind: 'idle', count: 0 });
      mirror({ kind: 'diagnostics', event: 'status', status: 'Waiting for the first loaded listing to test.' });
      return;
    }
    if (visibleTest) places = places.slice(0, 1);
    const next = JSON.stringify(places);
    if (next === signature) return;
    signature = next;
    const version = ++generation;
    controller?.abort(new Error('Loaded results changed.'));
    const keepKeys = places.filter(p => completed.has(JSON.stringify(p))).map(p => p.key);
    completed = new Set(places.filter(p => keepKeys.includes(p.key)).map(p => JSON.stringify(p)));
    send({ kind: 'listings', places, keepKeys });
    mirror({ kind: 'diagnostics', event: 'listings', places: places.map(diagnosticPlace), keepKeys });
    // Await cleanup before starting another batch: never create two owned review tabs.
    running = running.catch(() => {}).then(async () => {
      if (version !== generation || limit === undefined) return;
      const pending = places.filter(p => !completed.has(JSON.stringify(p)));
      controller = new AbortController();
      send({ kind: 'loading', count: pending.length });
      mirror({ kind: 'diagnostics', event: 'status', status: `Loading ${pending.length} listings, one at a time.` });
      try {
        await loadMapsBatch(pending, limit, (place, capture, error) => {
          if (version !== generation) return;
          completed.add(JSON.stringify(place));
          const capturedAt = new Date().toISOString();
          send({ kind: 'review', place, capture, error, capturedAt });
          mirror({ kind: 'diagnostics', event: 'review', row: diagnosticReview(place, capture, error, capturedAt) });
        }, controller.signal, visibleTest);
        if (version === generation) {
          send({ kind: 'idle', count: places.length, visibleTest });
          mirror({ kind: 'diagnostics', event: 'status', status: visibleTest ? 'Visible-window test finished. Stop this session before starting another test.' : `Current batch finished: ${places.length} loaded listings. Watching for changes.` });
        }
      } catch (error) {
        if (version === generation) stop(error instanceof Error ? error.message : 'Review loading stopped.');
      }
    });
  };
  browser.runtime.onConnect.addListener(port => {
    if (port.sender?.id !== browser.runtime.id) { port.disconnect(); return; }
    const devPanel = import.meta.env.DEV && port.name === 'careunfold:dev-panel' && port.sender.frameId === 0 && port.sender.tab?.id !== undefined && port.sender.url === 'http://127.0.0.1:3000/careunfold-test';
    if (devPanel || (port.name === 'careunfold:panel' && !port.sender.tab && port.sender.url === browser.runtime.getURL('/sidepanel.html'))) {
      if (devPanel && panel?.name === 'careunfold:panel') {
        stop('The development console is taking over this test session.');
        const previous = panel;
        panel = null;
        previous.disconnect();
      }
      if (panel && panel !== port) { port.postMessage({ kind: 'problem', message: 'Another CareUnfold panel owns the current session.' }); port.disconnect(); return; }
      panel = port;
      port.onMessage.addListener(message => {
        if (devPanel && message?.kind === 'sources') {
          void (async () => {
            const allowed = await browser.permissions.contains({ origins: MAPS_SITES });
            const tabs = allowed ? await browser.tabs.query({}) : [];
            send({ kind: 'sources', allowed, tabs: tabs.filter(tab => isMapsPage(tab.url ?? '')).map(tab => ({ id: tab.id, title: tab.title ?? 'Google Maps' })) });
          })().catch(() => send({ kind: 'problem', message: 'Could not discover Maps tabs. Refresh sources to retry.' }));
          return;
        }
        if (message?.kind === 'stop') { stop('Stopped by you.'); return; }
        if (message?.kind !== 'start') return;
        if (!Number.isSafeInteger(message.sourceTabId) || message.sourceTabId < 0 || !Number.isSafeInteger(message.limit) || message.limit < 1) {
          send({ kind: 'problem', message: 'Choose a source tab and an explicit review limit.' }); return;
        }
        stop('Starting a new Maps session.');
        sourceId = message.sourceTabId;
        limit = message.limit;
        diagnostics = message.diagnostics === true;
        visibleTest = message.visibleTest === true;
        const version = generation;
        void (async () => {
          try {
            if (!await browser.permissions.contains({ origins: MAPS_SITES })) throw new Error('Google Maps site access is not enabled.');
            const tab = await browser.tabs.get(message.sourceTabId);
            if (!isMapsPage(tab.url ?? '')) throw new Error('Open a Google Maps search in the source tab.');
            if (version !== generation) return;
            await browser.scripting.executeScript({ target: { tabId: message.sourceTabId }, files: ['/maps-results.js'], world: 'ISOLATED' });
          } catch (error) {
            if (version === generation) { stop('Maps session could not start.'); send({ kind: 'problem', message: error instanceof Error ? error.message : 'Maps unavailable.' }); }
          }
        })();
      });
      port.onDisconnect.addListener(() => { if (panel === port) { panel = null; stop('The side panel was closed.'); } });
      return;
    }
    if (port.name === 'careunfold:results' && port.sender.frameId === 0 && port.sender.tab?.id === sourceId && isMapsPage(port.sender.url ?? '')) {
      const old = source;
      source = port;
      old?.disconnect();
      port.onMessage.addListener(message => {
        if (source !== port || message?.kind !== 'listings') return;
        try { schedule(parseLoadedPlaces(message.places)); }
        catch (error) { stop(error instanceof Error ? error.message : 'Unsupported Maps results.'); }
      });
      port.onDisconnect.addListener(() => { if (source === port) stop('The Maps page disconnected. Start a new session to reconnect.'); });
      send({ kind: 'watching', sourceTabId: sourceId });
      return;
    }
    port.disconnect();
  });
  browser.tabs.onRemoved.addListener(tabId => { if (tabId === sourceId) stop('The source Maps tab was closed.'); });
  browser.permissions.onRemoved.addListener(() => {
    void browser.permissions.contains({ origins: MAPS_SITES }).then(allowed => { if (!allowed) stop('Google Maps site access was removed.'); });
  });
});
