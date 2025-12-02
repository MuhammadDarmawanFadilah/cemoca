"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { biografiAPI } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { useMobileDetection } from '@/hooks/useMobileDetection';
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
import {  ArrowLeft, 
  ArrowRight,
  Calendar,
  CalendarIcon,
  User,
  Mail,
  FileText,
  Clock,
  Target,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  Loader2,
  Send,
  UserCheck,
  Lock,
  Info,
  X,
  Timer,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormData {
  judul: string;
  rencanaKegiatan: string;
  tanggalMulai: Date | null;
  tanggalSelesai: Date | null;
  durasiUsulan: Date | null;
  namaPengusul: string;
  emailPengusul: string;
  gambar: File | null;
}

interface UsulanStepperProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Pengusul',
    description: 'Identitas pengusul',
    icon: UserCheck
  },
  {
    id: 2,
    title: 'Detail',
    description: 'Detail usulan',
    icon: FileText
  },
  {
    id: 3,
    title: 'Jadwal',
    description: 'Waktu kegiatan',
    icon: Clock
  },  {
    id: 4,
    title: 'Preview',
    description: 'Pratinjau usulan',
    icon: CheckCircle2
  }
];

const UsulanStepperNew: React.FC<UsulanStepperProps> = ({ onSubmit, loading }) => {
  const { isMobile, isSmallMobile } = useMobileDetection();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    judul: '',
    rencanaKegiatan: '',
    tanggalMulai: null,
    tanggalSelesai: null,
    durasiUsulan: null,
    namaPengusul: '',
    emailPengusul: '',
    gambar: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [biografiLoading, setBiografiLoading] = useState(true);
  const [isAutoFilled, setIsAutoFilled] = useState({
    name: false,
    email: false
  });

  const { user } = useAuth();  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setBiografiLoading(false);
        return;
      }

      try {
        setBiografiLoading(true);
        
        // Use user data directly
        setFormData(prev => ({
          ...prev,
          namaPengusul: user.fullName || '',
          emailPengusul: user.email || ''
        }));
        setIsAutoFilled({
          name: !!user.fullName,
          email: !!user.email
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setBiografiLoading(false);
      }
    };    loadUserData();
  }, [user]);

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
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.namaPengusul.trim() !== '';
      case 2:
        return formData.judul.trim() !== '' && formData.rencanaKegiatan.trim() !== '';
      case 3:
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (
          formData.tanggalMulai !== null &&
          formData.tanggalSelesai !== null &&
          formData.durasiUsulan !== null &&
          formData.tanggalMulai > today &&
          formData.tanggalSelesai >= today &&
          formData.durasiUsulan >= today &&
          formData.tanggalMulai <= formData.tanggalSelesai
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const isFormComplete = (): boolean => {
    return STEPS.every(step => isStepValid(step.id));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (isFormComplete()) {
      await onSubmit(formData);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={`space-y-${isMobile ? '6' : '8'}`}>
            <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
              <div className={`mx-auto ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center ${isMobile ? 'mb-4' : 'mb-6'} shadow-md`}>
                <UserCheck className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-white`} />
              </div>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 dark:text-slate-100 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Informasi Pengusul
              </h3>
              <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
                Isi data diri pengusul usulan
              </p>
            </div>

            {biografiLoading && (
              <div className={`bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-3 text-slate-500" />
                  <span className={`text-slate-600 dark:text-slate-300 ${isMobile ? 'text-sm' : ''}`}>Memuat data...</span>
                </div>
              </div>
            )}

            <div className={`${isMobile ? 'max-w-full mx-auto space-y-5' : 'max-w-md mx-auto space-y-6'}`}>
              <div className="space-y-3 relative">
                <Label htmlFor="namaPengusul" className={`flex items-center justify-between ${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center`}>
                      <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">Nama Lengkap *</span>
                  </div>
                  {isAutoFilled.name && (
                    <Badge className={`bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 ${isMobile ? 'text-xs px-2 py-0.5' : ''}`}>
                      <Lock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
                      {isMobile ? 'Auto' : 'Terkunci'}
                    </Badge>
                  )}
                </Label>
                <Input
                  id="namaPengusul"
                  name="namaPengusul"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={formData.namaPengusul}
                  onChange={handleInputChange}
                  required
                  disabled={biografiLoading || isAutoFilled.name}
                  className={cn(
                    `${isMobile ? 'h-11 text-base' : 'h-12 text-base'} transition-all duration-200 rounded-xl border-2 pr-10`,
                    isAutoFilled.name 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 cursor-not-allowed" 
                      : formData.namaPengusul.trim()
                        ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-gray-900 dark:border-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                  )}
                />
                {formData.namaPengusul.trim() && !isAutoFilled.name && (
                  <div className={`absolute ${isMobile ? 'right-3 top-9' : 'right-3 top-12'} transform -translate-y-1/2`}>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>

              {/* Email Pengusul */}
              <div className="space-y-3 relative">
                <Label htmlFor="emailPengusul" className={`flex items-center justify-between ${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center`}>
                      <Mail className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">Email</span>
                  </div>
                  {isAutoFilled.email && (
                    <Badge className={`bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 ${isMobile ? 'text-xs px-2 py-0.5' : ''}`}>
                      <Lock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
                      {isMobile ? 'Auto' : 'Terkunci'}
                    </Badge>
                  )}
                </Label>
                
                <Input
                  id="emailPengusul"
                  name="emailPengusul"
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={formData.emailPengusul}
                  onChange={handleInputChange}
                  disabled={biografiLoading || isAutoFilled.email}
                  className={cn(
                    `${isMobile ? 'h-11 text-base' : 'h-12 text-base'} transition-all duration-200 rounded-xl border-2 pr-10`,
                    isAutoFilled.email 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 cursor-not-allowed" 
                      : formData.emailPengusul.trim()
                        ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-gray-900 dark:border-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400"
                  )}
                />
                {formData.emailPengusul.trim() && !isAutoFilled.email && (
                  <div className={`absolute ${isMobile ? 'right-3 top-9' : 'right-3 top-12'} transform -translate-y-1/2`}>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );      case 2:
        return (
          <div className={`space-y-${isMobile ? '6' : '8'}`}>
            <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
              <div className={`mx-auto ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center ${isMobile ? 'mb-4' : 'mb-6'} shadow-lg`}>
                <FileText className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-white`} />
              </div>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 dark:text-slate-100 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Detail Usulan
              </h3>
              <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
                Isi detail usulan kegiatan dan lampiran
              </p>
            </div>

            <div className={`${isMobile ? 'max-w-full mx-auto space-y-6' : 'max-w-3xl mx-auto space-y-8'}`}>
              {/* Judul Usulan */}
              <div className="space-y-3 relative">
                <Label htmlFor="judul" className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-emerald-600 rounded-lg flex items-center justify-center`}>
                      <Target className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
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
                    `${isMobile ? 'h-11 text-base' : 'h-11 text-base'} rounded-lg border-2 pr-10 transition-all duration-200`,
                    formData.judul.trim()
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-900 dark:border-gray-100 focus:border-emerald-500 dark:focus:border-emerald-400"
                  )}
                />
                
                {formData.judul.trim() && (
                  <div className={`absolute ${isMobile ? 'right-3 top-9' : 'right-3 top-11'} transform -translate-y-1/2`}>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                
                <div className={`text-right ${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 dark:text-slate-400`}>
                  {formData.judul.length}/100 karakter
                </div>
              </div>

              {/* Rencana Kegiatan - Mobile Optimized */}
              <div className="space-y-3 relative">
                <Label htmlFor="rencanaKegiatan" className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-teal-600 rounded-lg flex items-center justify-center`}>
                      <FileText className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">Rencana Kegiatan *</span>
                  </div>
                </Label>
                
                <Textarea
                  id="rencanaKegiatan"
                  name="rencanaKegiatan"
                  placeholder={isMobile ? "Jelaskan rencana kegiatan secara detail..." : "Jelaskan rencana kegiatan secara detail. Semakin detail rencana yang Anda berikan, semakin mudah untuk direview dan disetujui..."}
                  value={formData.rencanaKegiatan}
                  onChange={handleInputChange}
                  required
                  rows={isMobile ? 8 : 10}
                  className={cn(
                    `${isMobile ? 'text-sm' : 'text-base'} rounded-lg border-2 pr-10 resize-none ${isMobile ? 'min-h-[200px]' : 'min-h-[250px]'} transition-all duration-200`,
                    formData.rencanaKegiatan.trim()
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-900 dark:border-gray-100 focus:border-teal-500 dark:focus:border-teal-400"
                  )}
                />
                
                {formData.rencanaKegiatan.trim() && (
                  <div className={`absolute ${isMobile ? 'right-3 top-9' : 'right-3 top-11'} transform -translate-y-1/2`}>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                
                <div className={`text-right ${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 dark:text-slate-400`}>
                  {formData.rencanaKegiatan.length}/1000 karakter
                </div>
              </div>

              {/* Input Gambar - Mobile Optimized */}
              <div className="space-y-4">
                <Label htmlFor="gambar" className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-amber-600 rounded-lg flex items-center justify-center`}>
                      <ImageIcon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">Gambar Pendukung</span>
                  </div>
                </Label>
                
                <div className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl ${isMobile ? 'p-4' : 'p-8'} text-center hover:border-amber-400 dark:hover:border-amber-500 transition-colors bg-slate-50 dark:bg-slate-700/50`}>
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
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`mx-auto ${isMobile ? 'max-h-32' : 'max-h-48'} rounded-xl shadow-md`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, gambar: null }));
                        }}
                        className={`text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 ${isMobile ? 'text-sm px-3 py-2' : ''}`}
                      >
                        <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                        Hapus Gambar
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="gambar" className="cursor-pointer block">
                      <ImageIcon className={`mx-auto ${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-slate-400 ${isMobile ? 'mb-2' : 'mb-4'}`} />
                      <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'mb-1 text-sm' : 'mb-2'}`}>
                        {isMobile ? 'Tap untuk pilih gambar' : 'Klik untuk memilih gambar pendukung'}
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 dark:text-slate-500`}>
                        PNG, JPG hingga 5MB (Opsional)
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        );      case 3:
        return (
          <div className={`space-y-${isMobile ? '6' : '8'}`}>
            <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
              <div className={`mx-auto ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center ${isMobile ? 'mb-4' : 'mb-6'} shadow-md`}>
                <Clock className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-white`} />
              </div>
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 dark:text-slate-100 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Jadwal Kegiatan
              </h3>
              <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
                Tentukan waktu pelaksanaan kegiatan
              </p>
            </div>

            <div className={`${isMobile ? 'max-w-full mx-auto grid grid-cols-1 gap-5' : 'max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'}`}>
              {currentStep === 3 && [
                { key: 'tanggalMulai', label: 'Tanggal Mulai', icon: Calendar, color: 'bg-slate-600' },
                { key: 'tanggalSelesai', label: 'Tanggal Selesai', icon: Calendar, color: 'bg-slate-600' },
                { key: 'durasiUsulan', label: 'Durasi Usulan', icon: Clock, color: 'bg-slate-600' }
              ].map((field) => (
                <div key={field.key} className="space-y-3 relative">
                  <Label className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>
                    <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${field.color} rounded-lg flex items-center justify-center`}>
                        <field.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
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
                            `w-full ${isMobile ? 'h-11' : 'h-12'} rounded-xl border-2 transition-all duration-200 pl-3 text-left font-normal justify-start`,
                            formData[field.key as keyof FormData]
                              ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/20"
                              : "border-gray-900 dark:border-gray-100",
                            !formData[field.key as keyof FormData] && "text-muted-foreground"
                          )}
                        >
                          <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                            {formData[field.key as keyof FormData] ? (
                              format(formData[field.key as keyof FormData] as Date, "dd MMMM yyyy", { locale: id })
                            ) : (
                              <span>Pilih {field.label.toLowerCase()}</span>
                            )}
                          </span>
                          <CalendarIcon className={`ml-auto ${isMobile ? 'h-4 w-4' : 'h-4 w-4'} opacity-50`} />
                          {formData[field.key as keyof FormData] && (
                            <CheckCircle2 className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-500`} />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={`w-auto p-0 ${isMobile ? 'max-w-[90vw]' : ''}`} align="start">
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
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            caption_dropdowns: "flex justify-center gap-1",
                            vhidden: "hidden",
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: cn(
                              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                            ),
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                            dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                            dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                            dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )) || null}
            </div>
          </div>
        );      case 4:
        return (
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            {/* Header Preview */}
            <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div className={`mx-auto ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center ${isMobile ? 'mb-3' : 'mb-4'} shadow-lg`}>
                <CheckCircle2 className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} text-white`} />
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-800 dark:text-slate-100 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                Preview Usulan
              </h3>
              <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
                {isMobile ? 'Pratinjau usulan Anda' : 'Pratinjau usulan seperti tampilan yang akan dilihat reviewer'}
              </p>
            </div>

            {/* Preview Content - Mobile Optimized */}
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-xl ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
                {/* Main Content Card */}
                <Card className={`overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
                  {/* Header dengan gradient blue-indigo */}
                  <CardHeader className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${isMobile ? 'p-4' : ''}`}>
                    <div className={`${isMobile ? 'space-y-3' : 'flex justify-between items-start mb-4'}`}>
                      <div>
                        <CardTitle className={`${isMobile ? 'text-lg mb-2' : 'text-3xl mb-3'} font-bold`}>
                          {formData.judul || 'Judul Usulan'}
                        </CardTitle>
                        <div className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-6'} text-blue-100`}>
                          <div className="flex items-center space-x-2">
                            <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.namaPengusul || 'Nama Pengusul'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            <span className={`${isMobile ? 'text-sm' : ''}`}>{new Date().toLocaleString('id-ID', {
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      {!isMobile && (
                        <div className="flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-md">
                          <Timer className="h-5 w-5" />
                          <span className="text-sm font-bold">Usulan Baru</span>
                        </div>
                      )}
                    </div>
                    {isMobile && (
                      <div className="flex justify-center">
                        <div className="flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-semibold shadow-md text-sm">
                          <Timer className="h-4 w-4" />
                          <span className="font-bold">Usulan Baru</span>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  {/* Content */}
                  <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                    {/* Gambar jika ada */}
                    {imagePreview && (
                      <div className={`${isMobile ? 'mb-4' : 'mb-8'} relative w-full rounded-xl overflow-hidden shadow-2xl`}>
                        <img
                          src={imagePreview}
                          alt={formData.judul || 'Preview gambar'}
                          width={800}
                          height={400}
                          className="w-full h-auto object-contain bg-gradient-to-br from-gray-50 to-gray-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>
                    )}

                    {/* Info Jadwal dalam Grid - Mobile Optimized */}
                    <div className={`${isMobile ? 'grid grid-cols-1 gap-3 mb-6 p-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6'} bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl`}>
                      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} text-gray-700 dark:text-gray-300`}>
                        <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-blue-100 dark:bg-blue-900 rounded-lg`}>
                          <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 dark:text-blue-400`} />
                        </div>
                        <div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 dark:text-gray-400`}>Periode Kegiatan</p>
                          <p className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                            {formData.tanggalMulai && formData.tanggalSelesai ? (
                              isMobile ? (
                                `${format(formData.tanggalMulai, "dd MMM yyyy", { locale: id })} - ${format(formData.tanggalSelesai, "dd MMM yyyy", { locale: id })}`
                              ) : (
                                `${format(formData.tanggalMulai, "dd MMMM yyyy", { locale: id })} - ${format(formData.tanggalSelesai, "dd MMMM yyyy", { locale: id })}`
                              )
                            ) : (
                              'Belum ditentukan'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} text-gray-700 dark:text-gray-300`}>
                        <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-orange-100 dark:bg-orange-900 rounded-lg`}>
                          <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-orange-600 dark:text-orange-400`} />
                        </div>
                        <div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 dark:text-gray-400`}>Batas Usulan</p>
                          <p className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                            {formData.durasiUsulan ? (
                              format(formData.durasiUsulan, isMobile ? "dd MMM yyyy" : "dd MMMM yyyy", { locale: id })
                            ) : (
                              'Belum ditentukan'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section Rencana Kegiatan */}
                    <div className={`${isMobile ? 'mb-6' : 'mb-10'}`}>
                      <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
                        <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg ${isMobile ? 'mr-2' : 'mr-4'}`}>
                          <FileText className={`${isMobile ? 'h-5 w-5' : 'h-8 w-8'} text-white`} />
                        </div>
                        <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>
                          Rencana Kegiatan
                        </h3>
                      </div>
                      <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl ${isMobile ? 'p-4' : 'p-8'} border-2 border-blue-100 dark:border-gray-600 shadow-xl`}>
                        <div className={`prose ${isMobile ? 'prose-sm' : 'prose-lg'} max-w-none text-gray-800 dark:text-gray-200 leading-relaxed`}>
                          <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : 'text-lg'} font-medium`}>
                            {formData.rencanaKegiatan || 'Belum ada rencana kegiatan'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Voting Section Preview - Mockup - Mobile Optimized */}
                    <div className={`bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl ${isMobile ? 'p-4' : 'p-8'} border-2 border-blue-100 dark:border-gray-600 shadow-xl`}>
                      <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-between'} ${isMobile ? 'mb-4' : 'mb-6'}`}>
                        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white flex items-center`}>
                          <TrendingUp className={`${isMobile ? 'h-5 w-5 mr-2' : 'h-6 w-6 mr-3'} text-blue-600`} />
                          Voting & Diskusi
                        </h3>
                        {!isMobile && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Preview - voting akan aktif setelah usulan dikirim
                          </div>
                        )}
                      </div>
                      
                      {isMobile && (
                        <div className="text-center mb-4">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Voting akan aktif setelah usulan dikirim
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-center space-x-6'}`}>
                        <div className={`flex ${isMobile ? 'justify-center space-x-4' : 'space-x-6'}`}>
                          <button
                            disabled
                            className={`flex items-center space-x-2 ${isMobile ? 'px-4 py-2' : 'px-6 py-3'} rounded-xl border border-green-200 bg-white dark:bg-gray-800 transition-all duration-200 shadow-lg opacity-50 cursor-not-allowed`}
                          >
                            <ArrowUp className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-green-600`} />
                            <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} text-green-600`}>0</span>
                          </button>
                          
                          <button
                            disabled
                            className={`flex items-center space-x-2 ${isMobile ? 'px-4 py-2' : 'px-6 py-3'} rounded-xl border border-red-200 bg-white dark:bg-gray-800 transition-all duration-200 shadow-lg opacity-50 cursor-not-allowed`}
                          >
                            <ArrowDown className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-red-600`} />
                            <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} text-red-600`}>0</span>
                          </button>
                        </div>
                        
                        <div className={`flex items-center ${isMobile ? 'justify-center' : 'space-x-3'} bg-gradient-to-r from-blue-500 to-indigo-500 text-white ${isMobile ? 'px-4 py-2' : 'px-6 py-3'} rounded-xl shadow-lg opacity-75`}>
                          <TrendingUp className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                          <div className="text-center ml-2">
                            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>0</div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>total score</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`${isMobile ? 'mt-4' : 'mt-6'} text-center`}>
                        <div className={`flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} rounded-xl shadow-md opacity-75`}>
                          <MessageCircle className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-blue-500`} />
                          <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                            {isMobile ? 'Komentar akan muncul' : 'Komentar akan muncul di sini'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Konfirmasi */}
            <Card className={`border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50`}>
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                  <Info className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-500 mt-0.5`} />
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-slate-400`}>
                    <p className={`font-medium ${isMobile ? 'mb-1' : 'mb-1'} text-blue-700 dark:text-blue-300`}>
                      {isMobile ? 'Preview Usulan:' : 'Preview Usulan Anda:'}
                    </p>
                    <ul className={`list-disc list-inside ${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
                      <li>{isMobile ? 'Pratinjau usulan Anda' : 'Ini adalah pratinjau bagaimana usulan Anda akan tampil'}</li>
                      <li>{isMobile ? 'Pastikan info sudah benar' : 'Pastikan semua informasi sudah benar sebelum mengirim'}</li>
                      <li>{isMobile ? 'Usulan tidak dapat diubah' : 'Usulan yang telah dikirim tidak dapat diubah'}</li>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-4 md:py-8">
      <div className={`${isMobile ? 'max-w-full mx-auto px-3' : 'max-w-4xl mx-auto px-4'}`}>
        {/* Progress Section */}
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${isMobile ? 'p-4 mb-4' : 'p-6 mb-8'}`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} font-medium`}>
                {isMobile ? `${currentStep}/${STEPS.length}` : `Langkah ${currentStep} dari ${STEPS.length}`}
              </Badge>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-slate-300`}>
                {Math.round(progress)}% selesai
              </span>
            </div>
            {!isMobile && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isFormComplete() ? 'Siap dikirim' : 'Lanjutkan mengisi'}
              </span>
            )}
          </div>
          <Progress value={progress} className={`${isMobile ? 'h-1.5' : 'h-2'} rounded-full bg-slate-200 dark:bg-slate-700`} />
          {isMobile && isFormComplete() && (
            <div className="mt-2 text-center">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Siap dikirim
              </span>
            </div>
          )}
        </div>        {/* Step Indicators */}
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${isMobile ? 'p-4 mb-4' : 'p-6 mb-8'}`}>
          {isMobile ? (
            /* Mobile: Compact Step Indicators */
            <div className="space-y-4">
              {/* Current Step Display */}
              <div className="text-center">
                <div className={cn(
                  "mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm",
                  "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200 dark:shadow-blue-700"
                )}>
                  {React.createElement(STEPS[currentStep - 1].icon, { className: "h-6 w-6" })}
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {STEPS[currentStep - 1].title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>
              
              {/* Mini Step Progress */}
              <div className="flex justify-center space-x-2">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.id || (currentStep === step.id && isStepValid(step.id));
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-200",
                        isCurrent 
                          ? "bg-blue-500 scale-125" 
                          : isCompleted
                            ? "bg-green-500"
                            : "bg-slate-300 dark:bg-slate-600"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            /* Desktop: Full Step Indicators */
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
          )}
        </div>        {/* Step Content */}
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${isMobile ? 'p-4 mb-4' : 'p-8 mb-8'}`}>
          {renderStepContent()}
        </div>        {/* Navigation */}
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${isMobile ? 'p-4' : 'p-6'}`}>
          {isMobile ? (
            /* Mobile Navigation */
            <div className="space-y-4">
              {/* Progress Info */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {currentStep === STEPS.length 
                    ? 'Tinjau usulan sebelum mengirim' 
                    : `${STEPS.length - currentStep} langkah lagi`
                  }
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 disabled:opacity-50 text-sm touch-manipulation"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali</span>
                </Button>

                {currentStep === STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !isFormComplete()}
                    className="flex-[2] flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 text-sm touch-manipulation"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Kirim Usulan</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="flex-[2] flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 text-sm touch-manipulation"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Desktop Navigation */
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {currentStep === STEPS.length 
                    ? 'Tinjau usulan sebelum mengirim' 
                    : `${STEPS.length - currentStep} langkah lagi`
                  }
                </p>
              </div>

              {currentStep === STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isFormComplete()}
                  className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Kirim Usulan</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsulanStepperNew;
