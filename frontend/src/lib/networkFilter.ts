// Network Filter untuk membersihkan network tab di browser
// Hanya menampilkan API calls ke backend

import { config } from './config';

interface NetworkConfig {
  showOnlyBackendCalls: boolean;
  backendBaseUrl: string;
  allowedDomains: string[];
  excludePatterns: RegExp[];
}

const defaultConfig: NetworkConfig = {
  showOnlyBackendCalls: config.showOnlyBackendCalls,
  backendBaseUrl: config.baseUrl,
  allowedDomains: config.allowedDomains,
  excludePatterns: [
    /\/_next\//, // Next.js internal requests
    /\/favicon\.ico/, // Favicon requests
    /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/, // Static assets
    /\/__webpack_hmr/, // Hot module reload
    /\/hot-update\.json/, // Hot update files
    /\/_vercel\//, // Vercel specific
    /\/sw\.js/, // Service worker
    /\/manifest\.json/, // PWA manifest
    /chrome-extension:\/\//, // Chrome extensions
    /moz-extension:\/\//, // Firefox extensions
  ]
};

class NetworkFilter {
  private config: NetworkConfig;
  private originalFetch: typeof fetch;

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.originalFetch = window.fetch;
    this.initFilter();
  }

  private initFilter() {
    if (typeof window === 'undefined') return;

    // Override fetch untuk filtering
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Log semua API calls ke backend
      if (this.isBackendCall(url)) {
        console.group(`🚀 Backend API Call`);
        console.log(`Method: ${init?.method || 'GET'}`);
        console.log(`URL: ${url}`);
        console.log(`Headers:`, init?.headers);
        if (init?.body) {
          console.log(`Body:`, init.body);
        }
        console.groupEnd();
      }

      // Panggil fetch asli
      const response = await this.originalFetch(input, init);

      // Log response untuk backend calls
      if (this.isBackendCall(url)) {
        console.group(`📡 Backend Response`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`URL: ${url}`);
        console.groupEnd();
      }

      return response;
    };
  }

  private isBackendCall(url: string): boolean {
    // Cek apakah URL adalah backend call
    return this.config.allowedDomains.some(domain => url.includes(domain)) ||
           url.startsWith(this.config.backendBaseUrl);
  }

  // Method untuk disable filter sementara
  public disableFilter() {
    if (typeof window !== 'undefined') {
      window.fetch = this.originalFetch;
    }
  }

  // Method untuk enable filter kembali
  public enableFilter() {
    this.initFilter();
  }

  // Method untuk update config
  public updateConfig(newConfig: Partial<NetworkConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
let networkFilter: NetworkFilter | null = null;

export const initNetworkFilter = (config?: Partial<NetworkConfig>) => {
  if (typeof window !== 'undefined' && !networkFilter) {
    networkFilter = new NetworkFilter(config);
  }
  return networkFilter;
};

export const getNetworkFilter = () => networkFilter;

// Console helpers untuk debugging
export const networkDebug = {
  // Show only backend calls in console
  onlyBackend: () => {
    console.clear();
    console.log('%c🎯 Network Filter: Showing only backend calls', 'color: #00ff00; font-weight: bold;');
  },
  
  // Clear network logs
  clear: () => {
    console.clear();
    console.log('%c🧹 Network logs cleared', 'color: #0099ff; font-weight: bold;');
  },
  
  // Show filter status
  status: () => {
    console.group('%c📊 Network Filter Status', 'color: #ff9900; font-weight: bold;');
    console.log('Filter Active:', !!networkFilter);
    console.log('Backend URL:', defaultConfig.backendBaseUrl);
    console.log('Allowed Domains:', defaultConfig.allowedDomains);
    console.groupEnd();
  }
};

// Export untuk penggunaan di browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).networkDebug = networkDebug;
}
