import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import ConditionalAppLayout from "@/components/ConditionalAppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAMOCA - Management System",
  description: "CAMOCA - Sistem Management dengan User dan Role Management",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.svg", sizes: "any", type: "image/svg+xml" }
    ],
    shortcut: "/icons/favicon-32x32.png",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAMOCA",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CAMOCA",
    title: "CAMOCA - Management System",
    description: "CAMOCA - Sistem Management dengan User dan Role Management",
  },
  twitter: {
    card: "summary",
    title: "CAMOCA",
    description: "CAMOCA Management System",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA and Mobile Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-navbutton-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CAMOCA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Icons */}
        <link rel="icon" href="/icons/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icons/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/logo.svg" sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" type="image/png" />
        <link rel="shortcut icon" href="/icons/favicon-32x32.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Prevent zooming on iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        
        {/* Development scripts */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <script src="/network-filter.js" defer></script>
            <script src="/pwa-utils.js" defer></script>
          </>
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            let updateAvailable = false;
            
            // Listen for service worker messages
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                  console.log('🔄 PWA Update Available:', event.data);
                  updateAvailable = true;
                  
                  // Show update notification
                  if (${process.env.NODE_ENV !== 'development'}) {
                    const showUpdate = () => {
                      const updateBanner = document.createElement('div');
                      updateBanner.id = 'pwa-update-banner';
                      updateBanner.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        background: linear-gradient(135deg, #2563eb, #1d4ed8);
                        color: white;
                        padding: 12px 20px;
                        text-align: center;
                        z-index: 9999;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        cursor: pointer;
                        transition: all 0.3s ease;
                      \`;
                      updateBanner.innerHTML = \`
                        🔄 <strong>Versi Baru Tersedia!</strong> Klik untuk memperbarui aplikasi
                      \`;
                      updateBanner.onclick = () => {
                        window.location.reload();
                      };
                      
                      // Remove existing banner if any
                      const existing = document.getElementById('pwa-update-banner');
                      if (existing) existing.remove();
                      
                      document.body.appendChild(updateBanner);
                      
                      // Auto-hide after 10 seconds
                      setTimeout(() => {
                        if (updateBanner.parentNode) {
                          updateBanner.style.transform = 'translateY(-100%)';
                          setTimeout(() => updateBanner.remove(), 300);
                        }
                      }, 10000);
                    };
                    
                    // Show after a short delay to ensure page is loaded
                    setTimeout(showUpdate, 1000);
                  } else {
                    // Auto-refresh in development
                    console.log('🔄 Auto-refreshing in development mode...');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }
              });
            }
            
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered with scope: ', registration.scope);
                    
                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker installed
                            console.log('New service worker available');
                            if (${process.env.NODE_ENV === 'development'}) {
                              // Auto-refresh in development after short delay
                              setTimeout(() => window.location.reload(), 2000);
                            }
                            // In production, the message listener will handle the update notification
                          }
                        });
                      }
                    });

                    // Check for updates periodically
                    setInterval(() => {
                      registration.update();
                    }, 60000); // Check every minute
                  })
                  .catch(function(error) {
                    console.log('SW registration failed: ', error);
                  });
              });
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ConditionalAppLayout defaultOpen={defaultOpen}>
              {children}
            </ConditionalAppLayout>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
