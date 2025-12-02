"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, User, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import AlumniMap from "@/components/AlumniMap";
import AlumniLocationFilters from "@/components/AlumniLocationFilters";

interface AlumniLocation {
  biografiId: number;
  namaLengkap: string;
  alumniTahun: string;
  jurusan: string;
  latitude: number;
  longitude: number;
  fotoProfil?: string;
  foto?: string;
  kota: string;
  provinsi: string;
  kecamatan: string;
  kelurahan: string;
  kodePos: string;
  alamat: string;
}

interface AlumniLocationFilters {
  search?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  spesialisasi?: string;
  pekerjaan?: string;
  alumniTahun?: string;
}

export default function AlumniLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<AlumniLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AlumniLocationFilters>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.548926, 118.0148634]); // Indonesia center
  const [mapZoom, setMapZoom] = useState(5);
  const { theme } = useTheme();
  // Fetch alumni locations
  const fetchLocations = async (filterParams?: AlumniLocationFilters) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      const currentFilters = filterParams || filters;
        if (currentFilters.search) queryParams.append('search', currentFilters.search);
      if (currentFilters.provinsi) queryParams.append('provinsi', currentFilters.provinsi);
      if (currentFilters.kota) queryParams.append('kota', currentFilters.kota);
      if (currentFilters.kecamatan) queryParams.append('kecamatan', currentFilters.kecamatan);
      if (currentFilters.kelurahan) queryParams.append('kelurahan', currentFilters.kelurahan);
      if (currentFilters.kodePos) queryParams.append('kodePos', currentFilters.kodePos);
      if (currentFilters.spesialisasi) queryParams.append('spesialisasi', currentFilters.spesialisasi);
      if (currentFilters.pekerjaan) queryParams.append('pekerjaan', currentFilters.pekerjaan);
      if (currentFilters.alumniTahun) queryParams.append('alumniTahun', currentFilters.alumniTahun);

      const response = await fetch(`/api/biografi/map-locations?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alumni locations');
      }
      
      const data = await response.json();
      setLocations(data);
      
      // Auto-center map if results are filtered
      if (data.length > 0 && Object.keys(currentFilters).some(key => currentFilters[key as keyof AlumniLocationFilters])) {
        const avgLat = data.reduce((sum: number, loc: AlumniLocation) => sum + loc.latitude, 0) / data.length;
        const avgLng = data.reduce((sum: number, loc: AlumniLocation) => sum + loc.longitude, 0) / data.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(currentFilters.kota || currentFilters.kecamatan || currentFilters.kelurahan ? 12 : currentFilters.provinsi ? 8 : 5);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Gagal memuat data lokasi member');
    } finally {
      setIsLoading(false);
    }  };

  // Handle alumni marker click
  const handleAlumniClick = (biografiId: number) => {
    router.push(`/biografi/${biografiId}`);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: AlumniLocationFilters) => {
    setFilters(newFilters);
    fetchLocations(newFilters);
  };

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, []);
  const getProfileImage = (alumni: AlumniLocation) => {
    return alumni.fotoProfil || alumni.foto || '/images/default-avatar.png';
  };

  return (
    <div className="alumni-locations-page container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 md:space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <h1 className="alumni-mobile-title text-2xl md:text-3xl font-bold tracking-tight">Lokasi Member</h1>
        </div>
        <p className="alumni-mobile-subtitle text-sm md:text-base text-muted-foreground">
          Temukan dan jelajahi lokasi member aktif di seluruh Indonesia
        </p>
      </div>      {/* Filters */}
      <AlumniLocationFilters
        onFilterChange={handleFilterChange}
        currentFilters={filters}
        totalItems={locations.length}
        currentItems={locations.length}
        loading={isLoading}
      />

      {/* Statistics */}
      <div className="alumni-stats-grid grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Total Lokasi</span>
            </div>
            <div className="text-xl md:text-2xl font-bold mt-2">
              {isLoading ? <Skeleton className="h-6 md:h-8 w-12 md:w-16" /> : locations.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Member Aktif</span>
            </div>
            <div className="text-xl md:text-2xl font-bold mt-2">
              {isLoading ? <Skeleton className="h-6 md:h-8 w-12 md:w-16" /> : locations.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Provinsi Tersebar</span>
            </div>
            <div className="text-xl md:text-2xl font-bold mt-2">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                new Set(locations.map(l => l.provinsi)).size
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="alumni-map-container">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            <span>Peta Lokasi Member</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-[400px] md:h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Skeleton className="h-[400px] md:h-[600px] w-full" />
                <p className="mt-4 text-muted-foreground text-sm">Memuat peta...</p>
              </div>
            </div>
          ) : (
            <div className="alumni-map-mobile">
              <AlumniMap
                locations={locations}
                center={mapCenter}
                zoom={mapZoom}
                onAlumniClick={handleAlumniClick}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
