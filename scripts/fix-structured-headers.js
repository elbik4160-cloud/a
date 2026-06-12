const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const pkgDir = path.resolve('node_modules', '.pnpm', '@expo+cli@0.17.13_@react-na_e131a71599e24dd1262d58260510c063', 'node_modules', 'structured-headers');
const srcDir = path.join(pkgDir, 'src');
const distDir = path.join(pkgDir, 'dist');
if (!fs.existsSync(srcDir)) {
  throw new Error(`src directory not found: ${srcDir}`);
}
fs.mkdirSync(distDir, { recursive: true });
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
for (const file of files) {
  const source = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      strict: false,
      declaration: false,
    },
    fileName: file,
  });
  const outPath = path.join(distDir, file.replace(/\.ts$/, '.js'));
  fs.writeFileSync(outPath, output.outputText, 'utf8');
  console.log('wrote', outPath);
}
console.log('structured-headers transpile complete');
