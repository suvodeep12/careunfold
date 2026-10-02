import { browser } from 'wxt/browser';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { collectMapsReviews } from '../lib/maps-loader';

// Packaged isolated-world script: injected only into the extension's owned review tab.
export default defineUnlistedScript(() => {
  let pending = false;
  let controller: AbortController | null = null;
  browser.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== browser.runtime.id || sender.tab || !message) return false;
    if (message.kind === 'careunfold:stop') {
      controller?.abort(new Error('Review loading stopped.'));
      reply({ stopped: true });
      return false;
    }
    if (pending || message.kind !== 'careunfold:reviews'
      || typeof message.key !== 'string' || message.key.length > 500 || !Number.isSafeInteger(message.limit) || message.limit < 1) return false;
    pending = true;
    controller = new AbortController();
    collectMapsReviews(document, () => location.href, message.key, message.limit, controller.signal)
      .then(capture => reply({ capture }), () => reply({ error: 'The review page could not be read.' }))
      .finally(() => { pending = false; controller = null; });
    return true;
  });
});
