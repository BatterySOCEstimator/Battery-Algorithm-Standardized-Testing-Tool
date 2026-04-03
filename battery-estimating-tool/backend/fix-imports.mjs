import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { dirname, resolve } from 'path';

const files = await glob('dist/**/*.js');
for (const file of files) {
  let content = readFileSync(file, 'utf8');
  content = content.replace(
    /from\s+["'](\..*?)["']/g,
    (match, importPath) => {
      if (importPath.endsWith('.js')) return match;

      const dir = dirname(file);
      // Check if it's a directory with an index.js
      const asDir = resolve(dir, importPath, 'index.js');
      if (existsSync(asDir)) {
        return match.replace(importPath, importPath + '/index.js');
      }
      // Otherwise just add .js
      return match.replace(importPath, importPath + '.js');
    }
  );
  writeFileSync(file, content);
}
console.log(`Fixed imports in ${files.length} files`);