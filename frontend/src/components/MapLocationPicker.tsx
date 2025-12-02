"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, X, Check, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MapLocationPickerProps {
  latitude?: number | string;
  longitude?: number | string;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  className?: string;
}

// Dynamically import the map component to avoid SSR issues
const DynamicMapLocationPickerClient = dynamic(() => import('./MapLocationPickerClient').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] w-full">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  ),
});

export default function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = ""
}: MapLocationPickerProps) {
  const { isMobile, isSmallMobile } = useMobileDetection();
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);  // Initialize selected location from props
  useEffect(() => {
    if (latitude && longitude) {
      if (typeof latitude === 'number' && typeof longitude === 'number' &&
          !isNaN(latitude) && !isNaN(longitude)) {
        setSelectedLocation({ lat: latitude, lng: longitude });
      } else if (typeof latitude === 'string' && typeof longitude === 'string' &&
                 latitude.trim() !== '' && longitude.trim() !== '') {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({ lat, lng });
        }
      }
    }
  }, [latitude, longitude]);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    // Check if we're on HTTPS (required for geolocation in modern browsers)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast.error("Akses lokasi memerlukan koneksi HTTPS yang aman");
      return;
    }

    // Check if location permission is already granted
    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});
      if (permission.state === 'denied') {
        toast.error("Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda.");
        return;
      }
    } catch (error) {
      // Permissions API not supported, continue with geolocation request
    }

    setIsGettingLocation(true);
    toast.loading("Mendapatkan lokasi Anda...", { id: "getting-location" });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setCurrentLocation(location);
        setSelectedLocation(location);
        onLocationChange(latitude, longitude);
        toast.dismiss("getting-location");
        toast.success("Lokasi berhasil ditemukan!");
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Gagal mendapatkan lokasi";
        let actionMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak";
            actionMessage = "Mohon izinkan akses lokasi di browser Anda dan coba lagi.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia";
            actionMessage = "Periksa koneksi internet dan GPS Anda.";
            break;
          case error.TIMEOUT:
            errorMessage = "Timeout saat mengambil lokasi";
            actionMessage = "Coba lagi atau pilih lokasi secara manual di peta.";
            break;
        }
        toast.dismiss("getting-location");
        toast.error(`${errorMessage}. ${actionMessage}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increase timeout
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [onLocationChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationChange(lat, lng);
    setSearchQuery(""); // Clear search when location is selected via map
    setSearchResults([]);
    toast.success("Lokasi berhasil dipilih di peta!");
  }, [onLocationChange]);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
    setSearchQuery("");
    setSearchResults([]);
    onLocationChange(null, null);
    toast.info("Lokasi dihapus");
  }, [onLocationChange]);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use Nominatim API for geocoding with focus on Indonesia
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ID&limit=5&addressdetails=1&accept-language=id,en`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      toast.error("Gagal mencari lokasi. Periksa koneksi internet Anda.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectSearchResult = useCallback((result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const location = { lat, lng };
    setSelectedLocation(location);
    onLocationChange(lat, lng);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    toast.success(`Lokasi dipilih: ${result.display_name.split(',')[0]}`);
  }, [onLocationChange]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchLocation]);

  const formatCoordinate = (value: number) => {
    return value.toFixed(6);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className={isMobile ? "pb-2" : "pb-3"}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            <MapPin className="h-5 w-5 text-primary" />
            {isMobile ? 'Pilih Lokasi' : 'Pilih Lokasi Karyawan'}
          </CardTitle>
          {!isMobile && (
            <p className="text-sm text-muted-foreground">
              Cari lokasi, gunakan lokasi saat ini, atau klik pada peta untuk menentukan lokasi
            </p>
          )}
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-2' : ''}`}>
          {/* Location Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari lokasi di Indonesia (contoh: Jakarta, Bandung, Surabaya)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
              )}
            </div>
            
            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-3 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="font-medium text-sm">
                      {result.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.display_name.split(',').slice(1, 3).join(',').trim()}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No results message */}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="bg-background border rounded-lg p-3 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk "{searchQuery}". Coba kata kunci lain atau pilih lokasi di peta.
              </div>
            )}
            
            {/* Search suggestions when no results and no query */}
            {!searchQuery && searchResults.length === 0 && (
              <div className="text-xs text-muted-foreground">
                💡 Contoh pencarian: Jakarta Pusat, Bandung Kota, Surabaya Timur, Yogyakarta, Denpasar
              </div>
            )}
          </div>
          {/* Control Buttons */}
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-wrap gap-2'}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencari Lokasi...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  {isMobile ? "Gunakan Lokasi Saat Ini" : "Gunakan Lokasi Saat Ini"}
                </>
              )}
            </Button>
            
            {selectedLocation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearLocation}
                className={`flex items-center gap-2 text-destructive hover:text-destructive ${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
              >
                <X className="h-4 w-4" />
                Hapus Lokasi
              </Button>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className={`flex items-center gap-2 ${isMobile ? 'p-2' : 'p-3'} bg-muted/50 rounded-lg`}>
              <Check className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                  {isMobile ? 'Koordinat:' : 'Lokasi Terpilih:'}
                </p>
                <div className={`flex ${isMobile ? 'flex-col gap-1' : 'flex-wrap gap-2'} mt-1`}>
                  <Badge variant="secondary" className="text-xs">
                    {formatCoordinate(selectedLocation.lat)}, {formatCoordinate(selectedLocation.lng)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Map Component */}
          <div className="border rounded-lg overflow-hidden">
            <DynamicMapLocationPickerClient
              selectedLocation={selectedLocation}
              currentLocation={currentLocation}
              onMapClick={handleMapClick}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
