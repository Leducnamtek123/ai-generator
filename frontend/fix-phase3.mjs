#!/usr/bin/env node
// Fix remaining react-doctor issues: destructure methods, array keys, size-axes, etc.

import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('./src');
let totalFixes = 0;
let totalFiles = 0;

// Common destructuring patterns
const hookMethods = new Map([
  ['useRouter', ['push', 'replace', 'back', 'forward', 'refresh', 'prefetch']],
  ['useSearchParams', ['get', 'set', 'delete', 'entries', 'has', 'toString', 'forEach']],
  ['usePathname', []],
]);

function processFile(filePath) {
  if (!/\.(tsx?)$/.test(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fileFixes = 0;

  // 1. className fixes: w-[Nunit] h-[Nunit] -> size-[Nunit]
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    let updated = classes;
    // w-[Npx] h-[Npx] or w-[Nrem] h-[Nrem] -> size-[Npx/rem]
    updated = updated.replace(
      /\bw-\[(\d+(?:\.\d+)?)(px|rem|%)\]\s+h-\[(\d+(?:\.\d+)?)(px|rem|%)\]\b/g,
      (m, w, wu, h, hu) => w === h && wu === hu ? `size-[${w}${wu}]` : m
    );
    updated = updated.replace(
      /\bh-\[(\d+(?:\.\d+)?)(px|rem|%)\]\s+w-\[(\d+(?:\.\d+)?)(px|rem|%)\]\b/g,
      (m, h, hu, w, wu) => w === h && wu === hu ? `size-[${w}${wu}]` : m
    );
    // px-N py-N -> p-N
    updated = updated.replace(
      /\bpx-(\d+(?:\.\d+)?)\s+py-(\d+(?:\.\d+)?)\b/g,
      (m, x, y) => x === y ? `p-${x}` : m
    );
    if (updated !== classes) {
      fileFixes++;
      return `className="${updated}"`;
    }
    return match;
  });

  // 2. font-black/font-bold on headings -> font-semibold
  content = content.replace(
    /(<h[1-3][^>]*?className="[^"]*?)\bfont-(?:bold|black)\b([^"]*")/g,
    '$1font-semibold$2'
  );

  // 3. space-y-* on flex/grid -> gap-y-*
  content = content.replace(/\b(flex|grid)\b([^>]*?)\bspace-y-(\d+)\b/g, '$1$2 gap-y-$3');

  // 4. Three-period ellipsis -> actual ellipsis character in JSX text
  content = content.replace(
    /(>)([^<]{0,200}?)\.\.\.([^<]{0,200}?)(<\/)/g,
    (match, open, before, after, close) => {
      if (before.includes('"') || after.includes('"')) return match;
      fileFixes++;
      return open + before + '\u2026' + after + close;
    }
  );

  // 5. Em dash -> comma in JSX text
  content = content.replace(/(>)([^<]*?)—([^<]*?)(<)/g, (match, open, before, after, close) => {
    fileFixes++;
    return open + before + ',' + after + close;
  });

  // 6. gradient text patterns (bg-clip-text bg-gradient-to-*)
  // Replace gradient text with solid color
  content = content.replace(
    /className="([^"]*?)(bg-clip-text[^"]*?text-transparent[^"]*?bg-gradient-to-[^"]*?)([^"]*)"/g,
    (match, before, gradient, after) => {
      fileFixes++;
      return `className="${before}text-zinc-800 dark:text-zinc-200${after}"`;
    }
  );
  
  // Alternative: text-transparent bg-gradient-to-*
  content = content.replace(
    /className="([^"]*?)text-transparent[^"]*?bg-gradient-to-[^"]*?([^"]*)"/g,
    (match, before, after) => {
      fileFixes++;
      return `className="${before}text-zinc-800 dark:text-zinc-200${after}"`;
    }
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
      } else if (entry.isFile() && /\.(tsx?|\.[jt]sx?)$/.test(entry.name)) {
        processFile(fullPath);
      }
    }
  } catch (e) { /* skip */ }
}

console.log('Phase 3: Fixing remaining patterns...\n');
walkDir(srcDir);
console.log(`\nDone: ${totalFixes} fixes in ${totalFiles} files.`);