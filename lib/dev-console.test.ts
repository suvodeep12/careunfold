import { afterEach, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { mountDevConsole } from './dev-console';

afterEach(() => vi.unstubAllGlobals());

it('resumes only opted-in settings, keeps startup busy and clears reruns on Stop', () => {
  const { document, window } = parseHTML('<html><body></body></html>');
  // Linkedom lacks the native select setter/options collection used by browsers.
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', { configurable: true, get() { return this.getAttribute('value') ?? ''; }, set(value) { this.setAttribute('value', value); } });
  Object.defineProperty(window.HTMLSelectElement.prototype, 'options', { configurable: true, get() { return this.querySelectorAll('option'); } });
  const values = new Map([['careunfold-dev-settings:test', JSON.stringify({ source: '3', limit: '100', resume: true })]]);
  vi.stubGlobal('document', document);
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) });
  vi.stubGlobal('Option', function(text: string, value: string) { const option = document.createElement('option'); option.textContent = text; option.value = value; return option; });
  let receive: (message: any) => void = () => {};
  let invalidate: () => void = () => {};
  const port = { onMessage: { addListener: (fn: typeof receive) => { receive = fn; } }, onDisconnect: { addListener() {} }, postMessage: vi.fn(), disconnect: vi.fn() };
  mountDevConsole({ isInvalid: false, addEventListener: (target: EventTarget, event: string, fn: EventListener) => target.addEventListener(event, fn), onInvalidated(fn: () => void) { invalidate = fn; } } as any,
    { id: 'test', getManifest: () => ({ version: 'synthetic' }), connect: () => port } as any);
  receive({ kind: 'sources', allowed: true, tabs: [{ id: 3, title: 'Invented search' }] });
  expect(port.postMessage).toHaveBeenCalledWith({ kind: 'start', sourceTabId: 3, limit: 100, visibleTest: false });
  const root = document.querySelector('main')!.shadowRoot!;
  expect(root.querySelector('#visible')?.parentElement?.textContent).toContain('all loaded listings');
  expect(root.querySelector('#visible')?.parentElement?.textContent).toContain('once per session');
  expect(root.querySelector('#visible-help')?.textContent).toContain('closes when finished');
  expect(root.querySelector('#visible-help')?.textContent).toContain('may cover other work');
  receive({ kind: 'stopped', message: 'Starting a new Maps session.' });
  expect(root.querySelector<HTMLButtonElement>('#run')!.disabled).toBe(true);
  expect(root.querySelector<HTMLButtonElement>('#refresh')!.disabled).toBe(true);
  receive({ kind: 'idle', count: 1 });
  expect(document.getElementById('careunfold-diagnostics')!.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain('Test batch finished.');
  root.querySelector<HTMLButtonElement>('#stop')!.click();
  expect(JSON.parse(values.get('careunfold-dev-settings:test')!).resume).toBe(false);
  expect(port.postMessage).toHaveBeenCalledWith({ kind: 'stop' });
  receive({ kind: 'stopped', message: 'Stopped by you.' });
  expect(root.querySelector<HTMLButtonElement>('#refresh')!.disabled).toBe(false);
  port.disconnect.mockImplementation(() => { throw new Error('Extension context invalidated.'); });
  expect(invalidate).not.toThrow();
  expect(document.querySelector('main')).toBeNull();
  expect(document.getElementById('careunfold-diagnostics')).toBeNull();
});
