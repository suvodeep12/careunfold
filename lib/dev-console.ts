import type { browser } from 'wxt/browser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createMapsDiagnostics, type DiagnosticEvent } from './maps-diagnostics';

export function mountDevConsole(ctx: ContentScriptContext, runtime: typeof browser.runtime) {
    document.getElementById('setup')?.remove();
    const host = document.createElement('main');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host{display:block;max-width:880px;margin:40px auto;padding:0 20px;color:#172b45;font:16px/1.6 "Segoe UI",sans-serif}
      *{box-sizing:border-box}h1{line-height:1.2;margin:0}small{color:#43556d}label{display:block;margin:18px 0 6px}select,button{font:inherit;padding:10px 14px;border:1px solid #bdcadb;border-radius:6px;background:white;color:#172b45}select{width:100%}button{cursor:pointer}button:disabled{cursor:default;opacity:.55}button.primary{background:#154fba;color:white;border-color:#154fba}:focus-visible{outline:3px solid #154fba;outline-offset:3px}.actions{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}input{accent-color:#154fba}p{margin:12px 0}.status{background:#edf3ff;padding:14px;border-radius:6px}fieldset{border:0;padding:0;margin:0}fieldset label{margin:12px 0}
    </style>

    <h1>CareUnfold test console</h1><p><small>Development extension ${runtime.getManifest().version}</small></p>
    <p>Choose an open Maps search. This page controls the installed development extension and shows aggregate results only.</p>
    <label for="source">Maps source tab</label><select id="source"><option value="">Discovering open Maps tabs…</option></select>
    <label for="limit">Review limit per listing</label><select id="limit"><option value="100">Up to 100 newest reviews</option><option value="all">Attempt all available reviews (bounded collection)</option></select>
    <fieldset><label><input id="visible" type="checkbox"> Test first listing in a visible review window</label>
    <label><input id="resume" type="checkbox"> Rerun this test after development reloads</label></fieldset>
    <div class="actions"><button class="primary" id="run" disabled>Run test</button><button id="stop" disabled>Stop</button><button id="refresh">Refresh sources</button></div>
    <p class="status" role="status" id="status">Connecting to the development extension…</p>
    <p><small>Settings stay in this tab only. Reviews are never saved or uploaded. Close this tab or press Stop to end collection. It takes control from the side panel automatically.</small></p>`;
    document.body.append(host);
    const source = root.querySelector<HTMLSelectElement>('#source')!;
    const limit = root.querySelector<HTMLSelectElement>('#limit')!;
    const visible = root.querySelector<HTMLInputElement>('#visible')!;
    const resume = root.querySelector<HTMLInputElement>('#resume')!;
    const run = root.querySelector<HTMLButtonElement>('#run')!;
    const stop = root.querySelector<HTMLButtonElement>('#stop')!;
    const refresh = root.querySelector<HTMLButtonElement>('#refresh')!;
    const status = root.querySelector<HTMLElement>('#status')!;
    const key = `careunfold-dev-settings:${runtime.id}`;
    let remembered: { source?: string; limit?: string; visible?: boolean; resume?: boolean } = {};
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) remembered = parsed;
    } catch { /* Invalid settings reset safely. */ }
    limit.value = remembered.limit === 'all' ? 'all' : '100';
    visible.checked = remembered.visible === true;
    resume.checked = remembered.resume === true;
    const save = () => {
      try { sessionStorage.setItem(key, JSON.stringify({ source: source.value, limit: limit.value, visible: visible.checked, resume: resume.checked })); }
      catch { resume.checked = false; /* Testing still works when tab storage is blocked. */ }
    };
    const view = createMapsDiagnostics(document);
    const resultHost = document.getElementById('careunfold-diagnostics')!;
    resultHost.style.cssText = 'display:block;position:static;max-width:880px;margin:24px auto;padding:0 20px';
    resultHost.shadowRoot!.querySelector('details')!.open = true;
    const notify = (text: string) => { status.textContent = text; view.update({ kind: 'diagnostics', event: 'status', status: text }); };
    let port: ReturnType<typeof runtime.connect>;
    let active = false;
    let allowed = false;
    let connected = false;
    let rejected = false;
    const idle = () => { active = false; refresh.disabled = false; run.disabled = !allowed || !source.value; stop.disabled = true; source.disabled = limit.disabled = visible.disabled = false; };
    const start = () => {
      if (!allowed || !source.value) return;
      save(); active = true; refresh.disabled = true; run.disabled = true; stop.disabled = false;
      source.disabled = limit.disabled = visible.disabled = true;
      notify('Starting test…');
      port.postMessage({ kind: 'start', sourceTabId: Number(source.value), limit: limit.value === 'all' ? Number.MAX_SAFE_INTEGER : 100, visibleTest: visible.checked });
    };
    const connect = () => {
      if (ctx.isInvalid) return;
      port = runtime.connect({ name: 'careunfold:dev-panel' });
      connected = true; rejected = false;
      let initialSources = true;
      port.onMessage.addListener(message => {
        if (message.kind === 'sources') {
          allowed = message.allowed === true;
          const selected = source.value || remembered.source;
          source.replaceChildren(new Option('Choose an open Maps search', ''));
          for (const tab of message.tabs) source.append(new Option(`${tab.title} · tab ${tab.id}`, String(tab.id)));
          if ([...source.options].some(option => option.value === selected)) source.value = selected ?? '';
          idle();
          notify(allowed ? 'Ready. Select a Maps search and run the test.' : 'One-time setup: open the development extension side panel and enable Google Maps site access, then refresh sources.');
          if (initialSources && resume.checked && source.value) start();
          initialSources = false;
        } else if (message.kind === 'diagnostics') view.update(message as DiagnosticEvent);
        else if (message.kind === 'problem') { rejected = true; idle(); notify(message.message); }
        else if (message.kind === 'stopped' && message.message !== 'Starting a new Maps session.') { idle(); notify(message.message); }
        else if (message.kind === 'loading') { active = true; run.disabled = true; stop.disabled = false; notify(`Loading ${message.count} listings, one at a time…`); }
        else if (message.kind === 'watching') { active = true; run.disabled = true; stop.disabled = false; notify('Watching loaded search results.'); }
        else if (message.kind === 'idle') notify(message.count === 0 ? 'Waiting for loaded search results.' : 'Test batch finished. Results below; Stop ends the session.');
      });
      port.onDisconnect.addListener(() => {
        if (ctx.isInvalid) return;
        connected = false;
        idle(); allowed = false; run.disabled = true;
        if (rejected) return;
        notify('Extension disconnected. Reconnecting…');
        ctx.setTimeout(connect, 1000);
      });
      port.postMessage({ kind: 'sources' });
    };
    ctx.addEventListener(run, 'click', start);
    ctx.addEventListener(stop, 'click', () => { resume.checked = false; save(); port.postMessage({ kind: 'stop' }); });
    ctx.addEventListener(refresh, 'click', () => { if (!active) { if (connected) port.postMessage({ kind: 'sources' }); else connect(); } });
    ctx.addEventListener(source, 'change', () => { save(); idle(); });
    for (const control of [limit, visible, resume]) ctx.addEventListener(control, 'change', save);
    ctx.onInvalidated(() => {
      try { port?.disconnect(); } catch { /* Chrome can invalidate the port before cleanup runs. */ }
      host.remove(); view.dispose();
    });
    connect();
}
