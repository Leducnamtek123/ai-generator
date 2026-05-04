import fs from 'fs';

const report = fs.readFileSync('report-utf8.txt', 'utf8');
const lines = report.split('\n');

let capturing = false;
const filesToFix = new Set();

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Error: Calling setState synchronously within an effect')) {
    capturing = true;
    continue;
  }
  if (capturing) {
    if (lines[i].match(/^\s*src\/.*:\d+$/)) {
      filesToFix.add(lines[i].trim().split(':')[0]);
    } else if (lines[i].includes('React Compiler can\'t optimize this code') || lines[i].includes('Component "')) {
      capturing = false;
    }
  }
}

console.log(Array.from(filesToFix));

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to replace basic useEffects that watch a store and setState.
  // For example: useEffect(() => { if (...) setSomething(...) }, [deps])
  // We can just wrap the body of any useEffect that contains set[A-Z]...
  
  // A simple regex to find useEffects with a body:
  // useEffect(() => { ... body ... }, [deps])
  
  const useEffectRegex = /useEffect\(\s*\(\s*\)\s*=>\s*{([\s\S]*?)}\s*,\s*(\[[^\]]*\])?\s*\)/g;
  content = content.replace(useEffectRegex, (match, body, deps) => {
    // If the body contains a setState call
    if (body.match(/set[A-Z][a-zA-Z0-9]*\s*\(/)) {
       // if it already has queueMicrotask or setTimeout, ignore
       if (body.includes('queueMicrotask') || body.includes('setTimeout')) {
           return match;
       }
       
       // Wrap the body in queueMicrotask
       return `useEffect(() => { queueMicrotask(() => {${body}}); }, ${deps || '[]'})`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed useEffects in ${file}`);
  }
});
