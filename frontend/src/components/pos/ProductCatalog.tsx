'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import CatalogAdvancedFilter from "@/components/CatalogAdvancedFilter";
import { Barang, Kategori, CatalogFilters, Pagination } from './types';
import './pos-styles.css';

interface ProductCatalogProps {
  barangs: Barang[];
  kategoris: Kategori[];
  catalogFilters: CatalogFilters;
  catalogPagination: Pagination;
  selectedQuantities: { [key: number]: number };
  isLoadingData: boolean;
  onFiltersChange: (filters: CatalogFilters) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onAddToCart: (barang: Barang, event?: React.MouseEvent) => void;
  onUpdateQuantity: (barangId: number, quantity: number) => void;
  onHistoryClick?: () => void;
  isCartOpen?: boolean;
}

export function ProductCatalog({
  barangs,
  kategoris,
  catalogFilters,
  catalogPagination,
  selectedQuantities,
  isLoadingData,
  onFiltersChange,
  onSearch,
  onPageChange,
  onAddToCart,
  onUpdateQuantity,
  onHistoryClick,
  isCartOpen = false
}: ProductCatalogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const getGridClasses = (columns: number) => {
    const baseClasses = "grid gap-2 sm:gap-4";
    switch (columns) {
      case 1: return `${baseClasses} grid-cols-1 max-w-md mx-auto`;
      case 2: return `${baseClasses} grid-cols-2`;
      case 3: return `${baseClasses} grid-cols-2 md:grid-cols-3`;
      case 4: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
      case 5: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`;
      default: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
    }
  };

  return (
    <div className={`transition-all duration-300 ${
      isCartOpen 
        ? 'mr-0 sm:mr-80 lg:mr-96' // Reduced cart space
        : 'mr-0'
    }`}>
      {/* Product Grid Container with Scroll */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto pr-2 product-scroll">
        
        {/* Inline Advanced Filter - Scrolls with content */}
        <div className="mb-6">
          <CatalogAdvancedFilter
            filters={catalogFilters}
            onFiltersChange={onFiltersChange}
            onSearch={onSearch}
            kategoris={kategoris}
            isLoading={catalogPagination.loading}
            totalItems={catalogPagination.totalElements}
            onHistoryClick={onHistoryClick}
          />
        </div>

      {/* Product Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className={getGridClasses(catalogFilters.gridColumns)}>
          {barangs.map((barang) => (
            <Card key={barang.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
              <div className="relative group">
                <div className="w-full aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
                  <img
                    src={barang.gambar || '/api/placeholder/300/200'}
                    alt={barang.nama}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-md z-10">
                  Stok: {barang.stock}
                </Badge>
                {barang.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg z-10">
                    <span className="text-white font-semibold">Habis</span>
                  </div>
                )}
              </div>
              <CardContent className="p-2 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">{barang.nama}</h3>
                <p className="text-xs text-gray-600 mb-2">{barang.kategori.nama}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(barang.harga)}
                    </span>
                    <span className="text-sm text-blue-600">
                      +{barang.poin} poin
                    </span>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onUpdateQuantity(barang.id, (selectedQuantities[barang.id] || 1) - 1)}
                        disabled={barang.stock === 0 || (selectedQuantities[barang.id] || 1) <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max={barang.stock}
                        value={selectedQuantities[barang.id] || 1}
                        onChange={(e) => onUpdateQuantity(barang.id, parseInt(e.target.value) || 1)}
                        className="h-8 w-12 text-center border-0 focus-visible:ring-0"
                        disabled={barang.stock === 0}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onUpdateQuantity(barang.id, (selectedQuantities[barang.id] || 1) + 1)}
                        disabled={barang.stock === 0 || (selectedQuantities[barang.id] || 1) >= barang.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      onClick={(e) => onAddToCart(barang, e)}
                      disabled={barang.stock === 0}
                      className="h-8 text-xs px-3 bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                    >
                      + Keranjang
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {barangs.length === 0 && !isLoadingData && (
            <div className="col-span-full text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Tidak ada barang yang ditemukan</p>
              <p className="text-sm text-gray-400 mt-2">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          )}
        </div>
      )}

        {/* Pagination */}
        {catalogPagination.totalPages > 1 && (
          <div className="flex items-center justify-center mt-6 pt-4 border-t">
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(catalogPagination.page - 1)}
                disabled={catalogPagination.page === 0 || catalogPagination.loading}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              {(() => {
                const currentPage = catalogPagination.page;
                const totalPages = catalogPagination.totalPages;
                const pages = [];
                
                // Calculate range of pages to show (5 pages total)
                let startPageCalc = Math.max(0, currentPage - 2);
                const endPageCalc = Math.min(totalPages - 1, startPageCalc + 4);
                
                // Adjust if we're near the end
                if (endPageCalc - startPageCalc < 4) {
                  startPageCalc = Math.max(0, endPageCalc - 4);
                }
                
                const startPage = startPageCalc;
                const endPage = endPageCalc;
                
                // Add first page if not in range
                if (startPage > 0) {
                  pages.push(
                    <Button
                      key={0}
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(0)}
                      className="h-9 w-9 p-0"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 1) {
                    pages.push(
                      <span key="start-ellipsis" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                }
                
                // Add page range
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={i === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(i)}
                      disabled={catalogPagination.loading}
                      className={`h-9 w-9 p-0 ${
                        i === currentPage
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : ''
                      }`}
                    >
                      {i + 1}
                    </Button>
                  );
                }
                
                // Add last page if not in range
                if (endPage < totalPages - 1) {
                  if (endPage < totalPages - 2) {
                    pages.push(
                      <span key="end-ellipsis" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={totalPages - 1}
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(totalPages - 1)}
                      className="h-9 w-9 p-0"
                    >
                      {totalPages}
                    </Button>
                  );
                }
                
                return pages;
              })()}
              
              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(catalogPagination.page + 1)}
                disabled={catalogPagination.page >= catalogPagination.totalPages - 1 || catalogPagination.loading}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
