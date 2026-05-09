#!/usr/bin/env node
const regex = /className="([^"]*?)\b((?:w-(\d+(?:\.\d+)?)\s+h-(\d+(?:\.\d+)?)|h-(\d+(?:\.\d+)?)\s+w-(\d+(?:\.\d+)?)))\b([^"]*)"/g;

const tests = [
  '<Icon className="h-4 w-4" />',
  '<Icon className="w-4 h-4" />',
  '<div className="h-10 w-10 flex items-center">',
  '<div className="mx-auto flex h-12 w-12 items-center">',
  'className="h-3.5 w-3.5"',
  '<div className={cn("mt-0.5 flex h-10 w-10 shrink-0")}>',
];

for (const t of tests) {
  const m = [...t.matchAll(regex)];
  console.log('Input:', t.substring(0, 60));
  if (m.length > 0) {
    console.log('  Match:', m[0][0]);
    console.log('  Groups:', { pre: m[0][1], mid: m[0][2], w1: m[0][3], h1: m[0][4], h2: m[0][5], w2: m[0][6], suf: m[0][7] });
    // Test replacement
    const w = m[0][3] || m[0][6];
    const h = m[0][4] || m[0][5];
    console.log('  Detected:', { w, h, same: w === h });
    const result = t.replace(regex, (match, prefix, _, w1, h1, h2, w2, suffix) => {
      const w = w1 || w2;
      const h = h1 || h2;
      if (w === h) return `className="${prefix.trim()} size-${w} ${suffix.trim()}"`;
      return match;
    });
    console.log('  Result:', result);
  } else {
    console.log('  NO MATCH');
  }
  console.log('');
}

// Also test cn() pattern
const cnRegex = /cn\(\s*['"]([^'"]*?)['"]/g;
const cnTests = [
  `cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', meta.className)`,
];
for (const t of cnTests) {
  console.log('cn test:', t.substring(0, 80));
  const m = [...t.matchAll(cnRegex)];
  if (m.length > 0) {
    console.log('  Inside cn:', m[0][1]);
    // Now check for w/h replacement inside that string
    const innerRegex = /(^|\s)(?:w-(\d+(?:\.\d+)?)\s+h-(\d+(?:\.\d+)?)|h-(\d+(?:\.\d+)?)\s+w-(\d+(?:\.\d+)?))(\s|$)/g;
    const im = [...m[0][1].matchAll(innerRegex)];
    console.log('  Inner matches:', im.length);
    for (const inn of im) {
      console.log('    Match:', inn[0], 'Groups:', inn.slice(1));
    }
  }
}