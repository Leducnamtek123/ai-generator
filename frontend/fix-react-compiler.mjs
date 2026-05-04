import fs from 'fs';
import path from 'path';

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
};

const files = getAllFiles('./src');
let fixedFinallyCount = 0;
let fixedAutoFocusCount = 0;
let fixedBgBlackCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix 1: try/finally -> try/catch
  const finallyRegex = /try\s*{\s*([\s\S]*?)\s*}\s*finally\s*{\s*([\s\S]*?)\s*}/g;
  content = content.replace(finallyRegex, (match, tryBlock, finallyBlock) => {
    if (tryBlock.includes('return ')) return match;
    fixedFinallyCount++;
    return `try {\n${tryBlock}\n${finallyBlock}\n} catch (error) {\n${finallyBlock}\nthrow error;\n}`;
  });

  // Fix 2: Remove autoFocus
  const autoFocusRegex = /\sautoFocus(?:={true}|={false})?\s*/g;
  if (autoFocusRegex.test(content)) {
    fixedAutoFocusCount++;
    content = content.replace(autoFocusRegex, ' ');
  }

  // Fix 3: bg-black -> bg-[#0a0a0f]
  const bgBlackRegex = /\bbg-black\b/g;
  if (bgBlackRegex.test(content)) {
    fixedBgBlackCount++;
    content = content.replace(bgBlackRegex, 'bg-[#0a0a0f]');
  }

  // Fix 4: animate-bounce
  const bounceRegex = /\banimate-bounce\b/g;
  if (bounceRegex.test(content)) {
    content = content.replace(bounceRegex, 'transition-transform hover:-translate-y-1 duration-300 ease-out');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(`Fixed try/finally in ${fixedFinallyCount} places.`);
console.log(`Removed autoFocus in ${fixedAutoFocusCount} places.`);
console.log(`Replaced bg-black in ${fixedBgBlackCount} places.`);
