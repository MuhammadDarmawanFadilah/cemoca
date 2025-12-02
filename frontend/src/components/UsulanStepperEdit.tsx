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
  FileText,
  Clock,
  Target,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Save,
  Info,
  X,
  Timer,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  MessageCircle
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
    title: 'Detail',
    description: 'Detail usulan',
    icon: FileText
  },
  {
    id: 2,
    title: 'Jadwal',
    description: 'Waktu kegiatan',
    icon: Clock
  },
  {
    id: 3,
    title: 'Preview',
    description: 'Pratinjau usulan',
    icon: CheckCircle2
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
    const fileInput = document.getElementById('gambar') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                Detail Usulan
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Isi detail usulan kegiatan dan lampiran
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {/* Judul Usulan */}
              <div className="space-y-3 relative">
                <Label htmlFor="judul" className="text-base font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">Judul Usulan *</span>
                  </div>
                </Label>
                
                <Input
                  id="judul"
                  name="judul"
                  type="text"
                  placeholder="Masukkan judul usulan yang menarik"
                  value={formData.judul}
                  onChange={handleInputChange}
                  required
                  className={cn(
                    "h-11 text-base rounded-lg border-2 pr-10 transition-all duration-200",
                    formData.judul.trim()
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-900 dark:border-gray-100 focus:border-emerald-500 dark:focus:border-emerald-400"
                  )}
                />
                
                {formData.judul.trim() && (
                  <div className="absolute right-3 top-11 transform -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                
                <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                  {formData.judul.length}/100 karakter
                </div>
              </div>

              {/* Rencana Kegiatan - Diperbesar */}
              <div className="space-y-3 relative">
                <Label htmlFor="rencanaKegiatan" className="text-base font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">Rencana Kegiatan *</span>
                  </div>
                </Label>
                
                <Textarea
                  id="rencanaKegiatan"
                  name="rencanaKegiatan"
                  placeholder="Jelaskan rencana kegiatan secara detail. Semakin detail rencana yang Anda berikan, semakin mudah untuk direview dan disetujui..."
                  value={formData.rencanaKegiatan}
                  onChange={handleInputChange}
                  required
                  rows={10}
                  className={cn(
                    "text-base rounded-lg border-2 pr-10 resize-none min-h-[250px] transition-all duration-200",
                    formData.rencanaKegiatan.trim()
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-900 dark:border-gray-100 focus:border-teal-500 dark:focus:border-teal-400"
                  )}
                />
                
                {formData.rencanaKegiatan.trim() && (
                  <div className="absolute right-3 top-11 transform -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                
                <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                  {formData.rencanaKegiatan.length}/1000 karakter
                </div>
              </div>

              {/* Input Gambar */}
              <div className="space-y-4">
                <Label htmlFor="gambar" className="text-base font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">Gambar Pendukung</span>
                  </div>
                </Label>
                
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-amber-400 dark:hover:border-amber-500 transition-colors bg-slate-50 dark:bg-slate-700/50">
                  <input
                    id="gambar"
                    name="gambar"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                    {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-md">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto max-h-60 object-contain bg-gradient-to-br from-gray-50 to-gray-100"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={removeImage}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hapus Gambar
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="gambar" className="cursor-pointer block">
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 mb-2">
                        Klik untuk memilih gambar pendukung
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        PNG, JPG hingga 5MB (Opsional)
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mb-6 shadow-md">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                Jadwal Kegiatan
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Tentukan waktu pelaksanaan kegiatan
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'tanggalMulai', label: 'Tanggal Mulai', icon: Calendar, color: 'bg-slate-600' },
                { key: 'tanggalSelesai', label: 'Tanggal Selesai', icon: Calendar, color: 'bg-slate-600' },
                { key: 'durasiUsulan', label: 'Durasi Usulan', icon: Clock, color: 'bg-slate-600' }
              ].map((field) => (
                <div key={field.key} className="space-y-3 relative">
                  <Label className="text-base font-semibold">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${field.color} rounded-lg flex items-center justify-center`}>
                        <field.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-800 dark:text-slate-100">{field.label} *</span>
                    </div>
                  </Label>

                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 rounded-xl border-2 transition-all duration-200 pl-3 text-left font-normal justify-start",
                            formData[field.key as keyof FormData]
                              ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                              : "border-gray-900 dark:border-gray-100",
                            !formData[field.key as keyof FormData] && "text-muted-foreground"
                          )}
                        >
                          {formData[field.key as keyof FormData] ? (
                            format(formData[field.key as keyof FormData] as Date, "dd MMMM yyyy", { locale: id })
                          ) : (
                            <span>Pilih {field.label.toLowerCase()}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          {formData[field.key as keyof FormData] && (
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData[field.key as keyof FormData] as Date || undefined}
                          onSelect={(date) => {
                            setFormData(prev => ({
                              ...prev,
                              [field.key]: date || null
                            }));
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 10}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Header Preview */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Preview Usulan
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Pratinjau usulan seperti tampilan yang akan dilihat reviewer
              </p>
            </div>

            {/* Preview Content - Struktur Sama dengan View Usulan */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4">
              <div className="max-w-4xl mx-auto">
                {/* Main Content Card */}
                <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  {/* Header dengan gradient blue-indigo */}
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <CardTitle className="text-3xl mb-3 font-bold">
                          {formData.judul || 'Judul Usulan'}
                        </CardTitle>
                        <div className="flex items-center space-x-6 text-blue-100">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5" />
                            <span className="font-medium">{usulan.namaPengusul}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>{new Date().toLocaleString('id-ID', {
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-orange-400 text-orange-900 px-4 py-2 rounded-full font-semibold shadow-md">
                        <Timer className="h-5 w-5" />
                        <span className="text-sm font-bold">Edit Usulan</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Content */}
                  <CardContent className="p-8">                    {/* Gambar jika ada */}
                    {imagePreview && (
                      <div className="mb-8 relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-md">
                        <img
                          src={imagePreview}
                          alt={formData.judul || 'Preview gambar'}
                          width={400}
                          height={200}
                          className="w-full h-auto max-h-60 object-contain bg-gradient-to-br from-gray-50 to-gray-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                      </div>
                    )}

                    {/* Info Jadwal dalam Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                      <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Periode Kegiatan</p>
                          <p className="font-semibold">
                            {formData.tanggalMulai && formData.tanggalSelesai ? (
                              `${format(formData.tanggalMulai, "dd MMMM yyyy", { locale: id })} - ${format(formData.tanggalSelesai, "dd MMMM yyyy", { locale: id })}`
                            ) : (
                              'Belum ditentukan'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Batas Usulan</p>
                          <p className="font-semibold">
                            {formData.durasiUsulan ? (
                              format(formData.durasiUsulan, "dd MMMM yyyy", { locale: id })
                            ) : (
                              'Belum ditentukan'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section Rencana Kegiatan */}
                    <div className="mb-10">
                      <div className="flex items-center mb-8">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg mr-4">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Rencana Kegiatan
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl p-8 border-2 border-blue-100 dark:border-gray-600 shadow-xl">
                        <div className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                          <p className="whitespace-pre-wrap text-lg font-medium">
                            {formData.rencanaKegiatan || 'Belum ada rencana kegiatan'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Voting Section Preview - Mockup */}
                    <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl p-8 border-2 border-blue-100 dark:border-gray-600 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                          Voting & Diskusi
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Preview - voting akan tetap aktif setelah diperbarui
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-6">
                        <button
                          disabled
                          className="flex items-center space-x-3 px-6 py-3 rounded-xl border border-green-200 bg-white dark:bg-gray-800 transition-all duration-200 shadow-lg opacity-50 cursor-not-allowed"
                        >
                          <ArrowUp className="h-6 w-6 text-green-600" />
                          <span className="font-bold text-lg text-green-600">0</span>
                        </button>
                        
                        <button
                          disabled
                          className="flex items-center space-x-3 px-6 py-3 rounded-xl border border-red-200 bg-white dark:bg-gray-800 transition-all duration-200 shadow-lg opacity-50 cursor-not-allowed"
                        >
                          <ArrowDown className="h-6 w-6 text-red-600" />
                          <span className="font-bold text-lg text-red-600">0</span>
                        </button>
                        
                        <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg opacity-75">
                          <TrendingUp className="h-6 w-6" />
                          <div className="text-center">
                            <div className="font-bold text-2xl">0</div>
                            <div className="text-sm opacity-90">total score</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md opacity-75">
                          <MessageCircle className="h-6 w-6 text-blue-500" />
                          <span className="font-semibold text-lg">Komentar akan muncul di sini</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Konfirmasi */}
            <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium mb-1 text-blue-700 dark:text-blue-300">Preview Perubahan Usulan:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ini adalah pratinjau bagaimana usulan yang telah diubah akan tampil</li>
                      <li>Pastikan semua informasi sudah benar sebelum menyimpan</li>
                      <li>Perubahan akan segera terlihat setelah disimpan</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                Langkah {currentStep} dari {STEPS.length}
              </Badge>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {Math.round((currentStep / STEPS.length) * 100)}% selesai
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isStepValid(STEPS.length) ? 'Siap disimpan' : 'Lanjutkan mengisi'}
            </span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Step Indicators */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id || (currentStep === step.id && isStepValid(step.id));
              const isCurrent = currentStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center space-y-3 relative z-10"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
                    isCurrent 
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200 dark:shadow-blue-700 scale-110" 
                      : isCompleted
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-200 dark:shadow-green-700"
                        : "bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600"
                  )}>
                    {isCompleted && !isCurrent ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="text-center max-w-20">
                    <p className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      isCurrent 
                        ? "text-blue-600 dark:text-blue-400 font-semibold" 
                        : isCompleted 
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-slate-400 dark:text-slate-500"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {currentStep === STEPS.length 
                  ? 'Tinjau perubahan sebelum menyimpan' 
                  : `${STEPS.length - currentStep} langkah lagi`
                }
              </p>
            </div>

            {currentStep === STEPS.length ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
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
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsulanStepperEdit;
