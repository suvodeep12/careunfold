import { defineConfig } from 'wxt';
import { MAPS_SITES } from './lib/maps-dom';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: { disabled: true },
  dev: { server: { host: '127.0.0.1', origin: 'http://127.0.0.1:3000', port: 3000, strictPort: true } },
  hooks: {
    'entrypoints:found'(wxt, entries) {
      if (wxt.config.command !== 'serve') {
        const index = entries.findIndex(entry => entry.name === 'dev-console');
        if (index >= 0) entries.splice(index, 1);
      }
    },
  },
  vite: () => ({ plugins: [{
    name: 'careunfold-local-test-page',
    configureServer(server) {
      server.middlewares.use('/careunfold-preview', (_request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CareUnfold synthetic development preview</title><body><p>SYNTHETIC PREVIEW — no extension or real listing is assessed.</p><script type="module">
          import { mountDevConsole } from '/lib/dev-console.ts';
          const listeners = [];
          const emit = message => queueMicrotask(() => listeners.forEach(fn => fn(message)));
          const port = { onMessage: { addListener: fn => listeners.push(fn) }, onDisconnect: { addListener() {} }, disconnect() {}, postMessage(message) {
            if (message.kind === 'sources') emit({kind:'sources',allowed:true,tabs:[{id:3,title:'Invented Maps search'}]});
            if (message.kind === 'stop') emit({kind:'stopped',message:'Stopped by you.'});
            if (message.kind === 'start') {
              emit({kind:'watching'}); emit({kind:'loading',count:1});
              emit({kind:'diagnostics',event:'listings',places:[{key:'invented',name:'Invented demonstration clinic',rating:4.8,totalReviews:125}],keepKeys:[]});
              emit({kind:'diagnostics',event:'review',row:{key:'invented',name:'Invented demonstration clinic',rating:4.8,totalReviews:125,captured:100,original:4.7,filtered:4.5,excluded:6,sort:'newest-confirmed',stopped:'limit'}}); emit({kind:'idle'});
            }
          }};
          mountDevConsole({isInvalid:false,addEventListener:(target,event,fn)=>target.addEventListener(event,fn),setTimeout,onInvalidated(){}}, {id:'preview',getManifest:()=>({version:'synthetic preview'}),connect:()=>port});
        </script></body></html>`);
      });
      server.middlewares.use('/careunfold-test', (_request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CareUnfold development</title><body><p id="setup">Load the development extension from .output/chrome-mv3-dev, then refresh this page.</p></body></html>');
      });
    },
  }] }),
  manifest: {
    name: 'CareUnfold — review evidence',
    description: 'Compare loaded Maps listings and imported review samples with transparent wording adjustments. Local processing only.',
    permissions: ['sidePanel', 'scripting'],
    optional_host_permissions: MAPS_SITES,
    action: { default_title: 'Open CareUnfold' },
    minimum_chrome_version: '116',
  },
});
