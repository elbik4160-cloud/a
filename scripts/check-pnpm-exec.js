const { execFileSync } = require('child_process');
const path = require('path');
const projectPath = path.resolve('c:/Users/n/Desktop/crm');
const pnpmPath = path.join(projectPath, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs');
console.log('pnpmPath:', pnpmPath);
console.log('exists:', require('fs').existsSync(pnpmPath));
try {
  const output = execFileSync('node', [pnpmPath, '--version'], {
    cwd: projectPath,
    env: { ...process.env, CI: 'true' },
    encoding: 'utf8'
  });
  console.log('OUTPUT:', output);
} catch (err) {
  console.error('ERROR_CODE:', err.status);
  console.error('ERROR_MESSAGE:', err.message);
  if (err.stdout) console.error('STDOUT:', err.stdout);
  if (err.stderr) console.error('STDERR:', err.stderr);
}
