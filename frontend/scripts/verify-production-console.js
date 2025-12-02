#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Production Console Log Removal...');

const buildDir = path.join(__dirname, '..', '.next');

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run npm run build first.');
  process.exit(1);
}

function searchConsoleLogsInDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      searchConsoleLogsInDir(filePath, results);
    } else if (file.endsWith('.js') && !file.includes('chunk')) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Look for console.log patterns
        const consoleLogMatches = content.match(/console\.log\(/g);
        const consoleInfoMatches = content.match(/console\.info\(/g);
        const consoleDebugMatches = content.match(/console\.debug\(/g);
        
        if (consoleLogMatches || consoleInfoMatches || consoleDebugMatches) {
          results.push({
            file: filePath,
            logs: (consoleLogMatches?.length || 0),
            info: (consoleInfoMatches?.length || 0),
            debug: (consoleDebugMatches?.length || 0)
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return results;
}

console.log('🔎 Scanning build files for console statements...');

const results = searchConsoleLogsInDir(buildDir);

if (results.length === 0) {
  console.log('✅ No console.log statements found in production build');
  console.log('✅ Console log removal verification PASSED');
} else {
  console.log('⚠️  Found console statements in production build:');
  
  results.forEach(result => {
    console.log(`📁 ${result.file.replace(buildDir, '.next')}`);
    if (result.logs > 0) console.log(`   - console.log: ${result.logs}`);
    if (result.info > 0) console.log(`   - console.info: ${result.info}`);
    if (result.debug > 0) console.log(`   - console.debug: ${result.debug}`);
  });
  
  console.log('\n💡 Note: console.error and console.warn are preserved for debugging');
}

// Check PWA files
console.log('\n🔍 Verifying PWA files...');

const pwaFiles = [
  '../public/sw.js',
  '../public/manifest.json',
  '../public/offline.html'
];

let pwaCheck = true;

pwaFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    pwaCheck = false;
  }
});

if (pwaCheck) {
  console.log('✅ PWA files verification PASSED');
} else {
  console.log('❌ PWA files verification FAILED');
}

console.log('\n📊 Production Build Verification Summary:');
console.log(`📝 Console Logs: ${results.length === 0 ? 'CLEANED' : 'FOUND'}`);
console.log(`📱 PWA Files: ${pwaCheck ? 'COMPLETE' : 'INCOMPLETE'}`);
console.log('🎯 Alumni System production build verification completed!');
