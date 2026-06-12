const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectPath = path.resolve('c:/Users/n/Desktop/crm');
console.log('Installing pnpm locally in:', projectPath);

try {
  execFileSync('npm', ['install', 'pnpm@11.5.3', '--save-dev'], {
    cwd: projectPath,
    env: { ...process.env, CI: 'true' },
    stdio: 'inherit'
  });
  const pnpmPath = path.join(projectPath, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs');
  console.log('pnpm installed path exists:', fs.existsSync(pnpmPath));
} catch (error) {
  console.error('PNPM_INSTALL_LOCAL_FAIL:', error.message);
  if (error.stdout) console.error('STDOUT:\n' + error.stdout.toString());
  if (error.stderr) console.error('STDERR:\n' + error.stderr.toString());
  process.exit(1);
}
