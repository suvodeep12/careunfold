import { browser } from 'wxt/browser';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { isMapsPage, readLoadedMapsPlaces } from '../lib/maps-dom';

export default defineUnlistedScript(() => {
  if (!isMapsPage(location.href)) return;
  const port = browser.runtime.connect({ name: 'careunfold:results' });
  let fingerprint = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const report = () => {
    timer = undefined;
    const places = isMapsPage(location.href) ? readLoadedMapsPlaces(document) : [];
    const current = JSON.stringify(places);
    if (current !== fingerprint) {
      fingerprint = current;
      port.postMessage({ kind: 'listings', places });
    }
  };
  const observer = new MutationObserver(() => {
    if (timer === undefined) timer = setTimeout(report, 300);
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  // Messages keep this explicitly opened session alive; no background polling after disconnect.
  const heartbeat = setInterval(() => port.postMessage({ kind: 'heartbeat' }), 20_000);
  port.onDisconnect.addListener(() => { observer.disconnect(); clearTimeout(timer); clearInterval(heartbeat); });
  report();
});
