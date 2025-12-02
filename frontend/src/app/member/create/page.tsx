"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MemberFormStepper from "@/components/MemberFormStepper";

export default function CreateMemberPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/member");
  };

  const handleCancel = () => {
    router.push("/member");
  };

  return (
    <div className="min-h-screen bg-background">
      <MemberFormStepper
        isEdit={false}
        onCancel={handleCancel}
        submitButtonText="Simpan Member"
        showBackButton={true}
      />
    </div>
  );
}