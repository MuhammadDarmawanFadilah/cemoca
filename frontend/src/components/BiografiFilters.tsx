"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Search, Filter, Calendar, GraduationCap, MapPin, UserCheck, Stethoscope, Grid, List } from "lucide-react";
import { BiografiFilterRequest, biografiAPI } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox-enhanced";

// Helper function for combobox options
const convertToComboboxOptions = (items: string[]) => 
  items.map(item => ({ value: item, label: item }));

// Medical specializations for filtering
const SPESIALISASI_KEDOKTERAN_OPTIONS = [
  "Dokter Umum",
  "Sp.A - Spesialis Anak",
  "Sp.PD - Spesialis Penyakit Dalam", 
  "Sp.B - Spesialis Bedah",
  "Sp.JP - Spesialis Jantung dan Pembuluh Darah",
  "Sp.M - Spesialis Mata",
  "Sp.THT-KL - Spesialis Telinga Hidung Tenggorok",
  "Sp.KK - Spesialis Kulit dan Kelamin",
  "Sp.OG - Spesialis Obstetri dan Ginekologi",
  "Sp.S - Spesialis Saraf",
  "Sp.P - Spesialis Paru",
  "Sp.U - Spesialis Urologi",
  "Sp.Or - Spesialis Ortopedi",
  "Sp.An - Spesialis Anestesi",
  "Sp.Rad - Spesialis Radiologi",
  "Sp.PA - Spesialis Patologi Anatomi",
  "Sp.PK - Spesialis Patologi Klinik",
  "Sp.F - Spesialis Farmakologi",
  "Sp.MK - Spesialis Mikrobiologi Klinis",
  "Sp.Psikiatri - Spesialis Kedokteran Jiwa",
  "Sp.RM - Spesialis Rehabilitasi Medik",
  "Sp.GK - Spesialis Gizi Klinik",
  "Sp.Olahraga - Spesialis Kedokteran Olahraga",
  "Sp.Okupasi - Spesialis Kedokteran Okupasi",
  "Sp.Forensik - Spesialis Kedokteran Forensik",
  "Sp.KGA - Spesialis Kedokteran Gigi Anak",
  "Sp.BM - Spesialis Bedah Mulut",
  "Sp.Perio - Spesialis Periodonsia",
  "Sp.Pros - Spesialis Prostodonsia",
  "Sp.Ortho - Spesialis Ortodonsia",
  "Sp.Konservasi - Spesialis Konservasi Gigi",
  "Sp.RKG - Spesialis Radiologi Kedokteran Gigi",
  "Sp.PM - Spesialis Penyakit Mulut",
  "Sp.KG - Spesialis Kedokteran Gigi",
  "SubSp.Bedah Anak",
  "SubSp.Bedah Toraks",
  "SubSp.Bedah Plastik",
  "SubSp.Bedah Saraf",
  "SubSp.Bedah Onkologi",
  "SubSp.Endokrinologi",
  "SubSp.Gastroentero-Hepatologi",
  "SubSp.Hematologi-Onkologi",
  "SubSp.Kardiologi",
  "SubSp.Nefrologi",
  "SubSp.Reumatologi",
  "SubSp.Respirologi"
];

// Alumni graduation years (last 20 years)
const ALUMNI_TAHUN_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

// Common Indonesian cities
const KOTA_OPTIONS = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang",
  "Tangerang", "Depok", "Bekasi", "Bogor", "Batam", "Pekanbaru", "Bandar Lampung",
  "Malang", "Yogyakarta", "Solo", "Denpasar", "Balikpapan", "Samarinda", "Pontianak",
  "Manado", "Ambon", "Jayapura", "Mataram", "Kupang", "Banda Aceh", "Padang",
  "Jambi", "Bengkulu", "Pangkal Pinang", "Tanjung Pinang", "Banjarmasin", "Palangka Raya"
].sort();

interface BiografiFiltersProps {
  onFilterChange: (filters: BiografiFilterRequest) => void;
  currentFilters: BiografiFilterRequest;
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  currentItems?: number;
}

export default function BiografiFilters({ 
  onFilterChange, 
  currentFilters, 
  viewMode = "list",
  onViewModeChange,
  pageSize = 10,
  onPageSizeChange,
  totalItems = 0,
  currentItems = 0
}: BiografiFiltersProps) {
  const [localFilters, setLocalFilters] = useState<BiografiFilterRequest>(currentFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Dynamic data options state
  const [dynamicOptions, setDynamicOptions] = useState({
    pekerjaan: [] as string[],
    spesialisasi: [] as string[],
    jurusan: [] as string[],
    alumniTahun: [] as string[]
  });
  
  const [loadingDynamicData, setLoadingDynamicData] = useState(false);
  
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
  
  const [loadingLocations, setLoadingLocations] = useState(false);  // Fetch location options on component mount
  useEffect(() => {
    const fetchLocationOptions = async () => {
      setLoadingLocations(true);
      try {
        const [provinsiData, kotaData, kecamatanData, kelurahanData, 
               provinsiMappings, kotaMappings, kecamatanMappings, kelurahanMappings] = await Promise.all([
          biografiAPI.getDistinctProvinsi(),
          biografiAPI.getDistinctKota(),
          biografiAPI.getDistinctKecamatan(),
          biografiAPI.getDistinctKelurahan(),
          biografiAPI.getProvinsiMappings(),
          biografiAPI.getKotaMappings(),
          biografiAPI.getKecamatanMappings(),
          biografiAPI.getKelurahanMappings()
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
      } catch (error) {
        console.error('Error fetching location options:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    const fetchDynamicOptions = async () => {
      setLoadingDynamicData(true);
      try {
        const [pekerjaanData, spesialisasiData, jurusanData, alumniTahunData] = await Promise.all([
          biografiAPI.getDistinctPekerjaan(),
          biografiAPI.getDistinctSpesialisasi(),
          biografiAPI.getDistinctJurusan(),
          biografiAPI.getDistinctAlumniTahun()
        ]);
        
        setDynamicOptions({
          pekerjaan: pekerjaanData,
          spesialisasi: spesialisasiData,
          jurusan: jurusanData,
          alumniTahun: alumniTahunData
        });
      } catch (error) {
        console.error('Error fetching dynamic filter options:', error);
      } finally {
        setLoadingDynamicData(false);
      }
    };

    fetchLocationOptions();
    fetchDynamicOptions();
  }, []);

  const handleInputChange = (key: keyof BiografiFilterRequest, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };
  const applyFilters = () => {
    // Convert location names to codes before sending to backend
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
      page: 0 // Reset to first page when applying filters
    };
    
    console.log('Original filters:', localFilters);
    console.log('Location mappings:', locationMappings);
    console.log('Filters sent to backend:', filtersToApply);
    
    onFilterChange(filtersToApply);
  };

  const clearFilters = () => {
    const defaultFilters: BiografiFilterRequest = {
      page: 0,
      size: currentFilters.size || 10,
      sortBy: currentFilters.sortBy || 'createdAt',
      sortDirection: currentFilters.sortDirection || 'desc'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(currentFilters).filter(([key, value]) => {
      return value && !['page', 'size', 'sortBy', 'sortDirection'].includes(key);
    });
    return activeFilters.length;
  };
  const activeFiltersCount = getActiveFiltersCount();  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="w-full">        <Button
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
          {/* Document count */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing <span className="font-medium text-gray-900 dark:text-white">{currentItems}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> alumni
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6">
            {/* Per page selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Per page:
              </Label>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange?.(parseInt(value))}>
                <SelectTrigger className="w-16 sm:w-20 h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="10000">10000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                View:
              </Label>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && typeof value === 'string' && onViewModeChange?.(value)} 
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
              >
                <ToggleGroupItem 
                  value="list" 
                  aria-label="List view" 
                  size="sm" 
                  className="px-2 sm:px-3 py-1.5 sm:py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">List</span>
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="grid" 
                  aria-label="Grid view" 
                  size="sm" 
                  className="px-2 sm:px-3 py-1.5 sm:py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                >
                  <Grid className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Grid</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>      {showFilters && (
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="pb-4 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Filter Alumni</span>
              <span className="sm:hidden">Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 max-w-full overflow-hidden">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              Informasi Personal
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-xs xs:text-sm">Nama Member</Label>
                <Input
                  id="nama"
                  placeholder="Cari nama member..."
                  value={localFilters.nama || ''}
                  onChange={(e) => handleInputChange('nama', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nim" className="text-xs xs:text-sm">NIM</Label>
                <Input
                  id="nim"
                  placeholder="Cari NIM..."
                  value={localFilters.nim || ''}
                  onChange={(e) => handleInputChange('nim', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Cari email..."
                  value={localFilters.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Academic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              Informasi Akademik
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programStudi">Program Studi</Label>
                <Input
                  id="programStudi"
                  placeholder="Cari program studi..."
                  value={localFilters.programStudi || ''}
                  onChange={(e) => handleInputChange('programStudi', e.target.value)}
                />
              </div>              <div className="space-y-2">
                <Label htmlFor="alumniTahun">Tahun Alumni</Label>
                <Combobox
                  options={convertToComboboxOptions(dynamicOptions.alumniTahun)}
                  value={localFilters.alumniTahun || ''}
                  onValueChange={(value) => handleInputChange('alumniTahun', value)}
                  placeholder={loadingDynamicData ? "Loading..." : "Pilih tahun alumni"}
                  searchPlaceholder="Cari tahun..."
                  emptyMessage="Tahun tidak ditemukan"
                  disabled={loadingDynamicData}
                />
              </div>
            </div>
          </div>

          <Separator />          {/* Professional Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Stethoscope className="h-4 w-4" />
              Informasi Profesi
            </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan/Posisi</Label>
                <Combobox
                  options={convertToComboboxOptions(dynamicOptions.pekerjaan)}
                  value={localFilters.pekerjaan || ''}
                  onValueChange={(value) => handleInputChange('pekerjaan', value)}
                  placeholder={loadingDynamicData ? "Loading..." : "Pilih atau ketik pekerjaan"}
                  searchPlaceholder="Cari pekerjaan..."
                  emptyMessage="Pekerjaan tidak ditemukan"
                  disabled={loadingDynamicData}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spesialisasi">Spesialisasi Kedokteran</Label>
                <Combobox
                  options={convertToComboboxOptions(dynamicOptions.spesialisasi)}
                  value={localFilters.spesialisasi || ''}
                  onValueChange={(value) => handleInputChange('spesialisasi', value)}
                  placeholder={loadingDynamicData ? "Loading..." : "Pilih atau ketik spesialisasi"}
                  searchPlaceholder="Cari spesialisasi..."
                  emptyMessage="Spesialisasi tidak ditemukan"
                  disabled={loadingDynamicData}
                />
              </div>
            </div>
          </div>

          <Separator />          {/* Location & Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Lokasi & Status
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={localFilters.status || undefined}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortBy">Urutkan berdasarkan</Label>
                <Select
                  value={localFilters.sortBy || 'createdAt'}
                  onValueChange={(value) => handleInputChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="createdAt">Tanggal Dibuat</SelectItem>
                    <SelectItem value="namaLengkap">Nama</SelectItem>
                    <SelectItem value="nim">NIM</SelectItem>
                    <SelectItem value="alumniTahun">Tahun Alumni</SelectItem>
                    <SelectItem value="programStudi">Program Studi</SelectItem>
                    <SelectItem value="pekerjaan">Pekerjaan</SelectItem>
                    <SelectItem value="spesialisasi">Spesialisasi</SelectItem>
                    <SelectItem value="kota">Kota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>            <Separator />
            
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
                <Button onClick={applyFilters} className="flex-1 sm:flex-none px-3 sm:px-4 text-sm">
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
