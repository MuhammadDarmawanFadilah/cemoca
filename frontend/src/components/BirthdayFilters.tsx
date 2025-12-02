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
import { X, Search, Filter, Calendar, UserCheck, Cake, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { biografiAPI } from "@/lib/api";

interface BirthdayNotificationFilter {
  year: number;
  alumniYear: string;
  status: string;
  isExcluded: string;
  nama: string;
  startBirthDate: string;
  endBirthDate: string;
  maxDaysUntilBirthday: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
}

interface BirthdayFiltersProps {
  onFilterChange: (filters: BirthdayNotificationFilter) => void;
  currentFilters: BirthdayNotificationFilter;
}

export default function BirthdayFilters({ onFilterChange, currentFilters }: BirthdayFiltersProps) {
  const [localFilters, setLocalFilters] = useState<BirthdayNotificationFilter>(currentFilters);
  const [showFilters, setShowFilters] = useState(false);
  // Location data state
  const [locationData, setLocationData] = useState({
    provinsiOptions: [] as string[],
    kotaOptions: [] as string[],
    kecamatanOptions: [] as string[],
    kelurahanOptions: [] as string[]
  });
  
  // Location mappings state (name -> code)
  const [locationMappings, setLocationMappings] = useState({
    provinsi: {} as Record<string, string>,
    kota: {} as Record<string, string>,
    kecamatan: {} as Record<string, string>,
    kelurahan: {} as Record<string, string>
  });
  
  const [loadingLocationData, setLoadingLocationData] = useState(false);

  // Load location data on component mount
  useEffect(() => {
    loadLocationData();
  }, []);
  const loadLocationData = async () => {
    try {
      setLoadingLocationData(true);
      const [provinsiRes, kotaRes, kecamatanRes, kelurahanRes,
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
      
      setLocationData({
        provinsiOptions: provinsiRes,
        kotaOptions: kotaRes,
        kecamatanOptions: kecamatanRes,
        kelurahanOptions: kelurahanRes
      });
      
      setLocationMappings({
        provinsi: provinsiMappings,
        kota: kotaMappings,
        kecamatan: kecamatanMappings,
        kelurahan: kelurahanMappings
      });
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setLoadingLocationData(false);
    }
  };

  // Helper function untuk format tanggal dd/MM
  const formatDayMonth = (day: number, month: number): string => {
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  };

  // Helper function untuk parse tanggal dd/MM
  const parseDayMonth = (dateStr: string): { day: number, month: number } | null => {
    if (!dateStr || !dateStr.includes('/')) return null;
    const [day, month] = dateStr.split('/').map(num => parseInt(num, 10));
    if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) return null;
    return { day, month };
  };  const handleInputChange = (key: keyof BirthdayNotificationFilter, value: string | number) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || (typeof value === 'number' ? 0 : '')
    }));
  };  const handleDateChange = (key: 'startBirthDate' | 'endBirthDate', day: number, month: number) => {
    const formatted = formatDayMonth(day, month);
    setLocalFilters(prev => ({
      ...prev,
      [key]: formatted
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
    onFilterChange(filtersToApply);
  };const clearFilters = () => {
    const defaultFilters: BirthdayNotificationFilter = {
      year: new Date().getFullYear(),
      alumniYear: '',
      status: '',
      isExcluded: '',
      nama: '',
      startBirthDate: '',
      endBirthDate: '',
      maxDaysUntilBirthday: '',
      provinsi: '',
      kota: '',
      kecamatan: '',
      kelurahan: '',
      page: 0,
      size: currentFilters.size || 10,
      sortBy: currentFilters.sortBy || 'notificationDate',
      sortDirection: currentFilters.sortDirection || 'desc'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(currentFilters).filter(([key, value]) => {
      return value && value !== '' && !['page', 'size', 'sortBy', 'sortDirection'].includes(key) && 
             !(key === 'year' && value === new Date().getFullYear());
    });
    return activeFilters.length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Pencarian Notifikasi Ulang Tahun
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} pencarian aktif</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Sembunyikan" : "Tampilkan"} Pencarian
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-6">
          {/* Basic Search Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              Pencarian Dasar
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">              <div className="space-y-2">
                <Label htmlFor="nama">Nama Member</Label>
                <Input
                  id="nama"
                  placeholder="Cari nama member..."
                  value={localFilters.nama || ''}
                  onChange={(e) => handleInputChange('nama', e.target.value)}
                />
              </div><div className="space-y-2">
                <Label htmlFor="alumniYear">Tahun Alumni</Label>
                <Select
                  value={localFilters.alumniYear || ''}
                  onValueChange={(value) => handleInputChange('alumniYear', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun alumni" />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status & Exclude Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Cake className="h-4 w-4" />
              Status & Pengecualian
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status Notifikasi</Label>
                <Select
                  value={localFilters.status || "all"}
                  onValueChange={(value) => handleInputChange('status', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="SENT">Terkirim</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                    <SelectItem value="RESENT">Dikirim Ulang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isExcluded">Status Pengecualian</Label>
                <Select
                  value={localFilters.isExcluded || "all"}
                  onValueChange={(value) => handleInputChange('isExcluded', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status pengecualian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="true">Dikecualikan</SelectItem>
                    <SelectItem value="false">Disertakan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>          <Separator />          {/* Birth Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Rentang Tanggal Lahir (Hari/Bulan)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">                <Label htmlFor="startBirthDate">Tanggal Lahir Mulai</Label>
                <div className="flex gap-2">
                  <Select
                    value={parseDayMonth(localFilters.startBirthDate || '')?.day?.toString() || ''}
                    onValueChange={(value) => {
                      const currentMonth = parseDayMonth(localFilters.startBirthDate || '')?.month || 1;
                      if (value && value !== 'none') {
                        handleDateChange('startBirthDate', parseInt(value), currentMonth);
                      } else {
                        handleInputChange('startBirthDate', '');
                      }
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {day.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={parseDayMonth(localFilters.startBirthDate || '')?.month?.toString() || ''}
                    onValueChange={(value) => {
                      const currentDay = parseDayMonth(localFilters.startBirthDate || '')?.day || 1;
                      if (value && value !== 'none') {
                        handleDateChange('startBirthDate', currentDay, parseInt(value));
                      } else {
                        handleInputChange('startBirthDate', '');
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      <SelectItem value="1">Januari</SelectItem>
                      <SelectItem value="2">Februari</SelectItem>
                      <SelectItem value="3">Maret</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">Mei</SelectItem>
                      <SelectItem value="6">Juni</SelectItem>
                      <SelectItem value="7">Juli</SelectItem>
                      <SelectItem value="8">Agustus</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">Oktober</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">Desember</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Pilih hari dan bulan untuk tanggal lahir mulai
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endBirthDate">Tanggal Lahir Akhir</Label>
                <div className="flex gap-2">                  <Select
                    value={parseDayMonth(localFilters.endBirthDate || '')?.day?.toString() || ''}
                    onValueChange={(value) => {
                      const currentMonth = parseDayMonth(localFilters.endBirthDate || '')?.month || 1;
                      if (value && value !== 'none') {
                        handleDateChange('endBirthDate', parseInt(value), currentMonth);
                      } else {
                        handleInputChange('endBirthDate', '');
                      }
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {day.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>                  <Select
                    value={parseDayMonth(localFilters.endBirthDate || '')?.month?.toString() || ''}
                    onValueChange={(value) => {
                      const currentDay = parseDayMonth(localFilters.endBirthDate || '')?.day || 1;
                      if (value && value !== 'none') {
                        handleDateChange('endBirthDate', currentDay, parseInt(value));
                      } else {
                        handleInputChange('endBirthDate', '');
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      <SelectItem value="1">Januari</SelectItem>
                      <SelectItem value="2">Februari</SelectItem>
                      <SelectItem value="3">Maret</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">Mei</SelectItem>
                      <SelectItem value="6">Juni</SelectItem>
                      <SelectItem value="7">Juli</SelectItem>
                      <SelectItem value="8">Agustus</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">Oktober</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">Desember</SelectItem>
                    </SelectContent>
                  </Select>
                </div>                <div className="text-xs text-muted-foreground">
                  Pilih hari dan bulan untuk tanggal lahir akhir
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Lokasi
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provinsi">Provinsi</Label>
                <Select
                  value={localFilters.provinsi || "all"}
                  onValueChange={(value) => handleInputChange('provinsi', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocationData ? "Memuat..." : "Pilih provinsi"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {locationData.provinsiOptions.map((provinsi) => (
                      <SelectItem key={provinsi} value={provinsi}>{provinsi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kota">Kota</Label>
                <Select
                  value={localFilters.kota || "all"}
                  onValueChange={(value) => handleInputChange('kota', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocationData ? "Memuat..." : "Pilih kota"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kota</SelectItem>
                    {locationData.kotaOptions.map((kota) => (
                      <SelectItem key={kota} value={kota}>{kota}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecamatan">Kecamatan</Label>
                <Select
                  value={localFilters.kecamatan || "all"}
                  onValueChange={(value) => handleInputChange('kecamatan', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocationData ? "Memuat..." : "Pilih kecamatan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kecamatan</SelectItem>
                    {locationData.kecamatanOptions.map((kecamatan) => (
                      <SelectItem key={kecamatan} value={kecamatan}>{kecamatan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kelurahan">Kelurahan</Label>
                <Select
                  value={localFilters.kelurahan || "all"}
                  onValueChange={(value) => handleInputChange('kelurahan', value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocationData ? "Memuat..." : "Pilih kelurahan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelurahan</SelectItem>
                    {locationData.kelurahanOptions.map((kelurahan) => (
                      <SelectItem key={kelurahan} value={kelurahan}>{kelurahan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Terapkan Pencarian
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Hapus Semua Pencarian
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t">              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium">Pencarian aktif:</span>
                {currentFilters.nama && (
                  <Badge variant="secondary">
                    Nama: {currentFilters.nama}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, nama: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.status && (
                  <Badge variant="secondary">
                    Status: {currentFilters.status}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, status: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.isExcluded && (
                  <Badge variant="secondary">
                    Pengecualian: {currentFilters.isExcluded === 'true' ? 'Dikecualikan' : 'Disertakan'}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, isExcluded: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.alumniYear && (
                  <Badge variant="secondary">
                    Tahun Alumni: {currentFilters.alumniYear}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, alumniYear: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.startBirthDate && (
                  <Badge variant="secondary">
                    Lahir Dari: {currentFilters.startBirthDate}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, startBirthDate: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}                {currentFilters.endBirthDate && (
                  <Badge variant="secondary">
                    Lahir Sampai: {currentFilters.endBirthDate}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, endBirthDate: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.provinsi && (
                  <Badge variant="secondary">
                    Provinsi: {currentFilters.provinsi}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, provinsi: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.kota && (
                  <Badge variant="secondary">
                    Kota: {currentFilters.kota}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, kota: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.kecamatan && (
                  <Badge variant="secondary">
                    Kecamatan: {currentFilters.kecamatan}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, kecamatan: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
                {currentFilters.kelurahan && (
                  <Badge variant="secondary">
                    Kelurahan: {currentFilters.kelurahan}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newFilters = { ...currentFilters, kelurahan: '', page: 0 };
                        setLocalFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
