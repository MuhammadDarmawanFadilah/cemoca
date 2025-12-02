"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarIcon, 
  Upload, 
  Save, 
  X, 
  ArrowRight, 
  ArrowLeft,
  User,
  GraduationCap,
  MapPin,
  Briefcase,
  Award,
  Heart,
  Share2,
  FileText,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { biografiAPI, imageAPI, BiografiRequest, Biografi, WorkExperience, Achievement, SpesialisasiKedokteran } from "@/lib/api";
import { toast } from "sonner";
import WorkExperienceList from "@/components/WorkExperienceList";
import AcademicRecordList, { AcademicRecord } from "@/components/AcademicRecordList";
import AchievementList from "@/components/AchievementList";
import HobbyList from "@/components/HobbyList";
import SpesialisasiKedokteranList from "@/components/SpesialisasiKedokteranList";
import { Combobox } from "@/components/ui/combobox-enhanced";
import { convertToComboboxOptions } from "@/lib/indonesia-data";
import WilayahForm from "@/components/WilayahForm";
import MapLocationPicker from "@/components/MapLocationPicker";

// Import existing data arrays
const AGAMA_OPTIONS = [
  "Islam",
  "Kristen Protestan", 
  "Kristen Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya"
];

const SPESIALISASI_KEDOKTERAN_OPTIONS = [
  "Dokter Umum",
  "Spesialis Anak (Sp.A)",
  "Spesialis Penyakit Dalam (Sp.PD)",
  "Spesialis Bedah (Sp.B)",
  "Spesialis Jantung dan Pembuluh Darah (Sp.JP)",
  "Spesialis Mata (Sp.M)",
  "Spesialis THT-KL (Sp.THT-KL)",
  "Spesialis Kulit dan Kelamin (Sp.KK)",
  "Spesialis Kandungan (Sp.OG)",
  "Spesialis Saraf (Sp.S)",
  "Spesialis Psikiatri (Sp.KJ)",
  "Spesialis Radiologi (Sp.Rad)",
  "Spesialis Anestesiologi (Sp.An)",
  "Spesialis Patologi Anatomi (Sp.PA)",
  "Spesialis Patologi Klinik (Sp.PK)",
  "Spesialis Mikrobiologi Klinik (Sp.MK)",
  "Spesialis Forensik (Sp.F)",
  "Spesialis Rehabilitasi Medik (Sp.RM)",
  "Spesialis Kedokteran Nuklir (Sp.KN)",
  "Spesialis Kedokteran Jiwa (Sp.KJ)",
  "Spesialis Bedah Saraf (Sp.BS)",
  "Spesialis Bedah Plastik (Sp.BP)",
  "Spesialis Bedah Anak (Sp.BA)",
  "Spesialis Bedah Toraks dan Kardiovaskular (Sp.BTKV)",
  "Spesialis Urologi (Sp.U)",
  "Spesialis Ortopedi dan Traumatologi (Sp.OT)",
  "Spesialis Kedokteran Fisik dan Rehabilitasi (Sp.KFR)",
  "Spesialis Onkologi Radiasi (Sp.OnkRad)",
  "Spesialis Gizi Klinik (Sp.GK)",
  "Spesialis Kedokteran Okupasi (Sp.OK)",
  "Spesialis Kedokteran Olahraga (Sp.KO)",
  "Spesialis Parasitologi (Sp.ParK)",
  "Spesialis Farmakologi Klinik (Sp.FK)",
  "Dokter Gigi Umum",
  "Spesialis Bedah Mulut (Sp.BM)",
  "Spesialis Konservasi Gigi (Sp.KG)",
  "Spesialis Periodonsia (Sp.Perio)",
  "Spesialis Prosthodonsia (Sp.Pros)",
  "Spesialis Ortodonsia (Sp.Ort)",
  "Spesialis Kedokteran Gigi Anak (Sp.KGA)",
  "Spesialis Penyakit Mulut (Sp.PM)",
  "Spesialis Radiologi Kedokteran Gigi (Sp.RKG)",
  "Tenaga Kesehatan Lainnya",
  "Peneliti Medis",
  "Dosen Kedokteran",
  "Tidak Praktik (Non-Medis)"
];

// Schema definition
const biografiSchema = z.object({
  // Mandatory fields
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi").max(100, "Nama lengkap maksimal 100 karakter"),
  alumniTahun: z.string().min(1, "Tahun alumni wajib diisi"),
  email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  nomorTelepon: z.string().min(1, "Nomor telepon wajib diisi").max(20, "Nomor telepon maksimal 20 karakter"),
  
  // Optional fields
  nim: z.string().max(20, "NIM maksimal 20 karakter").optional(),
  tanggalLahir: z.date().optional(),
  tempatLahir: z.string().max(100, "Tempat lahir maksimal 100 karakter").optional(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  agama: z.string().max(50, "Agama maksimal 50 karakter").optional(),
  posisiJabatan: z.string().max(100, "Posisi/Jabatan maksimal 100 karakter").optional(),
  foto: z.string().optional(),  alamat: z.string().optional(),
  provinsi: z.string().max(10, "Kode provinsi maksimal 10 karakter").optional(),
  kota: z.string().max(10, "Kode kota maksimal 10 karakter").optional(),
  kecamatan: z.string().max(15, "Kode kecamatan maksimal 15 karakter").optional(),
  kelurahan: z.string().max(20, "Kode kelurahan maksimal 20 karakter").optional(),
  kodePos: z.string().max(10, "Kode pos maksimal 10 karakter").optional(),
  latitude: z.number().min(-90).max(90).optional().or(z.string().optional()),
  longitude: z.number().min(-180).max(180).optional().or(z.string().optional()),
  prestasi: z.string().optional(),instagram: z.string().max(200, "Instagram maksimal 200 karakter").optional(),
  youtube: z.string().max(200, "YouTube maksimal 200 karakter").optional(),
  linkedin: z.string().max(200, "LinkedIn maksimal 200 karakter").optional(),
  facebook: z.string().max(200, "Facebook maksimal 200 karakter").optional(),
  tiktok: z.string().max(200, "TikTok maksimal 200 karakter").optional(),
  telegram: z.string().max(200, "Telegram maksimal 200 karakter").optional(),  catatan: z.string().optional(),
  status: z.enum(["AKTIF", "TIDAK_AKTIF", "DRAFT"]).optional(),
});

type BiografiFormData = z.infer<typeof biografiSchema>;

// Step configuration
const STEPS = [
  {
    id: 'personal',
    title: 'Informasi Pribadi',
    description: 'Data dasar dan identitas',
    icon: User,
    fields: ['namaLengkap', 'nim', 'alumniTahun', 'email', 'nomorTelepon', 'foto']
  },
  {
    id: 'profile',
    title: 'Profil Lengkap',
    description: 'Detail pribadi dan demografi',
    icon: GraduationCap,
    fields: ['tanggalLahir', 'tempatLahir', 'jenisKelamin', 'agama']
  },  {
    id: 'location',
    title: 'Lokasi & Alamat',
    description: 'Informasi tempat tinggal',
    icon: MapPin,
    fields: ['alamat', 'provinsi', 'kota', 'kecamatan', 'kelurahan', 'kodePos', 'latitude', 'longitude']
  },{
    id: 'career',
    title: 'Karir & Pendidikan',
    description: 'Pengalaman dan prestasi',
    icon: Briefcase,
    fields: ['posisiJabatan', 'workExperiences', 'academicRecords', 'achievements', 'spesialisasiKedokteran']
  },
  {
    id: 'interests',
    title: 'Minat & Hobi',
    description: 'Aktivitas dan kegemaran',
    icon: Heart,
    fields: ['hobbies']
  },
  {
    id: 'social',
    title: 'Media Sosial',
    description: 'Kontak dan jaringan sosial',
    icon: Share2,
    fields: ['instagram', 'youtube', 'linkedin', 'facebook', 'tiktok', 'telegram']
  },  {
    id: 'notes',
    title: 'Catatan Tambahan',
    description: 'Informasi pelengkap',
    icon: FileText,
    fields: ['catatan']
  }
];

interface BiografiFormStepperProps {
  initialData?: Biografi | Partial<Biografi>;
  isEdit?: boolean;
  redirectUrl?: string;
  onSubmit?: (data: any) => Promise<void>;
  submitButtonText?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  isRegistration?: boolean;
}

export default function BiografiFormStepper({ 
  initialData, 
  isEdit = false, 
  redirectUrl = "/biografi",
  onSubmit: customOnSubmit,
  submitButtonText = "Simpan Biografi",
  showBackButton = false,
  onBack,
  isRegistration = false
}: BiografiFormStepperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BiografiFormData | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>(() => {
    const photoFilename = 
      initialData?.foto || 
      (initialData as any)?.fotoProfil || 
      (initialData as any)?.image ||
      "";
    
    if (photoFilename) {
      return imageAPI.getImageUrl(photoFilename);
    }
    return "";
  });

  // State for complex fields
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(
    (initialData as any)?.workExperiences?.length 
      ? (initialData as any).workExperiences 
      : []
  );
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>(
    (initialData as any)?.academicRecords?.length 
      ? (initialData as any).academicRecords 
      : []
  );
  const [achievements, setAchievements] = useState<Achievement[]>(
    (initialData as any)?.achievements?.length 
      ? (initialData as any).achievements 
      : []
  );  const [hobbies, setHobbies] = useState<string[]>(() => {
    if (initialData?.hobi) {
      return initialData.hobi.split(',').map(h => h.trim()).filter(h => h.length > 0);
    }
    return [""];
  });
  const [spesialisasiKedokteran, setSpesialisasiKedokteran] = useState<SpesialisasiKedokteran[]>(
    (initialData as any)?.spesialisasiKedokteran?.length 
      ? (initialData as any).spesialisasiKedokteran 
      : []
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BiografiFormData>({
    resolver: zodResolver(biografiSchema),
    defaultValues: {
      namaLengkap: initialData?.namaLengkap || "",
      nim: initialData?.nim || "",
      alumniTahun: (initialData as any)?.alumniTahun || "",
      email: initialData?.email || "",
      nomorTelepon: initialData?.nomorTelepon || (initialData as any)?.nomorHp || "",
      tanggalLahir: initialData?.tanggalLahir ? new Date(initialData.tanggalLahir) : undefined,
      tempatLahir: initialData?.tempatLahir || "",
      jenisKelamin: initialData?.jenisKelamin as "LAKI_LAKI" | "PEREMPUAN" || undefined,
      agama: initialData?.agama || "",
      posisiJabatan: (() => {
        if (initialData?.workExperiences && initialData.workExperiences.length > 0) {
          const latest = initialData.workExperiences
            .sort((a, b) => {
              const dateA = a.tanggalMulai ? new Date(a.tanggalMulai).getTime() : 0;
              const dateB = b.tanggalMulai ? new Date(b.tanggalMulai).getTime() : 0;
              return dateB - dateA;
            })[0];
          return latest.posisi || "";
        }        return (initialData as any)?.posisiJabatan || "";
      })(),      foto: initialData?.foto || (initialData as any)?.fotoProfil || (initialData as any)?.image || "",      alamat: initialData?.alamat || "",
      provinsi: initialData?.provinsi || "",
      kota: initialData?.kota || "",      kecamatan: (initialData as any)?.kecamatan || "",
      kelurahan: (initialData as any)?.kelurahan || "",
      kodePos: (initialData as any)?.kodePos || "",
      latitude: (initialData as any)?.latitude ? Number((initialData as any).latitude) : "",
      longitude: (initialData as any)?.longitude ? Number((initialData as any).longitude) : "",
      prestasi: initialData?.prestasi || "",instagram: initialData?.instagram || "",
      youtube: initialData?.youtube || "",
      linkedin: initialData?.linkedin || "",
      facebook: initialData?.facebook || "",
      tiktok: (initialData as any)?.tiktok || "",
      telegram: (initialData as any)?.telegram || "",
      catatan: initialData?.catatan || "",
      status: initialData?.status || "AKTIF",
    },
  });

  // Add useEffect for form data persistence
  useEffect(() => {
    const handleUnload = () => {
      const formData = form.getValues();
      sessionStorage.setItem('biografiFormData', JSON.stringify(formData));
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [form]);
  // Load form data from session storage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('biografiFormData');
    if (savedData && !initialData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach(key => {
          if (parsedData[key] !== undefined && parsedData[key] !== "") {
            if (key === 'tanggalLahir' && parsedData[key]) {
              form.setValue(key as any, new Date(parsedData[key]));
            } else {
              form.setValue(key as any, parsedData[key]);
            }
          }
        });
        toast.info("Data form sebelumnya dimuat dari cache");
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, [form, initialData]);
  // Save form data to session storage on any form change
  useEffect(() => {
    const subscription = form.watch((data: any) => {
      if (Object.keys(data).some(key => data[key] && data[key] !== "")) {
        saveFormData();
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);// Save form data to session storage on step navigation
  const saveFormData = () => {
    const formData = form.getValues();
    // Convert Date objects to ISO strings for storage
    const dataToSave = { ...formData } as any;
    if (dataToSave.tanggalLahir && dataToSave.tanggalLahir instanceof Date) {
      dataToSave.tanggalLahir = dataToSave.tanggalLahir.toISOString();
    }
    sessionStorage.setItem('biografiFormData', JSON.stringify(dataToSave));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar");
        return;
      }

      try {
        const blobUrl = URL.createObjectURL(file);
        setFotoPreview(blobUrl);
        
        toast.loading("Mengunggah gambar...");
        const uploadResult = await imageAPI.uploadImage(file);
        
        URL.revokeObjectURL(blobUrl);
        const fullImageUrl = imageAPI.getImageUrl(uploadResult.filename);
        
        setFotoPreview(fullImageUrl);
        form.setValue("foto", uploadResult.filename);
        
        toast.dismiss();
        toast.success("Gambar berhasil diunggah");      } catch (error) {
        console.error("Upload error:", error);
        toast.dismiss();
        
        // Extract specific error message
        let errorMessage = "Gagal mengunggah gambar";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        toast.error(errorMessage);
        setFotoPreview("");
        form.setValue("foto", "");
      }
    }
  };
  // Step validation
  const validateCurrentStep = async () => {
    const currentStepConfig = availableSteps[currentStep];
    const fieldsToValidate = currentStepConfig.fields;
    
    // Get current form values
    const formValues = form.getValues();
    
    // Check required fields for current step
    let isValid = true;
    let hasErrors = false;

    // Validate step 1 (personal info) - has required fields
    if (currentStep === 0) {
      const requiredFields = ['namaLengkap', 'alumniTahun', 'email', 'nomorTelepon'];
      for (const field of requiredFields) {
        const value = formValues[field as keyof BiografiFormData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          form.setError(field as keyof BiografiFormData, {
            type: 'required',
            message: 'Field ini wajib diisi'
          });
          isValid = false;
          hasErrors = true;
        }
      }
      
      // Validate email format
      if (formValues.email && !formValues.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        form.setError('email', {
          type: 'pattern',
          message: 'Format email tidak valid'
        });
        isValid = false;
        hasErrors = true;
      }
    }

    // Trigger validation for current step fields
    const result = await form.trigger(fieldsToValidate as any);
    if (!result) {
      isValid = false;
    }

    return isValid;
  };  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < availableSteps.length - 1) {
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
  };// Handle form submission (called by react-hook-form)
  const handleFormSubmit = async (data: BiografiFormData) => {
    console.log("Form submit triggered from step:", currentStep);
      // CRITICAL: Only proceed if we're on the last step AND the submit button was actually clicked
    if (currentStep !== availableSteps.length - 1) {
      console.warn("Submit blocked - not on last step");
      // Don't show error toast here as this might be called during navigation
      return;
    }
    
    // Show confirmation dialog only for actual submit
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Actual submit handler (called after confirmation)
  const handleActualSubmit = async () => {
    if (!pendingFormData) return;
    
    setLoading(true);
    setShowConfirmDialog(false);
      try {
      // Convert latitude and longitude to numbers or null
      const lat = pendingFormData.latitude ? 
        (typeof pendingFormData.latitude === 'string' ? parseFloat(pendingFormData.latitude) : pendingFormData.latitude) : null;
      const lng = pendingFormData.longitude ? 
        (typeof pendingFormData.longitude === 'string' ? parseFloat(pendingFormData.longitude) : pendingFormData.longitude) : null;
      
      const finalData: BiografiRequest = {
        ...pendingFormData,
        tanggalLahir: pendingFormData.tanggalLahir ? format(pendingFormData.tanggalLahir, "yyyy-MM-dd") : undefined,
        latitude: (lat && !isNaN(lat)) ? lat : null,
        longitude: (lng && !isNaN(lng)) ? lng : null,
        hobi: hobbies.filter(h => h.trim()).join(', '),
        workExperiences,
        academicRecords,
        achievements,
        spesialisasiKedokteran,
      };if (customOnSubmit) {
        await customOnSubmit(finalData);
      } else {
        if (isEdit && (initialData as any)?.biografiId) {
          await biografiAPI.updateBiografi((initialData as any).biografiId, finalData);
          toast.success("Biografi berhasil diperbarui!");
        } else {
          await biografiAPI.createBiografi(finalData);
          toast.success("Biografi berhasil dibuat!");
        }
        
        // Clear saved form data after successful submit
        sessionStorage.removeItem('biografiFormData');
        
        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }    } catch (error) {
      console.error("Submit error:", error);
      
      // Extract error message from the error object
      let errorMessage = `Gagal ${isEdit ? 'memperbarui' : 'membuat'} biografi`;
      
      if (error instanceof Error) {
        // Use the specific error message from the API
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setPendingFormData(null);
    }
  };  // Handle submit button click specifically
  const handleSubmitButtonClick = () => {
    console.log("Submit button clicked on step:", currentStep);
    
    if (currentStep !== STEPS.length - 1) {
      toast.error("Silakan lengkapi semua langkah terlebih dahulu");
      return;
    }
    
    // Trigger form submission
    const formData = form.getValues();
    setPendingFormData(formData);
    setShowConfirmDialog(true);
  };

  // Cancel submit
  const cancelSubmit = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);  };
  // All steps are available for both registration and edit modes
  const getAvailableSteps = () => {
    return STEPS;
  };

  const availableSteps = getAvailableSteps();
  const currentStepConfig = availableSteps[currentStep];
  const progress = ((currentStep + 1) / availableSteps.length) * 100;
  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          {isEdit ? "Edit Biografi" : "Buat Biografi Baru"}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Lengkapi profil Anda dengan informasi yang akurat dan terkini
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2 md:space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">
            Langkah {currentStep + 1} dari {availableSteps.length}
          </span>
          <span className="text-xs md:text-sm font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1 md:h-2" />
      </div>

      {/* Step Navigation - Mobile Responsive */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-1 md:gap-2">
        {availableSteps.map((step, index) => {
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
                "flex flex-col items-center gap-1 h-auto p-1.5 md:p-3 transition-all",
                isAccessible && "cursor-pointer hover:scale-105",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isAccessible && handleStepClick(index)}
              disabled={!isAccessible}
            >
              <div className="flex items-center gap-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                ) : (
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </div>
              <span className="text-[10px] md:text-xs font-medium text-center leading-tight">
                {step.title}
              </span>
            </Button>
          );
        })}
      </div>      {/* Step Content */}
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
                <PersonalInfoStep 
                  form={form} 
                  fotoPreview={fotoPreview}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                />
              )}
              
              {currentStep === 1 && (
                <ProfileStep form={form} />
              )}
              
              {currentStep === 2 && (
                <LocationStep form={form} />
              )}
                {currentStep === 3 && (
                <CareerStep 
                  form={form}
                  workExperiences={workExperiences}
                  setWorkExperiences={setWorkExperiences}
                  academicRecords={academicRecords}
                  setAcademicRecords={setAcademicRecords}
                  achievements={achievements}
                  setAchievements={setAchievements}
                  spesialisasiKedokteran={spesialisasiKedokteran}
                  setSpesialisasiKedokteran={setSpesialisasiKedokteran}
                />
              )}
              
              {currentStep === 4 && (
                <InterestsStep 
                  hobbies={hobbies}
                  setHobbies={setHobbies}
                />
              )}
              
              {currentStep === 5 && (
                <SocialStep form={form} />
              )}
              
              {currentStep === 6 && (
                <NotesStep form={form} />
              )}              {/* Navigation Buttons */}
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
                  )}                  {showBackButton && onBack && currentStep === 0 && (
                    <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
                      Kembali
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep < availableSteps.length - 1 ? (
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
              </div>            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Konfirmasi Penyimpanan
            </DialogTitle>
            <DialogDescription className="text-left">
              Apakah Anda yakin ingin {isEdit ? 'memperbarui' : 'menyimpan'} data biografi ini? 
              Pastikan semua informasi yang Anda masukkan sudah benar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelSubmit}
              disabled={loading}
            >
              Batal
            </Button>            <Button
              type="button"
              onClick={handleActualSubmit}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'Perbarui' : 'Simpan'} Biografi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Step Components
function PersonalInfoStep({ 
  form, 
  fotoPreview, 
  fileInputRef, 
  handleImageUpload 
}: { 
  form: any;
  fotoPreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Photo Upload */}
      <div className="flex flex-col items-center space-y-3 md:space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
            <AvatarImage src={fotoPreview} alt="Foto profil" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg sm:text-2xl md:text-3xl font-semibold">
              {form.getValues("namaLengkap")?.charAt(0) || "?"}
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
            Ukuran maksimal 2MB, format JPG/PNG
          </p>
        </div>
      </div>

      <Separator />

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <FormField
          control={form.control}
          name="namaLengkap"
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
            name="nim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIM</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan NIM (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alumniTahun"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Tahun Alumni *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun alumni" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Masukkan email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nomorTelepon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon *</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nomor telepon" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      </div>
    </div>
  );
}

function ProfileStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="tempatLahir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Lahir</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan tempat lahir" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />        <FormField          control={form.control}
          name="tanggalLahir"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Lahir</FormLabel>
              <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih tanggal lahir (opsional)</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}                      onSelect={(date) => {
                        field.onChange(date);
                        // Auto-close after date selection - handled by default
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
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
                      dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"                    }}
                  />
                </PopoverContent>              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jenisKelamin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl>
                <Combobox
                  options={convertToComboboxOptions(AGAMA_OPTIONS)}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Pilih agama"
                  searchPlaceholder="Cari agama..."
                  emptyMessage="Agama tidak ditemukan"
                  name={field.name}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function LocationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <WilayahForm 
        control={form.control}
        setValue={form.setValue}
        watch={form.watch}
        onDataLoad={() => {
          console.log('WilayahForm data loaded in LocationStep');
        }}
      />
        {/* Map Location Picker */}
      <MapLocationPicker
        latitude={form.watch("latitude")}
        longitude={form.watch("longitude")}
        onLocationChange={(lat, lng) => {
          form.setValue("latitude", lat);
          form.setValue("longitude", lng);
        }}
      />
    </div>
  );
}

function CareerStep({ 
  form, 
  workExperiences, 
  setWorkExperiences,
  academicRecords,
  setAcademicRecords,
  achievements,
  setAchievements,
  spesialisasiKedokteran,
  setSpesialisasiKedokteran
}: { 
  form: any;
  workExperiences: WorkExperience[];
  setWorkExperiences: (experiences: WorkExperience[]) => void;
  academicRecords: any[];
  setAcademicRecords: (records: any[]) => void;
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  spesialisasiKedokteran: SpesialisasiKedokteran[];  setSpesialisasiKedokteran: (spesialisasi: SpesialisasiKedokteran[]) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Work Experience */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Kerja dimana dok?</h3>
        <WorkExperienceList 
          workExperiences={workExperiences}
          onChange={setWorkExperiences}        />
      </div>
      
      <Separator />

      {/* Spesialisasi Kedokteran - Dynamic List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Spesialisasi Kedokteran</h3>
        </div>
        <SpesialisasiKedokteranList 
          spesialisasiList={spesialisasiKedokteran}
          onChange={setSpesialisasiKedokteran}
        />
      </div>

      <Separator />

      {/* Academic Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Riwayat Pendidikan</h3>
        <AcademicRecordList 
          academicRecords={academicRecords}
          onChange={setAcademicRecords}
        />
      </div>

      <Separator />

      {/* Achievements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Prestasi</h3>
        </div>
        <AchievementList 
          achievements={achievements}
          onChange={setAchievements}
        />
      </div>
    </div>
  );
}

function InterestsStep({ 
  hobbies, 
  setHobbies 
}: { 
  hobbies: string[];
  setHobbies: (hobbies: string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h3 className="text-xl font-semibold">Minat & Hobi</h3>
        </div>
        <p className="text-muted-foreground">
          Ceritakan tentang aktivitas dan kegemaran Anda
        </p>
      </div>
      
      <Card className="border-dashed">
        <CardContent className="p-6">          <HobbyList 
            hobbies={hobbies}
            onChange={setHobbies}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SocialStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Share2 className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-semibold">Media Sosial</h3>
        </div>
        <p className="text-muted-foreground">
          Tambahkan tautan media sosial Anda (opsional)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-sm" />
                Instagram
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://instagram.com/username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkedin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-600 rounded-sm" />
                LinkedIn
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://linkedin.com/in/username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="youtube"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-red-600 rounded-sm" />
                YouTube
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://youtube.com/@username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />        <FormField
          control={form.control}
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-800 rounded-sm" />
                Facebook
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://facebook.com/username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tiktok"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-black rounded-sm" />
                TikTok
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://tiktok.com/@username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telegram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-500 rounded-sm" />
                Telegram
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://t.me/username"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function NotesStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-6 w-6 text-green-500" />
          <h3 className="text-xl font-semibold">Catatan Tambahan</h3>
        </div>
        <p className="text-muted-foreground">
          Informasi pelengkap dan pengaturan akun
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan Tambahan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Catatan atau informasi tambahan lainnya"
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6">
        </div>
      </div>
    </div>
  );
}
