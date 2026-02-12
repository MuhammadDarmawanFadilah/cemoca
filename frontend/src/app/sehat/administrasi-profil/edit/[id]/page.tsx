"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import { ArrowLeft, Loader2, Upload, UserPlus, ShieldCheck, Clock } from "lucide-react";
import Image from "next/image";

interface Role {
  id: number;
  name: string;
  roleName: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  age?: number;
  medicationTime?: string;
  photoPath?: string;
  avatarUrl?: string;
  role?: Role;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    roleId: "",
    age: "",
    medicationTime: "",
    photoUrl: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [medicationTimeError, setMedicationTimeError] = useState("");

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/users/${userId}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat data pengguna");
      const data: User = await res.json();
      setUser(data);
      
      // Convert medicationTime from HH:mm:ss to HH:mm for input type="time"
      let medicationTimeValue = "";
      if (data.medicationTime) {
        medicationTimeValue = data.medicationTime.substring(0, 5); // Extract HH:mm from HH:mm:ss
      }
      
      const photoFilename = data.photoPath || data.avatarUrl || "";
      setFormData({
        fullName: data.fullName || "",
        username: data.username || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        password: "",
        roleId: data.role?.id?.toString() || "",
        age: data.age?.toString() || "",
        medicationTime: medicationTimeValue,
        photoUrl: photoFilename,
      });
      if (photoFilename) {
        setPhotoPreview(getApiUrl("/files/" + photoFilename));
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pengguna");
      router.push("/sehat/administrasi-profil");
    } finally {
      setLoading(false);
    }
  }, [userId, getAuthHeaders, router]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/roles/all"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat roles");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchUser();
    fetchRoles();
  }, [fetchUser, fetchRoles]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(getApiUrl("/upload/image"), {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      setFormData(prev => ({ ...prev, photoUrl: data.filename }));
      toast.success("Foto berhasil diupload");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengupload foto");
      setPhotoFile(null);
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    if (!username || username.trim().length < 3) return false;
    try {
      const res = await fetch(getApiUrl(`/users/exists/username?username=${encodeURIComponent(username.trim())}`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      return data.exists === false || (data.userId && data.userId.toString() === userId);
    } catch {
      return false;
    }
  };

  const checkPhoneUnique = async (phone: string): Promise<boolean> => {
    if (!phone || phone.trim().length < 10) return false;
    try {
      const res = await fetch(getApiUrl(`/users/exists/phone?phoneNumber=${encodeURIComponent(phone.trim())}`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      return data.exists === false || (data.userId && data.userId.toString() === userId);
    } catch {
      return false;
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.username || formData.username.trim().length < 3) {
      setUsernameError("");
      return;
    }
    setCheckingUsername(true);
    const isUnique = await checkUsernameUnique(formData.username);
    setCheckingUsername(false);
    if (!isUnique) {
      setUsernameError("Username sudah digunakan");
    } else {
      setUsernameError("");
    }
  };

  const handlePhoneBlur = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.trim().length < 10) {
      setPhoneError("");
      return;
    }
    setCheckingPhone(true);
    const isUnique = await checkPhoneUnique(formData.phoneNumber);
    setCheckingPhone(false);
    if (!isUnique) {
      setPhoneError("Nomor telepon sudah digunakan");
    } else {
      setPhoneError("");
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = "Nama harus diisi";
    if (!formData.username.trim() || formData.username.trim().length < 3)
      errors.username = "Username minimal 3 karakter";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email tidak valid";
    if (!formData.phoneNumber.trim() || formData.phoneNumber.trim().length < 10)
      errors.phoneNumber = "Nomor telepon minimal 10 digit";
    if (formData.password && formData.password.length < 6)
      errors.password = "Password minimal 6 karakter";
    if (!formData.roleId) errors.roleId = "Role harus dipilih";
    
    // Check if user is patient and validate medication time
    if (isPasien && !formData.medicationTime) {
      setMedicationTimeError("Jam minum obat harus diisi untuk pasien");
      errors.medicationTime = "Jam minum obat harus diisi";
    } else {
      setMedicationTimeError("");
    }
    
    if (usernameError) errors.username = usernameError;
    if (phoneError) errors.phoneNumber = phoneError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        roleId: parseInt(formData.roleId),
      };
      if (formData.password) payload.password = formData.password;
      if (formData.age) payload.age = parseInt(formData.age);
      if (formData.medicationTime) {
        // Convert HH:mm to HH:mm:ss format
        payload.medicationTime = formData.medicationTime + ":00";
      }
      if (formData.photoUrl) payload.photoPath = formData.photoUrl;

      const res = await fetch(getApiUrl(`/users/${userId}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Operasi gagal");
      }

      toast.success("Pengguna berhasil diperbarui");
      router.push("/sehat/administrasi-profil");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id.toString() === formData.roleId);
  const isPasien = user?.role?.roleName === "PASIEN" || user?.role?.roleName === "KARYAWAN";

  return (
    <div className="max-w-xl mx-auto space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Edit Pengguna</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Form Edit</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Photo Upload - Center Only */}
            <div className="flex flex-col items-center gap-2 pb-3 border-b">
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted hover:border-primary transition-colors">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {isPasien ? <UserPlus className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </Label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploadingPhoto}
              />
              {photoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                    setFormData(prev => ({ ...prev, photoUrl: "" }));
                  }}
                  className="h-7 text-xs"
                >
                  Hapus
                </Button>
              )}
            </div>
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-xs">Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nama lengkap"
                className="h-9"
              />
              {formErrors.fullName && <p className="text-xs text-red-500">{formErrors.fullName}</p>}
            </div>

            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs">Username <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, username: e.target.value }));
                    if (formErrors.username) {
                      setFormErrors(prev => {
                        const { username, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder="username"
                  disabled={checkingUsername}
                  className="h-9"
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
              {formErrors.username && <p className="text-xs text-red-500">{formErrors.username}</p>}
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@contoh.com"
                  className="h-9"
                />
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
              </div>
              <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-xs">Nomor Telepon <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, phoneNumber: e.target.value }));
                      if (formErrors.phoneNumber) {
                        setFormErrors(prev => {
                          const { phoneNumber, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder="08xxx"
                    disabled={checkingPhone}
                    className="h-9"
                  />
                  {checkingPhone && (
                    <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
                {formErrors.phoneNumber && <p className="text-xs text-red-500">{formErrors.phoneNumber}</p>}
                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 karakter"
                className="h-9"
              />
              {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah</p>
            </div>

            {/* Age & Medication Time - Only for Pasien */}
            {isPasien && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="age" className="text-xs">Usia</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                    placeholder="Usia"
                    min={0}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="medicationTime" className="text-xs">Jam Minum Obat <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="medicationTime"
                      type="time"
                      value={formData.medicationTime}
                      onChange={(e) => setFormData((p) => ({ ...p, medicationTime: e.target.value }))}
                      className="pl-9 h-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:pl-0"
                      required={isPasien}
                    />
                  </div>
                  {medicationTimeError && <p className="text-xs text-red-500">{medicationTimeError}</p>}
                </div>
              </div>
            )}

            {/* Role Section - Read Only */}
            <div className={isPasien ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2.5" : "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-md p-2.5"}>
              <div className="flex items-center gap-2">
                <div className={isPasien ? "w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0" : "w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"}>
                  {isPasien ? (
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <p className={isPasien ? "text-xs text-blue-900 dark:text-blue-100 font-medium" : "text-xs text-purple-900 dark:text-purple-100 font-medium"}>
                  Role: <span className="font-semibold">{isPasien ? "Pasien" : "Administrator"}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 h-9">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-9">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
