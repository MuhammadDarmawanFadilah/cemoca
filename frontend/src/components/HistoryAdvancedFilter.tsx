import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Search, Filter, X, RotateCcw, Calendar, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HistoryFilters {
  memberName: string;
  status: string;
  barangName: string;
  kategori: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortDir: string;
  pageSize: number;
}

interface HistoryFilterProps {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  onSearch?: () => void;
  kategoris?: Array<{id: number, nama: string}>;
  isLoading?: boolean;
  totalItems?: number;
}

const HistoryAdvancedFilter: React.FC<HistoryFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  kategoris = [],
  isLoading = false,
  totalItems = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInputs, setSearchInputs] = useState({
    memberName: filters.memberName,
    barangName: filters.barangName
  });

  const handleFilterChange = (key: keyof HistoryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    
    // Auto-search for dropdown filters (non-manual search fields)
    if (key !== 'memberName' && key !== 'barangName' && onSearch) {
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        onSearch();
      }, 0);
    }
  };

  const handleManualSearch = () => {
    const newFilters = { 
      ...filters, 
      memberName: searchInputs.memberName,
      barangName: searchInputs.barangName
    };
    onFiltersChange(newFilters);
    // Trigger immediate search if callback provided
    if (onSearch) {
      onSearch();
    }
  };

  const resetFilters = () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const defaultFilters: HistoryFilters = {
      memberName: '',
      status: 'ALL',
      barangName: '',
      kategori: 'ALL',
      startDate,
      endDate,
      sortBy: 'tanggalPesanan',
      sortDir: 'desc',
      pageSize: 10
    };
    
    setSearchInputs({ memberName: '', barangName: '' });
    onFiltersChange(defaultFilters);
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const newFilters = { ...filters, startDate, endDate };
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.memberName) count++;
    if (filters.status && filters.status !== 'ALL') count++;
    if (filters.barangName) count++;
    if (filters.kategori && filters.kategori !== 'ALL') count++;
    if (filters.sortBy !== 'tanggalPesanan') count++;
    return count;
  };

  const statusOptions = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'PROCESSING', label: 'Diproses' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' }
  ];

  const sortOptions = [
    { value: 'tanggalPesanan', label: 'Tanggal Pesanan' },
    { value: 'totalHarga', label: 'Total Harga' },
    { value: 'status', label: 'Status' },
    { value: 'member.nama', label: 'Nama Member' }
  ];

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Compact Header with Search */}
      <CardHeader className="pb-4 space-y-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Filter className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Riwayat Pesanan
                </CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {totalItems} transaksi ditemukan
                </p>
              </div>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="default" className="bg-emerald-600 text-white">
                {getActiveFiltersCount()} filter
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(1)}
                className="rounded-none border-r border-slate-200 dark:border-slate-700 px-3 h-8 text-xs"
              >
                Hari Ini
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(7)}
                className="rounded-none border-r border-slate-200 dark:border-slate-700 px-3 h-8 text-xs"
              >
                7 Hari
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(30)}
                className="rounded-none px-3 h-8 text-xs"
              >
                30 Hari
              </Button>
            </div>

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
              onClick={resetFilters}
              className="gap-2 text-slate-600 dark:text-slate-400"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Quick Search - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama member..."
              value={searchInputs.memberName}
              onChange={(e) => setSearchInputs(prev => ({ ...prev, memberName: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              className="pl-10 border-slate-300 dark:border-slate-600"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama barang..."
              value={searchInputs.barangName}
              onChange={(e) => setSearchInputs(prev => ({ ...prev, barangName: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              className="pl-10 border-slate-300 dark:border-slate-600"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Advanced Filters - Collapsible */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Status Pesanan
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-500" />
                  Kategori
                </Label>
                <Select
                  value={filters.kategori}
                  onValueChange={(value) => handleFilterChange('kategori', value)}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                    {kategoris.map((kategori) => (
                      <SelectItem key={kategori.id} value={kategori.nama}>
                        {kategori.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Dari Tanggal
                </Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="border-slate-300 dark:border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Sampai Tanggal
                </Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="border-slate-300 dark:border-slate-600"
                />
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Urutkan
                </Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Arah Urutan</Label>
                <Select
                  value={filters.sortDir}
                  onValueChange={(value) => handleFilterChange('sortDir', value)}
                >
                  <SelectTrigger className="border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Terbaru ke Terlama</SelectItem>
                    <SelectItem value="asc">Terlama ke Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Items per halaman</Label>
                <Select
                  value={filters.pageSize.toString()}
                  onValueChange={(value) => handleFilterChange('pageSize', parseInt(value))}
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

              <div className="flex items-end">
                <Button 
                  onClick={handleManualSearch} 
                  disabled={isLoading} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? 'Memuat...' : 'Terapkan Filter'}
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Filter aktif:</span>
                
                {filters.memberName && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
                    Member: {filters.memberName}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSearchInputs(prev => ({ ...prev, memberName: '' }));
                        handleFilterChange('memberName', '');
                      }}
                    />
                  </Badge>
                )}
                
                {filters.barangName && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
                    Barang: {filters.barangName}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSearchInputs(prev => ({ ...prev, barangName: '' }));
                        handleFilterChange('barangName', '');
                      }}
                    />
                  </Badge>
                )}
                
                {filters.kategori && filters.kategori !== 'ALL' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
                    Kategori: {filters.kategori}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('kategori', 'ALL')}
                    />
                  </Badge>
                )}
                
                {filters.status && filters.status !== 'ALL' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('status', 'ALL')}
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

export default HistoryAdvancedFilter;
