const { execFileSync } = require('child_process');
const path = require('path');

const projectPath = path.resolve('c:/Users/n/Desktop/crm');
const pnpmCommand = path.join(projectPath, 'node_modules', '.bin', 'pnpm.cmd');

console.log('pnpmCommand=', pnpmCommand);

try {
  execFileSync('cmd.exe', [
    '/c',
    pnpmCommand,
    'install',
    '--no-frozen-lockfile',
    '--config.interactive=false',
    '--ignore-scripts',
    '--no-verify-store-integrity',
  ], {
    cwd: projectPath,
    env: { ...process.env, CI: 'true' },
    stdio: 'inherit',
  });
  console.log('PNPM_INSTALL_OK');
} catch (error) {
  console.error('PNPM_INSTALL_FAIL', error.message);
  if (error.stdout) console.error('STDOUT:', error.stdout.toString());
  if (error.stderr) console.error('STDERR:', error.stderr.toString());
  process.exit(1);
}
