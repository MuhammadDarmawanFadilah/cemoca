'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, DollarSign, Package, Users, Eye, ChevronLeft, ChevronRight, History, Printer, Edit, CheckCircle, XCircle } from 'lucide-react';
import HistoryAdvancedFilter from "@/components/HistoryAdvancedFilter";
import { Pesanan, Kategori, Pagination } from './types';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pesanans: Pesanan[];
  kategoris: Kategori[];
  historyFilters: any;
  historyPagination: Pagination;
  onFiltersChange: (filters: any) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onViewDetail: (pesanan: Pesanan) => void;
  onUpdateStatus: (pesananId: number, status: string) => void;
}

export function OrderHistoryModal({
  isOpen,
  onClose,
  pesanans,
  kategoris,
  historyFilters,
  historyPagination,
  onFiltersChange,
  onSearch,
  onPageChange,
  onViewDetail,
  onUpdateStatus
}: OrderHistoryModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Menunggu', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' };
      case 'PROCESSING':
        return { label: 'Diproses', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' };
      case 'COMPLETED':
        return { label: 'Selesai', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'Dibatalkan', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const handlePrintReceipt = (pesanan: Pesanan) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up diblokir! Silakan izinkan pop-up untuk mencetak struk.');
        return;
      }

      const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Struk Pembayaran - Koperasi Desa</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  color: #000;
                  background: white;
                  padding: 10px;
              }
              .receipt {
                  width: 300px;
                  margin: 0 auto;
                  background: white;
                  border: 1px solid #ddd;
                  padding: 15px;
              }
              .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
              }
              .title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  letter-spacing: 1px;
              }
              .subtitle {
                  font-size: 10px;
                  color: #666;
                  margin-bottom: 2px;
              }
              .info-section {
                  margin-bottom: 15px;
                  padding-bottom: 10px;
                  border-bottom: 1px dashed #999;
              }
              .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 3px;
                  font-size: 11px;
              }
              .items-header {
                  font-weight: bold;
                  border-bottom: 1px solid #999;
                  padding-bottom: 5px;
                  margin-bottom: 8px;
                  display: flex;
                  justify-content: space-between;
              }
              .item-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                  font-size: 11px;
              }
              .total-section {
                  border-top: 2px solid #000;
                  padding-top: 10px;
                  margin-top: 15px;
              }
              .total-row {
                  display: flex;
                  justify-content: space-between;
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 5px;
              }
              .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 1px dashed #999;
                  font-size: 9px;
                  color: #666;
              }
              @media print {
                  body { padding: 0; margin: 0; }
                  .receipt { width: 100%; border: none; margin: 0; }
              }
          </style>
      </head>
      <body>
          <div class="receipt">
              <div class="header">
                  <div class="title">KOPERASI DESA</div>
                  <div class="subtitle">Jl. Desa Sejahtera No. 123</div>
                  <div class="subtitle">Telp: (021) 1234-5678</div>
              </div>
              
              <div class="info-section">
                  <div class="info-row">
                      <span>No. Transaksi</span>
                      <span>#${pesanan.id}</span>
                  </div>
                  <div class="info-row">
                      <span>Tanggal</span>
                      <span>${formatDateTime(pesanan.tanggalPesanan)}</span>
                  </div>
                  <div class="info-row">
                      <span>Pembeli</span>
                      <span>${pesanan.member?.nama || 'Non-Member'}</span>
                  </div>
              </div>
              
              <div class="items-section">
                  <div class="items-header">
                      <span>ITEM</span>
                      <span>QTY</span>
                      <span>HARGA</span>
                  </div>
                  ${pesanan.details ? pesanan.details.map((detail: any) => `
                  <div class="item-row">
                      <span style="max-width: 150px; overflow: hidden;">${detail.barang?.nama || 'Produk'}</span>
                      <span>${detail.jumlah}</span>
                      <span>${formatCurrency(detail.subtotal)}</span>
                  </div>
                  `).join('') : ''}
              </div>
              
              <div class="total-section">
                  <div class="total-row">
                      <span>TOTAL PEMBAYARAN</span>
                      <span>${formatCurrency(pesanan.totalHarga)}</span>
                  </div>
                  ${pesanan.totalPoin ? `
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-bottom: 5px;">
                      <span>Poin Diperoleh</span>
                      <span>+${pesanan.totalPoin} poin</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="footer">
                  <div>Terima kasih atas kunjungan Anda!</div>
                  <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
                  <div style="margin-top: 10px; font-weight: bold;">
                      --- STRUK INI ADALAH BUKTI PEMBAYARAN YANG SAH ---
                  </div>
              </div>
          </div>
      </body>
      </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);

    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Gagal mencetak struk pembayaran');
    }
  };

  // Calculate statistics
  const totalPesananHariIni = pesanans.filter(p => 
    new Date(p.tanggalPesanan).toDateString() === new Date().toDateString()
  ).length;
  
  const totalPendapatan = pesanans
    .filter(p => p.status === 'COMPLETED')
    .reduce((total, p) => total + p.totalHarga, 0);
    
  const totalPending = pesanans.filter(p => p.status === 'PENDING').length;
  const totalMembers = new Set(pesanans.map(p => p.member?.id).filter(Boolean)).size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histori Pesanan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Advanced Filter */}
          <HistoryAdvancedFilter
            filters={historyFilters}
            onFiltersChange={onFiltersChange}
            onSearch={onSearch}
            kategoris={kategoris}
            isLoading={historyPagination.loading}
            totalItems={historyPagination.totalElements}
          />

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pesanan</CardTitle>
              <div className="text-sm text-gray-600">
                Menampilkan {historyPagination.totalElements} pesanan
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Tanggal</th>
                        <th className="text-left p-2">Member</th>
                        <th className="text-left p-2">Total</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesanans.map((pesanan) => (
                        <tr key={pesanan.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-mono">#{pesanan.id}</td>
                          <td className="p-2 text-sm">
                            {formatDateTime(pesanan.tanggalPesanan)}
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {pesanan.member?.nama || 'Non-Member'}
                              </div>
                              {pesanan.member?.email && (
                                <div className="text-sm text-gray-500">
                                  {pesanan.member.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-semibold">
                                {formatCurrency(pesanan.totalHarga)}
                              </div>
                              {pesanan.totalPoin > 0 && (
                                <div className="text-sm text-blue-600">
                                  +{pesanan.totalPoin} poin
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(pesanan.status).className}>
                              {getStatusBadge(pesanan.status).label}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetail(pesanan)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Status Update Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Update Status">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateStatus(pesanan.id, 'PROCESSING')}
                                    disabled={pesanan.status === 'PROCESSING' || pesanan.status === 'COMPLETED'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Diproses
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateStatus(pesanan.id, 'COMPLETED')}
                                    disabled={pesanan.status === 'COMPLETED'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Selesai
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateStatus(pesanan.id, 'CANCELLED')}
                                    disabled={pesanan.status === 'CANCELLED' || pesanan.status === 'COMPLETED'}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Batal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              {/* Print Receipt Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintReceipt(pesanan)}
                                title="Cetak Struk"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>

              {/* Pagination */}
              {historyPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-3 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {historyPagination.page * 10 + 1} to {Math.min((historyPagination.page + 1) * 10, historyPagination.totalElements)} of {historyPagination.totalElements} results
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(historyPagination.page - 1)}
                      disabled={historyPagination.page === 0 || historyPagination.loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-sm px-2">
                      {historyPagination.page + 1} / {historyPagination.totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(historyPagination.page + 1)}
                      disabled={historyPagination.page >= historyPagination.totalPages - 1 || historyPagination.loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}