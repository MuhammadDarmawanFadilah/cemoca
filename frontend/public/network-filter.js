/**
 * DevTools Network Filter Script
 * Script ini membantu menyembunyikan network noise di DevTools
 */

// Auto-apply network filter ketika DevTools dibuka
(function() {
  'use strict';
  
  console.clear();
  
  // Styled console messages
  const styles = {
    header: 'background: linear-gradient(90deg, #ff6b6b, #4ecdc4); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 18px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);',
    info: 'background: #667eea; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold;',
    filter: 'background: #f093fb; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;',
    success: 'background: #4ecdc4; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold;',
    warning: 'background: #ffeaa7; color: #2d3436; padding: 6px 12px; border-radius: 4px; font-weight: bold;'
  };

  // Get backend URL dynamically
  const getBackendUrl = () => {
    // Try to get from window.ENV if available
    if (typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_API_URL) {
      return window.ENV.NEXT_PUBLIC_API_URL;
    }
    
    // Try to get from process.env if available (might not work in browser but good fallback)
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Fallback to relative API path (will use Next.js rewrites)
    return '/api';
  };

  const backendUrl = getBackendUrl();
  const isAbsoluteUrl = backendUrl.startsWith('http');

  console.log('%c🎯 NETWORK FILTER - BACKEND ONLY MODE', styles.header);
  
  console.log('%c📋 INSTRUKSI MEMBERSIHKAN NETWORK TAB:', styles.info);
  
  console.log(
    '%c1. Buka DevTools (F12)\n' +
    '2. Klik tab "Network"\n' +
    '3. Copy-paste filter berikut ke kotak filter:'
  );
  
  // Show appropriate filter based on URL type
  if (isAbsoluteUrl) {
    try {
      const urlParts = new URL(backendUrl);
      console.log(`%c${urlParts.host}`, styles.filter);
    } catch (e) {
      console.log('%c/api', styles.filter);
    }
  } else {
    console.log('%c/api', styles.filter);
  }
  console.log('atau');
  console.log('%c-url:_next -url:webpack -url:hot-update -url:favicon -url:.js -url:.css', styles.filter);
  
  console.log('%c✅ HASIL: Hanya API calls ke backend yang akan tampil!', styles.success);

  // Test function
  window.testAPI = async function() {
    console.group('%c🧪 Testing Backend API', styles.info);
    try {
      const testUrl = `${backendUrl}/roles`;
      console.log(`Testing: GET ${testUrl} (ringan)`);
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('%c✅ Success!', styles.success);
      console.log('Roles found:', data?.length || 0);
      console.log('%c👆 Lihat di Network tab - hanya request ini yang penting!', styles.warning);
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('%c💡 Tip: Pastikan backend running dan konfigurasi API URL benar', 'color: orange; font-weight: bold;');
      console.log(`%cCurrent API URL: ${backendUrl}`, 'color: #666; font-family: monospace;');
    }
    console.groupEnd();
  };

  // Clear function
  window.clearLogs = function() {
    console.clear();
    console.log('%c🧹 Console cleared! Gunakan testAPI() untuk test backend.', styles.success);
  };

  // Auto test setelah 2 detik
  setTimeout(() => {
    console.log('%c🚀 Auto-testing backend connection...', styles.info);
    window.testAPI();
  }, 2000);

  console.log(
    '%c💡 Commands tersedia:\n' +
    '• testAPI() - Test koneksi backend\n' +
    '• clearLogs() - Clear console\n',
    'background: #2d3436; color: #00b894; padding: 8px 12px; border-radius: 4px; font-family: monospace;'
  );

  // Show current config for debugging
  console.log(`%cℹ️ Backend URL: ${backendUrl}`, 'color: #666; font-size: 12px;');

})();
