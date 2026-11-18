import fs from 'fs';
import path from 'path';

function checkJsxFiles(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const f of files) {
    if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const fullPath = path.join(dir, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Match all <CapitalWord ... /> or <CapitalWord>
      const jsxTags = content.matchAll(/<([A-Z][a-zA-Z0-9]+)[\s\/>]/g);
      const usedTags = new Set([...jsxTags].map(m => m[1]));

      // Check which tags are defined in content
      for (const tag of usedTags) {
        // Exclude standard React or common knowns
        if (['React', 'Fragment'].includes(tag)) continue;
        
        // Check if tag is imported or defined
        const importRegex = new RegExp(`\\b${tag}\\b`);
        if (!importRegex.test(content)) {
          console.error(`ERROR: ${tag} used in ${f} but not found!`);
        }
      }
    }
  }
}

console.log('Validating all JSX/JS files in frontend/src...');
checkJsxFiles('frontend/src');
console.log('Validation complete.');
