"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  Filter,
  Calendar,
  GraduationCap
} from "lucide-react";
import { PostFilters as PostFiltersType } from "@/types/komunikasi";

interface PostFiltersProps {
  filters: PostFiltersType;
  onFiltersChange: (filters: PostFiltersType) => void;
}

export default function PostFilters({ filters, onFiltersChange }: PostFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PostFiltersType>(filters);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchKeyword);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localFilters.searchKeyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [localFilters.searchKeyword]);

  // Apply filters when debounced search changes
  useEffect(() => {
    onFiltersChange({
      ...localFilters,
      searchKeyword: debouncedSearch
    });
  }, [debouncedSearch, localFilters.jurusan, localFilters.alumniTahun, onFiltersChange]);

  const handleFilterChange = (key: keyof PostFiltersType, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: keyof PostFiltersType) => {
    handleFilterChange(key, "");
  };

  const clearAllFilters = () => {
    const emptyFilters: PostFiltersType = {
      jurusan: "",
      alumniTahun: "",
      searchKeyword: ""
    };
    setLocalFilters(emptyFilters);
    setDebouncedSearch("");
  };

  const hasActiveFilters = localFilters.jurusan || localFilters.alumniTahun || localFilters.searchKeyword;

  // Sample data - replace with actual data from your API
  const jurusanOptions = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Teknik Komputer",
    "Manajemen Informatika",
    "Teknik Elektro",
    "Teknik Mesin",
    "Teknik Sipil",
    "Akuntansi",
    "Manajemen",
    "Ekonomi Pembangunan"
  ];

  const currentYear = new Date().getFullYear();
  const alumniYearOptions = Array.from(
    { length: currentYear - 1990 + 1 }, 
    (_, index) => (currentYear - index).toString()
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari post, nama member, atau konten..."
          value={localFilters.searchKeyword}
          onChange={(e) => handleFilterChange("searchKeyword", e.target.value)}
          className="pl-10 pr-10"
        />
        {localFilters.searchKeyword && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter("searchKeyword")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Jurusan Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <GraduationCap className="h-4 w-4 mr-1" />
            Jurusan
          </Label>
          <Select
            value={localFilters.jurusan}
            onValueChange={(value) => handleFilterChange("jurusan", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Jurusan</SelectItem>
              {jurusanOptions.map((jurusan) => (
                <SelectItem key={jurusan} value={jurusan}>
                  {jurusan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alumni Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Tahun Alumni
          </Label>
          <Select
            value={localFilters.alumniTahun}
            onValueChange={(value) => handleFilterChange("alumniTahun", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Tahun</SelectItem>
              {alumniYearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            Action
          </Label>
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Hapus Semua Filter
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Filter aktif:</span>
          
          {localFilters.searchKeyword && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              "{localFilters.searchKeyword}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("searchKeyword")}
                className="h-3 w-3 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {localFilters.jurusan && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {localFilters.jurusan}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("jurusan")}
                className="h-3 w-3 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {localFilters.alumniTahun && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {localFilters.alumniTahun}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("alumniTahun")}
                className="h-3 w-3 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Stats */}
      <div className="text-xs text-gray-500">
        {hasActiveFilters ? (
          <span>Menampilkan hasil yang difilter</span>
        ) : (
          <span>Menampilkan semua post</span>
        )}
      </div>
    </div>
  );
}
