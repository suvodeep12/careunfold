import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: { disabled: true },
  manifest: {
    name: 'CareUnfold — review evidence',
    description: 'Explore how repeated wording affects an imported review sample. Local processing only.',
    version: '0.1.0',
    permissions: ['sidePanel'],
    action: { default_title: 'Open CareUnfold' },
    minimum_chrome_version: '116',
  },
});
