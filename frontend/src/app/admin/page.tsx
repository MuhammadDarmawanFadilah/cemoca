"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to biografi admin page
    router.push("/admin/biografi");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Mengarahkan ke halaman admin...</div>
    </div>
  );
}
