const { execSync } = require('child_process');
const path = require('path');

const projectPath = process.cwd();

console.log('Project path:', projectPath);
console.log('Starting PNPM install in CI mode...');

try {
  execSync('npx pnpm install --no-frozen-lockfile --ignore-scripts --network-concurrency=1 --fetch-retries=5', {
    cwd: projectPath,
    env: {
      ...process.env,
      CI: 'true',
      npm_config_strict_ssl: 'false'
    },
    stdio: 'inherit'
  });

  console.log('PNPM_INSTALL_OK - تم بناء الـ node_modules وربط المونوربو بنجاح.');
} catch (error) {
  console.error('PNPM_INSTALL_FAIL:', error.message);
  if (error.stdout) console.error('STDOUT:\n' + error.stdout.toString());
  if (error.stderr) console.error('STDERR:\n' + error.stderr.toString());
  process.exit(1);
}
