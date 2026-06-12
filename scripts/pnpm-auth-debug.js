const { spawnSync } = require('child_process');
const path = require('path');
const projectPath = path.resolve('c:/Users/n/Desktop/crm');
const args = [
  'node_modules/pnpm/bin/pnpm.mjs',
  'install',
  '--filter=@crm/auth...',
  '--reporter=ndjson',
  '--loglevel=debug',
  '--no-frozen-lockfile',
  '--config.interactive=false',
  '--ignore-scripts',
  '--no-verify-store-integrity',
  '--fetch-timeout',
  '600000',
  '--fetch-retries',
  '10',
  '--network-concurrency',
  '1',
];
console.log('Running', process.execPath, args.join(' '));
const child = spawnSync(process.execPath, args, {
  cwd: projectPath,
  env: { ...process.env, CI: 'true' },
  stdio: ['pipe', 'pipe', 'pipe'],
  timeout: 100000,
  encoding: 'utf8',
});
console.log('STATUS', child.status, 'SIG', child.signal);
console.log('STDOUT:\n', child.stdout);
console.error('STDERR:\n', child.stderr);
if (child.error) {
  console.error('ERROR', child.error);
  process.exit(1);
}
if (child.status !== 0) {
  process.exit(child.status);
}
