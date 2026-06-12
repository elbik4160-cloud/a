const fs = require('fs');
const path = require('path');
const projectPath = path.resolve('c:/Users/n/Desktop/crm');
const pnpmFile = path.join(projectPath, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs');
console.log('cwd', process.cwd());
console.log('projectPath', projectPath);
console.log('exists', fs.existsSync(pnpmFile));
console.log('pnpmFile', pnpmFile);
try {
  const output = require('child_process').execFileSync(process.execPath, [pnpmFile, '--version'], { cwd: projectPath, env: { ...process.env, CI: 'true' }, encoding: 'utf8' });
  console.log('pnpm version output:', output.trim());
} catch (err) {
  console.error('pnpm exec error', err.message);
  if (err.stdout) console.error('stdout', err.stdout.toString());
  if (err.stderr) console.error('stderr', err.stderr.toString());
  process.exit(1);
}
