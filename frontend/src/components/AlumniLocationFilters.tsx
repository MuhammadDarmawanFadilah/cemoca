"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Search, Filter, MapPin, Users, GraduationCap } from "lucide-react";
import { biografiAPI, getFilterOptions } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox-enhanced";

// Helper function for combobox options
const convertToComboboxOptions = (items: string[]) => 
  items.map(item => ({ value: item, label: item }));

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

interface AlumniLocationFiltersProps {
  onFilterChange: (filters: AlumniLocationFilters) => void;
  currentFilters: AlumniLocationFilters;
  totalItems?: number;
  currentItems?: number;
  loading?: boolean;
}

export default function AlumniLocationFilters({
  onFilterChange,
  currentFilters,
  totalItems = 0,
  currentItems = 0,
  loading = false
}: AlumniLocationFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AlumniLocationFilters>(currentFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Location options state
  const [locationOptions, setLocationOptions] = useState({
    provinsi: [] as string[],
    kota: [] as string[],
    kecamatan: [] as string[],
    kelurahan: [] as string[]
  });
  
  // Location mappings state (name -> code)
  const [locationMappings, setLocationMappings] = useState({
    provinsi: {} as Record<string, string>,
    kota: {} as Record<string, string>,
    kecamatan: {} as Record<string, string>,
    kelurahan: {} as Record<string, string>
  });
    // Program options
  const [programOptions, setProgramOptions] = useState({
    spesialisasi: [] as string[],
    pekerjaan: [] as string[],
    alumniTahun: [] as string[]
  });
  
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Fetch location and program options on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingLocations(true);
      try {        const [provinsiData, kotaData, kecamatanData, kelurahanData,
               provinsiMappings, kotaMappings, kecamatanMappings, kelurahanMappings,
               spesialisasiData, pekerjaanData, alumniTahunData] = await Promise.all([
          biografiAPI.getDistinctProvinsi(),
          biografiAPI.getDistinctKota(),
          biografiAPI.getDistinctKecamatan(),
          biografiAPI.getDistinctKelurahan(),
          biografiAPI.getProvinsiMappings(),
          biografiAPI.getKotaMappings(),
          biografiAPI.getKecamatanMappings(),
          biografiAPI.getKelurahanMappings(),
          biografiAPI.getDistinctSpesialisasi(),
          biografiAPI.getDistinctPekerjaan(),
          getFilterOptions.alumniTahun()
        ]);
        
        setLocationOptions({
          provinsi: provinsiData,
          kota: kotaData,
          kecamatan: kecamatanData,
          kelurahan: kelurahanData
        });
        
        setLocationMappings({
          provinsi: provinsiMappings,
          kota: kotaMappings,
          kecamatan: kecamatanMappings,
          kelurahan: kelurahanMappings
        });
          setProgramOptions({
          spesialisasi: spesialisasiData,
          pekerjaan: pekerjaanData,
          alumniTahun: alumniTahunData
        });
      } catch (error) {
        console.error('Error fetching data options:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (key: keyof AlumniLocationFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };
  
  const applyFilters = () => {
    // Convert location names to codes before sending to backend (if needed)
    const filtersToApply = {
      ...localFilters,
      provinsi: localFilters.provinsi && locationMappings.provinsi[localFilters.provinsi] 
        ? locationMappings.provinsi[localFilters.provinsi] 
        : localFilters.provinsi,
      kota: localFilters.kota && locationMappings.kota[localFilters.kota] 
        ? locationMappings.kota[localFilters.kota] 
        : localFilters.kota,
      kecamatan: localFilters.kecamatan && locationMappings.kecamatan[localFilters.kecamatan] 
        ? locationMappings.kecamatan[localFilters.kecamatan] 
        : localFilters.kecamatan,
      kelurahan: localFilters.kelurahan && locationMappings.kelurahan[localFilters.kelurahan] 
        ? locationMappings.kelurahan[localFilters.kelurahan] 
        : localFilters.kelurahan,
    };
    
    onFilterChange(filtersToApply);
  };

  const clearFilters = () => {
    const defaultFilters: AlumniLocationFilters = {};
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  
  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(currentFilters).filter(([key, value]) => {
      return value && value.toString().trim() !== '';
    });
    return activeFilters.length;
  };
  
  const activeFiltersCount = getActiveFiltersCount();
  
  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative px-3 text-sm w-full sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tampilkan Pencarian</span>
          <span className="sm:hidden">Pencarian</span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          {/* Alumni count */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing <span className="font-medium text-gray-900 dark:text-white">{currentItems}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> alumni locations
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="pb-4 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Filter Alumni Locations</span>
              <span className="sm:hidden">Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 max-w-full overflow-hidden">
            {/* Search Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Search className="h-4 w-4" />
                Pencarian
              </div>
              <div className="space-y-2">
                <Label htmlFor="search" className="text-xs xs:text-sm">Cari Member</Label>
                <Input
                  id="search"
                  placeholder="Cari berdasarkan nama member..."
                  value={localFilters.search || ''}
                  onChange={(e) => handleInputChange('search', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Lokasi
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provinsi">Provinsi</Label>
                  <Combobox
                    options={convertToComboboxOptions(locationOptions.provinsi)}
                    value={localFilters.provinsi || ''}
                    onValueChange={(value) => handleInputChange('provinsi', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih provinsi"}
                    searchPlaceholder="Cari provinsi..."
                    emptyMessage="Provinsi tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kota">Kota</Label>
                  <Combobox
                    options={convertToComboboxOptions(locationOptions.kota)}
                    value={localFilters.kota || ''}
                    onValueChange={(value) => handleInputChange('kota', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih kota"}
                    searchPlaceholder="Cari kota..."
                    emptyMessage="Kota tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Combobox
                    options={convertToComboboxOptions(locationOptions.kecamatan)}
                    value={localFilters.kecamatan || ''}
                    onValueChange={(value) => handleInputChange('kecamatan', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih kecamatan"}
                    searchPlaceholder="Cari kecamatan..."
                    emptyMessage="Kecamatan tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kelurahan">Kelurahan</Label>
                  <Combobox
                    options={convertToComboboxOptions(locationOptions.kelurahan)}
                    value={localFilters.kelurahan || ''}
                    onValueChange={(value) => handleInputChange('kelurahan', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih kelurahan"}
                    searchPlaceholder="Cari kelurahan..."
                    emptyMessage="Kelurahan tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kodePos">Kode Pos</Label>
                  <Input
                    id="kodePos"
                    placeholder="Masukkan kode pos"
                    value={localFilters.kodePos || ''}
                    onChange={(e) => handleInputChange('kodePos', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />            {/* Academic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Informasi Akademik
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spesialisasi">Spesialisasi</Label>
                  <Combobox
                    options={convertToComboboxOptions(programOptions.spesialisasi)}
                    value={localFilters.spesialisasi || ''}
                    onValueChange={(value) => handleInputChange('spesialisasi', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih spesialisasi"}
                    searchPlaceholder="Cari spesialisasi..."
                    emptyMessage="Spesialisasi tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pekerjaan">Pekerjaan</Label>
                  <Combobox
                    options={convertToComboboxOptions(programOptions.pekerjaan)}
                    value={localFilters.pekerjaan || ''}
                    onValueChange={(value) => handleInputChange('pekerjaan', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih pekerjaan"}
                    searchPlaceholder="Cari pekerjaan..."
                    emptyMessage="Pekerjaan tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alumniTahun">Tahun Alumni</Label>
                  <Combobox
                    options={convertToComboboxOptions(programOptions.alumniTahun)}
                    value={localFilters.alumniTahun || ''}
                    onValueChange={(value) => handleInputChange('alumniTahun', value)}
                    placeholder={loadingLocations ? "Loading..." : "Pilih tahun alumni"}
                    searchPlaceholder="Cari tahun..."
                    emptyMessage="Tahun tidak ditemukan"
                    disabled={loadingLocations}
                  />
                </div>
              </div>
            </div>

            <Separator />
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto px-3 sm:px-4 text-sm">
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Reset Filter</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setShowFilters(false)} className="flex-1 sm:flex-none px-3 sm:px-4 text-sm">
                  <span className="hidden sm:inline">Tutup</span>
                  <span className="sm:hidden">Close</span>
                </Button>
                <Button onClick={applyFilters} className="flex-1 sm:flex-none px-3 sm:px-4 text-sm" disabled={loading}>
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Terapkan Filter</span>
                  <span className="sm:hidden">Apply</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
