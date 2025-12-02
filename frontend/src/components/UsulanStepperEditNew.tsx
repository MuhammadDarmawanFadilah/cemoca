"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {  
  ArrowLeft, 
  ArrowRight,
  Calendar,
  CalendarIcon,
  User,
  Mail,
  FileText,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Info,
  X,
  Timer,
  Save,
  Sparkles,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  judul: string;
  rencanaKegiatan: string;
  tanggalMulai: Date | null;
  tanggalSelesai: Date | null;
  durasiUsulan: Date | null;
  gambar: File | null;
}

interface Usulan {
  id: number;
  judul: string;
  rencanaKegiatan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  durasiUsulan: string;
  gambarUrl?: string;
  namaPengusul: string;
  emailPengusul?: string;
}

interface UsulanStepperEditProps {
  usulan: Usulan;
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Detail Usulan',
    description: 'Judul dan deskripsi kegiatan',
    icon: FileText,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    title: 'Jadwal Kegiatan',
    description: 'Waktu pelaksanaan dan deadline',
    icon: Clock,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 3,
    title: 'Media & Preview',
    description: 'Gambar dan pratinjau final',
    icon: CheckCircle2,
    color: 'from-green-500 to-green-600'
  }
];

const UsulanStepperEdit: React.FC<UsulanStepperEditProps> = ({ usulan, onSubmit, loading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    judul: '',
    rencanaKegiatan: '',
    tanggalMulai: null,
    tanggalSelesai: null,
    durasiUsulan: null,
    gambar: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (usulan) {
      setFormData({
        judul: usulan.judul,
        rencanaKegiatan: usulan.rencanaKegiatan,
        tanggalMulai: new Date(usulan.tanggalMulai),
        tanggalSelesai: new Date(usulan.tanggalSelesai),
        durasiUsulan: new Date(usulan.durasiUsulan),
        gambar: null
      });

      if (usulan.gambarUrl) {
        setImagePreview(usulan.gambarUrl);
      }
    }
  }, [usulan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        gambar: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      gambar: null
    }));
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDateChange = (field: 'tanggalMulai' | 'tanggalSelesai' | 'durasiUsulan', date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date || null
    }));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.judul.trim() && formData.rencanaKegiatan.trim());
      case 2:
        return !!(formData.tanggalMulai && formData.tanggalSelesai && formData.durasiUsulan);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const canProceed = (): boolean => {
    return isStepValid(currentStep);
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    await onSubmit(formData);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return format(date, 'dd MMMM yyyy', { locale: id });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Detail Usulan Kegiatan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Berikan informasi detail tentang usulan kegiatan yang akan Anda perbarui
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="judul" className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Judul Usulan 
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="judul"
                  name="judul"
                  value={formData.judul}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul usulan kegiatan yang menarik..."
                  className="text-base h-12 border-2 focus:border-blue-500 transition-colors"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Berikan judul yang jelas dan menarik untuk usulan kegiatan Anda
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="rencanaKegiatan" className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Rencana Kegiatan 
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rencanaKegiatan"
                  name="rencanaKegiatan"
                  value={formData.rencanaKegiatan}
                  onChange={handleInputChange}
                  placeholder="Jelaskan rencana kegiatan secara detail, termasuk tujuan, aktivitas yang akan dilakukan, dan manfaatnya untuk komunitas member..."
                  className="min-h-[180px] text-base border-2 focus:border-purple-500 transition-colors resize-none"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Deskripsikan kegiatan yang akan dilakukan, tujuan, dan manfaatnya secara mendetail
                </p>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-600" />
                  Gambar Kegiatan 
                  <Badge variant="secondary" className="text-xs">Opsional</Badge>
                </Label>
                
                {!imagePreview ? (
                  <div className="relative">
                    <Label 
                      htmlFor="image-upload" 
                      className="group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:border-blue-400 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <ImageIcon className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Upload Gambar Kegiatan
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                          Klik atau drag & drop gambar untuk menambahkan visual menarik
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          PNG, JPG, atau JPEG (Max 5MB)
                        </p>
                      </div>
                      <Input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </Label>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
                      onClick={removeImage}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl mb-4">
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Jadwal Kegiatan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Tentukan waktu pelaksanaan dan deadline untuk usulan kegiatan
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Tanggal Mulai 
                    <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 border-2 hover:border-green-400 transition-colors",
                          !formData.tanggalMulai && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 text-green-600" />
                        {formData.tanggalMulai ? formatDate(formData.tanggalMulai) : "Pilih tanggal mulai kegiatan"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.tanggalMulai || undefined}
                        onSelect={(date) => handleDateChange('tanggalMulai', date)}
                        initialFocus
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    Tanggal Selesai 
                    <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 border-2 hover:border-red-400 transition-colors",
                          !formData.tanggalSelesai && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 text-red-600" />
                        {formData.tanggalSelesai ? formatDate(formData.tanggalSelesai) : "Pilih tanggal selesai kegiatan"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.tanggalSelesai || undefined}
                        onSelect={(date) => handleDateChange('tanggalSelesai', date)}
                        initialFocus
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  Batas Waktu Usulan 
                  <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 border-2 hover:border-orange-400 transition-colors",
                        !formData.durasiUsulan && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-orange-600" />
                      {formData.durasiUsulan ? formatDate(formData.durasiUsulan) : "Pilih batas waktu usulan"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.durasiUsulan || undefined}
                      onSelect={(date) => handleDateChange('durasiUsulan', date)}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Deadline untuk menerima usulan kegiatan dari komunitas member
                </p>
              </div>

              {/* Important Notes */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Catatan Penting Jadwal
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        Tanggal selesai harus setelah tanggal mulai kegiatan
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        Batas waktu usulan adalah deadline untuk menerima usulan dari member
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        Pastikan memberikan waktu yang cukup untuk persiapan kegiatan
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Review & Konfirmasi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Periksa kembali semua detail usulan sebelum menyimpan perubahan
              </p>
            </div>

            {/* Preview Card */}
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {formData.judul}
                      </CardTitle>
                      <p className="text-green-100 text-sm">
                        Usulan kegiatan yang diperbarui
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white text-green-800 font-semibold">
                    UPDATE
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Proposer Info */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Informasi Pengusul
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">{usulan.namaPengusul}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span>{usulan.emailPengusul}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Activity Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Rencana Kegiatan
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {formData.rencanaKegiatan}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Schedule Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Jadwal Kegiatan
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">Mulai</span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 font-semibold">
                        {formatDate(formData.tanggalMulai)}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900 dark:text-red-100">Selesai</span>
                      </div>
                      <p className="text-red-700 dark:text-red-300 font-semibold">
                        {formatDate(formData.tanggalSelesai)}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900 dark:text-orange-100">Deadline</span>
                      </div>
                      <p className="text-orange-700 dark:text-orange-300 font-semibold">
                        {formatDate(formData.durasiUsulan)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-indigo-600" />
                        Gambar Kegiatan
                      </h4>
                      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700">
                        <img 
                          src={imagePreview} 
                          alt="Preview Gambar Kegiatan" 
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-1">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 relative z-10",
                  currentStep >= step.id 
                    ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-lg` 
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-semibold transition-colors",
                    currentStep >= step.id ? "text-gray-900 dark:text-white" : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-24">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-4 rounded-full transition-all duration-300 mt-6",
                  currentStep > step.id 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                    : "bg-gray-200 dark:bg-gray-700"
                )} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mb-4">
          <Progress 
            value={(currentStep / STEPS.length) * 100} 
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 h-12 px-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span>Selanjutnya</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default UsulanStepperEdit;
