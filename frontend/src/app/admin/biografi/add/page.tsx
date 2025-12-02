"use client";

import BiografiFormStepper from "@/components/BiografiFormStepper";

export default function AddBiografiPage() {
  return (
    <div className="container mx-auto p-6">
      <BiografiFormStepper redirectUrl="/admin/biografi" />
    </div>
  );
}
