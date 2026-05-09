#!/usr/bin/env node
// Fix remaining react-doctor issues after bulk phase

import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('./src');
let totalFixes = 0;
let totalFiles = 0;

function processFile(filePath) {
  if (!/\.(tsx?|jsx?)$/.test(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fileFixes = 0;

  // 1. Fix design-no-redundant-size-axes for arbitrary values w-[X] h-[X]
  // Also handle w-[Xpx] h-[Xpx] patterns 
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    let updated = classes;
    // w-[Nrem/px] h-[Nrem/px] -> size-[Nrem/px]
    updated = updated.replace(/\bw-\[(\d+)(px|rem)\]\s+h-\[(\d+)(px|rem)\]\b/g, 
      (m, w, wu, h, hu) => w === h && wu === hu ? `size-[${w}${wu}]` : m);
    updated = updated.replace(/\bh-\[(\d+)(px|rem)\]\s+w-\[(\d+)(px|rem)\]\b/g, 
      (m, h, hu, w, wu) => w === h && wu === hu ? `size-[${w}${wu}]` : m);
    
    // px-N py-N -> p-N
    updated = updated.replace(/\bpx-(\d+(?:\.\d+)?)\s+py-(\d+(?:\.\d+)?)\b/g, 
      (m, x, y) => x === y ? `p-${x}` : m);

    if (updated !== classes) {
      fileFixes++;
      return `className="${updated}"`;
    }
    return match;
  });

  // 2. Fix design-no-redundant-size-axes in cn() calls
  content = content.replace(/cn\(([^)]+)\)/g, (match, args) => {
    let changed = false;
    const newArgs = args.split(',').map(arg => {
      const m = arg.match(/^\s*['"]([^'"]*)['"]\s*$/);
      if (m) {
        let s = m[1];
        let u = s;
        u = u.replace(/\bw-\[(\d+)(px|rem)\]\s+h-\[(\d+)(px|rem)\]\b/g, 
          (m, w, wu, h, hu) => w === h && wu === hu ? (changed=true, `size-[${w}${wu}]`) : m);
        u = u.replace(/\bh-\[(\d+)(px|rem)\]\s+w-\[(\d+)(px|rem)\]\b/g, 
          (m, h, hu, w, wu) => w === h && wu === hu ? (changed=true, `size-[${w}${wu}]`) : m);
        u = u.replace(/\bpx-(\d+(?:\.\d+)?)\s+py-(\d+(?:\.\d+)?)\b/g, 
          (m, x, y) => x === y ? (changed=true, `p-${x}`) : m);
        if (u !== s) return `'${u}'`;
      }
      return arg;
    });
    if (changed) return `cn(${newArgs.join(',')})`;
    return match;
  });

  // 3. space-y-* on flex/grid -> gap-y-*
  content = content.replace(/\b(flex|grid)\b([^>]*?)\bspace-y-(\d+)\b/g, '$1$2 gap-y-$3');

  // 4. font-bold/font-black on headings -> font-semibold
  content = content.replace(
    /(<h[1-3][^>]*?className="[^"]*?)\bfont-(?:bold|black)\b([^"]*")/g,
    (m, b, a) => { fileFixes++; return b + 'font-semibold' + a; }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    totalFixes += fileFixes;
    totalFiles++;
    if (fileFixes > 0) console.log(`[${fileFixes}] ${path.relative(srcDir, filePath)}`);
  }
}

function walkDir(dir) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        processFile(fullPath);
      }
    }
  } catch (e) { /* skip */ }
}

console.log('Fixing remaining patterns...\n');
walkDir(srcDir);
console.log(`\nDone: ${totalFixes} fixes in ${totalFiles} files.`);