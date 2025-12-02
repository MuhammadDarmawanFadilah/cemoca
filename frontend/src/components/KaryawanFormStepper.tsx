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
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WilayahForm from "@/components/WilayahForm";
import MapLocationPicker from "@/components/MapLocationPicker";
import { useAuth } from "@/contexts/AuthContext";
import { config, getApiUrl } from "@/lib/config";

// Schema definition
const karyawanSchema = z.object({
  // Step 1: Personal Info (Required fields)
  username: z.string().min(1, "Username wajib diisi").max(50, "Username maksimal 50 karakter"),
  fullName: z.string().min(1, "Nama lengkap wajib diisi").max(100, "Nama lengkap maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  phoneNumber: z.string().min(1, "Nomor telepon wajib diisi").max(20, "Nomor telepon maksimal 20 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100, "Password maksimal 100 karakter"),
  roleId: z.number().min(1, "Role wajib dipilih"),
  
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

type KaryawanFormData = z.infer<typeof karyawanSchema>;

// Step configuration
const STEPS = [
  {
    id: 'personal',
    title: 'Data Karyawan',
    description: 'Informasi dasar karyawan',
    icon: User,
    fields: ['username', 'fullName', 'email', 'phoneNumber', 'password', 'roleId']
  },
  {
    id: 'location',
    title: 'Alamat & Lokasi',
    description: 'Informasi tempat tinggal (opsional)',
    icon: MapPin,
    fields: ['alamat', 'provinsi', 'kota', 'kecamatan', 'kelurahan', 'kodePos', 'latitude', 'longitude']
  }
];

interface Role {
  roleId: number;
  roleName: string;
  description: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  status: string;
  // Address fields
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
}

interface KaryawanFormStepperProps {
  initialData?: User | Partial<User>;
  isEdit?: boolean;
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showBackButton?: boolean;
}

export default function KaryawanFormStepper({ 
  initialData, 
  isEdit = false, 
  onSubmit: customOnSubmit,
  onCancel,
  submitButtonText = "Simpan Karyawan",
  showBackButton = true
}: KaryawanFormStepperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<KaryawanFormData | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const { token } = useAuth();

  // Helper function to get authorization headers
  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }), [token]);

  const form = useForm<KaryawanFormData>({
    resolver: zodResolver(karyawanSchema),
    defaultValues: {
      username: initialData?.username || "",
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber || "",
      password: "",  // Don't populate password for security
      roleId: (initialData as any)?.role?.roleId || 0,
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

  // Load roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Add useEffect for form data persistence
  useEffect(() => {
    const handleUnload = () => {
      const formData = form.getValues();
      sessionStorage.setItem('karyawanFormData', JSON.stringify(formData));
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [form]);

  // Save form data to session storage on step navigation
  const saveFormData = () => {
    const formData = form.getValues();
    sessionStorage.setItem('karyawanFormData', JSON.stringify(formData));
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(getApiUrl('/api/roles/all'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        toast.error("Gagal memuat data roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Gagal memuat data roles");
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

    // Validate step 1 (personal info) - has required fields
    if (currentStep === 0) {
      const requiredFields = ['username', 'fullName', 'email', 'phoneNumber', 'password', 'roleId'];
      for (const field of requiredFields) {
        if (field === 'roleId') {
          const value = formValues[field as keyof KaryawanFormData];
          if (!value || value === 0) {
            form.setError(field as keyof KaryawanFormData, {
              type: 'required',
              message: 'Role wajib dipilih'
            });
            isValid = false;
          }
        } else if (field === 'password' && isEdit) {
          // Skip password validation for edit mode
          continue;
        } else {
          const value = formValues[field as keyof KaryawanFormData];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            form.setError(field as keyof KaryawanFormData, {
              type: 'required',
              message: 'Field ini wajib diisi'
            });
            isValid = false;
          }
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
  const handleFormSubmit = async (data: KaryawanFormData) => {
    
    // CRITICAL: Only proceed if we're on the last step
    if (currentStep !== STEPS.length - 1) {
      console.warn("Submit blocked - not on last step");
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
      
      const finalData = {
        ...pendingFormData,
        latitude: (lat && !isNaN(lat)) ? lat : null,
        longitude: (lng && !isNaN(lng)) ? lng : null,
      };

      // Remove password if empty in edit mode
      if (isEdit && !finalData.password) {
        const { password, ...dataWithoutPassword } = finalData;
        Object.assign(finalData, dataWithoutPassword);
      }

      if (customOnSubmit) {
        await customOnSubmit(finalData);
      } else {
        // Default API submission
        const url = isEdit && (initialData as any)?.id 
          ? getApiUrl(`/api/users/${(initialData as any).id}`)
          : getApiUrl('/api/users');
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(finalData),
        });

        if (response.ok) {
          toast.success(`Karyawan berhasil ${isEdit ? 'diperbarui' : 'dibuat'}!`);
          
          // Clear saved form data after successful submit
          sessionStorage.removeItem('karyawanFormData');
          
          // Navigate back or to users page
          router.push('/users');
        } else {
          const errorText = await response.text();
          throw new Error(errorText || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} karyawan`);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      
      // Extract error message from the error object
      let errorMessage = `Gagal ${isEdit ? 'memperbarui' : 'membuat'} karyawan`;
      
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
      setPendingFormData(null);
    }
  };

  // Handle submit button click specifically
  const handleSubmitButtonClick = () => {
    
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
    setPendingFormData(null);
  };

  const currentStepConfig = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          {isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Lengkapi data karyawan dengan informasi yang akurat
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
                <PersonalInfoStep 
                  form={form} 
                  roles={roles}
                  isEdit={isEdit}
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Konfirmasi Penyimpanan
            </DialogTitle>
            <DialogDescription className="text-left">
              Apakah Anda yakin ingin {isEdit ? 'memperbarui' : 'menyimpan'} data karyawan ini? 
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
            </Button>
            <Button
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
                  {isEdit ? 'Perbarui' : 'Simpan'} Karyawan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PersonalInfoStep = React.memo(function PersonalInfoStep({ 
  form, 
  roles,
  isEdit
}: { 
  form: any;
  roles: Role[];
  isEdit: boolean;
}) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username *
              </FormLabel>
              <FormControl>
                <Input placeholder="Masukkan username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
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

          <FormField
            control={form.control}
            name="phoneNumber"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password {isEdit ? "(kosongkan jika tidak diubah)" : "*"}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder={isEdit ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role *
                </FormLabel>
                <Select 
                  value={field.value > 0 ? field.value.toString() : ""} 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.roleId} value={role.roleId.toString()}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
