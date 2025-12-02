"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  User,
  MapPin,
  CheckCircle2,
  Shield,
  Mail,
  Phone,
  Star,
  FileText,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WilayahForm from "@/components/WilayahForm";
import MapLocationPicker from "@/components/MapLocationPicker";
import { useAuth } from "@/contexts/AuthContext";
import { config, getApiUrl } from "@/lib/config";

// Import for image upload
import { imageAPI } from "@/lib/api";

// Enums yang sesuai dengan backend
const TingkatPrioritas = {
  TINGGI: "TINGGI",
  MENENGAH: "MENENGAH",
  RENDAH: "RENDAH"
} as const;

const StatusMember = {
  AKTIF: "AKTIF",
  NONAKTIF: "NONAKTIF"
} as const;

// Schema definition
const memberSchema = z.object({
  // Step 1: Member Info (Required fields)
  nama: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  telepon: z.string().min(1, "Nomor telepon wajib diisi").max(20, "Nomor telepon maksimal 20 karakter"),
  email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  poin: z.number().min(0, "Poin tidak boleh negatif").optional(),
  pekerjaan: z.string().max(100, "Pekerjaan maksimal 100 karakter").optional(), // Made optional
  tingkatPrioritas: z.enum([TingkatPrioritas.TINGGI, TingkatPrioritas.MENENGAH, TingkatPrioritas.RENDAH], {
    required_error: "Tingkat prioritas wajib dipilih"
  }),
  deskripsi: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  status: z.enum([StatusMember.AKTIF, StatusMember.NONAKTIF], {
    required_error: "Status wajib dipilih"
  }),
  foto: z.string().optional(), // Added photo field
  
  // Step 2: Address Info (Optional)
  alamat: z.string().optional(),
  provinsi: z.string().max(10, "Kode provinsi maksimal 10 karakter").optional(),
  kota: z.string().max(10, "Kode kota maksimal 10 karakter").optional(),
  kecamatan: z.string().max(15, "Kode kecamatan maksimal 15 karakter").optional(),
  kelurahan: z.string().max(20, "Kode kelurahan maksimal 20 karakter").optional(),
  kodePos: z.string().max(10, "Kode pos maksimal 10 karakter").optional(),
  latitude: z.number().min(-90).max(90).optional().or(z.string().optional()),
  longitude: z.number().min(-180).max(180).optional().or(z.string().optional()),
});

type MemberFormData = z.infer<typeof memberSchema>;

// Step configuration
const STEPS = [
  {
    id: 'member-info',
    title: 'Data Member',
    description: 'Informasi dasar member',
    icon: User,
    fields: ['nama', 'telepon', 'email', 'poin', 'pekerjaan', 'tingkatPrioritas', 'deskripsi', 'status', 'foto']
  },
  {
    id: 'location',
    title: 'Alamat & Lokasi',
    description: 'Informasi tempat tinggal (opsional)',
    icon: MapPin,
    fields: ['alamat', 'provinsi', 'kota', 'kecamatan', 'kelurahan', 'kodePos', 'latitude', 'longitude']
  }
];

interface Member {
  id: number;
  nama: string;
  telepon: string;
  email: string;
  poin: number;
  pekerjaan?: string; // Made optional
  tingkatPrioritas: string;
  deskripsi?: string;
  status: string;
  foto?: string; // Added photo field
  // Address fields
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MemberFormStepperProps {
  initialData?: Member | Partial<Member>;
  isEdit?: boolean;
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showBackButton?: boolean;
}

export default function MemberFormStepper({ 
  initialData, 
  isEdit = false, 
  onSubmit: customOnSubmit,
  onCancel,
  submitButtonText = "Simpan Member",
  showBackButton = true
}: MemberFormStepperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Photo upload state (same as biografi management)
  const [fotoPreview, setFotoPreview] = useState<string>(() => {
    const photoFilename = 
      initialData?.foto || 
      (initialData as any)?.fotoProfil || 
      (initialData as any)?.image ||
      '';
    
    if (photoFilename) {
      // If it's already a full URL, use it as is
      if (photoFilename.startsWith('http') || photoFilename.startsWith('data:')) {
        return photoFilename;
      }
      // Otherwise, use imageAPI to get the full URL
      return imageAPI.getImageUrl(photoFilename);
    }
    return '';
  });

  const { token } = useAuth();

  // Helper function to get authorization headers
  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }), [token]);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nama: initialData?.nama || "",
      telepon: initialData?.telepon || "",
      email: initialData?.email || "",
      poin: initialData?.poin || 0,
      pekerjaan: initialData?.pekerjaan || "",
      tingkatPrioritas: (initialData?.tingkatPrioritas as any) || TingkatPrioritas.MENENGAH,
      deskripsi: initialData?.deskripsi || "",
      status: (initialData?.status as any) || StatusMember.AKTIF,
      foto: initialData?.foto || (initialData as any)?.fotoProfil || (initialData as any)?.image || "",
      alamat: initialData?.alamat || "",
      provinsi: initialData?.provinsi || "",
      kota: initialData?.kota || "",
      kecamatan: initialData?.kecamatan || "",
      kelurahan: initialData?.kelurahan || "",
      kodePos: initialData?.kodePos || "",
      latitude: initialData?.latitude ? Number(initialData.latitude) : "",
      longitude: initialData?.longitude ? Number(initialData.longitude) : "",
    },
  });



  // Add useEffect for form data persistence
  useEffect(() => {
    const handleUnload = () => {
      const formData = form.getValues();
      sessionStorage.setItem('memberFormData', JSON.stringify(formData));
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [form]);

  // Save form data to session storage on step navigation
  const saveFormData = () => {
    const formData = form.getValues();
    sessionStorage.setItem('memberFormData', JSON.stringify(formData));
  };

  // Enhanced photo upload handler (improved from biografi management)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (10MB max - increased from 2MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    try {
      // Show preview immediately with blob URL
      const blobUrl = URL.createObjectURL(file);
      setFotoPreview(blobUrl);
      
      console.log('Starting member photo upload...');
      toast.loading('Mengunggah gambar...');

      // Upload to backend using imageAPI
      const uploadResult = await imageAPI.uploadImage(file);
      
      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl);

      if (uploadResult.filename) {
        // Update preview with backend URL
        const fullImageUrl = imageAPI.getImageUrl(uploadResult.filename);
        setFotoPreview(fullImageUrl);
        
        // Update form field
        form.setValue("foto", uploadResult.filename);
        
        console.log('Member photo uploaded successfully:', uploadResult.filename);
        toast.dismiss();
        toast.success('Foto berhasil diunggah!');
      } else {
        throw new Error('No filename returned from upload');
      }
    } catch (error) {
      console.error('Member photo upload error:', error);
      toast.dismiss();
      
      // Reset preview on error
      setFotoPreview('');
      form.setValue("foto", "");
      
      // Extract specific error message
      let errorMessage = 'Gagal mengunggah gambar';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    }
  };

  // Remove image handler
  const handleRemoveImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFotoPreview('');
    form.setValue("foto", "");
    toast.success('Foto dihapus');
  };

  // Check for duplicate phone number
  const checkDuplicatePhone = async (phone: string, currentMemberId?: number): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/api/members/search?keyword=' + encodeURIComponent(phone)), {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const members = data.content || data;
        
        // Check if phone exists for other members
        const duplicate = members.find((member: any) => 
          member.telepon === phone && member.id !== currentMemberId
        );
        
        return !!duplicate;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      return false;
    }
  };



  // Step validation
  const validateCurrentStep = async () => {
    const currentStepConfig = STEPS[currentStep];
    const fieldsToValidate = currentStepConfig.fields;
    
    // Get current form values
    const formValues = form.getValues();
    
    // Check required fields for current step
    let isValid = true;

    // Validate step 1 (member info) - has required fields
    if (currentStep === 0) {
      const requiredFields = ['nama', 'telepon', 'email', 'tingkatPrioritas', 'status'];
      for (const field of requiredFields) {
        const value = formValues[field as keyof MemberFormData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          form.setError(field as keyof MemberFormData, {
            type: 'required',
            message: 'Field ini wajib diisi'
          });
          isValid = false;
        }
      }
      
      // Validate email format
      if (formValues.email && !formValues.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        form.setError('email', {
          type: 'pattern',
          message: 'Format email tidak valid'
        });
        isValid = false;
      }

      // Check duplicate phone number
      if (formValues.telepon) {
        const currentMemberId = isEdit && (initialData as any)?.id ? (initialData as any).id : undefined;
        const isDuplicatePhone = await checkDuplicatePhone(formValues.telepon, currentMemberId);
        
        if (isDuplicatePhone) {
          form.setError('telepon', {
            type: 'custom',
            message: 'Nomor telepon sudah digunakan oleh member lain'
          });
          isValid = false;
        }
      }
    }

    // Trigger validation for current step fields
    const result = await form.trigger(fieldsToValidate as any);
    if (!result) {
      isValid = false;
    }

    return isValid;
  };

  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      saveFormData(); // Save before navigation
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      saveFormData(); // Save before navigation
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Allow going to previous steps without validation
    if (stepIndex < currentStep) {
      saveFormData(); // Save before navigation
      setCurrentStep(stepIndex);
      return;
    }
    
    // For forward navigation, validate current step first
    if (stepIndex > currentStep) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        saveFormData(); // Save before navigation
        setCurrentStep(stepIndex);
      }
    }
  };

  // Handle form submission (called by react-hook-form)
  const handleFormSubmit = async (data: MemberFormData) => {
    
    // CRITICAL: Only proceed if we're on the last step
    if (currentStep !== STEPS.length - 1) {
      console.warn("Submit blocked - not on last step");
      return;
    }
    
    // Submit directly without confirmation
    await handleActualSubmit(data);
  };

  // Actual submit handler
  const handleActualSubmit = async (data: MemberFormData) => {
    if (!data) return;
    
    setLoading(true);
    
    try {
      // Convert latitude and longitude to numbers or null
      const lat = data.latitude ? 
        (typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude) : null;
      const lng = data.longitude ? 
        (typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude) : null;
      
      const finalData = {
        ...data,
        latitude: (lat && !isNaN(lat)) ? lat : null,
        longitude: (lng && !isNaN(lng)) ? lng : null,
      };

      console.log('=== MEMBER FORM SUBMISSION DEBUG ===');
      console.log('Form data being submitted:', finalData);
      console.log('Photo field value:', finalData.foto);
      console.log('Is editing?', isEdit);
      console.log('Member ID:', (initialData as any)?.id);
      console.log('=== END DEBUG ===');

      if (customOnSubmit) {
        await customOnSubmit(finalData);
      } else {
        // Default API submission
        const url = isEdit && (initialData as any)?.id 
          ? getApiUrl(`/api/members/${(initialData as any).id}`)
          : getApiUrl('/api/members');
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(finalData),
        });

        if (response.ok) {
          toast.success(`Member berhasil ${isEdit ? 'diperbarui' : 'dibuat'}!`);
          
          // Clear saved form data after successful submit
          sessionStorage.removeItem('memberFormData');
          
          // Navigate back to members page
          router.push('/member');
        } else {
          const errorText = await response.text();
          throw new Error(errorText || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} member`);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      
      // Extract error message from the error object
      let errorMessage = `Gagal ${isEdit ? 'memperbarui' : 'membuat'} member`;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle submit button click specifically
  const handleSubmitButtonClick = () => {
    
    if (currentStep !== STEPS.length - 1) {
      toast.error("Silakan lengkapi semua langkah terlebih dahulu");
      return;
    }
    
    // Trigger form submission directly
    const formData = form.getValues();
    handleActualSubmit(formData);
  };



  const currentStepConfig = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          {isEdit ? "Edit Member" : "Tambah Member Baru"}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Lengkapi data member dengan informasi yang akurat
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2 md:space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">
            Langkah {currentStep + 1} dari {STEPS.length}
          </span>
          <span className="text-xs md:text-sm font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1 md:h-2" />
      </div>

      {/* Step Navigation - Mobile Responsive */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = index <= currentStep;
          
          return (
            <Button
              key={step.id}
              variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 h-auto p-3 md:p-4 transition-all",
                isAccessible && "cursor-pointer hover:scale-105",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isAccessible && handleStepClick(index)}
              disabled={!isAccessible}
            >
              <div className="flex items-center gap-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </div>
              <span className="text-xs md:text-sm font-medium text-center leading-tight">
                {step.title}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground text-center leading-tight">
                {step.description}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="border-2">
        <CardHeader className="border-b bg-muted/30 p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <currentStepConfig.icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">{currentStepConfig.title}</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                {currentStepConfig.description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 md:p-6">
          <Form {...form}>
            <form className="space-y-4 md:space-y-6">
              {/* Step Content Based on Current Step */}
              {currentStep === 0 && (
                <MemberInfoStep 
                  form={form} 
                  isEdit={isEdit}
                  fotoPreview={fotoPreview}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                />
              )}
              
              {currentStep === 1 && (
                <LocationStep form={form} />
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 md:pt-6 border-t">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handlePrev}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>
                  )}

                  {showBackButton && onCancel && currentStep === 0 && (
                    <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                      Kembali
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {currentStep < STEPS.length - 1 ? (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      Selanjutnya
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      disabled={loading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                      onClick={handleSubmitButtonClick}
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {submitButtonText}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

const MemberInfoStep = React.memo(function MemberInfoStep({ 
  form, 
  isEdit,
  fotoPreview,
  fileInputRef,
  handleImageUpload
}: { 
  form: any;
  isEdit: boolean;
  fotoPreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Photo Upload */}
      <div className="flex flex-col items-center space-y-3 md:space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
            <AvatarImage src={fotoPreview} alt="Foto profil" />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-lg sm:text-2xl md:text-3xl font-semibold">
              {form.getValues("nama")?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="sm"
            className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Foto Profil</p>
          <p className="text-xs text-muted-foreground">
            Opsional - Ukuran maksimal 10MB, format JPG/PNG
          </p>
        </div>
      </div>

      <Separator />

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nama Lengkap *
              </FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="telepon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor Telepon *
                </FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nomor telepon" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Masukkan email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="poin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Poin Pelanggan
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    disabled
                    value={0}
                    placeholder="0"
                    className="bg-muted"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Poin akan bertambah otomatis saat melakukan pemesanan
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pekerjaan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Pekerjaan
                </FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan pekerjaan (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="tingkatPrioritas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Tingkat Prioritas *
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat prioritas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TingkatPrioritas.TINGGI}>Prioritas Tinggi</SelectItem>
                    <SelectItem value={TingkatPrioritas.MENENGAH}>Prioritas Menengah</SelectItem>
                    <SelectItem value={TingkatPrioritas.RENDAH}>Prioritas Rendah</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Status *
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={StatusMember.AKTIF}>Aktif</SelectItem>
                    <SelectItem value={StatusMember.NONAKTIF}>Non Aktif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deskripsi"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Deskripsi/Catatan
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Catatan tambahan mengenai member (misal: pernah ada masalah pembayaran, preferensi khusus, dll)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Opsional - untuk mencatat informasi penting tentang member
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

const LocationStep = React.memo(function LocationStep({ form }: { form: any }) {
  const handleLocationChange = useCallback((lat: number | null, lng: number | null) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  }, [form]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <MapPin className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-semibold">Informasi Alamat</h3>
        </div>
        <p className="text-muted-foreground">
          Tambahkan informasi alamat karyawan (opsional)
        </p>
      </div>

      <WilayahForm 
        control={form.control}
        setValue={form.setValue}
        watch={form.watch}
        onDataLoad={() => {
          // WilayahForm data loaded
        }}
      />
      
      {/* Map Location Picker */}
      <MapLocationPicker
        latitude={form.watch("latitude")}
        longitude={form.watch("longitude")}
        onLocationChange={handleLocationChange}
      />
    </div>
  );
});
