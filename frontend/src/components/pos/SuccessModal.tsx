'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Printer, History, Receipt } from 'lucide-react';
import { Pesanan } from './types';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Pesanan | null;
  onPrintReceipt: () => void;
  onViewHistory: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  transaction,
  onPrintReceipt,
  onViewHistory
}: SuccessModalProps) {
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

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-3 text-green-600 text-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            Pembayaran Berhasil!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Terima kasih sudah berbelanja di koperasi kami
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="space-y-6">
            {/* Transaction Info */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">No. Transaksi:</span>
                  <div className="font-semibold">#{transaction.id}</div>
                </div>
                <div>
                  <span className="text-gray-600">Tanggal:</span>
                  <div className="font-medium">{formatDateTime(transaction.tanggalPesanan)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Kasir:</span>
                  <div className="font-medium">
                    {typeof transaction.karyawan === 'string' 
                      ? transaction.karyawan 
                      : (transaction.karyawan.fullName || transaction.karyawan.username)
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Pembeli:</span>
                  <div className="font-medium">{transaction.member?.nama || 'Non-Member'}</div>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Ringkasan Pembelian
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transaction.details.map((detail) => (
                  <div key={detail.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                    <div className="flex-1">
                      <div className="font-medium">{detail.barang?.nama || 'Produk'}</div>
                      <div className="text-gray-500">
                        {formatCurrency(detail.hargaSatuan)} x {detail.jumlah}
                      </div>
                    </div>
                    <div className="font-semibold text-right">
                      {formatCurrency(detail.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Item:</span>
                <span>{transaction.details.reduce((sum, d) => sum + d.jumlah, 0)} barang</span>
              </div>
              {transaction.totalPoin > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Poin Diperoleh:</span>
                  <Badge variant="secondary" className="text-blue-600">
                    +{transaction.totalPoin} poin
                  </Badge>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Pembayaran:</span>
                <span className="text-green-600">{formatCurrency(transaction.totalHarga)}</span>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onPrintReceipt}
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak Struk
          </Button>
          <Button
            onClick={() => {
              onViewHistory();
              onClose();
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <History className="h-4 w-4 mr-2" />
            Lihat Histori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
