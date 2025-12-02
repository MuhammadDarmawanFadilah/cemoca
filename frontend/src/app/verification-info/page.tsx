'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  QrCode, 
  CheckCircle, 
  Smartphone, 
  Globe, 
  Users,
  ArrowLeft,
  Info,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function VerificationInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/logo.jpg"
              alt="Logo Koperasi Desa"
              width={48}
              height={48}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistem Verifikasi Member
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Sistem keamanan dan verifikasi keanggotaan digital Koperasi Desa yang terpercaya dan mudah digunakan
          </p>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Cara Kerja Sistem Verifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">1. Scan QR Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gunakan kamera smartphone untuk memindai QR Code yang terdapat pada kartu member
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">2. Akses Halaman Verifikasi</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  QR Code akan mengarahkan ke halaman verifikasi resmi yang menampilkan detail member
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">3. Verifikasi Otomatis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistem akan memverifikasi keaslian member dan menampilkan status keanggotaan secara real-time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Terjamin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Data Terenkripsi</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Semua data member dilindungi dengan enkripsi tingkat tinggi
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Sistem Real-time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verifikasi dilakukan secara langsung dengan database terkini
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Anti Pemalsuan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    QR Code unik yang tidak dapat diduplikasi atau dipalsukan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mudah Digunakan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Kompatibel Universal</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dapat diakses dari smartphone, tablet, atau komputer
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Tidak Perlu Aplikasi</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cukup scan dengan kamera bawaan smartphone
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Respon Cepat</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hasil verifikasi muncul dalam hitungan detik
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Panduan Penggunaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Untuk Member:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                  <li>• Pastikan kartu member dalam kondisi baik dan QR Code tidak rusak</li>
                  <li>• Gunakan penerangan yang cukup saat memindai QR Code</li>
                  <li>• Jaga kerahasiaan nomor kartu dan data pribadi Anda</li>
                  <li>• Laporkan jika kartu hilang atau rusak untuk penggantian</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Untuk Petugas Verifikasi:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                  <li>• Pastikan status member menunjukkan "AKTIF" untuk layanan penuh</li>
                  <li>• Cocokkan foto dan nama dengan member yang bersangkutan</li>
                  <li>• Perhatikan tanggal berlaku kartu keanggotaan</li>
                  <li>• Hubungi admin jika menemukan ketidaksesuaian data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Penting untuk Diingat
                </h3>
                <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <p>• Halaman verifikasi resmi hanya tersedia di domain koperasidesa.com</p>
                  <p>• Jangan memberikan informasi pribadi kepada situs web yang tidak resmi</p>
                  <p>• Laporkan kepada admin jika menemukan QR Code yang mengarah ke situs mencurigakan</p>
                  <p>• Member yang tidak aktif tidak dapat menggunakan layanan koperasi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dukungan & Bantuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Hubungi Kami</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>📧 Email: info@koperasidesa.com</p>
                  <p>📞 Telepon: (021) 1234-5678</p>
                  <p>🕒 Jam Operasional: 08:00 - 17:00 WIB</p>
                  <p>📅 Senin - Jumat (hari kerja)</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Masalah Umum</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• QR Code tidak dapat dipindai → Bersihkan kamera dan kartu</p>
                  <p>• Status non-aktif → Hubungi admin untuk aktivasi</p>
                  <p>• Data tidak sesuai → Lakukan update data member</p>
                  <p>• Kartu hilang/rusak → Ajukan penggantian kartu baru</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link href="/kartu-member">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kartu Member
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}