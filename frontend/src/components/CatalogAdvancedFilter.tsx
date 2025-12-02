import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  RotateCcw,
  Grid3X3,
  Grid2X2,
  BarChart3,
  DollarSign,
  Clock,
  TrendingUp,
  History
} from 'lucide-react';

interface CatalogFilters {
  searchTerm: string;
  kategoriId: number | null;
  sortBy: string;
  sortDir: string;
  pageSize: number;
  gridColumns: number;
  minHarga: number | null;
  maxHarga: number | null;
}

interface CatalogFilterProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  onSearch: () => void;
  kategoris: Array<{id: number, nama: string}>;
  isLoading?: boolean;
  totalItems?: number;
  onHistoryClick?: () => void;
}

const CatalogAdvancedFilter: React.FC<CatalogFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  kategoris,
  isLoading = false,
  totalItems = 0,
  onHistoryClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  const handleFilterChange = (key: keyof CatalogFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    onFiltersChange({ ...filters, searchTerm: searchInput });
    onSearch();
  };

  const handleReset = () => {
    setSearchInput('');
    const resetFilters = {
      searchTerm: '',
      kategoriId: null,
      sortBy: 'id',
      sortDir: 'desc',
      pageSize: 10,
      gridColumns: 4,
      minHarga: null,
      maxHarga: null
    };
    onFiltersChange(resetFilters);
    onSearch();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.kategoriId) count++;
    if (filters.minHarga || filters.maxHarga) count++;
    if (filters.sortBy !== 'id') count++;
    return count;
  };

  const getSortLabel = (sortBy: string) => {
    switch (sortBy) {
      case 'nama': return 'Nama A-Z';
      case 'harga': return filters.sortDir === 'asc' ? 'Termurah' : 'Termahal';
      case 'createdAt': return filters.sortDir === 'desc' ? 'Terbaru' : 'Terlama';
      case 'stock': return 'Terpopuler';
      default: return 'Default';
    }
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Compact Header */}
      <CardHeader className="pb-4 space-y-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Katalog Produk
                </CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {totalItems} produk tersedia
                </p>
              </div>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="default" className="bg-indigo-600 text-white">
                {getActiveFiltersCount()} filter
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Select 
              value={filters.kategoriId?.toString() || 'all'} 
              onValueChange={(value) => handleFilterChange('kategoriId', value === 'all' ? null : Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-48 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoris.map((kategori) => (
                  <SelectItem key={kategori.id} value={kategori.id.toString()}>
                    {kategori.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {onHistoryClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onHistoryClick}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Histori
              </Button>
            )}

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="gap-2 text-slate-600 dark:text-slate-400"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Quick Search - Always Visible */}
        <div className="flex gap-3 pt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama barang, merek, atau deskripsi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 border-slate-300 dark:border-slate-600"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Mencari...' : 'Cari'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Advanced Filters - Collapsible */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              
              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Urutkan
                </Label>
                <Select 
                  value={
                    filters.sortBy === 'harga' && filters.sortDir === 'asc' ? 'harga_asc' :
                    filters.sortBy === 'harga' && filters.sortDir === 'desc' ? 'harga_desc' :
                    filters.sortBy === 'createdAt' && filters.sortDir === 'desc' ? 'createdAt_desc' :
                    filters.sortBy === 'createdAt' && filters.sortDir === 'asc' ? 'createdAt_asc' :
                    filters.sortBy === 'stock' ? 'popularity' :
                    filters.sortBy
                  } 
                  onValueChange={(value) => {
                    if (value === 'harga_asc') {
                      onFiltersChange({ ...filters, sortBy: 'harga', sortDir: 'asc' });
                    } else if (value === 'harga_desc') {
                      onFiltersChange({ ...filters, sortBy: 'harga', sortDir: 'desc' });
                    } else if (value === 'createdAt_desc') {
                      onFiltersChange({ ...filters, sortBy: 'createdAt', sortDir: 'desc' });
                    } else if (value === 'createdAt_asc') {
                      onFiltersChange({ ...filters, sortBy: 'createdAt', sortDir: 'asc' });
                    } else if (value === 'popularity') {
                      onFiltersChange({ ...filters, sortBy: 'stock', sortDir: 'asc' });
                    } else {
                      onFiltersChange({ ...filters, sortBy: value, sortDir: 'asc' });
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Default</SelectItem>
                    <SelectItem value="nama">Nama A-Z</SelectItem>
                    <SelectItem value="harga_asc">Termurah</SelectItem>
                    <SelectItem value="harga_desc">Termahal</SelectItem>
                    <SelectItem value="createdAt_desc">Terbaru</SelectItem>
                    <SelectItem value="createdAt_asc">Terlama</SelectItem>
                    <SelectItem value="popularity">Terpopuler</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Rentang Harga
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minHarga || ''}
                    onChange={(e) => handleFilterChange('minHarga', e.target.value ? Number(e.target.value) : null)}
                    className="text-sm border-slate-300 dark:border-slate-600"
                    disabled={isLoading}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxHarga || ''}
                    onChange={(e) => handleFilterChange('maxHarga', e.target.value ? Number(e.target.value) : null)}
                    className="text-sm border-slate-300 dark:border-slate-600"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Items per Page */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Item per Halaman
                </Label>
                <Select 
                  value={filters.pageSize.toString()} 
                  onValueChange={(value) => handleFilterChange('pageSize', Number(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid Layout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-orange-500" />
                  Layout Grid
                </Label>
                <Select 
                  value={filters.gridColumns.toString()} 
                  onValueChange={(value) => handleFilterChange('gridColumns', Number(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 kolom</SelectItem>
                    <SelectItem value="2">2 kolom</SelectItem>
                    <SelectItem value="3">3 kolom</SelectItem>
                    <SelectItem value="4">4 kolom</SelectItem>
                    <SelectItem value="5">5 kolom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Filter aktif:</span>
                
                {filters.searchTerm && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 gap-1">
                    Pencarian: "{filters.searchTerm}"
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-indigo-900" 
                      onClick={() => {
                        setSearchInput('');
                        handleFilterChange('searchTerm', '');
                      }}
                    />
                  </Badge>
                )}
                
                {filters.kategoriId && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 gap-1">
                    Kategori: {kategoris.find(k => k.id === filters.kategoriId)?.nama}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-indigo-900" 
                      onClick={() => handleFilterChange('kategoriId', null)}
                    />
                  </Badge>
                )}
                
                {(filters.minHarga || filters.maxHarga) && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 gap-1">
                    Harga: {filters.minHarga ? `Rp ${filters.minHarga.toLocaleString()}` : '0'} - {filters.maxHarga ? `Rp ${filters.maxHarga.toLocaleString()}` : '∞'}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-indigo-900" 
                      onClick={() => {
                        handleFilterChange('minHarga', null);
                        handleFilterChange('maxHarga', null);
                      }}
                    />
                  </Badge>
                )}
                
                {filters.sortBy !== 'id' && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 gap-1">
                    Urutan: {getSortLabel(filters.sortBy)}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-indigo-900" 
                      onClick={() => {
                        handleFilterChange('sortBy', 'id');
                        handleFilterChange('sortDir', 'desc');
                      }}
                    />
                  </Badge>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

CatalogAdvancedFilter.displayName = 'CatalogAdvancedFilter';

export default CatalogAdvancedFilter;