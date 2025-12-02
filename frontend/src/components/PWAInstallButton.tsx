"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Enhanced mobile detection
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check for mobile devices
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Check for tablet devices
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      
      // Use window size as additional check
      const hasSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
      
      // Consider both user agent and screen size
      const isMobile = isMobileDevice || (hasSmallScreen && !isTablet);
      
      setDeviceType(isMobile ? 'mobile' : 'desktop');
      
      console.log('PWA: Device detection', {
        userAgent,
        isMobileDevice,
        isTablet,
        hasSmallScreen,
        finalDeviceType: isMobile ? 'mobile' : 'desktop',
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      });
      
      return isMobile;
    };

    const isMobile = detectMobile();

    // Enhanced PWA support check
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
      const isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost';
      
      // Check if we're in a PWA context already
      const isPWAContext = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      // Additional mobile-specific checks
      const hasManifestSupport = 'onbeforeinstallprompt' in window || 
                                  isMobile; // Mobile browsers generally support PWA even without beforeinstallprompt
      
      const supported = hasServiceWorker && hasManifest && isSecureContext && !isPWAContext;
      setIsSupported(supported);
      
      console.log('PWA Support Check:', {
        serviceWorker: hasServiceWorker,
        manifest: hasManifest,
        secureContext: isSecureContext,
        manifestElement: document.querySelector('link[rel="manifest"]'),
        isPWAContext,
        hasManifestSupport,
        supported,
        userAgent: navigator.userAgent,
        standalone: (navigator as any).standalone,
        displayMode: window.matchMedia('(display-mode: standalone)').matches
      });
      
      return supported;
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Enhanced standalone detection
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone === true ||
                          document.referrer.includes('android-app://') ||
                          window.location.search.includes('utm_source=pwa');
      
      setIsInstalled(isStandalone);
      console.log('PWA: Install check', {
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        navigatorStandalone: (navigator as any).standalone,
        androidApp: document.referrer.includes('android-app://'),
        pwaSource: window.location.search.includes('utm_source=pwa'),
        finalResult: isStandalone
      });
      
      return isStandalone;
    };

    const supported = checkPWASupport();
    const installed = checkIfInstalled();

    // Only add event listeners if not installed and PWA is supported
    if (!installed && supported) {
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        console.log('PWA: beforeinstallprompt event fired');
        
        // Validate the event has required methods
        if (typeof e.prompt !== 'function') {
          console.log('PWA: Invalid beforeinstallprompt event - missing prompt method');
          return;
        }

        // Prevent browser from showing default prompt
        e.preventDefault();
        
        // Save event for later use
        setDeferredPrompt(e);
        
        // Set timeout to clear the prompt if it becomes stale
        setTimeout(() => {
          setDeferredPrompt(prevPrompt => {
            if (prevPrompt === e) {
              console.log('PWA: Clearing stale deferred prompt');
              return null;
            }
            return prevPrompt;
          });
        }, 300000); // Clear after 5 minutes
      };

      const handleAppInstalled = () => {
        console.log('PWA: App was installed');
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      // Type assertion for event listeners
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Force service worker registration check for mobile
      if (isMobile && 'serviceWorker' in navigator) {
        const checkServiceWorkerAndPrompt = () => {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log('PWA: Service worker registrations:', registrations.length);
            
            if (registrations.length === 0) {
              console.log('PWA: No service worker found, may affect installability');
              
              // Try to manually register service worker
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('PWA: Service worker manually registered:', registration.scope);
                  
                  // Wait a bit then check for install prompt
                  setTimeout(() => {
                    if (!deferredPrompt) {
                      console.log('PWA: No install prompt available after SW registration');
                    }
                  }, 2000);
                })
                .catch(error => {
                  console.error('PWA: Manual SW registration failed:', error);
                });
            } else {
              console.log('PWA: Service worker already registered');
              
              // Force update check
              registrations[0].update().then(() => {
                console.log('PWA: Service worker update check completed');
              });
            }
          });
        };

        // Check service worker after a delay to allow page to fully load
        setTimeout(checkServiceWorkerAndPrompt, 1000);
      }

      // Additional mobile-specific initialization
      if (isMobile) {
        // Check if manifest is properly loaded
        setTimeout(() => {
          fetch('/manifest.json')
            .then(response => response.json())
            .then(manifest => {
              console.log('PWA: Manifest loaded successfully:', manifest);
            })
            .catch(error => {
              console.error('PWA: Error loading manifest:', error);
            });
        }, 500);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    console.log('PWA: Install button component mounted', {
      isInstalled: installed,
      isSupported: supported,
      deviceType: isMobile ? 'mobile' : 'desktop',
      userAgent: navigator.userAgent,
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
  }, []);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked', { hasDeferredPrompt: !!deferredPrompt });
    
    if (deferredPrompt) {
      try {
        // Validate prompt is still valid
        if (typeof deferredPrompt.prompt !== 'function') {
          console.log('PWA: Deferred prompt is invalid, clearing and showing manual instructions');
          setDeferredPrompt(null);
          setShowManualDialog(true);
          return;
        }

        // Show install prompt immediately
        console.log('PWA: Showing native install prompt');
        await deferredPrompt.prompt();
        
        // Wait for user response
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt');
          setIsInstalled(true);
        } else {
          console.log('PWA: User dismissed the install prompt');
        }
        
        // Prompt can only be used once
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error('PWA: Error during native installation:', error);
        // Clear invalid prompt and fall through to manual instructions
        setDeferredPrompt(null);
      }
    }

    // Check if we can trigger install through other means
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
    const isEdge = /Edge|Edg/i.test(navigator.userAgent);
    
    if ((isChrome || isEdge) && !deferredPrompt) {
      // Try to trigger the browser's install mechanism
      try {
        // Force check for install criteria
        setTimeout(() => {
          console.log('PWA: Attempting to trigger browser install detection');
          // This helps trigger the beforeinstallprompt event in some cases
          window.dispatchEvent(new Event('beforeinstallprompt'));
        }, 100);
        
        // Show instructions after a brief delay
        setTimeout(() => {
          setShowManualDialog(true);
        }, 200);
      } catch (error) {
        console.error('PWA: Error triggering install detection:', error);
        setShowManualDialog(true);
      }
    } else {
      // For other browsers or as fallback, show manual instructions
      console.log('PWA: No native prompt available, showing manual instructions');
      setShowManualDialog(true);
    }
  };

  const getManualInstructions = () => {
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    const isEdge = /Edge|Edg/i.test(navigator.userAgent);
    const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (deviceType === 'mobile') {
      if (isAndroid) {
        if (isChrome || isEdge) {
          return {
            title: "Install Platform Cemoca",
            steps: [
              "📱 Di Chrome Android:",
              "1. Ketuk menu tiga titik (⋮) di pojok kanan atas",
              "2. Pilih 'Install app' atau 'Add to Home screen'",
              "3. Ketuk 'Install' untuk menambahkan ke layar utama",
              "4. Aplikasi akan muncul sebagai aplikasi native di drawer"
            ]
          };
        } else if (isFirefox) {
          return {
            title: "Install Platform Cemoca",
            steps: [
              "🦊 Di Firefox Android:",
              "1. Ketuk menu tiga titik (⋮) di pojok kanan atas",
              "2. Pilih 'Install' (jika tersedia) atau 'Add to Home Screen'",
              "3. Ketuk 'Add' untuk install aplikasi",
              "4. Buka dari layar utama untuk pengalaman terbaik"
            ]
          };
        } else if (isSamsung) {
          return {
            title: "Install Platform Cemoca",
            steps: [
              "📱 Di Samsung Internet:",
              "1. Ketuk menu (≡) di pojok kanan bawah",
              "2. Pilih 'Add page to' → 'Home screen'",
              "3. Ketuk 'Add' untuk install aplikasi",
              "4. Aplikasi akan tersedia di layar utama"
            ]
          };
        } else {
          return {
            title: "Install Platform Cemoca",
            steps: [
              "📱 Di Browser Android:",
              "1. Cari menu 'Add to Home Screen' di pengaturan browser",
              "2. Atau bookmark halaman ini untuk akses cepat",
              "3. Beberapa browser akan menampilkan popup install otomatis",
              "4. Gunakan Chrome atau Edge untuk pengalaman terbaik"
            ]
          };
        }
      } else if (isIOS) {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "🍎 Di Safari iOS:",
            "1. Ketuk tombol 'Share' (ikon persegi dengan panah ke atas)",
            "2. Scroll ke bawah dan pilih 'Add to Home Screen'",
            "3. Edit nama aplikasi jika diperlukan",
            "4. Ketuk 'Add' untuk install aplikasi",
            "5. Aplikasi akan muncul di layar utama iPhone/iPad"
          ]
        };
      } else {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "📱 Instruksi Umum Mobile:",
            "1. Cari opsi 'Add to Home Screen' di menu browser",
            "2. Atau simpan sebagai bookmark untuk akses cepat",
            "3. Aplikasi ini mendukung mode offline",
            "4. Gunakan Chrome atau Safari untuk hasil terbaik"
          ]
        };
      }
    } else {
      // Desktop instructions
      if (isChrome || isEdge) {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "💻 Di Chrome/Edge Desktop:",
            "1. Cari ikon install (+) di address bar sebelah kanan",
            "2. Atau klik menu tiga titik (⋮) → 'Install Platform Cemoca...'",
            "3. Klik 'Install' pada dialog yang muncul",
            "4. Aplikasi akan terbuka sebagai aplikasi desktop terpisah",
            "5. Pin ke taskbar untuk akses cepat"
          ]
        };
      } else if (isFirefox) {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "🦊 Di Firefox Desktop:",
            "1. Cari ikon '+' di address bar (jika tersedia)",
            "2. Atau bookmark halaman ini untuk akses cepat",
            "3. Firefox mendukung web app tanpa install formal",
            "4. Gunakan Chrome/Edge untuk install sebagai aplikasi desktop"
          ]
        };
      } else if (isSafari) {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "🍎 Di Safari Desktop:",
            "1. Bookmark halaman ini untuk akses cepat",
            "2. Atau drag URL ke Dock untuk shortcut",
            "3. Safari mendukung web app functionality",
            "4. Gunakan Chrome/Edge untuk install formal"
          ]
        };
      } else {
        return {
          title: "Install Platform Cemoca",
          steps: [
            "💻 Browser Desktop:",
            "1. Bookmark halaman ini untuk akses cepat",
            "2. Tambahkan shortcut ke desktop jika tersedia",
            "3. Aplikasi web ini berfungsi di semua browser modern",
            "4. Untuk pengalaman terbaik, gunakan Chrome atau Edge"
          ]
        };
      }
    }
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    console.log('PWA: Button hidden - app is installed');
    return null;
  }

  // Don't show button if PWA is not supported
  if (!isSupported) {
    console.log('PWA: Button hidden - PWA not supported');
    return null;
  }

  const instructions = getManualInstructions();

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleInstallClick}
        className="flex"
        title="Install Aplikasi"
      >
        <Download className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Install App</span>
      </Button>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deviceType === 'mobile' ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              {instructions.title}
            </DialogTitle>
            <DialogDescription>
              Ikuti langkah-langkah berikut untuk menginstall aplikasi:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowManualDialog(false)}>
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstallButton;
