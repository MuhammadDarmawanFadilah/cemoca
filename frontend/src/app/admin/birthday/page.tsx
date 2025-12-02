'use client';

import React, { useState, useEffect } from 'react';
import { birthdayAPI, birthdaySettingsAPI, BirthdaySettings, biografiAPI, Biografi } from '@/lib/api';
import { toast } from "sonner";

interface BirthdayNotification {
  id: number;
  biografiId: number;
  namaLengkap: string;
  nomorTelepon: string;
  email: string;
  tanggalLahir: string;
  notificationDate: string;
  year: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'EXCLUDED' | 'RESENT';
  statusDisplayName: string;
  message: string;
  sentAt?: string;
  errorMessage?: string;
  isExcluded: boolean;
  createdAt: string;
  updatedAt: string;
  age: number;
}

interface BirthdayStatistics {
  totalBirthdays: number;
  sent: number;
  pending: number;
  failed: number;
  excluded: number;
  year: number;
}

interface FilterState {
  year: number;
  alumniYear: string;
  status: string;
  isExcluded: string;
  nama: string;
  startBirthDate: string;
  endBirthDate: string;
  maxDaysUntilBirthday: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cake, Send, RefreshCw, Eye, EyeOff, Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, Settings, Upload, Image as ImageIcon, RotateCcw, TestTube } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { ServerPagination } from '@/components/ServerPagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import BirthdayFilters from '@/components/BirthdayFilters';

// Birthday Settings Form Component
const BirthdaySettingsForm = ({ onSettingsUpdate }: { onSettingsUpdate: () => void }) => {  const [formSettings, setFormSettings] = useState<BirthdaySettings>({
    enabled: false,
    notificationTime: '0 0 8 * * *',
    timezone: 'Asia/Jakarta',
    message: '',
    daysAhead: 0,
    includeAge: true
  });const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [timeFormat, setTimeFormat] = useState({ hour: '8', minute: '00' });
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const settings = await birthdaySettingsAPI.getCurrentSettings();
      setFormSettings(settings);
      setImagePreview(settings.attachmentImageUrl || '');
        // Parse time from cron expression (assuming format "0 minute hour * * *")
      const cronParts = settings.notificationTime.split(' ');
      if (cronParts.length >= 3) {
        const minute = cronParts[1];
        const hour = cronParts[2];
        setTimeFormat({
          hour: hour,
          minute: minute.padStart(2, '0')
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  const handleTimeChange = (field: 'hour' | 'minute', value: string) => {
    const newTimeFormat = { ...timeFormat, [field]: value };
    setTimeFormat(newTimeFormat);
    
    // Update cron expression - ensure minute is properly formatted
    const minute = field === 'minute' ? value : newTimeFormat.minute;
    const hour = field === 'hour' ? value : newTimeFormat.hour;
    const cronExpression = `0 ${minute} ${hour} * * *`;
    setFormSettings(prev => ({ ...prev, notificationTime: cronExpression }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormSettings(prev => ({ ...prev, attachmentImageUrl: undefined }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let imageUrl = formSettings.attachmentImageUrl;
      
      // Upload image if selected
      if (imageFile) {
        const uploadResponse = await birthdaySettingsAPI.uploadImage(imageFile);
        imageUrl = uploadResponse.imageUrl;
      }

      // Save settings
      const updatedSettings = { ...formSettings, attachmentImageUrl: imageUrl };
      await birthdaySettingsAPI.updateSettings(updatedSettings);
      
      toast.success('Pengaturan berhasil disimpan!', {
        description: 'Pengaturan notifikasi ulang tahun telah diperbarui',
        duration: 4000
      });
      
      onSettingsUpdate();
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    setLoading(true);
    try {
      await birthdaySettingsAPI.resetToDefaults();
      toast.success('Pengaturan berhasil direset ke default!', {
        description: 'Pengaturan telah dikembalikan ke nilai default dari application.properties',
        duration: 4000
      });
      await loadCurrentSettings();
      onSettingsUpdate();
    } catch (error) {
      toast.error('Gagal reset pengaturan', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  const handleTestNotification = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Nomor handphone harus diisi', {
        description: 'Masukkan nomor handphone untuk test notifikasi',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const result = await birthdaySettingsAPI.testNotification(testPhoneNumber);
      if (result.success) {
        toast.success('Test notifikasi berhasil!', {
          description: result.message,
          duration: 4000
        });
        setIsTestDialogOpen(false);
        setTestPhoneNumber('');
      } else {
        toast.error('Test notifikasi gagal', {
          description: result.message,
          duration: 5000
        });
      }
    } catch (error) {
      toast.error('Gagal mengirim test notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Notifikasi Ulang Tahun
          </CardTitle>
          <CardDescription>
            Konfigurasi sistem notifikasi ulang tahun otomatis untuk member. 
            Pengaturan ini akan menggantikan default dari application.properties.
          </CardDescription>
        </CardHeader>
      </Card>      {/* Basic Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200 dark:border-green-800">
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Settings className="h-5 w-5" />
            Pengaturan Dasar
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Konfigurasi dasar untuk sistem notifikasi ulang tahun otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${formSettings.enabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                Sistem Notifikasi Ulang Tahun
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formSettings.enabled 
                  ? "Sistem aktif - notifikasi akan dikirim otomatis sesuai jadwal" 
                  : "Sistem nonaktif - tidak ada notifikasi yang akan dikirim"
                }
              </p>
            </div>
            <Switch
              checked={formSettings.enabled}
              onCheckedChange={(checked) => 
                setFormSettings(prev => ({ ...prev, enabled: checked }))
              }
              className="data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Settings */}
            <div className="space-y-3">
              <Label>Waktu Pengiriman</Label>
              <div className="flex gap-2">
                <Select
                  value={timeFormat.hour}
                  onValueChange={(value) => handleTimeChange('hour', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Jam" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>                <Select
                  value={timeFormat.minute}
                  onValueChange={(value) => handleTimeChange('minute', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Menit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => {
                      const minuteValue = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={i} value={minuteValue}>
                          {minuteValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Waktu pengiriman notifikasi setiap hari
              </p>
            </div>

            {/* Timezone */}
            <div className="space-y-3">
              <Label htmlFor="timezone">Zona Waktu</Label>
              <Select
                value={formSettings.timezone}
                onValueChange={(value) => 
                  setFormSettings(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Jakarta">WIB (Asia/Jakarta)</SelectItem>
                  <SelectItem value="Asia/Makassar">WITA (Asia/Makassar)</SelectItem>
                  <SelectItem value="Asia/Jayapura">WIT (Asia/Jayapura)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days Ahead */}
            <div className="space-y-3">
              <Label htmlFor="daysAhead">Hari Sebelumnya</Label>
              <Input
                id="daysAhead"
                type="number"
                min="0"
                max="30"
                value={formSettings.daysAhead}
                onChange={(e) => 
                  setFormSettings(prev => ({ 
                    ...prev, 
                    daysAhead: parseInt(e.target.value) || 0 
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Kirim notifikasi berapa hari sebelum ulang tahun (0 = pada hari yang sama)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Message Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-purple-200 dark:border-purple-800">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Send className="h-5 w-5" />
            Template Pesan & Personalisasi
          </CardTitle>
          <CardDescription className="text-purple-600 dark:text-purple-400">
            Kustomisasi pesan ucapan ulang tahun yang akan dikirim ke member. 
            Pesan dapat dipersonalisasi dengan nama dan usia penerima.
          </CardDescription>
        </CardHeader><CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="message">Pesan Ucapan</Label>
            <Textarea
              id="message"
              placeholder="Masukkan pesan ucapan ulang tahun yang menarik..."
              className="min-h-32"
              value={formSettings.message}
              onChange={(e) => 
                setFormSettings(prev => ({ ...prev, message: e.target.value }))
              }
            />            {/* Include Age Option */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-4">
                <div className="flex items-center h-6">
                  <Checkbox
                    id="includeAge"
                    checked={formSettings.includeAge || false}
                    onCheckedChange={(checked) => 
                      setFormSettings(prev => ({ ...prev, includeAge: checked as boolean }))
                    }
                    className="h-5 w-5 border-2 border-blue-400 dark:border-blue-500 data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-500"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label 
                    htmlFor="includeAge"                    className="text-base font-semibold cursor-pointer text-gray-800 dark:text-gray-200 flex items-center gap-2"
                  >
                    <Cake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Sertakan usia dalam ucapan ulang tahun
                  </Label>
                  
                  {/* Preview Examples */}
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Pratinjau pesan:</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${formSettings.includeAge ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={formSettings.includeAge ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-500'}>
                          <span className="font-semibold">Dengan usia:</span> "Selamat ulang tahun yang ke-30, John! Semoga..."
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${!formSettings.includeAge ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={!formSettings.includeAge ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-500'}>
                          <span className="font-semibold">Tanpa usia:</span> "Selamat ulang tahun, John! Semoga..."
                        </div>
                      </div>
                    </div>                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Attachment */}
      <Card>
        <CardHeader>
          <CardTitle>Lampiran Gambar</CardTitle>
          <CardDescription>
            Upload gambar yang akan disertakan dalam pesan ulang tahun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2"
                  onClick={removeImage}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Klik × untuk menghapus gambar
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih Gambar
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG hingga 5MB
                  </p>
                </div>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>      {/* Action Buttons */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Setelah selesai mengatur, simpan perubahan atau test notifikasi terlebih dahulu
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Simpan Pengaturan
              </Button>

              <Button
                variant="outline"
                onClick={handleResetDefaults}
                disabled={loading}
                size="lg"
                className="border-2 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-700 dark:text-orange-400"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset ke Default              </Button>

              <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:hover:from-blue-900/60 dark:hover:to-indigo-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                  >
                    <TestTube className="h-5 w-5 mr-2" />
                    Test Notifikasi
                  </Button>
                </DialogTrigger>
              <DialogContent>                <DialogHeader className="text-center">                  <DialogTitle className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200">
                    <TestTube className="h-5 w-5" />
                    Test Notifikasi Ulang Tahun
                  </DialogTitle>
                  <DialogDescription className="text-blue-600 dark:text-blue-400">
                    Masukkan nomor handphone untuk mengirim test notifikasi dengan pengaturan saat ini
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Nomor Handphone Tujuan
                    </Label>
                    <Input
                      id="phone"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="Contoh: 08123456789 atau +6281234567890"
                      className="text-center"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Test notifikasi akan dikirim menggunakan template pesan dan pengaturan yang telah dikonfigurasi
                    </p>
                  </div>
                </div>                <DialogFooter className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsTestDialogOpen(false);
                      setTestPhoneNumber('');
                    }}
                    className="border-gray-300"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={loading || !testPhoneNumber.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Kirim Test
                  </Button>
                </DialogFooter>              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BirthdayAdmin = () => {const [notifications, setNotifications] = useState<BirthdayNotification[]>([]);
  const [upcoming, setUpcoming] = useState<BirthdayNotification[]>([]);
  const [past, setPast] = useState<BirthdayNotification[]>([]);
  const [today, setToday] = useState<BirthdayNotification[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<number>(7);
  const [pastDays, setPastDays] = useState<number>(30);  const [activeTab, setActiveTab] = useState<string>('today');
  const [selectedUpcoming, setSelectedUpcoming] = useState<Set<number>>(new Set());
  const [selectedPast, setSelectedPast] = useState<Set<number>>(new Set());
  const [selectedToday, setSelectedToday] = useState<Set<number>>(new Set());
  const [statistics, setStatistics] = useState<BirthdayStatistics>({
    totalBirthdays: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    excluded: 0,
    year: new Date().getFullYear()
  });  const [settings, setSettings] = useState<BirthdaySettings>({
    enabled: false,
    notificationTime: '0 0 8 * * *',
    timezone: 'Asia/Jakarta',
    message: '',
    daysAhead: 0
  });  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<BirthdayNotification | null>(null);const [filters, setFilters] = useState<FilterState>({
    year: new Date().getFullYear(),
    alumniYear: '',
    status: '',
    isExcluded: '',
    nama: '',
    startBirthDate: '',
    endBirthDate: '',
    maxDaysUntilBirthday: '',
    page: 0,
    size: 10,
    sortBy: 'notificationDate',
    sortDirection: 'desc'
  });useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadUpcoming();
  }, [upcomingDays]);

  useEffect(() => {
    loadPast();
  }, [pastDays]);
  useEffect(() => {
    // Load statistics when tab changes or when data is loaded
    loadStatistics();
  }, [activeTab, upcoming, past, today, filters.year]);  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadUpcoming(),
        loadToday(),
        loadPast(),
        loadStatistics(),
        loadSettings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetail = (notification: BirthdayNotification) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
  };const loadNotifications = async () => {
    const filter = {
      ...filters,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
    };

    const data = await birthdayAPI.getBirthdayNotifications(filter);
    
    setNotifications(data.content || []);
    setTotalPages(data.totalPages || 0);
  };const loadUpcoming = async () => {
    const data = await birthdayAPI.getUpcomingBirthdays(upcomingDays);
    // Sort by notification date (closest first)
    const sortedData = data.sort((a: BirthdayNotification, b: BirthdayNotification) => {
      return new Date(a.notificationDate).getTime() - new Date(b.notificationDate).getTime();
    });
    setUpcoming(sortedData);
    
    // Update statistics immediately for upcoming tab
    if (activeTab === 'upcoming') {
      const stats = {
        totalBirthdays: sortedData.length,
        sent: sortedData.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
        pending: sortedData.filter(n => n.status === 'PENDING').length,
        failed: sortedData.filter(n => n.status === 'FAILED').length,
        excluded: sortedData.filter(n => n.isExcluded).length,
        year: new Date().getFullYear()
      };
      setStatistics(stats);
    }
  };

  const loadPast = async () => {
    const data = await birthdayAPI.getPastBirthdays(pastDays);
    // Sort by notification date (most recent first)
    const sortedData = data.sort((a: BirthdayNotification, b: BirthdayNotification) => {
      return new Date(b.notificationDate).getTime() - new Date(a.notificationDate).getTime();
    });
    setPast(sortedData);
    
    // Update statistics immediately for past tab
    if (activeTab === 'past') {
      const stats = {
        totalBirthdays: sortedData.length,
        sent: sortedData.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
        pending: sortedData.filter(n => n.status === 'PENDING').length,
        failed: sortedData.filter(n => n.status === 'FAILED').length,
        excluded: sortedData.filter(n => n.isExcluded).length,
        year: new Date().getFullYear()
      };
      setStatistics(stats);    }
  };  const loadToday = async () => {
    try {
      // Get today's date
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
      const todayDay = today.getDate();
      const todayYear = today.getFullYear();
      const todayDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`Loading birthdays for today: ${todayDay}/${todayMonth}/${todayYear} (${todayDateStr})`);
      
      // First try to get biografi data to find today's birthdays
      const biografiResponse = await biografiAPI.getAllBiografi(0, 1000, 'namaLengkap', 'asc');
      const allBiografi = biografiResponse.content || [];
      
      console.log(`Found ${allBiografi.length} biografi entries`);
      
      if (allBiografi.length === 0) {
        console.warn('No biografi entries found! API might be returning empty data.');
        setToday([]);
        return;
      }

      // Filter biografi for today's birthdays ONLY (exact date match)
      const todayBirthdays = allBiografi.filter((biografi: Biografi) => {
        if (!biografi.tanggalLahir) return false;
        
        // Parse the birth date more carefully
        const birthDateStr = biografi.tanggalLahir;
        const birthDate = new Date(birthDateStr + 'T00:00:00'); // Add time to avoid timezone issues
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        const isTodayExact = birthMonth === todayMonth && birthDay === todayDay;
        
        // Debug specific biografi ID 1
        if (biografi.biografiId === 1) {
          console.log(`Biografi ID 1 debug: 
            Name: ${biografi.namaLengkap}
            Birth Date String: ${birthDateStr}
            Parsed Birth Date: ${birthDate.toISOString()}
            Birth Month: ${birthMonth}
            Birth Day: ${birthDay}
            Today Month: ${todayMonth}
            Today Day: ${todayDay}
            Is Today Exact: ${isTodayExact}`);
        }
        
        if (isTodayExact) {
          console.log(`Found birthday today: ${biografi.namaLengkap} - ${biografi.tanggalLahir}`);
        }
        
        return isTodayExact;
      });
      
      console.log(`Found ${todayBirthdays.length} birthdays for today`);
      
      // Remove duplicates based on biografiId and ensure unique entries
      const uniqueTodayBirthdays = todayBirthdays.filter((biografi, index, array) => 
        array.findIndex(b => b.biografiId === biografi.biografiId) === index
      );
      
      console.log(`After deduplication: ${uniqueTodayBirthdays.length} unique birthdays`);
      
      // Convert biografi to BirthdayNotification format for consistency
      const todayNotifications: BirthdayNotification[] = uniqueTodayBirthdays.map((biografi: Biografi) => {
        const birthDate = new Date(biografi.tanggalLahir!);
        const age = todayYear - birthDate.getFullYear();
        
        return {
          id: biografi.biografiId,
          biografiId: biografi.biografiId,
          namaLengkap: biografi.namaLengkap,
          nomorTelepon: biografi.nomorTelepon || biografi.nomorHp || biografi.nomorWa || '',
          email: biografi.email,
          tanggalLahir: biografi.tanggalLahir!,
          notificationDate: todayDateStr,
          year: todayYear,
          status: 'PENDING' as const,
          statusDisplayName: 'Menunggu',
          message: '',
          isExcluded: false,
          createdAt: biografi.createdAt,
          updatedAt: biografi.updatedAt,
          age: age
        };
      });
      
      // Get existing birthday notifications for this year to check status
      try {
        const existingNotifications = await birthdayAPI.getUpcomingBirthdays(365); // Get all notifications for this year
        
        // Filter only notifications for today's date exactly
        const existingTodayNotifications = existingNotifications.filter((notification) => {
          const notificationDate = new Date(notification.notificationDate).toISOString().split('T')[0];
          return notificationDate === todayDateStr;
        });
        
        console.log(`Found ${existingTodayNotifications.length} existing notifications for today: ${todayDateStr}`);
          // Merge existing notification status with biografi data
        const mergedNotifications = todayNotifications.map((bioNotification) => {
          const existingNotification = existingTodayNotifications.find(
            (existing) => existing.biografiId === bioNotification.biografiId
          );
          
          if (existingNotification) {
            console.log(`Merging data for ${bioNotification.namaLengkap}: status=${existingNotification.status}, isExcluded=${existingNotification.isExcluded}`);
            // Use existing notification data for status, but keep biografi data for other fields
            return {
              ...bioNotification,
              id: existingNotification.id,
              status: existingNotification.status,
              statusDisplayName: existingNotification.statusDisplayName || (() => {
                const statusMap = {
                  'PENDING': 'Menunggu',
                  'SENT': 'Sudah Terkirim',
                  'FAILED': 'Gagal Kirim',
                  'EXCLUDED': 'Dikecualikan',
                  'RESENT': 'Dikirim Ulang'
                };
                return statusMap[existingNotification.status] || 'Menunggu';
              })(),
              message: existingNotification.message,
              sentAt: existingNotification.sentAt,
              errorMessage: existingNotification.errorMessage,
              isExcluded: existingNotification.isExcluded,
              notificationDate: existingNotification.notificationDate
            };
          } else {
            console.log(`No existing notification found for ${bioNotification.namaLengkap}, using default PENDING status`);
            return bioNotification;
          }
        });
        
        console.log('Final merged notifications for today:', mergedNotifications.map(n => ({ 
          biografiId: n.biografiId, 
          name: n.namaLengkap, 
          status: n.status, 
          isExcluded: n.isExcluded 
        })));
        
        setToday(mergedNotifications);
        
        // Update statistics immediately for today tab
        if (activeTab === 'today') {
          const stats = {
            totalBirthdays: mergedNotifications.length,
            sent: mergedNotifications.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
            pending: mergedNotifications.filter(n => n.status === 'PENDING').length,
            failed: mergedNotifications.filter(n => n.status === 'FAILED').length,
            excluded: mergedNotifications.filter(n => n.isExcluded).length,
            year: todayYear
          };
          setStatistics(stats);
        }
      } catch (notificationError) {
        console.log('No existing notifications found, using biografi data only');
        setToday(todayNotifications);
        
        if (activeTab === 'today') {
          const stats = {
            totalBirthdays: todayNotifications.length,
            sent: 0,
            pending: todayNotifications.length,
            failed: 0,
            excluded: 0,
            year: todayYear          };
          setStatistics(stats);
        }
      }
    } catch (error) {
      console.error('Error loading today\'s birthdays:', error);
      setToday([]);
    }
  };

  const loadStatistics = async () => {
    if (activeTab === 'upcoming') {
      const stats = {
        totalBirthdays: upcoming.length,
        sent: upcoming.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
        pending: upcoming.filter(n => n.status === 'PENDING').length,
        failed: upcoming.filter(n => n.status === 'FAILED').length,
        excluded: upcoming.filter(n => n.isExcluded).length,
        year: new Date().getFullYear()
      };
      setStatistics(stats);
    } else if (activeTab === 'today') {
      const stats = {
        totalBirthdays: today.length,
        sent: today.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
        pending: today.filter(n => n.status === 'PENDING').length,
        failed: today.filter(n => n.status === 'FAILED').length,
        excluded: today.filter(n => n.isExcluded).length,
        year: new Date().getFullYear()
      };
      setStatistics(stats);
    } else if (activeTab === 'past') {
      const stats = {
        totalBirthdays: past.length,
        sent: past.filter(n => n.status === 'SENT' || n.status === 'RESENT').length,
        pending: past.filter(n => n.status === 'PENDING').length,
        failed: past.filter(n => n.status === 'FAILED').length,
        excluded: past.filter(n => n.isExcluded).length,
        year: new Date().getFullYear()
      };
      setStatistics(stats);
    } else if (activeTab === 'notifications') {
      // For 'all' tab, get current year data from backend
      try {
        const data = await birthdayAPI.getBirthdayStatistics(filters.year);
        setStatistics(data);
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    }
  };
  const loadSettings = async () => {
    try {
      const data = await birthdaySettingsAPI.getCurrentSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Gagal memuat pengaturan', {
        description: (error as Error).message,
        duration: 5000
      });
    }
  };const handleGenerateNotifications = async (year: number) => {
    setLoading(true);    try {
      await birthdayAPI.generateBirthdayNotifications(year);
      toast.success(`Notifikasi ulang tahun untuk tahun ${year} berhasil dibuat!`, {
        description: "Semua notifikasi telah berhasil dibuat untuk member",
        duration: 4000
      });
      loadData();
    } catch (error) {
      toast.error('Gagal membuat notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };  const handleSendToday = async () => {
    if (selectedUpcoming.size === 0) {
      toast.warning('Pilih notifikasi terlebih dahulu', {
        description: 'Pilih minimal satu notifikasi untuk dikirim hari ini',
        duration: 3000
      });
      return;
    }    setLoading(true);
    try {
      const today = new Date().toDateString();
      const selectedItems = upcoming.filter(n => 
        selectedUpcoming.has(n.biografiId) && 
        new Date(n.notificationDate).toDateString() === today &&
        n.status === 'PENDING'
      );
        if (selectedItems.length === 0) {
        toast.warning('Tidak ada notifikasi untuk dikirim', {
          description: 'Tidak ada notifikasi hari ini yang dipilih untuk dikirim',
          duration: 3000
        });        return;
      }

      for (const notification of selectedItems) {
        await birthdayAPI.sendBirthdayNotificationForBiografi(notification.biografiId);
      }      
      toast.success(`${selectedItems.length} notifikasi berhasil dikirim!`, {
        description: "Semua notifikasi hari ini telah berhasil dikirim ke WhatsApp",
        duration: 4000
      });
      setSelectedUpcoming(new Set());
      await loadUpcoming();
      await loadData(); // Refresh all data
    } catch (error) {
      toast.error('Gagal mengirim notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  const handleResend = async (biografiId: number) => {
    setLoading(true);
    try {
      await birthdayAPI.sendBirthdayNotificationForBiografi(biografiId);
      toast.success('Notifikasi berhasil dikirim ulang!', {
        description: "Notifikasi ulang tahun telah dikirim ke WhatsApp",
        duration: 4000
      });
      loadData();
    } catch (error) {
      toast.error('Gagal mengirim ulang notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };  const handleExclude = async (biografiId: number, exclude: boolean) => {
    setLoading(true);
    try {
      await birthdayAPI.toggleBiografiBirthdayExclusion(biografiId, exclude);
      const action = exclude ? 'dikecualikan dari' : 'disertakan dalam';
      toast.success(`Notifikasi berhasil ${action} pengiriman ulang tahun!`, {
        description: exclude ? "Member dikecualikan dari notifikasi otomatis" : "Member disertakan dalam notifikasi otomatis",
        duration: 4000
      });
      
      // Reload all relevant data
      await Promise.all([
        loadData(),
        loadToday(),
        loadUpcoming(),
        loadPast()
      ]);
    } catch (error) {
      toast.error('Gagal mengubah status notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };const handleBulkExclude = async () => {
    if (selectedUpcoming.size === 0) {
      toast.warning('Pilih notifikasi terlebih dahulu', {
        description: 'Pilih minimal satu notifikasi untuk dikecualikan',
        duration: 3000
      });
      return;
    }    setLoading(true);
    try {
      const selectedItems = upcoming.filter(n => selectedUpcoming.has(n.biografiId));
      for (const notification of selectedItems) {
        await birthdayAPI.toggleBiografiBirthdayExclusion(notification.biografiId, true);
      }
      toast.success(`${selectedItems.length} notifikasi berhasil dikecualikan!`, {
        description: "Member terpilih dikecualikan dari notifikasi otomatis",
        duration: 4000
      });
      setSelectedUpcoming(new Set());
      await loadUpcoming();
    } catch (error) {
      toast.error('Gagal mengecualikan notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };  const handleBulkResend = async () => {
    if (selectedPast.size === 0) {
      toast.warning('Pilih notifikasi terlebih dahulu', {
        description: 'Pilih minimal satu notifikasi untuk dikirim ulang',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {      const selectedItems = past.filter(n => selectedPast.has(n.id));
      if (selectedItems.length === 0) {
        toast.warning('Tidak ada notifikasi untuk dikirim', {
          description: 'Tidak ada notifikasi yang dipilih',
          duration: 3000
        });
        return;
      }        for (const notification of selectedItems) {
        await birthdayAPI.sendBirthdayNotificationForBiografi(notification.biografiId);
      }
      toast.success(`${selectedItems.length} notifikasi berhasil dikirim ulang!`, {
        description: "Semua notifikasi terpilih telah dikirim ulang ke WhatsApp",
        duration: 4000
      });
      setSelectedPast(new Set());
      await loadPast();
    } catch (error) {
      toast.error('Gagal mengirim ulang notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExcludeToday = async () => {
    if (selectedToday.size === 0) {
      toast.warning('Pilih notifikasi terlebih dahulu', {
        description: 'Pilih minimal satu notifikasi untuk dikecualikan',
        duration: 3000
      });
      return;
    }    setLoading(true);
    try {
      const selectedItems = today.filter(n => selectedToday.has(n.biografiId));
      for (const notification of selectedItems) {
        await birthdayAPI.toggleBiografiBirthdayExclusion(notification.biografiId, true);
      }
      toast.success(`${selectedItems.length} notifikasi berhasil dikecualikan!`, {
        description: "Member terpilih dikecualikan dari notifikasi otomatis",
        duration: 4000
      });
      setSelectedToday(new Set());
      await loadToday();
    } catch (error) {
      toast.error('Gagal mengecualikan notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTodaySelected = async () => {
    if (selectedToday.size === 0) {
      toast.warning('Pilih notifikasi terlebih dahulu', {
        description: 'Pilih minimal satu notifikasi untuk dikirim',
        duration: 3000
      });
      return;
    }    setLoading(true);
    try {
      const selectedItems = today.filter(n => 
        selectedToday.has(n.biografiId) && 
        n.status === 'PENDING'
      );
        if (selectedItems.length === 0) {
        toast.warning('Tidak ada notifikasi untuk dikirim', {
          description: 'Tidak ada notifikasi yang dipilih untuk dikirim',
          duration: 3000
        });
        return;
      }      for (const notification of selectedItems) {
        // Always use biografiId for consistency
        await birthdayAPI.sendBirthdayNotificationForBiografi(notification.biografiId);
      }
      
      toast.success(`${selectedItems.length} notifikasi berhasil dikirim!`, {
        description: "Semua notifikasi hari ini telah berhasil dikirim ke WhatsApp",
        duration: 4000
      });
      setSelectedToday(new Set());
      await loadToday();
      await loadData(); // Refresh all data
    } catch (error) {
      toast.error('Gagal mengirim notifikasi', {
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: BirthdayNotification['status'], notificationDate?: string) => {
    const today = new Date();
    const targetDate = notificationDate ? new Date(notificationDate) : null;
    const daysUntil = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    const statusConfig = {
      PENDING: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        text: daysUntil !== null && daysUntil >= 0 ? 
          (daysUntil === 0 ? 'Hari ini' : `${daysUntil} hari lagi`) : 
          'Menunggu' 
      },
      SENT: { variant: 'default' as const, icon: CheckCircle, text: 'Sudah Terkirim' },
      FAILED: { variant: 'destructive' as const, icon: XCircle, text: 'Gagal Kirim' },
      EXCLUDED: { variant: 'outline' as const, icon: EyeOff, text: 'Dikecualikan' },
      RESENT: { variant: 'default' as const, icon: RefreshCw, text: 'Dikirim Ulang' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'namaLengkap',
      header: 'Nama',
      cell: (row: BirthdayNotification) => (
        <div>
          <div className="font-medium">{row.namaLengkap}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'tanggalLahir',
      header: 'Tanggal Lahir',
      cell: (row: BirthdayNotification) => (
        <div>
          <div>{new Date(row.tanggalLahir).toLocaleDateString('id-ID')}</div>
          <div className="text-sm text-gray-500">Usia: {row.age} tahun</div>
        </div>
      )
    },    {
      key: 'daysUntilBirthday',
      header: 'Durasi Ulang Tahun',
      cell: (row: BirthdayNotification) => {
        const today = new Date();
        const birthDate = new Date(row.tanggalLahir);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // If birthday has passed this year, calculate for next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = thisYearBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          return <span className="font-medium text-green-600">Hari ini!</span>;        } else if (diffDays === 1) {
          return <span className="font-medium text-blue-600">Besok</span>;
        } else {
          return <span className="text-gray-700 dark:text-gray-300">{diffDays} hari lagi</span>;
        }
      }
    },{
      key: 'status',
      header: 'Status',
      cell: (row: BirthdayNotification) => getStatusBadge(row.status, row.notificationDate)
    },
    {
      key: 'sentAt',
      header: 'Dikirim',
      cell: (row: BirthdayNotification) => row.sentAt ? new Date(row.sentAt).toLocaleDateString('id-ID') : '-'
    },
    {
      key: 'actions',
      header: 'Aksi',      cell: (row: BirthdayNotification) => (
        <div className="flex gap-2">
          {(row.status === 'SENT' || row.status === 'FAILED') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResend(row.biografiId)}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant={row.isExcluded ? "default" : "outline"}
            onClick={() => handleExclude(row.biografiId, !row.isExcluded)}
            disabled={loading}
          >
            {row.isExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      )
    }
  ];
  // Selection handlers
  const handleSelectUpcoming = (biografiId: number, checked: boolean) => {
    const newSelected = new Set(selectedUpcoming);
    if (checked) {
      newSelected.add(biografiId);
    } else {
      newSelected.delete(biografiId);
    }
    setSelectedUpcoming(newSelected);
  };

  const handleSelectAllUpcoming = (checked: boolean) => {
    if (checked) {
      setSelectedUpcoming(new Set(upcoming.map(item => item.biografiId)));
    } else {
      setSelectedUpcoming(new Set());
    }
  };
  const handleSelectPast = (biografiId: number, checked: boolean) => {
    const newSelected = new Set(selectedPast);
    if (checked) {
      newSelected.add(biografiId);
    } else {
      newSelected.delete(biografiId);
    }
    setSelectedPast(newSelected);
  };
  const handleSelectAllPast = (checked: boolean) => {
    if (checked) {
      setSelectedPast(new Set(past.map(item => item.biografiId)));
    } else {
      setSelectedPast(new Set());
    }
  };

  const handleSelectToday = (biografiId: number, checked: boolean) => {
    const newSelected = new Set(selectedToday);
    if (checked) {
      newSelected.add(biografiId);
    } else {
      newSelected.delete(biografiId);
    }
    setSelectedToday(newSelected);
  };

  const handleSelectAllToday = (checked: boolean) => {
    if (checked) {
      setSelectedToday(new Set(today.map(item => item.biografiId)));
    } else {
      setSelectedToday(new Set());
    }
  };

  // Sorting and pagination handlers
  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortDirection: newSortDir,
      page: 0 // Reset to first page when sorting
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({ ...prev, size, page: 0 }));
  };
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 p-8 border border-pink-100 dark:border-pink-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-200/30 to-purple-200/30 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg">
            <Cake className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Admin Ulang Tahun Member
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Kelola notifikasi ulang tahun member dengan sistem otomatis yang canggih
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Tahun {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span>Otomatis {settings.enabled ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Member</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{statistics.totalBirthdays || 0}</p>
                <p className="text-xs text-blue-500 mt-1">Tahun ini</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Terkirim</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{statistics.sent || 0}</p>
                <p className="text-xs text-green-500 mt-1">Berhasil</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Menunggu</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{statistics.pending || 0}</p>
                <p className="text-xs text-yellow-500 mt-1">Siap kirim</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950/50 dark:to-pink-950/50 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Gagal</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{statistics.failed || 0}</p>
                <p className="text-xs text-red-500 mt-1">Perlu perhatian</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/50 dark:to-slate-950/50 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Dikecualikan</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{statistics.excluded || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Tidak dikirim</p>
              </div>
              <div className="p-3 bg-gray-500 rounded-xl shadow-lg">
                <EyeOff className="h-6 w-6 text-white" />
              </div>
            </div>          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab} className="space-y-6">{/* Enhanced Tab List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
          <TabsList className="grid w-full grid-cols-5 bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
            <TabsTrigger 
              value="today" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              <Cake className="h-4 w-4 mr-2" />
              Hari Ini
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Akan Datang
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              <Clock className="h-4 w-4 mr-2" />
              Sudah Lampau
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              <Send className="h-4 w-4 mr-2" />
              Semua Notifikasi
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-600 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Pengaturan
            </TabsTrigger>
          </TabsList>
        </div><TabsContent value="notifications" className="space-y-4">
          <BirthdayFilters
            currentFilters={filters}
            onFilterChange={setFilters}
          />          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortableHeader
                          sortKey="namaLengkap"
                          currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDirection as 'asc' | 'desc' }}
                          onSort={handleSort}
                        >
                          Nama
                        </SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="tanggalLahir"
                          currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDirection as 'asc' | 'desc' }}
                          onSort={handleSort}
                        >
                          Tanggal Lahir
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Durasi Ulang Tahun</TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="status"
                          currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDirection as 'asc' | 'desc' }}
                          onSort={handleSort}
                        >
                          Status
                        </SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="sentAt"
                          currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDirection as 'asc' | 'desc' }}
                          onSort={handleSort}
                        >
                          Dikirim
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Cake className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Tidak ada data notifikasi ulang tahun
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((row) => (
                        <TableRow key={row.id}>                          <TableCell>
                            <div>
                              <div className="font-medium">{row.namaLengkap}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{new Date(row.tanggalLahir).toLocaleDateString('id-ID')}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Usia: {row.age} tahun</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const today = new Date();
                              const birthDate = new Date(row.tanggalLahir);
                              const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                              
                              // If birthday has passed this year, calculate for next year
                              if (thisYearBirthday < today) {
                                thisYearBirthday.setFullYear(today.getFullYear() + 1);
                              }
                              
                              const diffTime = thisYearBirthday.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays === 0) {
                                return <span className="font-medium text-green-600">Hari ini!</span>;                              } else if (diffDays === 1) {
                                return <span className="font-medium text-blue-600">Besok</span>;
                              } else {
                                return <span className="text-gray-700 dark:text-gray-300">{diffDays} hari lagi</span>;
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(row.status, row.notificationDate)}
                          </TableCell>
                          <TableCell>
                            {row.sentAt ? new Date(row.sentAt).toLocaleDateString('id-ID') : '-'}
                          </TableCell>                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetail(row)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(row.status === 'SENT' || row.status === 'FAILED') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResend(row.biografiId)}
                                  disabled={loading}
                                  title="Resend Notification"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant={row.isExcluded ? "default" : "outline"}
                                onClick={() => handleExclude(row.biografiId, !row.isExcluded)}
                                disabled={loading}
                                title={row.isExcluded ? "Include in notifications" : "Exclude from notifications"}
                              >
                                {row.isExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <ServerPagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    totalElements={notifications.length}
                    pageSize={filters.size}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="today" className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 shadow-xl">
            <CardHeader className="border-b border-pink-100 dark:border-pink-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg">
                    <Cake className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      🎉 Ulang Tahun Hari Ini
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Daftar member yang berulang tahun hari ini - {new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                </div>
                {today.length > 0 && (
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkExcludeToday}
                      disabled={loading || selectedToday.size === 0}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/20"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Kecualikan ({selectedToday.size})
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendTodaySelected}
                      disabled={loading || selectedToday.size === 0}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Kirim Sekarang ({selectedToday.size})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Enhanced Select All Checkbox */}
                {today.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl border border-pink-100 dark:border-pink-800">
                    <Checkbox
                      checked={today.length > 0 && selectedToday.size === today.length}
                      onCheckedChange={handleSelectAllToday}
                      className="border-pink-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                    />
                    <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                      Pilih semua member ({selectedToday.size}/{today.length})
                    </span>
                    {selectedToday.size > 0 && (
                      <div className="ml-auto flex gap-2">
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                          {selectedToday.size} terpilih
                        </Badge>
                      </div>
                    )}
                  </div>
                )}                {today.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/50 dark:to-purple-950/50 rounded-full flex items-center justify-center mb-6">
                      <Cake className="h-12 w-12 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tidak ada ulang tahun hari ini
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Tidak ada member yang berulang tahun hari ini ({new Date().toLocaleDateString('id-ID')})
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {today.map((item) => {
                      return (
                        <Card key={item.id} className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${
                          item.isExcluded 
                            ? 'border-l-orange-400 bg-gradient-to-r from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 opacity-75' 
                            : 'border-l-pink-400 bg-gradient-to-r from-white to-pink-50/30 dark:from-gray-800 dark:to-pink-950/10'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Checkbox
                                  checked={selectedToday.has(item.biografiId)}
                                  onCheckedChange={(checked) => handleSelectToday(item.biografiId, checked as boolean)}
                                  className="border-pink-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                                  disabled={item.isExcluded}
                                />
                                <div className={`p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                                  item.isExcluded 
                                    ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                                    : 'bg-gradient-to-br from-pink-500 to-purple-600'
                                }`}>
                                  {item.isExcluded ? <EyeOff className="h-8 w-8 text-white" /> : <Cake className="h-8 w-8 text-white" />}
                                </div>
                                <div className="space-y-1">
                                  <h3 className={`text-xl font-bold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors ${
                                    item.isExcluded 
                                      ? 'text-gray-600 dark:text-gray-400' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {item.namaLengkap}
                                    {item.isExcluded && <span className="ml-2 text-sm text-orange-600 dark:text-orange-400">(Dikecualikan)</span>}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(item.tanggalLahir).toLocaleDateString('id-ID')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      Usia: {item.age} tahun
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📞 {item.nomorTelepon}</span>
                                    <span>✉️ {item.email}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right min-w-[140px] space-y-2">
                                  <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                    🎂 Hari Ini!
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(item.notificationDate).toLocaleDateString('id-ID')}
                                  </div>
                                  <div className="space-y-1">
                                    {getStatusBadge(item.status, item.notificationDate)}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.isExcluded ? (
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                          ⚠️ Tidak akan menerima notifikasi
                                        </span>
                                      ) : (
                                        <span>Status: {item.statusDisplayName || 'Belum Diproses'}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {/* Tombol Kirim Sekarang - untuk PENDING, FAILED, RESENT yang tidak dikecualikan */}
                                  {(item.status === 'PENDING' || item.status === 'FAILED' || item.status === 'RESENT') && !item.isExcluded && (
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                                      onClick={async () => {
                                        setLoading(true);
                                        try {
                                          // Always use biografiId for consistency
                                          await birthdayAPI.sendBirthdayNotificationForBiografi(item.biografiId);
                                          toast.success('Notifikasi berhasil dikirim!', {
                                            description: `Notifikasi ulang tahun untuk ${item.namaLengkap} telah dikirim`,
                                            duration: 4000
                                          });
                                          await loadToday();
                                        } catch (error) {
                                          toast.error('Gagal mengirim notifikasi', {
                                            description: (error as Error).message,
                                            duration: 5000
                                          });
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      disabled={loading}
                                      title={item.status === 'PENDING' ? 'Kirim Sekarang' : 'Kirim Ulang'}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Tombol Reset ke Pending - untuk semua status kecuali EXCLUDED dan tidak dikecualikan */}
                                  {item.status !== 'EXCLUDED' && !item.isExcluded && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                      onClick={async () => {
                                        setLoading(true);
                                        try {
                                          await birthdayAPI.resetBiografiNotificationToPending(item.biografiId);
                                          
                                          toast.success('Status berhasil direset ke pending!', {
                                            description: `Notifikasi untuk ${item.namaLengkap} dapat dikirim ulang`,
                                            duration: 4000
                                          });
                                          await loadToday();
                                        } catch (error) {
                                          toast.error('Gagal mereset status', {
                                            description: (error as Error).message,
                                            duration: 5000
                                          });
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      disabled={loading}
                                      title="Reset ke Pending"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Tombol Kecualikan/Sertakan */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={item.isExcluded ? 
                                      "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20" : 
                                      "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/20"
                                    }
                                    onClick={async () => {
                                      setLoading(true);
                                      try {
                                        await birthdayAPI.toggleBiografiBirthdayExclusion(item.biografiId, !item.isExcluded);
                                        const action = !item.isExcluded ? 'dikecualikan dari' : 'disertakan dalam';
                                        const statusInfo = !item.isExcluded ? 
                                          'Status: EXCLUDED (tidak akan menerima notifikasi)' : 
                                          'Status: PENDING (akan menerima notifikasi)';
                                        toast.success(`Notifikasi berhasil ${action} pengiriman ulang tahun!`, {
                                          description: `${item.namaLengkap} ${!item.isExcluded ? 'dikecualikan dari' : 'disertakan dalam'} notifikasi otomatis. ${statusInfo}`,
                                          duration: 4000
                                        });
                                        await loadToday();
                                      } catch (error) {
                                        toast.error('Gagal mengubah status notifikasi', {
                                          description: (error as Error).message,
                                          duration: 5000
                                        });
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    title={item.isExcluded ? 'Sertakan' : 'Kecualikan'}
                                  >
                                    {item.isExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="upcoming" className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-xl">
            <CardHeader className="border-b border-blue-100 dark:border-blue-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      📅 Ulang Tahun {upcomingDays === 1 ? 'Hari Ini' : `${upcomingDays} Hari Ke Depan`}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Daftar member yang akan berulang tahun {upcomingDays === 1 ? 'hari ini' : `mulai hari ini sampai ${upcomingDays} hari ke depan`}, diurutkan dari yang terdekat
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-blue-50 dark:bg-blue-950/30 p-1 rounded-xl">
                    {[1, 7, 14, 30].map((days) => (
                      <Button
                        key={days}
                        size="sm"
                        variant={upcomingDays === days ? "default" : "ghost"}
                        onClick={() => setUpcomingDays(days)}
                        className={upcomingDays === days ? 
                          "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md" : 
                          "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        }
                      >
                        {days} hari
                      </Button>
                    ))}
                  </div>
                  
                  {upcoming.length > 0 && (
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkExclude}
                        disabled={loading || selectedUpcoming.size === 0}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/20"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Kecualikan ({selectedUpcoming.size})
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendToday}
                        disabled={loading || selectedUpcoming.size === 0}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Kirim Hari Ini ({selectedUpcoming.size})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Enhanced Select All Checkbox */}
                {upcoming.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-800">
                    <Checkbox
                      checked={upcoming.length > 0 && selectedUpcoming.size === upcoming.length}
                      onCheckedChange={handleSelectAllUpcoming}
                      className="border-blue-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Pilih semua member ({selectedUpcoming.size}/{upcoming.length})
                    </span>
                    {selectedUpcoming.size > 0 && (
                      <div className="ml-auto flex gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {selectedUpcoming.size} terpilih
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {upcoming.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mb-6">
                      <Calendar className="h-12 w-12 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tidak ada ulang tahun mendatang
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Tidak ada member yang akan berulang tahun {upcomingDays === 1 ? 'hari ini' : `dalam ${upcomingDays} hari ke depan`}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">                    {upcoming.map((item) => {
                      // Fix: Use proper date comparison without time component
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Remove time component
                      
                      const notificationDate = new Date(item.notificationDate);
                      notificationDate.setHours(0, 0, 0, 0); // Remove time component
                      
                      // Calculate days difference properly
                      const timeDiff = notificationDate.getTime() - today.getTime();
                      const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        return (
                        <Card key={item.id} className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${
                          item.isExcluded 
                            ? 'border-l-orange-400 bg-gradient-to-r from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 opacity-75' 
                            : 'border-l-blue-400 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/10'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">                                <Checkbox
                                  checked={selectedUpcoming.has(item.biografiId)}
                                  onCheckedChange={(checked) => handleSelectUpcoming(item.biografiId, checked as boolean)}
                                  className="border-blue-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  disabled={item.isExcluded}
                                />
                                <div className={`p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                                  item.isExcluded 
                                    ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                  {item.isExcluded ? <EyeOff className="h-8 w-8 text-white" /> : <Cake className="h-8 w-8 text-white" />}
                                </div>
                                <div className="space-y-1">
                                  <h3 className={`text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                                    item.isExcluded 
                                      ? 'text-gray-600 dark:text-gray-400' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {item.namaLengkap}
                                    {item.isExcluded && <span className="ml-2 text-sm text-orange-600 dark:text-orange-400">(Dikecualikan)</span>}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(item.tanggalLahir).toLocaleDateString('id-ID')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      Usia: {item.age} tahun
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📞 {item.nomorTelepon}</span>
                                    <span>✉️ {item.email}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right min-w-[140px] space-y-2">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {daysUntil === 0 ? '🎂 Hari Ini!' : 
                                     daysUntil === 1 ? '📅 Besok' : 
                                     `📅 ${daysUntil} hari lagi`}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(item.notificationDate).toLocaleDateString('id-ID')}
                                  </div>
                                  <div className="space-y-1">
                                    {getStatusBadge(item.status, item.notificationDate)}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.isExcluded ? (
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                          ⚠️ Tidak akan menerima notifikasi
                                        </span>
                                      ) : (
                                        <span>Status: {item.statusDisplayName || 'Belum Diproses'}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {/* Tombol Kirim Sekarang - untuk PENDING, FAILED, RESENT yang tidak dikecualikan */}
                                  {(item.status === 'PENDING' || item.status === 'FAILED' || item.status === 'RESENT') && !item.isExcluded && (
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                                      onClick={async () => {                                        setLoading(true);
                                        try {
                                          // Always use biografiId for consistency
                                          await birthdayAPI.sendBirthdayNotificationForBiografi(item.biografiId);
                                          toast.success('Notifikasi berhasil dikirim!', {
                                            description: `Notifikasi ulang tahun untuk ${item.namaLengkap} telah dikirim`,
                                            duration: 4000
                                          });
                                          await loadUpcoming();
                                        } catch (error) {
                                          toast.error('Gagal mengirim notifikasi', {
                                            description: (error as Error).message,
                                            duration: 5000
                                          });
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      disabled={loading}
                                      title={item.status === 'PENDING' ? 'Kirim Sekarang' : 'Kirim Ulang'}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Tombol Reset ke Pending - untuk semua status kecuali EXCLUDED dan tidak dikecualikan */}
                                  {item.status !== 'EXCLUDED' && !item.isExcluded && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                      onClick={async () => {
                                        setLoading(true);
                                        try {
                                          await birthdayAPI.resetBiografiNotificationToPending(item.biografiId);
                                          
                                          toast.success('Status berhasil direset ke pending!', {
                                            description: `Notifikasi untuk ${item.namaLengkap} dapat dikirim ulang`,
                                            duration: 4000
                                          });
                                          await loadUpcoming();
                                        } catch (error) {
                                          toast.error('Gagal mereset status', {
                                            description: (error as Error).message,
                                            duration: 5000
                                          });
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      disabled={loading}
                                      title="Reset ke Pending"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Tombol Kecualikan/Sertakan */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={item.isExcluded ? 
                                      "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20" : 
                                      "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/20"
                                    }
                                    onClick={async () => {
                                      setLoading(true);
                                      try {
                                        await birthdayAPI.toggleBiografiBirthdayExclusion(item.biografiId, !item.isExcluded);
                                        const action = !item.isExcluded ? 'dikecualikan dari' : 'disertakan dalam';
                                        const statusInfo = !item.isExcluded ? 
                                          'Status: EXCLUDED (tidak akan menerima notifikasi)' : 
                                          'Status: PENDING (akan menerima notifikasi)';
                                        toast.success(`Notifikasi berhasil ${action} pengiriman ulang tahun!`, {
                                          description: `${item.namaLengkap} ${!item.isExcluded ? 'dikecualikan dari' : 'disertakan dalam'} notifikasi otomatis. ${statusInfo}`,
                                          duration: 4000
                                        });
                                        await loadUpcoming();
                                      } catch (error) {
                                        toast.error('Gagal mengubah status notifikasi', {
                                          description: (error as Error).message,
                                          duration: 5000
                                        });
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    title={item.isExcluded ? 'Sertakan' : 'Kecualikan'}
                                  >
                                    {item.isExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="past" className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl">
            <CardHeader className="border-b border-green-100 dark:border-green-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      📋 Ulang Tahun {pastDays} Hari Yang Lalu
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Daftar alumni yang sudah berulang tahun dalam {pastDays} hari terakhir, diurutkan dari yang terbaru
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-green-50 dark:bg-green-950/30 p-1 rounded-xl">
                    {[7, 14, 30].map((days) => (
                      <Button
                        key={days}
                        size="sm"
                        variant={pastDays === days ? "default" : "ghost"}
                        onClick={() => setPastDays(days)}
                        className={pastDays === days ? 
                          "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" : 
                          "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50"
                        }
                      >
                        {days} hari
                      </Button>
                    ))}
                  </div>
                  
                  {past.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBulkResend}
                      disabled={loading || selectedPast.size === 0}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Kirim Sekarang ({selectedPast.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Enhanced Select All Checkbox */}
                {past.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-100 dark:border-green-800">
                    <Checkbox
                      checked={past.length > 0 && selectedPast.size === past.length}
                      onCheckedChange={handleSelectAllPast}
                      className="border-green-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Pilih semua alumni ({selectedPast.size}/{past.length})
                    </span>
                    {selectedPast.size > 0 && (
                      <div className="ml-auto flex gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {selectedPast.size} terpilih
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {past.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-full flex items-center justify-center mb-6">
                      <Clock className="h-12 w-12 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tidak ada riwayat ulang tahun
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Tidak ada member yang berulang tahun dalam {pastDays} hari terakhir
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {past.map((item) => {
                      const today = new Date();
                      const notificationDate = new Date(item.notificationDate);
                      const daysPast = Math.ceil((today.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-400 bg-gradient-to-r from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/10">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">                                <Checkbox
                                  checked={selectedPast.has(item.biografiId)}
                                  onCheckedChange={(checked) => handleSelectPast(item.biografiId, checked as boolean)}
                                  className="border-green-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                  <Cake className="h-8 w-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                    {item.namaLengkap}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(item.tanggalLahir).toLocaleDateString('id-ID')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      Usia: {item.age} tahun
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📞 {item.nomorTelepon}</span>
                                    <span>✉️ {item.email}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right min-w-[140px] space-y-2">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {daysPast === 0 ? '🎂 Hari ini' : 
                                     daysPast === 1 ? '📅 Kemarin' : 
                                     `📅 ${daysPast} hari lalu`}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(item.notificationDate).toLocaleDateString('id-ID')}
                                  </div>
                                  <div className="space-y-1">
                                    {getStatusBadge(item.status, item.notificationDate)}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.isExcluded ? (
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                          ⚠️ Tidak akan menerima notifikasi
                                        </span>
                                      ) : (
                                        <span>Status: {item.statusDisplayName || 'Belum Diproses'}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {/* Tombol Kirim Sekarang - untuk semua status di tab past */}
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                                    onClick={async () => {                                      setLoading(true);
                                      try {
                                        // Always use biografiId for consistency
                                        await birthdayAPI.sendBirthdayNotificationForBiografi(item.biografiId);
                                        toast.success('Notifikasi berhasil dikirim ulang!', {
                                          description: `Notifikasi ulang tahun untuk ${item.namaLengkap} telah dikirim ulang`,
                                          duration: 4000
                                        });
                                        await loadPast();
                                      } catch (error) {
                                        toast.error('Gagal mengirim ulang notifikasi', {
                                          description: (error as Error).message,
                                          duration: 5000
                                        });
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    title="Kirim Sekarang"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">          <BirthdaySettingsForm onSettingsUpdate={() => loadSettings()} />
        </TabsContent>
      </Tabs>

      {/* Notification Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Detail Notifikasi Ulang Tahun
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNotification.namaLengkap}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNotification.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Telepon</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNotification.nomorTelepon}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Lahir</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {new Date(selectedNotification.tanggalLahir).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Umur</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNotification.age} tahun
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Notifikasi</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {new Date(selectedNotification.notificationDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <p className="text-sm">
                      <Badge variant={
                        selectedNotification.status === 'SENT' || selectedNotification.status === 'RESENT' ? 'default' :
                        selectedNotification.status === 'PENDING' ? 'secondary' :
                        selectedNotification.status === 'FAILED' ? 'destructive' :
                        'outline'
                      }>
                        {selectedNotification.statusDisplayName}
                      </Badge>
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNotification.year}
                    </p>
                  </div>
                  
                  {selectedNotification.sentAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dikirim Pada</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {new Date(selectedNotification.sentAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  
                  {selectedNotification.errorMessage && (
                    <div>
                      <label className="text-sm font-medium text-red-700 dark:text-red-300">Pesan Error</label>
                      <p className="text-sm text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {selectedNotification.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedNotification.message && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pesan Notifikasi</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1 whitespace-pre-wrap">
                    {selectedNotification.message}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-gray-700">
                <span>
                  <strong>Dibuat:</strong> {new Date(selectedNotification.createdAt).toLocaleString('id-ID')}
                </span>
                <span>
                  <strong>Diperbarui:</strong> {new Date(selectedNotification.updatedAt).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BirthdayAdmin;
