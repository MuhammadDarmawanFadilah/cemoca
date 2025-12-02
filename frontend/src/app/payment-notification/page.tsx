'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, ArrowLeft, Home, CreditCard, AlertTriangle } from 'lucide-react';

interface PaymentStatus {
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  amount?: number;
  donorName?: string;
  paymentMethod?: string;
  timestamp?: string;
}

export default function PaymentNotificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get parameters from URL
    const status = searchParams.get('status') as 'success' | 'failed' | 'pending';
    const transactionId = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const donorName = searchParams.get('donor_name');
    const paymentMethod = searchParams.get('payment_method');
    
    if (status) {
      setPaymentStatus({
        status,
        transactionId: transactionId || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        donorName: donorName || undefined,
        paymentMethod: paymentMethod || undefined,
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          title: 'Pembayaran Berhasil!',
          description: 'Terima kasih atas donasi Anda. Pembayaran telah berhasil diproses.',
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
          iconColor: 'text-green-600 dark:text-green-400',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'failed':
        return {
          icon: XCircle,
          title: 'Pembayaran Gagal',
          description: 'Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi.',
          bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
          iconColor: 'text-red-600 dark:text-red-400',
          badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'pending':
        return {
          icon: Clock,
          title: 'Pembayaran Pending',
          description: 'Pembayaran Anda sedang diproses. Mohon tunggu konfirmasi lebih lanjut.',
          bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Status Tidak Diketahui',
          description: 'Status pembayaran tidak dapat ditentukan.',
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30',
          iconColor: 'text-gray-600 dark:text-gray-400',
          badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg bg-card dark:bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <AlertTriangle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Status Tidak Ditemukan</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Informasi status pembayaran tidak tersedia
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button 
              onClick={() => router.push('/dukung-pengembang')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Halaman Dukung Pengembang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = getStatusConfig(paymentStatus.status);
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-700 dark:via-purple-700 dark:to-blue-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Notifikasi Pembayaran</h1>
              <p className="text-blue-100 mt-1">Status transaksi donasi Anda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <div className="lg:col-span-2">
            <Card className={`${config.borderColor} ${config.bgColor} border-2 shadow-xl`}>
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                    <StatusIcon className={`h-12 w-12 ${config.iconColor}`} />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {config.title}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                  {config.description}
                </CardDescription>
                <div className="flex justify-center mt-4">
                  <Badge className={config.badgeColor}>
                    {paymentStatus.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              {(paymentStatus.transactionId || paymentStatus.amount || paymentStatus.donorName) && (
                <CardContent className="space-y-6">
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paymentStatus.transactionId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID Transaksi</label>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {paymentStatus.transactionId}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {paymentStatus.amount && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Jumlah Donasi</label>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(paymentStatus.amount)}
                        </div>
                      </div>
                    )}
                    
                    {paymentStatus.donorName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nama Donatur</label>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {paymentStatus.donorName}
                        </div>
                      </div>
                    )}
                    
                    {paymentStatus.paymentMethod && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Metode Pembayaran</label>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {paymentStatus.paymentMethod}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Waktu: {new Date().toLocaleString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            <Card className="border shadow-lg bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Langkah Selanjutnya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentStatus.status === 'success' && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Donasi Anda telah berhasil diproses. Terima kasih atas kontribusi Anda!
                    </p>
                    <Button 
                      onClick={() => router.push('/dukung-pengembang')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Lihat Dukung Pengembang
                    </Button>
                  </>
                )}
                
                {paymentStatus.status === 'failed' && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Jangan khawatir, Anda dapat mencoba melakukan donasi kembali.
                    </p>
                    <Button 
                      onClick={() => router.push('/donasi')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Coba Donasi Lagi
                    </Button>
                  </>
                )}
                
                {paymentStatus.status === 'pending' && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pembayaran sedang diproses. Kami akan mengirim notifikasi setelah konfirmasi.
                    </p>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="w-full"
                    >
                      Refresh Status
                    </Button>
                  </>
                )}
                
                <Separator />
                
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Dashboard
                </Button>
              </CardContent>
            </Card>
            
            {/* Support Info */}
            <Card className="border shadow-lg bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Butuh Bantuan?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium mb-2">Hubungi Tim Support:</p>
                  <p>📧 muhammaddarmawanfadillah@gmail.com</p>
                  <p>📱 085600121760</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tim support kami siap membantu 24/7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}