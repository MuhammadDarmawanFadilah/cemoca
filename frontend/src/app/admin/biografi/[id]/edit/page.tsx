"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { biografiAPI, Biografi } from "@/lib/api";
import BiografiFormStepper from "@/components/BiografiFormStepper";

export default function EditBiografiPage() {
  const params = useParams();
  const id = params?.id as string;

  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchBiografi = async () => {
      try {
        setLoading(true);
        const data = await biografiAPI.getBiografiForEdit(parseInt(id));
        setBiografi(data);
      } catch (error) {
        console.error("Error fetching biografi:", error);
        setError("Gagal memuat data biografi");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBiografi();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Memuat data biografi...</div>
      </div>
    );
  }

  if (error || !biografi) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-destructive">
          {error || "Biografi tidak ditemukan"}
        </h2>
      </div>
    );
  }

  return <BiografiFormStepper initialData={biografi} isEdit={true} redirectUrl="/admin/biografi" />;
}
