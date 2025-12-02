"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import MemberFormStepper from "@/components/MemberFormStepper";
import { getApiUrl } from "@/lib/config";

interface Member {
  id: number;
  nama: string;
  telepon: string;
  email: string;
  foto?: string;
  poin: number;
  pekerjaan: string;
  tingkatPrioritas: string;
  deskripsi?: string;
  status: string;
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

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const memberId = params.id as string;

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/members/${memberId}`));
        
        if (!response.ok) {
          throw new Error("Failed to fetch member");
        }
        
        const data = await response.json();
        setMember(data);
      } catch (error) {
        console.error("Error fetching member:", error);
        toast.error("Gagal memuat data member");
        router.push("/member");
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchMember();
    }
  }, [memberId, router]);

  const handleSuccess = () => {
    router.push("/member");
  };

  const handleCancel = () => {
    router.push("/member");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data member...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Member tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MemberFormStepper
        initialData={member}
        isEdit={true}
        onCancel={handleCancel}
        submitButtonText="Perbarui Member"
        showBackButton={true}
      />
    </div>
  );
}