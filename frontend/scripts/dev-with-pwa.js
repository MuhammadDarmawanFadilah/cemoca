#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Alumni System in PWA Development Mode...');
console.log('===============================================');

// Generate service worker first
console.log('📝 Generating service worker...');
const generateSw = spawn('node', ['scripts/generate-sw.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

generateSw.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Service worker generated successfully');
    
    // Start Next.js development server
    console.log('🎯 Starting Next.js development server...');
    const nextDev = spawn('pnpm', ['dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: true
    });
    
    nextDev.on('close', (nextCode) => {
      console.log(`Next.js development server exited with code ${nextCode}`);
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      nextDev.kill('SIGINT');
      process.exit(0);
    });
    
  } else {
    console.error('❌ Failed to generate service worker');
    process.exit(code);
  }
});
