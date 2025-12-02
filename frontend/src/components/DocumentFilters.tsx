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
import { X, Search, Filter, FileText, User, Calendar, Download } from "lucide-react";

interface DocumentFilterRequest {
  searchTerm?: string;
  title?: string;
  fileType?: string;
  author?: string;
  sortBy?: string;
  page: number;
  size: number;
}

// Document file types for filtering
const FILE_TYPE_OPTIONS = [
  { value: "all", label: "Semua Tipe File" },
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Word Document" },
  { value: "docx", label: "Word Document (DOCX)" },
  { value: "ppt", label: "PowerPoint" },
  { value: "pptx", label: "PowerPoint (PPTX)" },
  { value: "xls", label: "Excel" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "txt", label: "Text File" },
  { value: "csv", label: "CSV" },
  { value: "md", label: "Markdown" },
  { value: "zip", label: "ZIP Archive" },
  { value: "rar", label: "RAR Archive" },
  { value: "jpg", label: "JPEG Image" },
  { value: "png", label: "PNG Image" },
  { value: "gif", label: "GIF Image" }
];

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "title", label: "Judul A-Z" },
  { value: "mostDownloaded", label: "Paling Banyak Diunduh" }
];

interface DocumentFiltersProps {
  onFilterChange: (filters: DocumentFilterRequest) => void;
  currentFilters: DocumentFilterRequest;
}

export default function DocumentFilters({ onFilterChange, currentFilters }: DocumentFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DocumentFilterRequest>(currentFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (key: keyof DocumentFilterRequest, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === "" ? undefined : value,
      page: 0 // Reset page when filters change
    }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: DocumentFilterRequest = {
      page: 0,
      size: currentFilters.size,
      sortBy: "newest"
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.title) count++;
    if (localFilters.fileType && localFilters.fileType !== "all") count++;
    if (localFilters.author) count++;
    return count;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };  return (
    <div className="w-full max-w-full overflow-hidden space-y-4 force-mobile-layout">
      {/* Filter Toggle Button */}
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 max-w-full overflow-hidden">        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative px-2 xs:px-3 text-xs xs:text-sm max-w-full flex-shrink-0 mobile-filter-btn"
        >
          <Filter className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
          <span className="hidden sm:inline">Tampilkan Pencarian</span>
          <span className="sm:hidden">Pencarian</span>
          {getActiveFiltersCount() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 xs:-top-2 -right-1 xs:-right-2 h-4 w-4 xs:h-5 xs:w-5 p-0 flex items-center justify-center text-xs"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>{getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-800 px-2 xs:px-3 text-xs xs:text-sm mobile-filter-btn flex-shrink-0"
          ><X className="h-3 w-3 xs:h-3 xs:w-3 mr-1" />
            <span className="hidden sm:inline">Hapus Semua Filter</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-1 xs:gap-2 items-center max-w-full overflow-hidden">
          <span className="text-xs xs:text-sm text-gray-600 flex-shrink-0 mobile-text-sm">
            <span className="hidden sm:inline">Pencarian aktif:</span>
            <span className="sm:hidden">Active:</span>
          </span>
          
          {localFilters.searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs max-w-32 xs:max-w-xs mobile-text-sm">
              <Search className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Pencarian: "</span>
                <span className="sm:hidden">"</span>
                {localFilters.searchTerm.length > 15 ? 
                  `${localFilters.searchTerm.substring(0, 15)}...` : 
                  localFilters.searchTerm
                }"
              </span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                onClick={() => handleInputChange("searchTerm", "")}
              />
            </Badge>
          )}
          
          {localFilters.title && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs max-w-32 xs:max-w-xs mobile-text-sm">              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Judul: "</span>
                <span className="sm:hidden">"</span>
                {localFilters.title.length > 15 ? 
                  `${localFilters.title.substring(0, 15)}...` : 
                  localFilters.title
                }"
              </span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                onClick={() => handleInputChange("title", "")}
              />
            </Badge>
          )}
          
          {localFilters.fileType && localFilters.fileType !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs mobile-text-sm flex-shrink-0">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="hidden sm:inline">Tipe: </span>
              <span className="truncate max-w-16">
                {FILE_TYPE_OPTIONS.find(opt => opt.value === localFilters.fileType)?.label}
              </span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                onClick={() => handleInputChange("fileType", "all")}
              />
            </Badge>
          )}
            {localFilters.author && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs max-w-32 xs:max-w-xs mobile-text-sm">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Penulis: "</span>
                <span className="sm:hidden">"</span>
                {localFilters.author.length > 12 ? 
                  `${localFilters.author.substring(0, 12)}...` : 
                  localFilters.author
                }"
              </span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                onClick={() => handleInputChange("author", "")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}      {showFilters && (
        <Card className="max-w-full overflow-hidden mobile-card mobile-filter-form">
          <CardHeader className="pb-4 px-3 xs:px-6">
            <CardTitle className="text-base xs:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Pencarian Dokumen</span>
              <span className="sm:hidden">Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 xs:space-y-6 px-3 xs:px-6 max-w-full overflow-hidden mobile-filter-form">
            
            {/* Search Filters Row */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-4 max-w-full mobile-grid">
              <div className="space-y-2 max-w-full">
                <Label htmlFor="searchTerm" className="flex items-center gap-2 text-xs xs:text-sm">
                  <Search className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Pencarian Umum</span>
                  <span className="xs:hidden">Cari</span>
                </Label>
                <Input
                  id="searchTerm"
                  placeholder="Cari dalam judul..."
                  value={localFilters.searchTerm || ""}
                  onChange={(e) => handleInputChange("searchTerm", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="title" className="flex items-center gap-2 text-xs xs:text-sm">
                  <FileText className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Judul Dokumen</span>
                  <span className="xs:hidden">Judul</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Cari berdasarkan judul..."
                  value={localFilters.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-sm"
                />
              </div>
            </div>            {/* Filter Options Row */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
              
              <div className="space-y-2 max-w-full">
                <Label htmlFor="fileType" className="flex items-center gap-2 text-xs xs:text-sm">
                  <FileText className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Tipe File</span>
                  <span className="xs:hidden">Tipe</span>
                </Label>
                <Select
                  value={localFilters.fileType || "all"}
                  onValueChange={(value) => handleInputChange("fileType", value)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Pilih tipe file" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="author" className="flex items-center gap-2 text-xs xs:text-sm">
                  <User className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Penulis</span>
                  <span className="xs:hidden">Author</span>
                </Label>
                <Input
                  id="author"
                  placeholder="Nama penulis..."
                  value={localFilters.author || ""}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2 max-w-full">
                <Label htmlFor="sortBy" className="flex items-center gap-2 text-xs xs:text-sm">
                  <Calendar className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Urutkan</span>
                  <span className="xs:hidden">Sort</span>
                </Label>                <Select
                  value={localFilters.sortBy || "newest"}
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
            </div>            <Separator />
            
            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 max-w-full">
              <Button variant="outline" onClick={clearFilters} className="w-full xs:w-auto px-3 xs:px-4 text-sm">
                <X className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Reset Pencarian</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              
              <div className="flex gap-2 w-full xs:w-auto">
                <Button variant="outline" onClick={() => setShowFilters(false)} className="flex-1 xs:flex-none px-3 xs:px-4 text-sm">
                  <span className="hidden xs:inline">Tutup</span>
                  <span className="xs:hidden">Close</span>
                </Button>
                <Button onClick={applyFilters} className="flex-1 xs:flex-none px-3 xs:px-4 text-sm">
                  <Search className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Terapkan Pencarian</span>
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
