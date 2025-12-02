// PWA Utilities for Cemoca System
// This file provides helper functions for PWA installation and updates

(function() {
  'use strict';

  // Check if the app is running in standalone mode (installed as PWA)
  window.isPWAInstalled = function() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  };

  // Check if the device supports PWA installation
  window.canInstallPWA = function() {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  };

  // Get the current PWA display mode
  window.getPWADisplayMode = function() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (document.referrer.startsWith('android-app://')) {
      return 'twa';
    } else if (navigator.standalone || isStandalone) {
      return 'standalone';
    }
    return 'browser';
  };

  // Log PWA events for debugging (only in development)
  window.logPWAEvent = function(eventName, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PWA] ${eventName}:`, data);
    }
  };

  // Check for service worker updates
  window.checkForPWAUpdates = function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(function(registration) {
        if (registration) {
          registration.update();
        }
      });
    }
  };

  // Initialize PWA utilities
  window.initPWAUtils = function() {
    // Log initial state
    window.logPWAEvent('init', {
      installed: window.isPWAInstalled(),
      canInstall: window.canInstallPWA(),
      displayMode: window.getPWADisplayMode()
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', function(e) {
      window.logPWAEvent('displayModeChange', { standalone: e.matches });
    });
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initPWAUtils);
  } else {
    window.initPWAUtils();
  }
})();
