"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PendaftaranPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sehat/administrasi-profil");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Mengalihkan ke Manajemen Pengguna...</p>
    </div>
  );
}
