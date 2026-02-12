"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import { ArrowLeft, Loader2, UserPlus, Upload, Clock } from "lucide-react";
import Image from "next/image";

interface Role {
  id: number;
  name: string;
  roleName: string;
}

export default function TambahPasienPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/roles/all"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat roles");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
      
      // Auto-select PASIEN role
      const pasienRole = data.find((r: Role) => r.roleName === "PASIEN" || r.name === "PASIEN");
      if (pasienRole) {
        setFormData(prev => ({ ...prev, roleId: pasienRole.id.toString() }));
      }
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return true;
    try {
      const res = await fetch(getApiUrl(`/users/exists/username?value=${encodeURIComponent(username)}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return true;
      const exists = await res.json();
      return !exists;
    } catch {
      return true;
    }
  };

  const checkPhoneUnique = async (phone: string): Promise<boolean> => {
    if (!phone || phone.length < 10) return true;
    try {
      const res = await fetch(getApiUrl(`/users/exists/phone?value=${encodeURIComponent(phone)}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return true;
      const exists = await res.json();
      return !exists;
    } catch {
      return true;
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.username.trim() || formData.username.length < 3) return;
    setCheckingUsername(true);
    const isUnique = await checkUsernameUnique(formData.username.trim());
    setCheckingUsername(false);
    if (!isUnique) {
      setFormErrors(prev => ({ ...prev, username: "Username sudah digunakan" }));
    } else {
      setFormErrors(prev => {
        const { username, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhoneBlur = async () => {
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) return;
    setCheckingPhone(true);
    const isUnique = await checkPhoneUnique(formData.phoneNumber.trim());
    setCheckingPhone(false);
    if (!isUnique) {
      setFormErrors(prev => ({ ...prev, phoneNumber: "Nomor telepon sudah terdaftar" }));
    } else {
      setFormErrors(prev => {
        const { phoneNumber, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

    // Upload photo
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(getApiUrl("/upload/image"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload foto");

      const result = await res.json();
      setFormData(prev => ({ ...prev, photoUrl: result.filename || result.url }));
      toast.success("Foto berhasil di-upload");
    } catch (err) {
      console.error(err);
      toast.error("Gagal upload foto");
      setPhotoFile(null);
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
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
    if (!formData.password || formData.password.length < 6)
      errors.password = "Password minimal 6 karakter";
    if (!formData.roleId) errors.roleId = "Role harus dipilih";
    if (!formData.medicationTime || formData.medicationTime.trim() === "")
      errors.medicationTime = "Jam minum obat harus diisi";
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
        password: formData.password,
        roleId: parseInt(formData.roleId),
      };
      if (formData.age) payload.age = parseInt(formData.age);
      if (formData.medicationTime) {
        // Convert HH:mm to HH:mm:ss format
        payload.medicationTime = formData.medicationTime + ":00";
      }
      if (formData.photoUrl) payload.photoPath = formData.photoUrl;

      const res = await fetch(getApiUrl("/users"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Operasi gagal");
      }

      toast.success("Pasien berhasil ditambahkan");
      router.push("/sehat/administrasi-profil");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Tambah Pasien</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4" />
            Form Pasien Baru
          </CardTitle>
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
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UserPlus className="w-10 h-10" />
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
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 karakter"
                className="h-9"
              />
              {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
            </div>

            {/* Age & Medication Time */}
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
                <Label htmlFor="medicationTime">
                  Jam Minum Obat <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="medicationTime"
                    type="time"
                    value={formData.medicationTime}
                    onChange={(e) => setFormData((p) => ({ ...p, medicationTime: e.target.value }))}
                    className="pl-9 h-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:pl-0"
                    required
                  />
                  <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {formErrors.medicationTime && <p className="text-xs text-red-500">{formErrors.medicationTime}</p>}
              </div>
            </div>

            {/* Role Section */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs text-blue-900 dark:text-blue-100 font-medium">
                  Role: <span className="font-semibold">Pasien</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t mt-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 h-9">
                Batal
              </Button>
              <Button type="submit" disabled={submitting || uploadingPhoto} className="flex-1 h-9">
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
