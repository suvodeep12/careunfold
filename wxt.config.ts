import { defineConfig } from 'wxt';
import { MAPS_SITES } from './lib/maps-dom';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: { disabled: true },
  manifest: {
    name: 'CareUnfold — review evidence',
    description: 'Compare loaded Maps listings and imported review samples with transparent wording adjustments. Local processing only.',
    version: '0.2.5',
    permissions: ['sidePanel', 'scripting'],
    optional_host_permissions: MAPS_SITES,
    action: { default_title: 'Open CareUnfold' },
    minimum_chrome_version: '116',
  },
});
