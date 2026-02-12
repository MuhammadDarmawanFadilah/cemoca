"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getApiUrl } from "@/lib/config";

export default function ProfilPasienPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Profil Pasien</h1>
        <p className="text-base text-muted-foreground">Informasi profil dan data diri Anda</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{user.fullName?.[0] || user.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.fullName}</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Usia</p>
              <p>{user.age || "-"} tahun</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Nomor Telepon</p>
              <p>{user.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Jam Minum Obat</p>
              <p>{user.medicationTime || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Username</p>
              <p>{user.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
