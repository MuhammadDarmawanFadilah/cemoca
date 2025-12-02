"use client";

import { useState } from "react";
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
import { 
  X, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Grid, 
  List,
  TrendingUp,
  Timer,
  CheckCircle
} from "lucide-react";

export interface UsulanFilterRequest {
  page: number;
  size: number;
  search?: string;
  judul?: string;
  namaPengusul?: string;
  status?: string;
  tanggalMulaiFrom?: string;
  tanggalMulaiTo?: string;
  tanggalSelesaiFrom?: string;
  tanggalSelesaiTo?: string;
  sortBy?: string;
  sortDirection?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "AKTIF", label: "Aktif" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DALAM_PELAKSANAAN", label: "Dalam Pelaksanaan" },
  { value: "SELESAI", label: "Selesai" }
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Terbaru" },
  { value: "judul", label: "Judul A-Z" },
  { value: "tanggalMulai", label: "Tanggal Mulai" },
  { value: "jumlahUpvote", label: "Paling Disukai" },
  { value: "durasiUsulan", label: "Deadline" }
];

interface UsulanFiltersProps {
  onFilterChange: (filters: UsulanFilterRequest) => void;
  currentFilters: UsulanFilterRequest;
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  currentItems?: number;
}

export default function UsulanFilters({ 
  onFilterChange, 
  currentFilters, 
  viewMode = "grid",
  onViewModeChange,
  pageSize = 10,
  onPageSizeChange,
  totalItems = 0,
  currentItems = 0
}: UsulanFiltersProps) {
  const [localFilters, setLocalFilters] = useState<UsulanFilterRequest>(currentFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (key: keyof UsulanFilterRequest, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const applyFilters = () => {
    const filtersToApply = {
      ...localFilters,
      page: 0 // Reset to first page when applying filters
    };
    onFilterChange(filtersToApply);
  };

  const clearFilters = () => {
    const defaultFilters: UsulanFilterRequest = {
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
          {/* Document count */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing <span className="font-medium text-gray-900 dark:text-white">{currentItems}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> usulan
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6">
            {/* Per page selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Per page:
              </Label>              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange?.(parseInt(value))}>
                <SelectTrigger className="w-16 sm:w-20 h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
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
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active filters:
          </span>
          
          {currentFilters.search && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Search className="h-3 w-3" />
              <span>Search: "{currentFilters.search}"</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, search: undefined }));
                  onFilterChange({ ...currentFilters, search: undefined, page: 0 });
                }}
              />
            </Badge>
          )}
          
          {currentFilters.namaPengusul && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3" />
              <span>Pengusul: "{currentFilters.namaPengusul}"</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, namaPengusul: undefined }));
                  onFilterChange({ ...currentFilters, namaPengusul: undefined, page: 0 });
                }}
              />
            </Badge>
          )}
          
          {currentFilters.status && currentFilters.status !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Status: {STATUS_OPTIONS.find(opt => opt.value === currentFilters.status)?.label}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, status: undefined }));
                  onFilterChange({ ...currentFilters, status: undefined, page: 0 });
                }}
              />
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-800 h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="pb-4 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Filter Usulan Kegiatan</span>
              <span className="sm:hidden">Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 max-w-full overflow-hidden">
            
            {/* Search Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-full">
              <div className="space-y-2 max-w-full">
                <Label htmlFor="search" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Pencarian Umum</span>
                  <span className="sm:hidden">Cari</span>
                </Label>
                <Input
                  id="search"
                  placeholder="Cari dalam judul atau deskripsi..."
                  value={localFilters.search || ""}
                  onChange={(e) => handleInputChange("search", e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="judul" className="flex items-center gap-2 text-xs sm:text-sm">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Judul Kegiatan</span>
                  <span className="sm:hidden">Judul</span>
                </Label>
                <Input
                  id="judul"
                  placeholder="Cari berdasarkan judul..."
                  value={localFilters.judul || ""}
                  onChange={(e) => handleInputChange("judul", e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            {/* Filter Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
              
              <div className="space-y-2 max-w-full">
                <Label htmlFor="namaPengusul" className="flex items-center gap-2 text-xs sm:text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Nama Pengusul</span>
                  <span className="sm:hidden">Pengusul</span>
                </Label>
                <Input
                  id="namaPengusul"
                  placeholder="Nama pengusul..."
                  value={localFilters.namaPengusul || ""}
                  onChange={(e) => handleInputChange("namaPengusul", e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="status" className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Status</span>
                </Label>
                <Select
                  value={localFilters.status || "all"}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="sortBy" className="flex items-center gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Urutkan</span>
                  <span className="sm:hidden">Sort</span>
                </Label>
                <Select
                  value={localFilters.sortBy || "createdAt"}
                  onValueChange={(value) => handleInputChange("sortBy", value)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Pilih urutan" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Filter Tanggal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggalMulaiFrom" className="text-xs sm:text-sm">Tanggal Mulai Dari</Label>
                  <Input
                    id="tanggalMulaiFrom"
                    type="date"
                    value={localFilters.tanggalMulaiFrom || ""}
                    onChange={(e) => handleInputChange("tanggalMulaiFrom", e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalMulaiTo" className="text-xs sm:text-sm">Tanggal Mulai Sampai</Label>
                  <Input
                    id="tanggalMulaiTo"
                    type="date"
                    value={localFilters.tanggalMulaiTo || ""}
                    onChange={(e) => handleInputChange("tanggalMulaiTo", e.target.value)}
                    className="w-full text-sm"
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
