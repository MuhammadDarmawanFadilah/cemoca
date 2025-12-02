"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Image, 
  Send, 
  Filter, 
  X, 
  Users, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Edit3,
  UserCheck,
  Send as SendIcon,
  AlertCircle
} from "lucide-react";
import { BiografiFilterRequest, biografiAPI, notifikasiAPI, NotificationRequest, getRecipientsForSelection, RecipientSummary } from "@/lib/api";
import { toast } from "sonner";
import { WhatsAppMobilePreview } from "@/components/WhatsAppMobilePreview";
import { WhatsAppTextEditor } from "@/components/WhatsAppTextEditor";
import { ServerPagination } from "@/components/ServerPagination";
import { Combobox, ComboboxOption } from "@/components/ui/combobox-enhanced";
import { cn } from "@/lib/utils";

interface SelectedRecipient {
  id: number;
  namaLengkap: string;
  nomorTelepon: string;
}

interface NotificationFilter {
  nama?: string;
  nomorTelepon?: string;
  alumniTahun?: string;
  spesialisasi?: string;
  pekerjaan?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

interface FilterOptions {
  spesialisasi: string[];
  pekerjaan: string[];
}

// Step configuration
const STEPS = [
  {
    id: 1,
    title: "Buat Pesan",
    description: "Tulis judul dan isi pesan notifikasi",
    icon: Edit3
  },
  {
    id: 2,
    title: "Pilih Penerima",
    description: "Tentukan alumni yang akan menerima notifikasi",
    icon: UserCheck
  },
  {
    id: 3,
    title: "Review & Kirim",
    description: "Periksa kembali dan kirim notifikasi",
    icon: SendIcon
  }
];

// Debounce hook for search optimization
const useDebounce = (value: NotificationFilter, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};



const NotifikasiPage = () => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Recipients state
  const [recipients, setRecipients] = useState<RecipientSummary[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [showFilters, setShowFilters] = useState(false);  const [filterOptions, setFilterOptions] = useState({
    spesialisasi: [] as string[],
    pekerjaan: [] as string[]
  })
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false)
  
  // Location data state (similar to pelaksanaan edit page)
  const [locationData, setLocationData] = useState({
    provinsiOptions: [] as string[],
    kotaOptions: [] as string[],
    kecamatanOptions: [] as string[],
    kelurahanOptions: [] as string[]
  })
  
  // Location mappings state (name -> code) - same as pelaksanaan edit page
  const [locationMappings, setLocationMappings] = useState({
    provinsi: {} as Record<string, string>,
    kota: {} as Record<string, string>,
    kecamatan: {} as Record<string, string>,
    kelurahan: {} as Record<string, string>
  })
  
  const [loadingLocationData, setLoadingLocationData] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    pageSize: 25,
    totalPages: 0,
    totalElements: 0
  });

  // Debounce filters to prevent too many API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Calculate progress percentage
  const getProgress = () => {
    return ((currentStep - 1) / (STEPS.length - 1)) * 100;
  };

  // Validate current step
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return title.trim() !== "" && message.trim() !== "";
      case 2:
        return selectedRecipients.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Navigation functions
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

  const goToStep = (step: number) => {
    // Only allow going to previous steps or current step
    if (step <= currentStep || isStepValid(step - 1)) {
      setCurrentStep(step);
    }
  };
  // Load recipients data with pagination
  const loadRecipients = useCallback(async () => {
    setSearchLoading(true);
    try {
      // Convert location names to codes for filtering (same as pelaksanaan edit page)
      const getLocationCode = (selectedName: string, mappings: Record<string, string>) => {
        return selectedName && selectedName !== '' && mappings[selectedName] ? mappings[selectedName] : null;
      }
      
      const provinsiCode = getLocationCode(debouncedFilters.provinsi || '', locationMappings.provinsi)
      const kotaCode = getLocationCode(debouncedFilters.kota || '', locationMappings.kota)
      const kecamatanCode = getLocationCode(debouncedFilters.kecamatan || '', locationMappings.kecamatan)
      const kelurahanCode = getLocationCode(debouncedFilters.kelurahan || '', locationMappings.kelurahan)
      
      const filterRequest: BiografiFilterRequest = {
        page: pagination.currentPage,
        size: pagination.pageSize,
        sortBy: 'namaLengkap',
        sortDirection: 'asc',
        nama: debouncedFilters.nama || undefined,
        nomorTelepon: debouncedFilters.nomorTelepon || undefined,
        alumniTahun: debouncedFilters.alumniTahun || undefined,
        spesialisasi: debouncedFilters.spesialisasi || undefined,
        pekerjaan: debouncedFilters.pekerjaan || undefined,
        provinsi: provinsiCode || undefined,
        kota: kotaCode || undefined,
        kecamatan: kecamatanCode || undefined,
        kelurahan: kelurahanCode || undefined
      };
      const response = await getRecipientsForSelection(filterRequest);
      setRecipients(response.content);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages,
        totalElements: response.totalElements
      }));
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast.error('Gagal memuat data penerima');
    } finally {
      setSearchLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedFilters, locationMappings]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);


  // Load dynamic filter options (same as pelaksanaan edit page)
  const loadFilterOptions = async () => {
    if (loadingFilterOptions) return
    
    try {
      setLoadingFilterOptions(true)
      const [spesialisasiData, pekerjaanData] = await Promise.all([
        biografiAPI.getDistinctSpesialisasi(),
        biografiAPI.getDistinctPekerjaan()
      ])
      
      setFilterOptions({
        spesialisasi: spesialisasiData,
        pekerjaan: pekerjaanData
      })
    } catch (error) {
      console.error('Error loading filter options:', error)
      toast.error('Gagal memuat opsi filter')
    } finally {
      setLoadingFilterOptions(false)
    }
  }

  // Load location data for filters (same as pelaksanaan edit page)
  const loadLocationData = async () => {
    if (loadingLocationData) return
    
    try {
      setLoadingLocationData(true)
      const [provinsiData, kotaData, kecamatanData, kelurahanData,
             provinsiMappings, kotaMappings, kecamatanMappings, kelurahanMappings] = await Promise.all([
        biografiAPI.getDistinctProvinsi(),
        biografiAPI.getDistinctKota(),
        biografiAPI.getDistinctKecamatan(),
        biografiAPI.getDistinctKelurahan(),
        biografiAPI.getProvinsiMappings(),
        biografiAPI.getKotaMappings(),
        biografiAPI.getKecamatanMappings(),
        biografiAPI.getKelurahanMappings()
      ])
      
      setLocationData({
        provinsiOptions: provinsiData,
        kotaOptions: kotaData,
        kecamatanOptions: kecamatanData,
        kelurahanOptions: kelurahanData
      })
      
      setLocationMappings({
        provinsi: provinsiMappings,
        kota: kotaMappings,
        kecamatan: kecamatanMappings,
        kelurahan: kelurahanMappings
      })
    } catch (error) {
      console.error('Error loading location data:', error)
      toast.error('Gagal memuat data lokasi')
    } finally {
      setLoadingLocationData(false)
    }
  }

  // Call load functions on mount
  useEffect(() => {
    loadFilterOptions();
    loadLocationData();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecipientToggle = (recipient: RecipientSummary) => {
    const isSelected = selectedRecipients.some(r => r.id === recipient.biografiId);
    
    if (isSelected) {
      setSelectedRecipients(prev => prev.filter(r => r.id !== recipient.biografiId));
    } else {
      const phoneNumber = recipient.nomorTelepon;
      if (phoneNumber) {
        setSelectedRecipients(prev => [...prev, {
          id: recipient.biografiId,
          namaLengkap: recipient.namaLengkap,
          nomorTelepon: phoneNumber
        }]);
      } else {
        toast.error(`${recipient.namaLengkap} tidak memiliki nomor telepon`);
      }
    }
  };

  const removeRecipient = (id: number) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id));
  };

  const selectAllOnCurrentPage = () => {
    const newRecipients = recipients
      .filter(recipient => {
        const phoneNumber = recipient.nomorTelepon;
        return phoneNumber && !selectedRecipients.some(r => r.id === recipient.biografiId);
      })
      .map(recipient => ({
        id: recipient.biografiId,
        namaLengkap: recipient.namaLengkap,
        nomorTelepon: recipient.nomorTelepon
      }));
    
    setSelectedRecipients(prev => [...prev, ...newRecipients]);
  };

  const clearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, currentPage: 0 }));
  };

  const handleFilterChange = (newFilters: Partial<NotificationFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  };

  const resetFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  };

  const handleSendNotification = async () => {
    if (!isStepValid(1) || !isStepValid(2)) {
      toast.error('Lengkapi semua data yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      const notificationData: NotificationRequest = {
        title,
        message,
        recipients: selectedRecipients.map(r => r.nomorTelepon),
        type: activeTab,
        image: activeTab === 'image' ? image : null
      };

      await notifikasiAPI.sendWhatsAppNotification(notificationData);
      
      toast.success(`🎉 Notifikasi berhasil dikirim!`, {
        description: `Pesan "${title}" telah dikirim ke ${selectedRecipients.length} alumni melalui WhatsApp`,
        duration: 5000
      });
      
      // Reset form and go back to step 1
      setTitle('');
      setMessage('');
      setImage(null);
      setImagePreview(null);
      setSelectedRecipients([]);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Gagal mengirim notifikasi', {
        description: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifikasi WhatsApp</h1>
            <p className="text-muted-foreground">Kirim notifikasi kepada alumni melalui WhatsApp dengan mudah</p>
          </div>
        </div>

        {/* Progress Stepper */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Langkah {currentStep} dari {STEPS.length}</h2>
                <Badge variant="outline" className="text-sm">
                  {Math.round(getProgress())}% selesai
                </Badge>
              </div>
              
              <Progress value={getProgress()} className="w-full" />
              
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={cn(
                          "flex items-center gap-3 cursor-pointer transition-all",
                          isActive && "text-primary",
                          isCompleted && "text-green-600"
                        )}
                        onClick={() => goToStep(step.id)}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                            isActive && "border-primary bg-primary/10",
                            isCompleted && "border-green-600 bg-green-600/10",
                            !isActive && !isCompleted && "border-muted-foreground/30"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <StepIcon className={cn(
                              "h-5 w-5",
                              isActive && "text-primary",
                              !isActive && "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        <div className="hidden md:block">
                          <p className={cn(
                            "font-medium text-sm",
                            isActive && "text-primary",
                            isCompleted && "text-green-600"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className="flex-1 h-px bg-border mx-4 hidden md:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>        {/* Step Content */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Step 1: Create Message */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Buat Pesan Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Tulis judul dan isi pesan yang akan dikirim kepada alumni
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Message Type Tabs */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setActiveTab("text")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all text-sm font-medium",
                        activeTab === "text" 
                          ? "bg-background shadow-sm text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Teks Saja
                    </button>
                    <button
                      onClick={() => setActiveTab("image")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all text-sm font-medium",
                        activeTab === "image" 
                          ? "bg-background shadow-sm text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Image className="h-4 w-4" />
                      Teks + Gambar
                    </button>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Judul Notifikasi *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Masukkan judul notifikasi (contoh: Undangan Reuni Alumni 2025)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full"
                    />
                    {!title.trim() && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Judul wajib diisi
                      </p>
                    )}
                  </div>                  {/* Message Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Isi Pesan *
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {message.length} karakter
                      </span>
                    </div>
                    <WhatsAppTextEditor
                      value={message}
                      onChange={setMessage}
                      placeholder="Tulis pesan Anda di sini...&#10;&#10;Contoh:&#10;Halo Alumni! 👋&#10;&#10;Kami dengan senang hati mengundang Anda untuk menghadiri acara reuni alumni yang akan diselenggarakan pada:&#10;&#10;📅 Tanggal: 15 Juni 2025&#10;🕐 Waktu: 19.00 WIB&#10;📍 Tempat: Aula Kampus&#10;&#10;Acara ini akan menjadi kesempatan yang baik untuk bersilaturahmi dan berbagi pengalaman.&#10;&#10;Terima kasih! 🙏"
                    />
                    {!message.trim() && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Isi pesan wajib diisi
                      </p>
                    )}
                  </div>

                  {/* Image Upload for Image Tab */}
                  {activeTab === "image" && (
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-sm font-medium">Upload Gambar</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file:mr-2 file:px-4 file:py-2 file:border-0 file:text-sm file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
                      />
                      {imagePreview && (
                        <div className="space-y-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full h-40 object-cover rounded-lg border shadow-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Hapus Gambar
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-end">
                    <Button
                      onClick={nextStep}
                      disabled={!isStepValid(1)}
                      className="flex items-center gap-2"
                    >
                      Lanjut: Pilih Penerima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Recipients */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Pilih Penerima Notifikasi
                      </CardTitle>
                      <CardDescription>
                        Tentukan alumni yang akan menerima notifikasi WhatsApp
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRecipients.length > 0 && (
                        <Badge variant="secondary" className="px-3 py-1">
                          {selectedRecipients.length} dipilih
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Recipients Summary */}
                  {selectedRecipients.length > 0 && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Penerima Terpilih ({selectedRecipients.length})</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllRecipients}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Hapus Semua
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {selectedRecipients.slice(0, 6).map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center justify-between p-2 bg-background rounded text-sm"
                          >
                            <span className="truncate">{recipient.namaLengkap}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipient(recipient.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {selectedRecipients.length > 6 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{selectedRecipients.length - 6} lainnya
                        </p>
                      )}
                    </div>
                  )}

                  {/* Filter Section */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    {showFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reset Filter
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllOnCurrentPage}
                      disabled={recipients.length === 0 || searchLoading}
                    >
                      Pilih Semua Halaman
                    </Button>
                  </div>                  {/* Advanced Filters */}
                  {showFilters && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Filter Penerima Notifikasi
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Text Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nama Lengkap</Label>
                            <Input
                              value={filters.nama || ''}
                              onChange={(e) => handleFilterChange({ nama: e.target.value })}
                              placeholder="Cari nama..."
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Nomor Telepon</Label>
                            <Input
                              value={filters.nomorTelepon || ''}
                              onChange={(e) => handleFilterChange({ nomorTelepon: e.target.value })}
                              placeholder="Cari nomor..."
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tahun Alumni</Label>
                            <Input
                              value={filters.alumniTahun || ''}
                              onChange={(e) => handleFilterChange({ alumniTahun: e.target.value })}
                              placeholder="Cari tahun..."
                              className="h-8 text-sm"
                            />
                          </div>                          <div className="space-y-1">
                            <Label className="text-xs">Spesialisasi</Label>
                            <Combobox
                              options={filterOptions.spesialisasi.map(item => ({ value: item, label: item }))}
                              value={filters.spesialisasi || ''}
                              onValueChange={(value) => handleFilterChange({ spesialisasi: value })}
                              placeholder={loadingFilterOptions ? "Memuat..." : "Pilih spesialisasi..."}
                              searchPlaceholder="Cari spesialisasi..."
                              emptyMessage="Spesialisasi tidak ditemukan"
                              disabled={loadingFilterOptions}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Pekerjaan</Label>
                            <Combobox
                              options={filterOptions.pekerjaan.map(item => ({ value: item, label: item }))}
                              value={filters.pekerjaan || ''}
                              onValueChange={(value) => handleFilterChange({ pekerjaan: value })}
                              placeholder={loadingFilterOptions ? "Memuat..." : "Pilih pekerjaan..."}
                              searchPlaceholder="Cari pekerjaan..."
                              emptyMessage="Pekerjaan tidak ditemukan"
                              disabled={loadingFilterOptions}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                          {/* Location Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Provinsi</Label>
                            <Combobox
                              options={[
                                { value: '', label: 'Semua Provinsi' },
                                ...locationData.provinsiOptions.map(provinsi => ({ value: provinsi, label: provinsi }))
                              ]}
                              value={filters.provinsi || ''}
                              onValueChange={(value) => handleFilterChange({ provinsi: value })}
                              placeholder={loadingLocationData ? "Memuat..." : "Pilih provinsi"}
                              searchPlaceholder="Cari provinsi..."
                              emptyMessage="Provinsi tidak ditemukan"
                              disabled={loadingLocationData}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Kota</Label>
                            <Combobox
                              options={[
                                { value: '', label: 'Semua Kota' },
                                ...locationData.kotaOptions.map(kota => ({ value: kota, label: kota }))
                              ]}
                              value={filters.kota || ''}
                              onValueChange={(value) => handleFilterChange({ kota: value })}
                              placeholder={loadingLocationData ? "Memuat..." : "Pilih kota"}
                              searchPlaceholder="Cari kota..."
                              emptyMessage="Kota tidak ditemukan"
                              disabled={loadingLocationData}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Kecamatan</Label>
                            <Combobox
                              options={[
                                { value: '', label: 'Semua Kecamatan' },
                                ...locationData.kecamatanOptions.map(kecamatan => ({ value: kecamatan, label: kecamatan }))
                              ]}
                              value={filters.kecamatan || ''}
                              onValueChange={(value) => handleFilterChange({ kecamatan: value })}
                              placeholder={loadingLocationData ? "Memuat..." : "Pilih kecamatan"}
                              searchPlaceholder="Cari kecamatan..."
                              emptyMessage="Kecamatan tidak ditemukan"
                              disabled={loadingLocationData}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Kelurahan</Label>
                            <Combobox
                              options={[
                                { value: '', label: 'Semua Kelurahan' },
                                ...locationData.kelurahanOptions.map(kelurahan => ({ value: kelurahan, label: kelurahan }))
                              ]}
                              value={filters.kelurahan || ''}
                              onValueChange={(value) => handleFilterChange({ kelurahan: value })}
                              placeholder={loadingLocationData ? "Memuat..." : "Pilih kelurahan"}
                              searchPlaceholder="Cari kelurahan..."
                              emptyMessage="Kelurahan tidak ditemukan"
                              disabled={loadingLocationData}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        
                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFilters({})
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reset Filter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recipients List */}
                  <div className="space-y-4">
                    {searchLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Memuat data penerima...</p>
                      </div>
                    ) : recipients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Tidak ada penerima yang ditemukan</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {recipients.map((recipient) => {
                            const phoneNumber = recipient.nomorTelepon;
                            const isSelected = selectedRecipients.some(r => r.id === recipient.biografiId);
                            
                            return (
                              <div
                                key={recipient.biografiId}
                                className={cn(
                                  "flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all",
                                  isSelected 
                                    ? "bg-primary/5 border-primary/30" 
                                    : "hover:bg-secondary/50",
                                  !phoneNumber && "opacity-50"
                                )}
                                onClick={() => handleRecipientToggle(recipient)}
                              >
                                <Checkbox checked={isSelected} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{recipient.namaLengkap}</p>
                                    {recipient.jurusan && (
                                      <Badge variant="secondary" className="text-xs">
                                        {recipient.jurusan}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-4 text-xs text-muted-foreground">
                                    {phoneNumber && <span>📱 {phoneNumber}</span>}
                                    {recipient.spesialisasi && <span>🎓 {recipient.spesialisasi}</span>}
                                    {recipient.alumniTahun && <span>📅 {recipient.alumniTahun}</span>}
                                  </div>
                                  {!phoneNumber && (
                                    <p className="text-xs text-destructive">⚠️ Nomor telepon tidak tersedia</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Menampilkan {pagination.currentPage * pagination.pageSize + 1}-{Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)} dari {pagination.totalElements} penerima
                          </span>
                        </div>

                        <ServerPagination
                          currentPage={pagination.currentPage}
                          totalPages={pagination.totalPages}
                          totalElements={pagination.totalElements}
                          pageSize={pagination.pageSize}
                          onPageChange={handlePageChange}
                          onPageSizeChange={handlePageSizeChange}
                        />
                      </>
                    )}
                  </div>

                  {/* Validation Message */}
                  {selectedRecipients.length === 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Pilih minimal satu penerima untuk melanjutkan
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Kembali
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!isStepValid(2)}
                      className="flex items-center gap-2"
                    >
                      Lanjut: Review & Kirim
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}            {/* Step 3: Review & Send */}
            {currentStep === 3 && (
              <div className="max-w-2xl mx-auto">
                {/* WhatsApp Preview Only */}
                <WhatsAppMobilePreview
                  title={title}
                  message={message}
                  image={imagePreview || undefined}
                  recipientCount={selectedRecipients.length}
                />
                
                {/* Send Actions */}
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Siap untuk dikirim?</h3>
                        <p className="text-sm text-muted-foreground">
                          Pesan akan dikirim ke {selectedRecipients.length} alumni
                        </p>
                      </div>

                      {/* Send Button */}
                      <Button
                        onClick={handleSendNotification}
                        disabled={loading}
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengirim Notifikasi...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Kirim Notifikasi ke {selectedRecipients.length} Alumni
                          </>
                        )}
                      </Button>
                      
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          className="flex items-center gap-2"
                          disabled={loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Kembali ke Pilih Penerima
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NotifikasiPage;
