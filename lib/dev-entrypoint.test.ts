import { expect, it, vi } from 'vitest';
import { MatchPattern } from 'wxt/utils/match-patterns';
import consoleEntry from '../entrypoints/dev-console.content';

vi.mock('wxt/utils/define-content-script', () => ({ defineContentScript: (entry: unknown) => entry }));
vi.mock('wxt/browser', () => ({ browser: { runtime: {} } }));
vi.mock('./dev-console', () => ({ mountDevConsole: vi.fn() }));

it('uses a valid WXT reload match and refuses other loopback ports at runtime', async () => {
  const entry = consoleEntry as unknown as { matches: string[]; main: (context: unknown) => void };
  for (const match of entry.matches) expect(new MatchPattern(match).includes('http://127.0.0.1:3000/careunfold-test')).toBe(true);
  const { mountDevConsole } = await import('./dev-console');
  vi.stubGlobal('location', { href: 'http://127.0.0.1:3001/careunfold-test' });
  entry.main({});
  expect(mountDevConsole).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
