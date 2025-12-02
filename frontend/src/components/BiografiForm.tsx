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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Upload, Save, X, Instagram, Youtube, Linkedin, Facebook, Music, MessageCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { biografiAPI, imageAPI, BiografiRequest, Biografi, WorkExperience, Achievement, SpesialisasiKedokteran, masterDataAPI } from "@/lib/api";
import { toast } from "sonner";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import WorkExperienceList from "@/components/WorkExperienceList";
import AcademicRecordList, { AcademicRecord } from "@/components/AcademicRecordList";
import AchievementList from "@/components/AchievementList";
import HobbyList from "@/components/HobbyList";
import SpesialisasiKedokteranList from "@/components/SpesialisasiKedokteranList";
import WilayahForm from "@/components/WilayahForm";
import MapLocationPicker from "@/components/MapLocationPicker";
import { Combobox } from "@/components/ui/combobox-enhanced";

// Data arrays for dropdowns
const AGAMA_OPTIONS = [
  "Islam",
  "Kristen Protestan", 
  "Kristen Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya"
];

// Generate year options (current year down to 10 years)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 10; i++) {
    years.push((currentYear - i).toString());
  }
  return years;
};

const biografiSchema = z.object({
  // Mandatory fields
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi").max(100, "Nama lengkap maksimal 100 karakter"),
  alumniTahun: z.string().min(1, "Tahun alumni wajib diisi"),
  email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  nomorTelepon: z.string().min(1, "Nomor telepon wajib diisi").max(20, "Nomor telepon maksimal 20 karakter"),
  
  // Optional fields
  nim: z.string().max(20, "NIM maksimal 20 karakter").optional(),
  tanggalLahir: z.date().optional(),
  tempatLahir: z.string().max(100, "Tempat lahir maksimal 100 karakter").optional(),  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),  agama: z.string().max(50, "Agama maksimal 50 karakter").optional(),
  posisiJabatan: z.string().max(100, "Posisi/Jabatan maksimal 100 karakter").optional(),
  foto: z.string().optional(),
  alamat: z.string().optional(),
  kota: z.string().max(50, "Kota maksimal 50 karakter").optional(),
  provinsi: z.string().max(50, "Provinsi maksimal 50 karakter").optional(),
  kecamatan: z.string().max(50, "Kecamatan maksimal 50 karakter").optional(),
  kelurahan: z.string().max(50, "Kelurahan maksimal 50 karakter").optional(),
  kodePos: z.string().max(10, "Kode pos maksimal 10 karakter").optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  prestasi: z.string().optional(),  instagram: z.string().max(200, "Instagram maksimal 200 karakter").optional(),
  youtube: z.string().max(200, "YouTube maksimal 200 karakter").optional(),
  linkedin: z.string().max(200, "LinkedIn maksimal 200 karakter").optional(),
  facebook: z.string().max(200, "Facebook maksimal 200 karakter").optional(),
  tiktok: z.string().max(200, "TikTok maksimal 200 karakter").optional(),
  telegram: z.string().max(200, "Telegram maksimal 200 karakter").optional(),
  catatan: z.string().optional(),
  status: z.enum(["AKTIF", "TIDAK_AKTIF", "DRAFT"]).optional(),
});

type BiografiFormData = z.infer<typeof biografiSchema>;

interface BiografiFormProps {
  initialData?: Biografi | Partial<Biografi>;
  isEdit?: boolean;
  redirectUrl?: string; // Add redirect URL parameter
  onSubmit?: (data: any) => Promise<void>; // Custom submit handler
  submitButtonText?: string; // Custom submit button text
  showBackButton?: boolean; // Show back button
  onBack?: () => void; // Back button handler
  isRegistration?: boolean; // Whether this is part of registration flow
  hideStatusField?: boolean; // Whether to hide the status field (for user self-edit)
  disableUserFields?: boolean; // Whether to disable user fields (name, email, phone) for self-edit
  isMobile?: boolean; // Mobile detection override
}

export default function BiografiForm({ 
  initialData, 
  isEdit = false, 
  redirectUrl = "/biografi",
  onSubmit: customOnSubmit,
  submitButtonText = "Simpan Biografi",
  showBackButton = false,
  onBack,
  isRegistration = false,
  hideStatusField = false,
  disableUserFields = false,
  isMobile: propIsMobile
}: BiografiFormProps) {
  const router = useRouter();
  const { isMobile: detectedMobile, isSmallMobile } = useMobileDetection();
  const isMobile = propIsMobile !== undefined ? propIsMobile : detectedMobile;
  const [loading, setLoading] = useState(false);

  const [fotoPreview, setFotoPreview] = useState<string>(() => {
    // Determine the photo filename from initialData - try multiple possible field names
    const photoFilename = 
      initialData?.foto || 
      (initialData as any)?.fotoProfil || 
      (initialData as any)?.image ||
      "";
    
    if (photoFilename) {
      const imageUrl = imageAPI.getImageUrl(photoFilename);
      return imageUrl;
    }
      return "";
  });

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
  );
    
  const [spesialisasiKedokteran, setSpesialisasiKedokteran] = useState<SpesialisasiKedokteran[]>(
    (initialData as any)?.spesialisasiKedokteran?.length 
      ? (initialData as any).spesialisasiKedokteran 
      : []
  );
    
  const [hobbies, setHobbies] = useState<string[]>(() => {
    if (initialData?.hobi) {
      return initialData.hobi.split(',').map(h => h.trim()).filter(h => h.length > 0);
    }
    return [""];
  });

  // Master data state management
  const [spesialisasiOptions, setSpesialisasiOptions] = useState<{value: string, label: string}[]>([]);
  const [posisiOptions, setPosisiOptions] = useState<{value: string, label: string}[]>([]);
  const [hobiOptions, setHobiOptions] = useState<{value: string, label: string}[]>([]);
  const [mapKey, setMapKey] = useState(0); // Force re-render map when coordinates change

  const fileInputRef = useRef<HTMLInputElement>(null);  const form = useForm<BiografiFormData>({
    resolver: zodResolver(biografiSchema),    defaultValues: {
      namaLengkap: initialData?.namaLengkap || "",
      nim: initialData?.nim || "",
      alumniTahun: (initialData as any)?.alumniTahun || "",
      email: initialData?.email || "",
      nomorTelepon: initialData?.nomorTelepon || (initialData as any)?.nomorHp || "",
      tanggalLahir: initialData?.tanggalLahir ? new Date(initialData.tanggalLahir) : undefined,
      tempatLahir: initialData?.tempatLahir || "",
      jenisKelamin: initialData?.jenisKelamin as "LAKI_LAKI" | "PEREMPUAN" || undefined,      agama: initialData?.agama || "",
      posisiJabatan: (() => {
        // Get the latest work experience position for specialization field
        if (initialData?.workExperiences && initialData.workExperiences.length > 0) {
          const latest = initialData.workExperiences
            .sort((a, b) => {
              const dateA = a.tanggalMulai ? new Date(a.tanggalMulai).getTime() : 0;
              const dateB = b.tanggalMulai ? new Date(b.tanggalMulai).getTime() : 0;
              return dateB - dateA;
            })[0];
          return latest.posisi || "";
        }        return (initialData as any)?.posisiJabatan || "";
      })(),
      foto: initialData?.foto || (initialData as any)?.fotoProfil || (initialData as any)?.image || "",
      alamat: initialData?.alamat || "",
      kota: initialData?.kota || "",
      provinsi: initialData?.provinsi || "",
      kecamatan: initialData?.kecamatan || "",
      kelurahan: initialData?.kelurahan || "",
      kodePos: initialData?.kodePos || "",
      latitude: (() => {
        const lat = initialData?.latitude;
        if (lat !== undefined && lat !== null && lat !== 0) {
          return lat;
        }
        return "";
      })(),
      longitude: (() => {
        const lng = initialData?.longitude;
        if (lng !== undefined && lng !== null && lng !== 0) {
          return lng;
        }
        return "";
      })(),
      prestasi: initialData?.prestasi || "",      instagram: initialData?.instagram || "",
      youtube: initialData?.youtube || "",
      linkedin: initialData?.linkedin || "",
      facebook: initialData?.facebook || "",
      tiktok: (initialData as any)?.tiktok || "",
      telegram: (initialData as any)?.telegram || "",
      catatan: initialData?.catatan || "",
      status: initialData?.status || "DRAFT",
    },
  });
  // Update photo preview when initialData changes
  useEffect(() => {
    if (initialData) {
      const photoFilename = 
        initialData?.foto || 
        (initialData as any)?.fotoProfil || 
        (initialData as any)?.image ||
        "";
      
      if (photoFilename) {
        const imageUrl = imageAPI.getImageUrl(photoFilename);
        setFotoPreview(imageUrl);
        form.setValue("foto", photoFilename);
      } else {
        setFotoPreview("");
        form.setValue("foto", "");
      }

      // Update GPS coordinates
      if (initialData.latitude !== undefined && initialData.latitude !== null && initialData.latitude !== 0) {
        form.setValue("latitude", initialData.latitude);
      }
      
      if (initialData.longitude !== undefined && initialData.longitude !== null && initialData.longitude !== 0) {
        form.setValue("longitude", initialData.longitude);
      }

      // Also update location fields
      if (initialData.provinsi) {
        form.setValue("provinsi", initialData.provinsi);
      }
      if (initialData.kota) {
        form.setValue("kota", initialData.kota);
      }
      if (initialData.kecamatan) {
        form.setValue("kecamatan", initialData.kecamatan);
      }
      if (initialData.kelurahan) {
        form.setValue("kelurahan", initialData.kelurahan);
      }
      if (initialData.kodePos) {
        form.setValue("kodePos", initialData.kodePos);
      }

      // Force map re-render after setting coordinates
      setTimeout(() => {
        setMapKey(prev => prev + 1);
      }, 100);
    }  }, [initialData, form]);
  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load spesialisasi data
        const spesialisasiData = await masterDataAPI.spesialisasi.getAllActive();
        const spesialisasiOpts = spesialisasiData.map(item => ({
          value: item.nama,
          label: item.nama
        }));
        setSpesialisasiOptions(spesialisasiOpts);

        // Load posisi data
        const posisiData = await masterDataAPI.posisi.getAllActive();
        const posisiOpts = posisiData.map(item => ({
          value: item.nama,
          label: item.nama
        }));
        setPosisiOptions(posisiOpts);

        // Load hobi data
        const hobiData = await masterDataAPI.hobi.getAllActive();
        const hobiOpts = hobiData.map(item => ({
          value: item.nama,
          label: item.nama
        }));
        setHobiOptions(hobiOpts);
      } catch (error) {
        console.error("Error loading master data:", error);
        toast.error("Gagal memuat data master");
      }
    };

    loadMasterData();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar");
        return;      }      try {        // Show immediate preview using blob URL for better UX
        const blobUrl = URL.createObjectURL(file);
        setFotoPreview(blobUrl);
          // Upload image to backend
        toast.loading("Mengunggah gambar...");
        const uploadResult = await imageAPI.uploadImage(file);
        
        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);        // Set preview using the full URL from imageAPI.getImageUrl
        const fullImageUrl = imageAPI.getImageUrl(uploadResult.filename);
        
        setFotoPreview(fullImageUrl);
        form.setValue("foto", uploadResult.filename);
        
        toast.dismiss();
        toast.success("Gambar berhasil diunggah");
      } catch (error) {
        toast.dismiss();
        toast.error(`Gagal mengunggah gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error("Upload error:", error);
        
        // Revert to no preview on error
        setFotoPreview("");
      }    }  };  const onSubmit = async (data: BiografiFormData) => {
    setLoading(true);
    try {      const requestData: BiografiRequest = {
        // Mandatory fields
        namaLengkap: data.namaLengkap,
        alumniTahun: data.alumniTahun,
        email: data.email,
        nomorTelepon: data.nomorTelepon,
          // Optional fields
        nim: data.nim || undefined,
        tanggalLahir: data.tanggalLahir ? format(data.tanggalLahir, "yyyy-MM-dd") : undefined,
        tempatLahir: data.tempatLahir || undefined,
        jenisKelamin: data.jenisKelamin || undefined,
        agama: data.agama || undefined,        posisiJabatan: data.posisiJabatan || undefined,
        foto: data.foto || undefined,        workExperiences: workExperiences.filter(we => we.posisi && we.perusahaan && we.posisi.trim() && we.perusahaan.trim()),
        academicRecords: academicRecords.filter(ar => ar.jenjangPendidikan || ar.universitas || ar.programStudi),
        achievements: achievements.filter(a => a.judul || a.penyelenggara || a.deskripsi),
        spesialisasiKedokteran: spesialisasiKedokteran.filter(sk => sk.spesialisasi || sk.lokasiPenempatan),
        alamat: data.alamat || undefined,
        kota: data.kota || undefined,
        provinsi: data.provinsi || undefined,
        kecamatan: data.kecamatan || undefined,
        kelurahan: data.kelurahan || undefined,
        kodePos: data.kodePos || undefined,
        latitude: data.latitude ? Number(data.latitude) : undefined,
        longitude: data.longitude ? Number(data.longitude) : undefined,
        prestasi: data.prestasi || undefined,
        hobi: hobbies.filter(h => h.trim().length > 0).join(', ') || undefined,        instagram: data.instagram || undefined,
        youtube: data.youtube || undefined,
        linkedin: data.linkedin || undefined,
        facebook: data.facebook || undefined,
        tiktok: data.tiktok || undefined,
        telegram: data.telegram || undefined,
        catatan: data.catatan || undefined,
        status: data.status || "DRAFT",
      };      // Use custom onSubmit if provided
      if (customOnSubmit) {
        await customOnSubmit(requestData);
        toast.success("Biografi berhasil diperbarui!");
        return;
      }

      // Default submission logic
      if (isEdit && initialData) {
        await biografiAPI.updateBiografi((initialData as any).biografiId || (initialData as any).id, requestData);
        toast.success("Biografi berhasil diperbarui!");
      } else {
        await biografiAPI.createBiografi(requestData);
        toast.success("Biografi berhasil dibuat!");
      }

      router.push(redirectUrl);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      
      // Extract meaningful error message
      let errorMessage = `Gagal ${isEdit ? "memperbarui" : "membuat"} biografi`;
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data && typeof error.response.data === 'string') {
        // Handle validation errors
        if (error.response.data.includes('Validation failed')) {
          const validationMatch = error.response.data.match(/List of constraint violations:\[(.*?)\]/);
          if (validationMatch) {
            const violations = validationMatch[1].split('}, ').map((violation: string) => {
              const messageMatch = violation.match(/interpolatedMessage='([^']+)'/);
              return messageMatch ? messageMatch[1] : violation;
            });
            errorMessage = `Validasi gagal: ${violations.join(', ')}`;
          }
        } else {
          errorMessage = error.response.data;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isMobile ? 'w-full' : 'max-w-4xl mx-auto'}>
      <Card className="overflow-hidden">
        <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
          <CardTitle className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
            {isEdit ? "Edit Biografi Alumni" : "Tambah Biografi Alumni"}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-${isMobile ? '4' : '6'}`}>
              
              {/* Data Pribadi */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Data Pribadi</CardTitle>
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-2' : ''}`}>
                    {/* Foto Profil */}
                  <div className={`flex ${isMobile ? 'flex-col items-center space-y-3' : 'items-center space-x-4'}`}>
                    <div className={`relative ${isMobile ? 'h-24 w-24' : 'h-20 w-20'}`}>                      {fotoPreview ? (
                        <img 
                          src={fotoPreview} 
                          alt="Preview" 
                          className={`${isMobile ? 'h-24 w-24' : 'h-20 w-20'} rounded-full object-cover border`}
                          onError={(e) => {
                            // If it's not already retried and it's not a blob URL, try adding timestamp
                            if (!e.currentTarget.dataset.retried && !fotoPreview.startsWith('blob:')) {
                              const url = new URL(fotoPreview);
                              url.searchParams.set('t', Date.now().toString());
                              e.currentTarget.src = url.toString();
                              e.currentTarget.dataset.retried = 'true';
                            } else {
                              // Hide the image and show fallback
                              setFotoPreview("");
                            }
                          }}
                          onLoad={() => {
                            // Image loaded successfully
                          }}
                        />
                      ) : null}
                      {!fotoPreview && (
                        <div className={`${isMobile ? 'h-24 w-24' : 'h-20 w-20'} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 ${isMobile ? 'text-base' : 'text-sm'} border`}>
                          AL
                        </div>
                      )}
                    </div>
                    <div className={`space-y-2 ${isMobile ? 'text-center' : ''}`}>
                      <Label className={isMobile ? 'text-sm' : ''}>Foto Profil</Label>
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Foto
                        </Button>
                        {fotoPreview && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFotoPreview("");
                                form.setValue("foto", "");
                              }}
                              className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                            >
                              <X className="h-4 w-4" />
                              {isMobile ? 'Hapus' : ''}
                            </Button>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                        Maksimal 2MB, format: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                    <FormField
                      control={form.control}
                      name="namaLengkap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={isMobile ? 'text-sm' : ''}>Nama Lengkap *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nama lengkap" 
                              disabled={disableUserFields}
                              className={isMobile ? 'h-11' : ''}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    /><FormField
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
                    /><FormField
                      control={form.control}
                      name="alumniTahun"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alumni Tahun *</FormLabel>                          <FormControl>
                            <Combobox
                              options={generateYearOptions().map(year => ({ value: year, label: year }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Pilih tahun alumni"
                              searchPlaceholder="Cari tahun..."
                              emptyMessage="Tahun tidak ditemukan"
                              name={field.name}
                              onBlur={field.onBlur}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Masukkan email" 
                              disabled={disableUserFields}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={form.control}
                      name="nomorTelepon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nomor telepon" 
                              disabled={disableUserFields}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    /><FormField
                      control={form.control}
                      name="tempatLahir"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempat Lahir</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan tempat lahir (opsional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={form.control}
                      name="tanggalLahir"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={isMobile ? 'text-sm' : ''}>Tanggal Lahir</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                    isMobile && "h-11 touch-manipulation"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd MMMM yyyy", { locale: id })
                                  ) : (
                                    <span className={isMobile ? 'text-sm' : ''}>
                                      {isMobile ? 'Pilih tanggal lahir' : 'Pilih tanggal lahir (opsional)'}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
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
                                  day_hidden: "invisible",                                  dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                                  dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                                  dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    /><FormField
                      control={form.control}
                      name="jenisKelamin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Kelamin</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis kelamin (opsional)" />
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
                    /><FormField
                      control={form.control}
                      name="agama"                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agama</FormLabel>
                          <FormControl>
                            <Combobox
                              options={AGAMA_OPTIONS.map(item => ({ value: item, label: item }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Pilih agama (opsional)"
                              searchPlaceholder="Cari agama..."
                              emptyMessage="Agama tidak ditemukan"
                              name={field.name}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                    <FormField
                      control={form.control}
                      name="posisiJabatan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posisi/Jabatan Saat Ini</FormLabel>
                          <FormControl>
                            <Combobox
                              options={posisiOptions}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Pilih posisi/jabatan"
                              searchPlaceholder="Cari posisi/jabatan..."
                              emptyMessage="Posisi/jabatan tidak ditemukan"
                              name={field.name}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />{!hideStatusField && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AKTIF">Aktif</SelectItem>
                                <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}                  </div>
                </CardContent>
              </Card>

              {/* Riwayat Pendidikan */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Riwayat Pendidikan</CardTitle>
                </CardHeader>
                <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
                  <AcademicRecordList 
                    academicRecords={academicRecords}
                    onChange={setAcademicRecords}
                  />
                </CardContent>
              </Card>

              {/* Data Karir & Pekerjaan */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Pengalaman Kerja</CardTitle>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                    Pengalaman kerja yang ditambahkan harus memiliki jabatan dan nama tempat praktek untuk dapat disimpan.
                  </p>
                </CardHeader>
                <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
                  <WorkExperienceList 
                    workExperiences={workExperiences}
                    onChange={setWorkExperiences}
                  />
                </CardContent>
              </Card>
              
              {/* Spesialisasi Kedokteran */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Spesialisasi Kedokteran</CardTitle>
                </CardHeader>
                <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
                  <SpesialisasiKedokteranList 
                    spesialisasiList={spesialisasiKedokteran}
                    onChange={setSpesialisasiKedokteran}
                  />
                </CardContent>
              </Card>

              {/* Data Lokasi */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Data Lokasi & Alamat</CardTitle>
                </CardHeader>
                <CardContent className={`space-y-6 ${isMobile ? 'p-4 pt-2' : ''}`}>
                  {/* Wilayah Form with complete address fields */}
                  <WilayahForm
                    control={form.control as any}
                    setValue={form.setValue as any}
                    watch={form.watch as any}
                    onDataLoad={() => {
                      // WilayahForm data loaded
                    }}
                  />
                  
                  {/* Address Field */}
                  <FormField
                    control={form.control}
                    name="alamat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isMobile ? 'text-sm' : ''}>Alamat Lengkap</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Masukkan alamat lengkap (nama jalan, nomor rumah, RT/RW, dll)"
                            className={`min-h-[100px] ${isMobile ? 'text-sm' : ''}`}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Map Location Picker for GPS coordinates */}
                  <div className="space-y-2">
                    <label className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Koordinat GPS (Opsional)</label>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                      {isMobile ? 
                        'Tap pada peta atau gunakan tombol untuk mengatur koordinat GPS' :
                        'Klik pada peta atau gunakan tombol "Dapatkan Lokasi Saat Ini" untuk mengatur koordinat GPS'
                      }
                    </p>
                    <MapLocationPicker
                      key={mapKey} // Force re-render when coordinates change
                      latitude={form.watch("latitude")}
                      longitude={form.watch("longitude")}
                      onLocationChange={(lat, lng) => {
                        form.setValue("latitude", lat ?? "");
                        form.setValue("longitude", lng ?? "");
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data Tambahan */}
              <Card className="overflow-hidden">
                <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                  <CardTitle className={isMobile ? 'text-base' : ''}>Data Tambahan</CardTitle>
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-2' : ''}`}>
                  {/* Prestasi & Penghargaan Section */}
                  <div className="space-y-4">
                    <Label className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>Prestasi & Penghargaan</Label>
                    <AchievementList 
                      achievements={achievements}
                      onChange={setAchievements}
                    />
                  </div>

                  {/* Hobi & Minat Section */}
                  <div className="space-y-4">
                    <Label className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>Hobi & Minat</Label>
                    <HobbyList 
                      hobbies={hobbies}
                      onChange={setHobbies}
                    />
                  </div>

                  {/* Media Sosial Section */}
                  <div className="space-y-4">
                    <Label className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>Media Sosial</Label>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <Instagram className="h-4 w-4 text-pink-600" />
                              Instagram
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://instagram.com/username"
                                className={isMobile ? 'h-11' : ''}
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
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <Youtube className="h-4 w-4 text-red-600" />
                              YouTube
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://youtube.com/@channel"
                                className={isMobile ? 'h-11' : ''}
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
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <Linkedin className="h-4 w-4 text-blue-700" />
                              LinkedIn
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://linkedin.com/in/username"
                                className={isMobile ? 'h-11' : ''}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                        <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <Facebook className="h-4 w-4 text-blue-600" />
                              Facebook
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://facebook.com/username"
                                className={isMobile ? 'h-11' : ''}
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
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <Music className="h-4 w-4 text-black" />
                              TikTok
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://tiktok.com/@username"
                                className={isMobile ? 'h-11' : ''}
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
                            <FormLabel className={`${isMobile ? 'text-sm' : ''} flex items-center gap-2`}>
                              <MessageCircle className="h-4 w-4 text-blue-500" />
                              Telegram
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://t.me/username"
                                className={isMobile ? 'h-11' : ''}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="catatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isMobile ? 'text-sm' : ''}>Catatan Tambahan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Catatan atau informasi tambahan lainnya"
                            className={`min-h-[100px] ${isMobile ? 'text-sm' : ''}`}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>              {/* Submit Button */}
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'}`}>
                {showBackButton && onBack ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onBack}
                    className={`${isMobile ? 'w-full order-2' : ''} touch-manipulation`}
                  >
                    Kembali
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    className={`${isMobile ? 'w-full order-2' : ''} touch-manipulation`}
                  >
                    Batal
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={`${isMobile ? 'w-full order-1' : ''} touch-manipulation`}
                >
                  {loading ? "Menyimpan..." : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {submitButtonText}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
