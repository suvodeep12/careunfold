import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('.output/chrome-mv3/manifest.json', 'utf8'));
assert.equal(manifest.version, pkg.version, 'Built manifest version must match package version');
assert.equal(existsSync('.output/chrome-mv3/content-scripts/dev-console.js'), false, 'Development console must never ship');
assert.doesNotMatch(JSON.stringify(manifest), /localhost|127\.0\.0\.1|dev-console/, 'Packaged manifest must not grant local development access');
assert.doesNotMatch(readFileSync('.output/chrome-mv3/background.js', 'utf8'), /careunfold:dev-panel|careunfold-dev-settings/, 'Packaged background must exclude development controls');
console.log(`Verified extension manifest version ${manifest.version}`);
