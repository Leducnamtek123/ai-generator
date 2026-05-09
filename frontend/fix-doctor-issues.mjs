#!/usr/bin/env node
// Phase 2: Single-pass fix for remaining react-doctor issues

import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('./src');
let totalFixes = 0;
let totalFiles = 0;

function fixClassName(classStr) {
  let result = classStr;
  let changed = false;

  // 1. w-[Npx] h-[Npx] -> size-[Npx]
  result = result.replace(/\bw-\[(\d+)px\]\s+h-\[(\d+)px\]\b/g, (m, w, h) => {
    if (w === h) { changed = true; return `size-[${w}px]`; }
    return m;
  });
  result = result.replace(/\bh-\[(\d+)px\]\s+w-\[(\d+)px\]\b/g, (m, h, w) => {
    if (w === h) { changed = true; return `size-[${w}px]`; }
    return m;
  });

  // 2. h-N w-N or w-N h-N -> size-N
  result = result.replace(
    /\b(h-(\d+(?:\.\d+)?)\s+w-(\d+(?:\.\d+)?)|w-(\d+(?:\.\d+)?)\s+h-(\d+(?:\.\d+)?))\b/g,
    (m, _, h1, w1, w2, h2) => {
      const nums = m.match(/\d+(?:\.\d+)?/g);
      if (nums && nums.length === 2 && nums[0] === nums[1]) {
        changed = true;
        return 'size-' + nums[0];
      }
      return m;
    }
  );

  // 3. px-N py-N -> p-N
  result = result.replace(/\bpx-(\d+(?:\.\d+)?)\s+py-(\d+(?:\.\d+)?)\b/g, (m, x, y) => {
    if (x === y) { changed = true; return `p-${x}`; }
    return m;
  });

  // 4. gray-* -> zinc-*, slate-* -> zinc-*, indigo-* -> violet-*
  result = result
    .replace(/\bgray-(\d+)\b/g, (m, n) => { changed = true; return `zinc-${n}`; })
    .replace(/\bgray-(\w+)\b/g, (m, n) => { changed = true; return `zinc-${n}`; })
    .replace(/\bslate-(\d+)\b/g, (m, n) => { changed = true; return `zinc-${n}`; })
    .replace(/\bindigo-(\d+)\b/g, (m, n) => { changed = true; return `violet-${n}`; });

  return changed ? result : null;
}

function processFile(filePath) {
  if (!/\.(tsx?|jsx?)$/.test(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fileFixes = 0;

  // Single pass: transform className="..." strings  
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    const fixed = fixClassName(classes);
    if (fixed !== null) {
      fileFixes++;
      return `className="${fixed}"`;
    }
    return match;
  });

  // font-black/font-bold on h1-h3 -> font-semibold
  content = content.replace(
    /(<h[1-3][^>]*?className="[^"]*?)\bfont-(?:bold|black)\b([^"]*")/g,
    (match, before, after) => {
      fileFixes++;
      return before + 'font-semibold' + after;
    }
  );

  // Three dots in JSX text -> ellipsis
  content = content.replace(
    /(>)([^<]{0,200}?)\.\.\.([^<]{0,200}?)(<\/)/g,
    (match, open, before, after, close) => {
      if (before.includes('"') || after.includes('"')) return match;
      fileFixes++;
      return open + before + '\u2026' + after + close;
    }
  );

  // Em dash in JSX text -> comma
  content = content.replace(/(>)([^<]*?)—([^<]*?)(<)/g, (match, open, before, after, close) => {
    fileFixes++;
    return open + before + ',' + after + close;
  });

  // space-y-0 on flex/grid -> gap-y-0
  content = content.replace(/(flex|grid)([^>]*?)\bspace-y-(\d+)\b/g, '$1$2 gap-y-$3');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    totalFixes += fileFixes;
    totalFiles++;
    console.log(`[${fileFixes}] ${path.relative(srcDir, filePath)}`);
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

console.log('Phase 2 fixes...\n');
walkDir(srcDir);
console.log(`\nDone: ${totalFixes} fixes in ${totalFiles} files.`);