import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('.output/chrome-mv3/manifest.json', 'utf8'));
assert.equal(manifest.version, pkg.version, 'Built manifest version must match package version');
console.log(`Verified extension manifest version ${manifest.version}`);
