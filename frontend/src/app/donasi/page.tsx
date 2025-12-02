'use client';

import React, { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, CreditCard, CheckCircle, AlertCircle, Heart, Loader2, Link, MessageCircle, ExternalLink, Copy, RefreshCw, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DonationForm {
  name: string;
  isAnonymous: boolean;
  phoneNumber: string;
  amount: string;
  paymentMethod: 'direct' | 'link' | 'whatsapp';
}

interface MidtransConfig {
  clientKey: string;
  isProduction: boolean;
}

interface PaymentData {
  orderId: string;
  snapToken?: string;
  paymentUrl?: string;
  amount: number;
  paymentMethod: string;
  whatsappSent?: boolean;
}

export default function DonasiPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [midtransConfig, setMidtransConfig] = useState<MidtransConfig | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  
  const [form, setForm] = useState<DonationForm>({
    name: '',
    isAnonymous: false,
    phoneNumber: '',
    amount: '',
    paymentMethod: 'direct'
  });

  // Load Midtrans configuration and Snap script
  useEffect(() => {
    const loadMidtransConfig = async () => {
      try {
        const response = await fetch(`${config.baseUrl}/api/donations/midtrans-config`);
        const config = await response.json();
        
        if (config.success) {
          setMidtransConfig(config.data);
          
          // Load Midtrans Snap script
          const snapUrl = config.data.isProduction 
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
            
          const script = document.createElement('script');
          script.src = snapUrl;
          script.setAttribute('data-client-key', config.data.clientKey);
          script.onload = () => setSnapLoaded(true);
          script.onerror = () => {
            console.error('Failed to load Midtrans Snap script');
            setError('Gagal memuat sistem pembayaran');
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Failed to load Midtrans config:', error);
        setError('Gagal memuat konfigurasi pembayaran');
      }
    };
    
    loadMidtransConfig();
  }, []);

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Link berhasil disalin!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyalin link');
    }
  };

  // Phone number formatting is now handled by backend

  const verifyPayment = async () => {
    if (!paymentData?.orderId) return;
    
    setVerifyingPayment(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${config.baseUrl}/api/donations/verify-payment/${paymentData.orderId}`);
      const data = await response.json();
      
      if (data.success) {
        const status = data.status;
        setPaymentStatus(status);
        
        if (status === 'settlement' || status === 'capture') {
          // Pembayaran berhasil - pindah ke step 3
          setPaymentStatus('SUCCESS');
          setCurrentStep(3);
          setSuccess('Berhasil! Terima kasih sudah melakukan pembayaran.');
          setShowPaymentModal(false);
        } else if (status === 'pending') {
          // Pembayaran belum selesai
          setPaymentStatus('PENDING');
          setError('Pembayaran belum ditemukan. Silakan selesaikan pembayaran terlebih dahulu.');
        } else if (status === 'deny' || status === 'cancel' || status === 'expire' || status === 'failure') {
          // Pembayaran gagal - pindah ke step 3
          setPaymentStatus('FAILED');
          setCurrentStep(3);
          setError('Pembayaran gagal, silahkan coba lagi.');
          setShowPaymentModal(false);
        } else {
          // Status lainnya
          setPaymentStatus(status.toUpperCase());
          setError('Pembayaran belum ditemukan.');
        }
      } else {
        // Response tidak success - pembayaran belum ditemukan
        setError('Pembayaran belum ditemukan.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Pembayaran belum ditemukan.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setForm({ ...form, amount: value });
  };

  const validateForm = () => {
    if (!form.name.trim() && !form.isAnonymous) {
      setError('Nama harus diisi atau pilih opsi anonim');
      return false;
    }
    if (!form.phoneNumber.trim()) {
      setError('Nomor handphone harus diisi');
      return false;
    }
    if (!form.amount || parseInt(form.amount) < 10000) {
      setError('Jumlah donasi minimal Rp 10.000');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (validateForm()) {
      setCurrentStep(2);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.baseUrl}/api/donations/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.isAnonymous ? 'Anonim' : form.name,
          phoneNumber: form.phoneNumber,
          amount: parseInt(form.amount),
          paymentMethod: form.paymentMethod,
          isAnonymous: form.isAnonymous
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentData({
          orderId: data.orderId,
          snapToken: data.snapToken,
          paymentUrl: data.paymentUrl,
          amount: parseInt(form.amount),
          paymentMethod: form.paymentMethod,
          whatsappSent: data.whatsappSent
        });
        
        // Handle different payment methods
        if (form.paymentMethod === 'direct' && data.snapToken) {
          // Check if Snap is loaded for direct payment
          if (!snapLoaded || !midtransConfig) {
            setError('Sistem pembayaran belum siap. Silakan tunggu sebentar.');
            setLoading(false);
            return;
          }
          
          // Open Midtrans Snap popup for direct payment
          (window as any).snap.pay(data.snapToken, {
            onSuccess: function(result: any) {
              console.log('Payment success:', result);
              // Redirect to payment notification page
              window.location.href = `/payment-notification?status=success&transaction_id=${data.orderId}&amount=${form.amount}&donor_name=${encodeURIComponent(form.isAnonymous ? 'Anonim' : form.name)}&payment_method=Direct Payment`;
            },
            onPending: function(result: any) {
              console.log('Payment pending:', result);
              // Redirect to payment notification page
              window.location.href = `/payment-notification?status=pending&transaction_id=${data.orderId}&payment_method=Direct Payment`;
            },
            onError: function(result: any) {
              console.log('Payment error:', result);
              // Redirect to payment notification page
              window.location.href = `/payment-notification?status=failed&transaction_id=${data.orderId}&payment_method=Direct Payment`;
            },
            onClose: function() {
              console.log('Payment popup closed');
            }
          });
        } else if (form.paymentMethod === 'link' || form.paymentMethod === 'whatsapp') {
          // Show modal for both link and WhatsApp payment
          setShowPaymentModal(true);
          if (form.paymentMethod === 'whatsapp' && data.whatsappSent) {
            setSuccess('Link pembayaran telah dikirim ke WhatsApp Anda!');
          } else {
            setSuccess('Link pembayaran berhasil dibuat!');
          }
        }
      } else {
        throw new Error(data.message || data.error || 'Gagal membuat transaksi pembayaran');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Gagal memproses pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setForm({
      name: '',
      isAnonymous: false,
      phoneNumber: '',
      amount: '',
      paymentMethod: 'direct'
    });
    setPaymentData(null);
    setError('');
    setSuccess('');
    setShowPaymentModal(false);
    setPaymentStatus('');
  };

  // WhatsApp sending is now handled by backend
  // No need for frontend to handle WhatsApp logic

  const renderPaymentModal = () => {
    if (!showPaymentModal || !paymentData) return null;

    return (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {form.paymentMethod === 'link' ? (
                <><Link className="h-5 w-5 text-blue-600" /> Link Pembayaran</>
              ) : (
                <><MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp Pembayaran</>
              )}
            </DialogTitle>
            <DialogDescription>
              {form.paymentMethod === 'link' 
                ? 'Silakan gunakan link berikut untuk melakukan pembayaran'
                : 'Link pembayaran telah diproses untuk dikirim ke WhatsApp Anda'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Detail Pembayaran</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Jumlah:</span>
                  <span className="font-semibold">Rp {formatCurrency(form.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono text-xs">{paymentData.orderId}</span>
                </div>
              </div>
            </div>

            {paymentData.paymentUrl && (
              <div className="space-y-3">
                {/* Notifikasi Status Pembayaran */}
                {error && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Link Pembayaran:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                    {paymentData.paymentUrl}
                  </div>
                </div>
                
                {form.paymentMethod === 'link' ? (
                  <Button
                    onClick={() => copyToClipboard(paymentData.paymentUrl!)}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {paymentData.whatsappSent 
                          ? '✅ Link pembayaran telah dikirim ke WhatsApp Anda'
                          : '⚠️ Gagal mengirim ke WhatsApp, silakan copy link manual'
                        }
                      </span>
                    </div>
                    {!paymentData.whatsappSent && (
                      <Button
                        onClick={() => copyToClipboard(paymentData.paymentUrl!)}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={() => window.open(paymentData.paymentUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buka Link Pembayaran
                </Button>
                
                <Button
                  onClick={verifyPayment}
                  variant="outline"
                  className="w-full"
                  disabled={verifyingPayment}
                >
                  {verifyingPayment ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Verifikasi Pembayaran</>
                  )}
                </Button>
              </div>
            )}
            
            <div className="text-center">
              <Button
                onClick={() => {
                  setShowPaymentModal(false);
                  setCurrentStep(3);
                }}
                variant="ghost"
                className="text-sm"
              >
                Tutup dan Lanjutkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Informasi Donatur</CardTitle>
        <CardDescription className="text-center">
          Langkah 1 dari 3: Masukkan informasi Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama lengkap"
            disabled={form.isAnonymous}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={form.isAnonymous}
              onCheckedChange={(checked) => 
                setForm({ ...form, isAnonymous: checked as boolean, name: checked ? 'Anonim' : '' })
              }
            />
            <Label htmlFor="anonymous" className="text-sm text-gray-600">
              Sembunyikan nama (tampil sebagai Anonim)
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Handphone</Label>
          <Input
            id="phone"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Jumlah Donasi (IDR)</Label>
          <Input
            id="amount"
            value={formatCurrency(form.amount)}
            onChange={handleAmountChange}
            placeholder="0"
          />
          <p className="text-sm text-gray-600">Minimal donasi Rp 10.000</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Lanjut ke Pembayaran
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Pilih Metode Pembayaran</CardTitle>
        <CardDescription className="text-center">
          Langkah 2 dari 3: Pilih cara pembayaran yang Anda inginkan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Ringkasan Donasi</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Nama:</span>
              <span>{form.isAnonymous ? 'Anonim' : form.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Nomor HP:</span>
              <span>{form.phoneNumber}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Jumlah:</span>
              <span>Rp {formatCurrency(form.amount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">Metode Pembayaran</Label>
          <RadioGroup
            value={form.paymentMethod}
            onValueChange={(value) => setForm({ ...form, paymentMethod: value as 'direct' | 'link' | 'whatsapp' })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="direct" id="direct" />
              <div className="flex-1">
                <Label htmlFor="direct" className="flex items-center cursor-pointer">
                  <CreditCard className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold">Pembayaran Langsung</div>
                    <div className="text-sm text-gray-600">Bayar langsung dengan popup Midtrans (QRIS, Credit Card, Virtual Account, E-Wallet)</div>
                  </div>
                </Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="link" id="link" />
              <div className="flex-1">
                <Label htmlFor="link" className="flex items-center cursor-pointer">
                  <Link className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold">Link Pembayaran</div>
                    <div className="text-sm text-gray-600">Dapatkan link pembayaran yang bisa dibuka di browser</div>
                  </div>
                </Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="whatsapp" id="whatsapp" />
              <div className="flex-1">
                <Label htmlFor="whatsapp" className="flex items-center cursor-pointer">
                  <MessageCircle className="mr-3 h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold">WhatsApp</div>
                    <div className="text-sm text-gray-600">Link pembayaran akan dikirim ke nomor WhatsApp Anda</div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Memproses pembayaran...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {form.paymentMethod === 'direct' && (!snapLoaded || !midtransConfig) ? (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Memuat sistem pembayaran...</p>
              </div>
            ) : (
              <Button
                onClick={processPayment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={form.paymentMethod === 'direct' && (!snapLoaded || !midtransConfig)}
              >
                {form.paymentMethod === 'direct' && <CreditCard className="mr-2 h-5 w-5" />}
                {form.paymentMethod === 'link' && <Link className="mr-2 h-5 w-5" />}
                {form.paymentMethod === 'whatsapp' && <MessageCircle className="mr-2 h-5 w-5" />}
                
                {form.paymentMethod === 'direct' && `Bayar Langsung - Rp ${formatCurrency(form.amount)}`}
                {form.paymentMethod === 'link' && `Buat Link Pembayaran - Rp ${formatCurrency(form.amount)}`}
                {form.paymentMethod === 'whatsapp' && `Kirim ke WhatsApp - Rp ${formatCurrency(form.amount)}`}
              </Button>
            )}
            
            {form.paymentMethod === 'direct' && snapLoaded && midtransConfig && (
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Metode pembayaran yang tersedia:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">QRIS</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">Credit/Debit Card</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">Virtual Account</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">E-Wallet</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">Bank Transfer</span>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)} 
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => {
    const getStatusMessage = () => {
      // Prioritas: status pembayaran > metode pembayaran
      if (paymentStatus === 'SUCCESS') {
        return {
          title: 'Pembayaran Berhasil!',
          description: 'Terima kasih atas donasi Anda untuk Cemoca',
          icon: <CheckCircle className="h-24 w-24 mx-auto mb-6 text-green-500" />,
          color: 'text-green-600'
        };
      } else if (paymentStatus === 'FAILED') {
        return {
          title: 'Pembayaran Gagal!',
          description: 'Pembayaran gagal diproses. Silakan coba lagi dengan metode pembayaran yang berbeda.',
          icon: <AlertCircle className="h-24 w-24 mx-auto mb-6 text-red-500" />,
          color: 'text-red-600'
        };
      } else if (paymentStatus === 'PENDING') {
        return {
          title: 'Pembayaran Pending!',
          description: 'Pembayaran Anda sedang diproses. Silakan tunggu konfirmasi atau coba verifikasi lagi.',
          icon: <Clock className="h-24 w-24 mx-auto mb-6 text-yellow-500" />,
          color: 'text-yellow-600'
        };
      } else {
        // Fallback ke metode pembayaran jika belum ada status
        switch (form.paymentMethod) {
          case 'direct':
            return {
              title: 'Pembayaran Berhasil!',
              description: 'Terima kasih atas donasi Anda untuk Cemoca',
              icon: <CheckCircle className="h-24 w-24 mx-auto mb-6 text-green-500" />,
              color: 'text-green-600'
            };
          case 'link':
            return {
              title: 'Link Pembayaran Dibuat!',
              description: 'Link pembayaran telah berhasil dibuat. Silakan gunakan link tersebut untuk melakukan pembayaran.',
              icon: <Link className="h-24 w-24 mx-auto mb-6 text-blue-500" />,
              color: 'text-blue-600'
            };
          case 'whatsapp':
            return {
              title: 'Link Dikirim ke WhatsApp!',
              description: 'Link pembayaran telah dikirim ke nomor WhatsApp Anda. Silakan cek pesan WhatsApp untuk melanjutkan pembayaran.',
              icon: <MessageCircle className="h-24 w-24 mx-auto mb-6 text-green-500" />,
              color: 'text-green-600'
            };
          default:
            return {
              title: 'Berhasil!',
              description: 'Proses berhasil dilakukan',
              icon: <CheckCircle className="h-24 w-24 mx-auto mb-6 text-green-500" />,
              color: 'text-green-600'
            };
        }
      }
    };

    const statusInfo = getStatusMessage();

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className={`text-2xl font-bold text-center ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-center">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="py-8">
            {statusInfo.icon}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-2">Detail Donasi</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Nama:</span>
                  <span>{form.isAnonymous ? 'Anonim' : form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nomor HP:</span>
                  <span>{form.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Pembayaran:</span>
                  <span>
                    {form.paymentMethod === 'direct' && 'Pembayaran Langsung'}
                    {form.paymentMethod === 'link' && 'Link Pembayaran'}
                    {form.paymentMethod === 'whatsapp' && 'WhatsApp'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Jumlah:</span>
                  <span>Rp {formatCurrency(form.amount)}</span>
                </div>
                {paymentData?.orderId && (
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-xs">{paymentData.orderId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Removed payment link section - now handled by modal */}

            <p className="text-gray-600 mb-6">
              {form.paymentMethod === 'direct' 
                ? 'Donasi Anda akan sangat membantu dalam pengembangan dan kemajuan Cemoca.'
                : 'Silakan lanjutkan pembayaran melalui link yang telah disediakan. Donasi Anda akan sangat membantu dalam pengembangan dan kemajuan Cemoca.'
              }
            </p>

            {form.paymentMethod === 'direct' && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-semibold mb-2">
                  Donasi Anda akan digunakan untuk:
                </p>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Maintenance server dan infrastruktur</li>
                  <li>• Pengembangan fitur-fitur baru</li>
                  <li>• Peningkatan keamanan dan performa</li>
                  <li>• Support teknis berkelanjutan</li>
                </ul>
              </div>
            )}
          </div>

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Tombol Verifikasi Pembayaran untuk metode link dan whatsapp */}
            {(form.paymentMethod === 'link' || form.paymentMethod === 'whatsapp') && paymentData?.orderId && (
              <Button
                onClick={verifyPayment}
                variant="outline"
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                disabled={verifyingPayment}
              >
                {verifyingPayment ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi Pembayaran...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" /> Verifikasi Status Pembayaran</>
                )}
              </Button>
            )}
            
            {paymentStatus && (
              <Alert className={paymentStatus === 'SUCCESS' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Status Pembayaran: <strong>{paymentStatus}</strong>
                  {paymentStatus === 'SUCCESS' && ' - Pembayaran berhasil!'}
                  {paymentStatus === 'PENDING' && ' - Pembayaran sedang diproses'}
                  {paymentStatus === 'FAILED' && ' - Pembayaran gagal'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                <Heart className="mr-2 h-4 w-4" />
                Donasi Lagi
              </Button>
              <Button onClick={() => router.push('/dashboard')} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {currentStep === 1 && 'Informasi Donatur'}
                {currentStep === 2 && 'Pembayaran Langsung'}
                {currentStep === 3 && 'Selesai'}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {/* Payment Modal */}
        {renderPaymentModal()}
      </div>
    </div>
  );
}