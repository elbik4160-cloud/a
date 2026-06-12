const fs = require('fs');
const path = require('path');
const root = path.resolve('apps/web');
const exts = ['.ts', '.tsx'];
const replacements = [
  [/from "@\/lib\/db\/schema"/g, 'from "@crm/db"'],
  [/from '@\/lib\/db\/schema'/g, 'from "@crm/db"'],
  [/from "@\/lib\/db"/g, 'from "@crm/db"'],
  [/from '@\/lib\/db'/g, 'from "@crm/db"'],
  [/from "@\/lib\/auth"/g, 'from "@crm/auth"'],
  [/from '@\/lib\/auth'/g, 'from "@crm/auth"'],
  [/from "@\/lib\/session"/g, 'from "@crm/auth/session"'],
  [/from '@\/lib\/session'/g, 'from "@crm/auth/session"'],
  [/from "@\/lib\/permission-constants"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/permission-constants'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/permissions"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/permissions'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/utils"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/utils'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/csv"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/csv'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/country-codes"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/country-codes'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/image"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/image'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/use-lang"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/use-lang'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/leads-constants"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/leads-constants'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/constants"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/constants'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/crypto"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/crypto'/g, 'from "@crm/shared-lib"'],
  [/from "@\/lib\/types"/g, 'from "@crm/shared-lib"'],
  [/from '@\/lib\/types'/g, 'from "@crm/shared-lib"'],
];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (exts.includes(path.extname(full))) {
      let text = fs.readFileSync(full, 'utf8');
      let replaced = text;
      for (const [pattern, repl] of replacements) {
        replaced = replaced.replace(pattern, repl);
      }
      if (replaced !== text) {
        fs.writeFileSync(full, replaced, 'utf8');
        console.log('Updated', full);
      }
    }
  }
}
walk(root);
