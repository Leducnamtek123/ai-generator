#!/usr/bin/env node
import fs from 'fs';

const content = fs.readFileSync('src/components/admin/AdminNotificationsPanel.tsx', 'utf-8');
const lines = content.split('\n');

console.log('=== Lines with w- h- patterns ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('w-') && lines[i].includes('h-')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

console.log('\n=== Testing regex ===');
const testStr = '<Icon className="h-4 w-4" />';
const regex = /className="([^"]*)\bw-(\d+(?:\.\d+)?)\s+h-(\d+(?:\.\d+)?)\b([^"]*)"/g;
const matches = [...testStr.matchAll(regex)];
console.log('Test matches:', matches.length);
for (const m of matches) {
  console.log('  Groups:', m[0], '| before:', m[1], '| w:', m[2], '| h:', m[3], '| after:', m[4]);
}

// Test actual file content  
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = [...line.matchAll(regex)];
  if (m.length > 0) {
    console.log('Line ' + (i+1) + ' matched:', m[0][0]);
  }
}