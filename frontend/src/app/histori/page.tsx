'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, DollarSign, Package, Users, Eye, Printer, Edit, CheckCircle, XCircle } from 'lucide-react';
import HistoryAdvancedFilter from "@/components/HistoryAdvancedFilter";
import { pesananService } from '@/services/pesananService';
import { KategoriService } from '@/services/barangService';
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/lib/config';

interface Kategori {
  id: number;
  nama: string;
}

interface Member {
  id: number;
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
}

interface Barang {
  id: number;
  nama: string;
  harga: number;
  poin: number;
  kategori: Kategori;
}

interface DetailPesanan {
  id: number;
  barang: Barang;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

interface Pesanan {
  id: number;
  member: Member;
  karyawan: string | { id: number; username: string; fullName?: string };
  totalHarga: number;
  totalPoin: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  tanggalPesanan: string;
  details: DetailPesanan[];
}

export default function HistoriPage() {
  const [pesanans, setPesanans] = useState<Pesanan[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [selectedPesanan, setSelectedPesanan] = useState<Pesanan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const [historyFilters, setHistoryFilters] = useState(() => {
    const { startDate, endDate } = getDefaultDateRange();
    return {
      memberName: '',
      status: 'ALL',
      barangName: '',
      kategori: 'ALL',
      startDate,
      endDate,
      sortBy: 'tanggalPesanan',
      sortDir: 'desc',
      pageSize: 20
    };
  });

  const [historyPagination, setHistoryPagination] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadHistoryData();
  }, [historyFilters, historyPagination.page]);

  const loadData = async () => {
    try {
      const kategoriData = await KategoriService.getAllKategori();
      setKategoris(kategoriData);
      await loadHistoryData();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      setHistoryPagination(prev => ({ ...prev, loading: true }));
      
      const response = await pesananService.searchPesananPaginated({
        page: historyPagination.page,
        size: historyFilters.pageSize,
        memberName: historyFilters.memberName || undefined,
        status: historyFilters.status === 'ALL' ? undefined : historyFilters.status || undefined,
        barangName: historyFilters.barangName || undefined,
        kategori: historyFilters.kategori === 'ALL' ? undefined : historyFilters.kategori || undefined,
        startDate: historyFilters.startDate || undefined,
        endDate: historyFilters.endDate || undefined,
        sortBy: historyFilters.sortBy,
        sortDir: historyFilters.sortDir
      });
      
      const frontendPesanans = response.content.map((p: any) => ({
        ...p,
        karyawan: typeof p.karyawan === 'string' ? p.karyawan : p.karyawan.username
      }));
      setPesanans(frontendPesanans as any);
      
      setHistoryPagination({
        page: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading history data:', error);
      setHistoryPagination(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Gagal memuat data histori",
        variant: "destructive"
      });
    }
  };

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
        return { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800' };
      case 'PROCESSING':
        return { label: 'Diproses', className: 'bg-blue-100 text-blue-800' };
      case 'COMPLETED':
        return { label: 'Selesai', className: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
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

  const handleFiltersChange = (newFilters: typeof historyFilters) => {
    setHistoryFilters(newFilters);
    setHistoryPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setHistoryPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetail = (pesanan: Pesanan) => {
    setSelectedPesanan(pesanan);
    setIsDetailOpen(true);
  };

  const updatePesananStatus = async (pesananId: number, newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const response = await fetch(getApiUrl(`/api/pesanan/${pesananId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedPesanan = await response.json();

      // Update local state
      setPesanans(prev =>
        prev.map(pesanan =>
          pesanan.id === pesananId
            ? { ...pesanan, status: updatedPesanan.status }
            : pesanan
        )
      );

      toast({
        title: "Status Updated",
        description: "Status pesanan berhasil diperbarui",
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive"
      });
    }
  };

  const handlePrintReceipt = (pesanan: Pesanan) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Pop-up diblokir! Silakan izinkan pop-up untuk mencetak struk.",
          variant: "destructive"
        });
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
              .item-name {
                  flex: 1;
                  max-width: 150px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }
              .item-qty {
                  width: 30px;
                  text-align: center;
              }
              .item-price {
                  width: 80px;
                  text-align: right;
                  font-weight: bold;
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
              .points-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 10px;
                  color: #666;
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
              .footer-line {
                  margin-bottom: 5px;
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
                  <div class="subtitle">Email: info@koperasidesa.com</div>
              </div>
              
              <div class="info-section">
                  <div class="info-row">
                      <span>No. Transaksi</span>
                      <span>#${pesanan.id}</span>
                  </div>
                  <div class="info-row">
                      <span>Tanggal</span>
                      <span>${new Date(pesanan.tanggalPesanan).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                  </div>
                  <div class="info-row">
                      <span>Kasir</span>
                      <span>${typeof pesanan.karyawan === 'string' ? pesanan.karyawan : (pesanan.karyawan.fullName || pesanan.karyawan.username)}</span>
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
                  ${pesanan.details.map((detail: any) => `
                  <div class="item-row">
                      <span class="item-name">${detail.barang?.nama || 'Produk'}</span>
                      <span class="item-qty">${detail.jumlah}</span>
                      <span class="item-price">${formatCurrency(detail.subtotal)}</span>
                  </div>
                  `).join('')}
              </div>
              
              <div class="total-section">
                  <div class="total-row">
                      <span>TOTAL PEMBAYARAN</span>
                      <span>${formatCurrency(pesanan.totalHarga)}</span>
                  </div>
                  ${pesanan.totalPoin ? `
                  <div class="points-row">
                      <span>Poin Diperoleh</span>
                      <span>+${pesanan.totalPoin} poin</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="footer">
                  <div class="footer-line">Terima kasih atas kunjungan Anda!</div>
                  <div class="footer-line">Barang yang sudah dibeli tidak dapat dikembalikan</div>
                  <div class="footer-line" style="margin-top: 10px; font-weight: bold;">
                      --- STRUK INI ADALAH BUKTI PEMBAYARAN YANG SAH ---
                  </div>
                  <div class="footer-line" style="margin-top: 15px; font-size: 8px;">
                      Dicetak pada: ${new Date().toLocaleString('id-ID')}
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
        toast({
          title: "Berhasil",
          description: "Struk pembayaran telah dicetak",
        });
        printWindow.close();
      }, 100);

    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Error",
        description: "Gagal mencetak struk pembayaran",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Histori Pesanan</h1>
        <p className="text-gray-600 dark:text-gray-400">Lihat semua histori pesanan dan transaksi</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Pesanan Hari Ini</div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPesananHariIni}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Pendapatan</div>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendapatan)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Pending</div>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Members</div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter */}
      <HistoryAdvancedFilter
        filters={historyFilters}
        onFiltersChange={handleFiltersChange}
        onSearch={loadHistoryData}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pesanans.map((pesanan) => (
                  <tr key={pesanan.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 font-mono">#{pesanan.id}</td>
                    <td className="p-3 text-sm">
                      {formatDateTime(pesanan.tanggalPesanan)}
                    </td>
                    <td className="p-3">
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
                    <td className="p-3">
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
                    <td className="p-3">
                      <Badge className={getStatusBadge(pesanan.status).className}>
                        {getStatusBadge(pesanan.status).label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(pesanan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Status Update Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => updatePesananStatus(pesanan.id, 'PROCESSING')}
                              disabled={pesanan.status === 'PROCESSING' || pesanan.status === 'COMPLETED'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Diproses
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updatePesananStatus(pesanan.id, 'COMPLETED')}
                              disabled={pesanan.status === 'COMPLETED'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Selesai
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updatePesananStatus(pesanan.id, 'CANCELLED')}
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

          {/* Pagination */}
          {historyPagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-3 border-t">
              <div className="text-sm text-gray-700">
                Showing {historyPagination.page * historyFilters.pageSize + 1} to {Math.min((historyPagination.page + 1) * historyFilters.pageSize, historyPagination.totalElements)} of {historyPagination.totalElements} results
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(historyPagination.page - 1)}
                  disabled={historyPagination.page === 0 || historyPagination.loading}
                >
                  Previous
                </Button>
                
                <span className="text-sm px-2">
                  {historyPagination.page + 1} / {historyPagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(historyPagination.page + 1)}
                  disabled={historyPagination.page >= historyPagination.totalPages - 1 || historyPagination.loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Pesanan Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan #{selectedPesanan?.id}</DialogTitle>
            <DialogDescription>
              Informasi lengkap pesanan
            </DialogDescription>
          </DialogHeader>
          {selectedPesanan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Pesanan</label>
                  <p className="text-sm">{formatDateTime(selectedPesanan.tanggalPesanan)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusBadge(selectedPesanan.status).className}>
                      {getStatusBadge(selectedPesanan.status).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member</label>
                  <p className="text-sm">{selectedPesanan.member?.nama || 'Non-Member'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kasir</label>
                  <p className="text-sm">
                    {typeof selectedPesanan.karyawan === 'string' 
                      ? selectedPesanan.karyawan 
                      : (selectedPesanan.karyawan.fullName || selectedPesanan.karyawan.username)
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Detail Barang</label>
                <div className="mt-2 space-y-2">
                  {selectedPesanan.details.map((detail) => (
                    <div key={detail.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{detail.barang?.nama || 'Produk'}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(detail.hargaSatuan)} x {detail.jumlah}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(detail.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pembayaran:</span>
                  <span>{formatCurrency(selectedPesanan.totalHarga)}</span>
                </div>
                {selectedPesanan.totalPoin > 0 && (
                  <div className="flex justify-between items-center text-sm text-blue-600">
                    <span>Total Poin:</span>
                    <span>+{selectedPesanan.totalPoin} poin</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
            {selectedPesanan && (
              <Button
                onClick={() => {
                  handlePrintReceipt(selectedPesanan);
                  setIsDetailOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}