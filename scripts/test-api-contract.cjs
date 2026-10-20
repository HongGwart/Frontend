// Bundle the actual TS adapters/client for Node, then test against a real disposable backend.
const { buildSync } = require('esbuild');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = mkdtempSync(join(tmpdir(), 'honggwart-api-contract-'));
try {
  const output = join(directory, 'test.cjs');
  buildSync({
    entryPoints: ['tests/api-contract.ts'],
    outfile: output,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    define: { __DEV__: 'false' },
    // Only icon imports are omitted in these adapter tests; native UI is tested with Maestro.
    loader: { '.svg': 'empty' },
    logLevel: 'warning',
  });
  const result = spawnSync(process.execPath, [output, ...process.argv.slice(2)], {
    stdio: 'inherit', env: process.env,
  });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
