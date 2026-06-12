const fs = require('fs');
const path = require('path');
const envs = new Set();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(js|ts|tsx|mjs|cjs)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const re = /process\.env\.([A-Z0-9_]+)/g;
      let m;
      while ((m = re.exec(text))) {
        envs.add(m[1]);
      }
    }
  }
}
walk(process.cwd());
console.log([...envs].sort().join('\n'));
