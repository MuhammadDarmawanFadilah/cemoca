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
import { X, Search, Filter, Grid, List } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface AdminFiltersProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  currentItems?: number;
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  onClearFilters?: () => void;
  activeFiltersCount?: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 100, 1000, 10000];

export default function AdminFilters({
  searchPlaceholder = "Cari...",
  searchValue = "",
  onSearchChange,
  filters = [],
  pageSize = 25,
  onPageSizeChange,
  totalItems = 0,
  currentItems = 0,
  viewMode = "table",
  onViewModeChange,
  onClearFilters,
  activeFiltersCount = 0,
}: AdminFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleClearAllFilters = () => {
    onClearFilters?.();
    setIsFiltersOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* View Mode and Page Size Controls */}
        <div className="flex items-center gap-4">
          {onViewModeChange && (
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("table")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Per page:
            </Label>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange?.(parseInt(value))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentItems} of {totalItems}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isFiltersOpen && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFiltersOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filters.map((filter, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium">{filter.label}</Label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.color && (
                              <div 
                                className={`w-2 h-2 rounded-full ${option.color}`}
                              />
                            )}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
