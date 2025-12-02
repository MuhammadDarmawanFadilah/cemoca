"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Mail, 
  Lock, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  UserPlus,
  GraduationCap,
  Shield,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { publicInvitationLinkAPI, userAPI, authAPI, PublicRegistrationRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import BiografiFormStepper from "@/components/BiografiFormStepper";

// Validation schema for user credentials
const credentialsSchema = z.object({
  username: z.string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore"),
  email: z.string()
    .email("Format email tidak valid"),
  password: z.string()
    .min(6, "Password minimal 6 karakter")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password harus mengandung huruf besar, huruf kecil, dan angka"),
  confirmPassword: z.string(),
  fullName: z.string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  phoneNumber: z.string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^[\+\d\s\-\(\)]+$/, "Format nomor HP tidak valid")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type Step = 'credentials' | 'biografi';

// Helper function to format phone number to Indonesian format (08...)
const formatPhoneToIndonesian = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with +62, convert to 08
  if (phone.startsWith('+62')) {
    return '0' + cleaned.substring(2);
  }
  
  // If starts with 62, convert to 08
  if (cleaned.startsWith('62')) {
    return '0' + cleaned.substring(2);
  }
  
  // If already starts with 08, return as is
  if (cleaned.startsWith('08')) {
    return cleaned;
  }
  
  // If starts with 8, add 0
  if (cleaned.startsWith('8')) {
    return '0' + cleaned;
  }
  
  return cleaned;
};

export default function PublicRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('credentials');
  const [credentials, setCredentials] = useState<CredentialsFormData | null>(null);
  const [validating, setValidating] = useState(false);

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    const token = searchParams?.get("token");
    if (!token) {
      setError("Token undangan tidak ditemukan");
      setLoading(false);
      return;
    }

    // Validate public link token
    const validateToken = async () => {
      try {
        const result = await publicInvitationLinkAPI.validatePublicLink(token);
        if (result.valid) {
          setLinkValid(true);
        } else {
          setError(result.message || "Link undangan tidak valid atau sudah kedaluwarsa");
        }
      } catch (error: any) {
        console.error("Error validating public link:", error);
        setError(error.message || "Token undangan tidak valid atau sudah kadaluwarsa");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [searchParams]);

  const onCredentialsSubmit = async (data: CredentialsFormData) => {
    setValidating(true);
    try {
      // Check if username already exists
      const usernameExists = await userAPI.checkUsernameExists(data.username);
      if (usernameExists) {
        form.setError("username", {
          type: "manual",
          message: "Username sudah digunakan, silakan pilih username lain"
        });
        return;
      }      // Check if email already exists  
      const emailExists = await userAPI.checkEmailExists(data.email);
      if (emailExists) {
        form.setError("email", {
          type: "manual", 
          message: "Email sudah terdaftar, silakan gunakan email lain"
        });
        return;
      }

      // Check if phone number already exists
      const phoneExists = await userAPI.checkPhoneExists(formatPhoneToIndonesian(data.phoneNumber));
      if (phoneExists) {
        form.setError("phoneNumber", {
          type: "manual",
          message: "Nomor HP sudah terdaftar, silakan gunakan nomor lain"
        });
        return;
      }

      // If validation passes, proceed to next step
      setCredentials(data);
      setStep('biografi');
      toast.success("Data akun valid, lanjutkan ke langkah berikutnya");
    } catch (error: any) {
      console.error("Error validating credentials:", error);
      toast.error("Terjadi kesalahan saat validasi data");
    } finally {
      setValidating(false);
    }
  };
  const handleBiografiSubmit = async (biografiData: any) => {
    if (!credentials) {
      toast.error("Data tidak lengkap");
      return;
    }    try {
      const token = searchParams?.get("token");
      const registrationData: PublicRegistrationRequest = {
        publicInvitationToken: token!,
        username: credentials.username,
        email: credentials.email,
        fullName: credentials.fullName,
        password: credentials.password,
        phoneNumber: formatPhoneToIndonesian(credentials.phoneNumber),        // Biografi data as a nested object - include ALL fields from biografiData
        biografiData: {
          ...biografiData, // Include all fields from the BiografiFormStepper
          namaLengkap: credentials.fullName,
          email: credentials.email,
          nomorTelepon: formatPhoneToIndonesian(credentials.phoneNumber),
        }
      };

      const result = await authAPI.registerFromPublicLink(registrationData);
        toast.success("🎉 Pendaftaran berhasil!", {
        description: "Menunggu persetujuan admin. Silakan hubungi Admin Alumni untuk aktivasi.",
        duration: 4000,
      });

      // Redirect to login page with success message
      setTimeout(() => {
        router.push("/login?message=registration_pending_approval");
      }, 2000);

    } catch (error: any) {
      console.error("Error during registration:", error);
      toast.error(error.message || "Terjadi kesalahan saat mendaftar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Memvalidasi Link Undangan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mohon tunggu sebentar...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !linkValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">
              Link Tidak Valid
            </CardTitle>
            <CardDescription>
              {error || "Link undangan tidak valid atau sudah kedaluwarsa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className={`mx-auto ${step === 'credentials' ? 'max-w-2xl' : 'max-w-5xl'}`}>
            {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Selamat Datang
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
              Calon Alumni
            </p>            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lengkapi pendaftaran Anda untuk bergabung dengan Sistem Cemoca
            </p>
          </div>          {/* Compact Progress */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                step === 'credentials' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {step === 'credentials' ? '1' : <Check className="w-4 h-4" />}
              </div>
              <div className={`h-1 w-12 transition-all ${
                step === 'biografi' ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                step === 'biografi' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Main Content */}
          {step === 'credentials' ? (
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <CardTitle>Buat Akun</CardTitle>
                <CardDescription>
                  Buat username dan password untuk akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCredentialsSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="Masukkan nama lengkap" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
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
                          <FormLabel>Nomor HP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />                              <Input 
                                placeholder="Masukkan nomor HP (08xxx)" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="Masukkan username" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="email"
                                placeholder="Masukkan email" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="password"
                                placeholder="Masukkan password" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="password"
                                placeholder="Konfirmasi password" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={validating}
                    >
                      {validating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Memvalidasi...
                        </>
                      ) : (
                        <>
                          Lanjutkan
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <GraduationCap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <CardTitle>Lengkapi Biografi</CardTitle>
                <CardDescription>
                  Langkah terakhir untuk menyelesaikan pendaftaran
                </CardDescription>
                {credentials?.email && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Email: {credentials.email}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <BiografiFormStepper 
                  onSubmit={handleBiografiSubmit}
                  initialData={{
                    namaLengkap: credentials?.fullName || '',
                    nomorTelepon: formatPhoneToIndonesian(credentials?.phoneNumber || ''),
                    email: credentials?.email || '',
                  }}
                  isRegistration={true}
                  submitButtonText="🎉 Selesaikan Pendaftaran"
                  showBackButton={true}
                  onBack={() => setStep('credentials')}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
