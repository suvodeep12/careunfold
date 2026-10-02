import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: { disabled: true },
  manifest: {
    name: 'CareUnfold — review evidence',
    description: 'Compare loaded Maps listings and imported review samples with transparent wording adjustments. Local processing only.',
    version: '0.2.3',
    permissions: ['sidePanel', 'scripting'],
    optional_host_permissions: ['https://www.google.com/maps/*'],
    action: { default_title: 'Open CareUnfold' },
    minimum_chrome_version: '116',
  },
});
