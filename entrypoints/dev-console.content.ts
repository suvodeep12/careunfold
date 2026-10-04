import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { mountDevConsole } from '../lib/dev-console';

// Omitted from every packaged build by wxt.config.ts.
export default defineContentScript({
  matches: ['http://127.0.0.1:3000/careunfold-test'],
  main(ctx) {
    if (import.meta.env.DEV && location.href === 'http://127.0.0.1:3000/careunfold-test') mountDevConsole(ctx, browser.runtime);
  },
});
